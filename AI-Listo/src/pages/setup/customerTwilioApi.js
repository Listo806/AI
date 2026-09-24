import apiClient from "../../api/apiClient";
const qs=(workspaceId="")=>workspaceId&&workspaceId!=="default"?`?workspace_id=${encodeURIComponent(workspaceId)}`:"";
const req=(path,options={},workspaceId="")=>apiClient.request(`/customer-twilio${path}${qs(workspaceId)}`,options);
export const customerTwilioApi={
 status:(w)=>req('/status',{},w),
 connect:(body,w)=>req('/connect',{method:'POST',body:JSON.stringify(body)},w),
 disconnect:(w)=>req('/disconnect',{method:'DELETE'},w),
 numbers:(w)=>req('/numbers',{},w),
 refreshNumbers:(w)=>req('/numbers/refresh',{method:'POST',body:JSON.stringify({})},w),
 selectNumber:(numberSid,w)=>req('/numbers/select',{method:'POST',body:JSON.stringify({numberSid})},w),
 startTestCall:(toNumber,w)=>req('/test-call',{method:'POST',body:JSON.stringify({toNumber})},w),
 testStatus:(id,w)=>req(`/test-call/${encodeURIComponent(id)}`,{},w),
};
