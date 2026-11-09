// Cloudflare Durable Object: shared, per-account AI rate and concurrency control.
// Bind AI_USAGE_GATE in wrangler configuration and export AIUsageGate from the entrypoint.
export class AIUsageGate {
  constructor(state) { this.state = state; }
  async fetch(request) {
    if (request.method !== 'POST') return Response.json({error:'method'},{status:405});
    let data; try { data = await request.json(); } catch { return Response.json({error:'json'},{status:400}); }
    const now = Date.now();
    const operation = data?.operation;
    if (!['limit','acquire','release','reserveBudget','settleBudget'].includes(operation)) return Response.json({error:'operation'},{status:400});
    const result = await this.state.blockConcurrencyWhile(async () => {
      const record = await this.state.storage.get('usage') || { calls: [], leases: {}, budget: {day:'',reserved:0,spent:0,holds:{}} };
      record.calls = record.calls.filter(t => Number.isFinite(t) && t > now - 60000);
      for (const [id, expires] of Object.entries(record.leases)) if (expires <= now) delete record.leases[id];
      // Fixed per-account daily budget in USD micros. Reserve before provider call,
      // then settle actual usage (or release on error). Storage is atomic per Durable Object.
      const day = new Date(now).toISOString().slice(0,10);
      if (!record.budget || record.budget.day !== day) record.budget={day,reserved:0,spent:0,holds:{}};
      if (operation === 'reserveBudget') {
        const requestId=data.requestId, amount=data.amountMicros;
        if(typeof requestId!=='string'||!/^[\w-]{1,80}$/.test(requestId)||!Number.isSafeInteger(amount)||amount<1||amount>1000000)return {error:'budgetRequest'};
        if(record.budget.holds[requestId])return {success:false};
        const limit=Number.isSafeInteger(data.dailyLimitMicros)&&data.dailyLimitMicros>0?Math.min(data.dailyLimitMicros,10000000):1000000;
        const success=record.budget.spent+record.budget.reserved+amount<=limit;
        if(success){record.budget.holds[requestId]=amount;record.budget.reserved+=amount;}
        await this.state.storage.put('usage',record);
        return {success,remainingMicros:Math.max(0,limit-record.budget.spent-record.budget.reserved)};
      }
      if (operation === 'settleBudget') {
        const requestId=data.requestId,spent=data.spentMicros;
        if(typeof requestId!=='string'||!/^[\w-]{1,80}$/.test(requestId)||!Number.isSafeInteger(spent)||spent<0||spent>1000000)return {error:'budgetSettlement'};
        const hold=record.budget.holds[requestId];
        if(!hold)return {settled:false};
        record.budget.reserved=Math.max(0,record.budget.reserved-hold);
        record.budget.spent+=Math.min(hold,spent);
        delete record.budget.holds[requestId];
        await this.state.storage.put('usage',record);
        return {settled:true};
      }
      if (operation === 'limit') {
        const success = record.calls.length < 6;
        if (success) record.calls.push(now);
        await this.state.storage.put('usage', record);
        return {success};
      }
      if (operation === 'acquire') {
        const requestId = data.requestId;
        if (typeof requestId !== 'string' || !/^[\w-]{1,80}$/.test(requestId)) return {error:'requestId'};
        const leaseId = requestId;
        const success = Object.keys(record.leases).length < 2 && !(leaseId in record.leases);
        if (success) record.leases[leaseId] = now + Math.min(35, Math.max(5, Number(data.ttlSeconds) || 35))*1000;
        await this.state.storage.put('usage',record);
        return success ? {id:leaseId} : {id:null};
      }
      if (typeof data.leaseId !== 'string' || !/^[\w-]{1,80}$/.test(data.leaseId)) return {error:'leaseId'};
      delete record.leases[data.leaseId];
      await this.state.storage.put('usage',record);
      return {released:true};
    });
    return Response.json(result,{status:result.error?400:200,headers:{'cache-control':'no-store'}});
  }
}
export function usageGateBindings(namespace) {
  if (!namespace || typeof namespace.idFromName !== 'function' || typeof namespace.get !== 'function') return {};
  const invoke = async (user, payload) => {
    if (typeof user !== 'string' || !/^[-\w:.@]{1,160}$/.test(user)) throw Error('Invalid account');
    const stub = namespace.get(namespace.idFromName(user));
    const response = await stub.fetch('https://ai-usage.internal/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if (!response.ok) throw Error('Usage gate unavailable');
    return response.json();
  };
  return {
    AI_RATE_LIMITER:{limit:({key})=>invoke(key,{operation:'limit'})},
    AI_COST_BUDGET:{reserve:({user,requestId,amountMicros,dailyLimitMicros})=>invoke(user,{operation:'reserveBudget',requestId,amountMicros,dailyLimitMicros}),settle:({user,requestId,spentMicros})=>invoke(user,{operation:'settleBudget',requestId,spentMicros})},
    AI_CONCURRENCY_GATE:{acquire:({user,requestId,ttlSeconds})=>invoke(user,{operation:'acquire',requestId,ttlSeconds}),release:({user,leaseId})=>invoke(user,{operation:'release',leaseId})}
  };
}
