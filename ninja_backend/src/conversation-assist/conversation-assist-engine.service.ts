import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { AiAssistantService, ChatMessage } from '../integrations/ai/ai-assistant.service';
import { PropertiesService } from '../properties/properties.service';
import {
  SiteAssistButton,
  SiteAssistIntent,
  SiteAssistLocale,
  SiteAssistSlots,
  SiteAssistState,
  SiteAssistTurnResponse,
} from '../site-assist/site-assist.types';

const CONTEXT_LIMIT = 24;

function pick<T extends Record<SiteAssistLocale, string>>(m: T, locale: SiteAssistLocale): string {
  return m[locale] || m.en;
}

@Injectable()
export class ConversationAssistEngineService {
  private readonly logger = new Logger(ConversationAssistEngineService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly aiAssistant: AiAssistantService,
    private readonly propertiesService: PropertiesService,
  ) {}

  private propertyUrl(propertyId: string): string {
    const origin = (this.config.get('SITE_ASSIST_PUBLIC_ORIGIN') || '').replace(/\/$/, '');
    // Default matches marketplace frontends like /listings/{uuid} (override with SITE_ASSIST_PROPERTY_PATH)
    const pathTpl = this.config.get('SITE_ASSIST_PROPERTY_PATH') || '/listings/{id}';
    const path = pathTpl.replace(/\{id\}/g, propertyId);
    const pathNorm = path.startsWith('/') ? path : `/${path}`;
    return origin ? `${origin}${pathNorm}` : pathNorm;
  }

  welcomeResponse(sessionId: string, locale: SiteAssistLocale): SiteAssistTurnResponse {
    const text = pick(
      {
        en: "Hi! I'm your marketplace assistant. What would you like to do today?",
        es: '¡Hola! Soy tu asistente del marketplace. ¿Qué te gustaría hacer hoy?',
        pt: 'Olá! Sou o assistente do marketplace. O que você gostaria de fazer hoje?',
      },
      locale,
    );
    const buttons: SiteAssistButton[] = [
      { id: 'welcome_buy', label: pick({ en: 'I want to buy', es: 'Quiero comprar', pt: 'Quero comprar' }, locale) },
      { id: 'welcome_rent', label: pick({ en: 'I want to rent', es: 'Quiero alquilar', pt: 'Quero alugar' }, locale) },
      { id: 'welcome_sell', label: pick({ en: 'I want to sell', es: 'Quiero vender', pt: 'Quero vender' }, locale) },
    ];
    return { sessionId, type: 'message', text, buttons, links: [] };
  }

  /** Legacy / edge: human handoff is not supported; keep users in AI flow. */
  private directHelpMessage(locale: SiteAssistLocale): string {
    return pick(
      {
        en: 'I can help you directly. What would you like to do?',
        es: 'Puedo ayudarte directamente. ¿Qué te gustaría hacer?',
        pt: 'Posso ajudar você diretamente. O que você gostaria de fazer?',
      },
      locale,
    );
  }

  private extractSignals(text: string, slots: SiteAssistSlots): SiteAssistSlots {
    const t = (text || '').toLowerCase();
    const next: SiteAssistSlots = { ...slots };

    const cityMatch =
      t.match(/(?:ciudad|city|cidade)\s*[:-]\s*([a-záéíóúãõç0-9\s\-'.]{2,50})/i) ||
      t.match(/\b(?:en|in|em|at|near|around)\s+([a-záéíóúãõç][a-záéíóúãõç0-9\s\-'.]{1,48})\b/i) ||
      t.match(/\b(?:looking\s+in|busco\s+en|searching\s+in)\s+([a-záéíóúãõç][a-záéíóúãõç0-9\s\-'.]{1,48})\b/i);
    if (cityMatch) next.city = (cityMatch[1] || '').trim();

    const typeMap: Array<[RegExp, string]> = [
      [/\b(apartamento|apartment|depto|departamento|flat|studio)\b/i, 'apartment'],
      [/\b(casa|house|home|moradia)\b/i, 'house'],
      [/\b(condo|condominio|condomínio)\b/i, 'condo'],
      [/\b(terreno|land|lot|terreno)\b/i, 'land'],
    ];
    for (const [re, val] of typeMap) {
      if (re.test(t)) {
        next.property_type = val;
        break;
      }
    }

    const zoneMatch =
      t.match(/(?:zona|barrio|vecindario|neighborhood|bairro)\s*[:-]?\s*([a-z0-9áéíóúãõç\s]{2,60})/i) ||
      t.match(/(?:direcci[oó]n|address|endereço)\s*[:-]?\s*([a-z0-9áéíóúãõç\s]{5,80})/i);
    if (zoneMatch) next.zone = (zoneMatch[1] || '').trim();

    return next;
  }

  /**
   * When the user answers with just a place name ("Sydney", "Quito", "Australia"),
   * structured patterns above miss it — fill the missing city/zone slot so we don't loop the same question.
   */
  private applyPlainLocationFallback(
    rawMessage: string,
    intent: SiteAssistIntent,
    slots: SiteAssistSlots,
  ): SiteAssistSlots {
    if (intent !== 'buy' && intent !== 'rent' && intent !== 'sell') return slots;
    const msg = rawMessage.trim();
    if (msg.length < 2 || msg.length > 100) return slots;

    const lower = msg.toLowerCase();
    if (
      /^(yes|no|yeah|yep|nope|ok|okay|sure|thanks?|thank you|si|sí|vale|sim|não|nao|claro|please)$/i.test(
        lower,
      )
    ) {
      return slots;
    }

    if (!/^[a-záéíóúãõçüñß0-9\s\-'.]+$/i.test(msg)) return slots;
    if (/^[\d\s$,.\-€£]+$/.test(msg)) return slots;

    const out: SiteAssistSlots = { ...slots };
    if (intent === 'buy' || intent === 'rent') {
      if (!out.city) {
        out.city = msg.replace(/\s+/g, ' ');
        return out;
      }
    }
    if (intent === 'sell') {
      if (!out.city) {
        out.city = msg.replace(/\s+/g, ' ');
        return out;
      }
      if (!out.zone) {
        out.zone = msg.replace(/\s+/g, ' ');
        return out;
      }
    }
    return slots;
  }

  private hasBuyBudget(s: SiteAssistSlots): boolean {
    if (s.budget_min != null || s.budget_max != null) return true;
    return !!(s.budget && String(s.budget).trim().length > 0);
  }

  private hasRentBudget(s: SiteAssistSlots): boolean {
    if (s.budget_min != null || s.budget_max != null) return true;
    return !!(s.monthly_budget && String(s.monthly_budget).trim().length > 0);
  }

  /**
   * Parse purchase / rent budget phrases:
   * - 100k~200k / 250,000-400,000
   * - less than 200k / under 250,000
   * - over than 200k / above 300000
   * - two hundred thousand (handles common typo: handred)
   */
  private extractBudgetFromText(message: string, slots: SiteAssistSlots): SiteAssistSlots {
    const next: SiteAssistSlots = { ...slots };
    const t = (message || '').trim().toLowerCase();
    if (!t) return next;

    const parseAmount = (rawNum: string, rawUnit?: string): number => {
      const cleaned = (rawNum || '').replace(/[,\s]/g, '');
      if (!cleaned) return NaN;
      const n = parseFloat(cleaned);
      if (Number.isNaN(n)) return NaN;
      const unit = (rawUnit || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') return Math.round(n * 1000);
      if (unit === 'm' || unit === 'million') return Math.round(n * 1_000_000);
      return Math.round(n);
    };

    const parseWordsNumber = (input: string): number => {
      const normalized = input
        .toLowerCase()
        .replace(/handred/g, 'hundred')
        .replace(/-/g, ' ')
        .replace(/\sand\s/g, ' ')
        .trim();
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const small: Record<string, number> = {
        zero: 0,
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
        eleven: 11,
        twelve: 12,
        thirteen: 13,
        fourteen: 14,
        fifteen: 15,
        sixteen: 16,
        seventeen: 17,
        eighteen: 18,
        nineteen: 19,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50,
        sixty: 60,
        seventy: 70,
        eighty: 80,
        ninety: 90,
      };
      let current = 0;
      let total = 0;
      for (const tok of tokens) {
        if (small[tok] != null) {
          current += small[tok];
          continue;
        }
        if (tok === 'hundred') {
          if (current === 0) current = 1;
          current *= 100;
          continue;
        }
        if (tok === 'thousand') {
          if (current === 0) current = 1;
          total += current * 1000;
          current = 0;
          continue;
        }
        if (tok === 'million') {
          if (current === 0) current = 1;
          total += current * 1_000_000;
          current = 0;
          continue;
        }
        return NaN;
      }
      const out = total + current;
      return out > 0 ? out : NaN;
    };

    const extractWordBudget = (): number => {
      const wordsOnly = t.replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!wordsOnly) return NaN;
      return parseWordsNumber(wordsOnly);
    };

    const range = t.match(
      /(\d+(?:\.\d+)?(?:,\d{3})*)\s*(k|m|thousand|million)?\s*[~–-]\s*(\d+(?:\.\d+)?(?:,\d{3})*)\s*(k|m|thousand|million)?/i,
    );
    if (range) {
      const a = parseAmount(range[1], range[2]);
      const b = parseAmount(range[3], range[4] || range[2]);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        next.budget_min = Math.min(a, b);
        next.budget_max = Math.max(a, b);
        next.budget = `${next.budget_min}-${next.budget_max}`;
        return next;
      }
    }

    const under = t.match(
      /(?:less than|under|below|max|up to|at most|maximum|no more than)\s+\$?\s*(\d+(?:\.\d+)?(?:,\d{3})*)\s*(k|m|thousand|million)?\b/i,
    );
    if (under) {
      const n = parseAmount(under[1], under[2]);
      if (!Number.isNaN(n)) {
        next.budget_max = n;
        next.budget = `max ${n}`;
        return next;
      }
    }

    const over = t.match(
      /(?:more than|over|above|at least|greater than|minimum|min)\s+(?:than\s+)?\$?\s*(\d+(?:\.\d+)?(?:,\d{3})*)\s*(k|m|thousand|million)?\b/i,
    );
    if (over) {
      const n = parseAmount(over[1], over[2]);
      if (!Number.isNaN(n)) {
        next.budget_min = n;
        next.budget = `min ${n}`;
        return next;
      }
    }

    if (next.budget_min != null || next.budget_max != null) return next;

    const single = t.match(/\$?\s*(\d+(?:\.\d+)?(?:,\d{3})*)\s*(k|m|thousand|million)?\b/i);
    if (single) {
      const n = parseAmount(single[1], single[2]);
      if (!Number.isNaN(n) && n > 0) {
        next.budget_max = n;
        next.budget = String(n);
        return next;
      }
    }

    const wordAmount = extractWordBudget();
    if (!Number.isNaN(wordAmount) && wordAmount >= 1000) {
      next.budget_max = wordAmount;
      next.budget = String(wordAmount);
      return next;
    }

    return next;
  }

  private mergeExtractedSlots(base: SiteAssistSlots, extracted: Partial<SiteAssistSlots>): SiteAssistSlots {
    const out: SiteAssistSlots = { ...base };
    const cleanText = (v?: string) => (v || '').trim();
    if (cleanText(extracted.city)) out.city = cleanText(extracted.city);
    if (cleanText(extracted.property_type)) out.property_type = cleanText(extracted.property_type).toLowerCase();
    if (cleanText(extracted.zone)) out.zone = cleanText(extracted.zone);
    if (cleanText(extracted.budget)) out.budget = cleanText(extracted.budget);
    if (cleanText(extracted.monthly_budget)) out.monthly_budget = cleanText(extracted.monthly_budget);
    if (typeof extracted.budget_min === 'number' && Number.isFinite(extracted.budget_min)) {
      out.budget_min = Math.round(extracted.budget_min);
    }
    if (typeof extracted.budget_max === 'number' && Number.isFinite(extracted.budget_max)) {
      out.budget_max = Math.round(extracted.budget_max);
    }
    if (
      out.budget_min != null &&
      out.budget_max != null &&
      out.budget_min > out.budget_max
    ) {
      const t = out.budget_min;
      out.budget_min = out.budget_max;
      out.budget_max = t;
    }
    return out;
  }

  /**
   * AI extraction layer for typo / natural language robustness.
   * Returns partial slots only; deterministic validators/fallback still run after this.
   */
  private async extractSignalsWithAi(
    message: string,
    locale: SiteAssistLocale,
    intent: SiteAssistIntent | undefined,
    current: SiteAssistSlots,
  ): Promise<Partial<SiteAssistSlots> | null> {
    const system = [
      'Extract structured real-estate search slots from a user message.',
      'Return ONLY valid JSON (no markdown).',
      'JSON schema:',
      '{',
      '  "city": string|null,',
      '  "property_type": "house"|"apartment"|"land"|"commercial"|"villa"|"office"|null,',
      '  "zone": string|null,',
      '  "budget_min": number|null,',
      '  "budget_max": number|null,',
      '  "monthly_budget": string|null,',
      '  "budget": string|null',
      '}',
      'Handle misspells and informal phrasing.',
      'If unknown, set null for that field.',
      'Do not invent values.',
    ].join('\n');

    const user = JSON.stringify({
      locale,
      intent: intent || 'general',
      current_slots: current || {},
      message,
    });

    try {
      const result = await this.aiAssistant.chat({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const raw = (result.message || '').trim();
      if (!raw) return null;
      const jsonChunk = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
      const obj = JSON.parse(jsonChunk);
      if (!obj || typeof obj !== 'object') return null;
      return obj as Partial<SiteAssistSlots>;
    } catch (e: any) {
      this.logger.warn(`extractSignalsWithAi: ${e?.message}`);
      return null;
    }
  }

  private slotProgress(before: SiteAssistSlots, after: SiteAssistSlots): { changed: boolean } {
    if ((before.city || '') !== (after.city || '')) return { changed: true };
    if ((before.property_type || '') !== (after.property_type || '')) return { changed: true };
    if ((before.zone || '') !== (after.zone || '')) return { changed: true };
    if ((before.budget || '') !== (after.budget || '')) return { changed: true };
    if ((before.monthly_budget || '') !== (after.monthly_budget || '')) return { changed: true };
    if ((before.budget_min ?? null) !== (after.budget_min ?? null)) return { changed: true };
    if ((before.budget_max ?? null) !== (after.budget_max ?? null)) return { changed: true };
    return { changed: false };
  }

  private clarifyPrefix(locale: SiteAssistLocale): string {
    return pick(
      {
        en: "I couldn't fully understand that input. ",
        es: 'No pude entender completamente ese dato. ',
        pt: 'Não consegui entender completamente esse dado. ',
      },
      locale,
    );
  }

  private nextCollectingQuestion(
    intent: SiteAssistIntent,
    slots: SiteAssistSlots,
    locale: SiteAssistLocale,
  ): { question: string; qualified: boolean } {
    const s = slots;
    if (intent === 'buy') {
      if (!s.city)
        return {
          qualified: false,
          question: pick(
            {
              en: 'Which city or area are you looking in?',
              es: '¿En qué ciudad o zona buscas?',
              pt: 'Em qual cidade ou região você está procurando?',
            },
            locale,
          ),
        };
      if (!s.property_type)
        return {
          qualified: false,
          question: pick(
            {
              en: 'What type of property? (apartment, house, land, etc.)',
              es: '¿Qué tipo de propiedad? (apartamento, casa, terreno, etc.)',
              pt: 'Que tipo de imóvel? (apartamento, casa, terreno, etc.)',
            },
            locale,
          ),
        };
      if (!this.hasBuyBudget(s))
        return {
          qualified: false,
          question: pick(
            {
              en: 'What is your approximate purchase budget?',
              es: '¿Cuál es tu presupuesto aproximado de compra?',
              pt: 'Qual é seu orçamento aproximado de compra?',
            },
            locale,
          ),
        };
      return { qualified: true, question: '' };
    }
    if (intent === 'rent') {
      if (!s.city)
        return {
          qualified: false,
          question: pick(
            {
              en: 'Which city or area do you want to rent in?',
              es: '¿En qué ciudad o zona quieres alquilar?',
              pt: 'Em qual cidade ou região você quer alugar?',
            },
            locale,
          ),
        };
      if (!s.property_type)
        return {
          qualified: false,
          question: pick(
            {
              en: 'What type of rental are you looking for?',
              es: '¿Qué tipo de alquiler buscas?',
              pt: 'Que tipo de aluguel você procura?',
            },
            locale,
          ),
        };
      if (!this.hasRentBudget(s))
        return {
          qualified: false,
          question: pick(
            {
              en: 'What is your approximate monthly budget?',
              es: '¿Cuál es tu presupuesto mensual aproximado?',
              pt: 'Qual é seu orçamento mensal aproximado?',
            },
            locale,
          ),
        };
      return { qualified: true, question: '' };
    }
    if (intent === 'sell') {
      if (!s.city)
        return {
          qualified: false,
          question: pick(
            {
              en: 'Which city is the property in?',
              es: '¿En qué ciudad está la propiedad?',
              pt: 'Em qual cidade fica o imóvel?',
            },
            locale,
          ),
        };
      if (!s.property_type)
        return {
          qualified: false,
          question: pick(
            {
              en: 'What type of property is it?',
              es: '¿Qué tipo de propiedad es?',
              pt: 'Que tipo de imóvel é?',
            },
            locale,
          ),
        };
      if (!s.zone)
        return {
          qualified: false,
          question: pick(
            {
              en: 'Which neighborhood or zone (or approximate address)?',
              es: '¿Qué barrio o zona (o dirección aproximada)?',
              pt: 'Qual bairro ou zona (ou endereço aproximado)?',
            },
            locale,
          ),
        };
      return { qualified: true, question: '' };
    }
    return { qualified: true, question: '' };
  }

  private async listingContextBlock(
    state: SiteAssistState,
    locale: SiteAssistLocale,
  ): Promise<string> {
    const slots = state.slots || {};
    const mode =
      state.intent === 'rent' ? 'rent' : state.intent === 'buy' ? 'sale' : undefined;
    const city = slots.city?.trim();
    const pt = slots.property_type?.trim();
    const priceMin = slots.budget_min != null ? slots.budget_min : undefined;
    const priceMax = slots.budget_max != null ? slots.budget_max : undefined;

    const fetchList = async (filters: Parameters<PropertiesService['findPublic']>[0]) => {
      const { items } = await this.propertiesService.findPublic(filters, { limit: 12, offset: 0 });
      return items;
    };

    try {
      let items: Awaited<ReturnType<typeof fetchList>> = [];

      if (city) {
        items = await fetchList({
          city,
          propertyType: pt,
          mode,
          priceMin,
          priceMax,
        });
      }
      if (!items.length && city) {
        items = await fetchList({
          search: city,
          propertyType: pt,
          mode,
          priceMin,
          priceMax,
        });
      }
      if (!items.length && city) {
        items = await fetchList({
          search: city,
          propertyType: pt,
          mode,
        });
      }
      if (!items.length) {
        items = await fetchList({
          propertyType: pt,
          mode,
          priceMin,
          priceMax,
        });
      }
      if (!items.length) {
        items = await fetchList({ propertyType: pt, mode });
      }
      if (!items.length) {
        items = await fetchList({ mode, priceMin, priceMax });
      }
      if (!items.length) {
        items = await fetchList({ mode });
      }
      if (!items.length) {
        items = await fetchList({});
      }

      if (!items.length) {
        return pick(
          {
            en: 'No matching published listings were found in the catalog for these filters.',
            es: 'No se encontraron anuncios publicados que coincidan con estos filtros.',
            pt: 'Não foram encontrados anúncios publicados que correspondam a esses filtros.',
          },
          locale,
        );
      }

      const lines = items.map((p) => {
        const url = this.propertyUrl(p.id);
        const price = p.price != null ? String(p.price) : '—';
        return `- ${p.title} | ${p.city ?? '—'} | ${price} | ${url}`;
      });
      return lines.join('\n');
    } catch (e: any) {
      this.logger.warn(`listingContextBlock: ${e?.message}`);
      return '';
    }
  }

  private localeInstruction(locale: SiteAssistLocale): string {
    const names = { en: 'English', es: 'Spanish', pt: 'Portuguese' };
    return `Always reply in ${names[locale]} (${locale}). Do not invent listing URLs; copy full https URLs exactly from the listing context. When you mention a property, include its full URL on its own line or after the title so users can open the listing page. If the context lists properties, those are real published listings from the database—do not claim there are none unless the context explicitly says no rows were found.`;
  }

  private async runLlm(
    history: { role: 'user' | 'assistant'; body: string }[],
    state: SiteAssistState,
    locale: SiteAssistLocale,
  ): Promise<string> {
    const listingBlock = await this.listingContextBlock(state, locale);
    const systemParts = [
      'You are a helpful real estate marketplace assistant on a public website.',
      this.localeInstruction(locale),
    ];
    const slots = state.slots || {};
    const bn: string[] = [];
    if (slots.budget_min != null) bn.push(`min ${slots.budget_min}`);
    if (slots.budget_max != null) bn.push(`max ${slots.budget_max}`);
    if (bn.length) {
      systemParts.push(
        `User stated budget (numeric, same currency as listing prices): ${bn.join(', ')}.`,
      );
    }
    if (listingBlock) {
      systemParts.push('Published listings (use these links when relevant):\n' + listingBlock);
    }
    const messages: ChatMessage[] = [{ role: 'system', content: systemParts.join('\n\n') }];
    for (const m of history.slice(-CONTEXT_LIMIT)) {
      messages.push({ role: m.role, content: m.body });
    }
    const result = await this.aiAssistant.chat({ messages });
    return (result.message || '').trim();
  }

  /**
   * Apply user input (text and/or button) and return assistant turn.
   */
  async processTurn(args: {
    sessionId: string;
    locale: SiteAssistLocale;
    state: SiteAssistState;
    message?: string;
    actionId?: string;
    priorMessages: { role: 'user' | 'assistant'; body: string }[];
  }): Promise<{ newState: SiteAssistState; response: SiteAssistTurnResponse }> {
    const { sessionId, locale } = args;
    let state: SiteAssistState = { ...args.state, slots: { ...args.state.slots } };

    const userParts: string[] = [];
    if (args.actionId) userParts.push(`[action:${args.actionId}]`);
    if (args.message?.trim()) userParts.push(args.message.trim());
    const userLine = userParts.join(' ');

    if (args.actionId === 'welcome_human' || args.actionId === 'talk_to_person') {
      state = { ...state, stage: 'chat', intent: 'general', slots: { ...state.slots } };
      return {
        newState: state,
        response: {
          sessionId,
          type: 'message',
          text: this.directHelpMessage(locale),
          buttons: [],
          links: [],
        },
      };
    }

    if (args.actionId === 'welcome_buy') {
      state = { stage: 'collecting', intent: 'buy', slots: { ...state.slots, mode: 'sale' } };
      const { question } = this.nextCollectingQuestion('buy', state.slots!, locale);
      return {
        newState: state,
        response: { sessionId, type: 'message', text: question, buttons: [], links: [] },
      };
    }
    if (args.actionId === 'welcome_rent') {
      state = { stage: 'collecting', intent: 'rent', slots: { ...state.slots, mode: 'rent' } };
      const { question } = this.nextCollectingQuestion('rent', state.slots!, locale);
      return {
        newState: state,
        response: { sessionId, type: 'message', text: question, buttons: [], links: [] },
      };
    }
    if (args.actionId === 'welcome_sell') {
      state = { stage: 'collecting', intent: 'sell', slots: { ...state.slots } };
      const { question } = this.nextCollectingQuestion('sell', state.slots!, locale);
      return {
        newState: state,
        response: { sessionId, type: 'message', text: question, buttons: [], links: [] },
      };
    }
    if (args.actionId === 'welcome_browse') {
      state = { stage: 'chat', intent: 'general', slots: { ...state.slots } };
      const browseUserLine = pick(
        {
          en: 'I want to browse listings.',
          es: 'Quiero ver anuncios disponibles.',
          pt: 'Quero ver anúncios disponíveis.',
        },
        locale,
      );
      const history = [...args.priorMessages, { role: 'user' as const, body: browseUserLine }];
      let reply: string;
      try {
        reply = await this.runLlm(history, state, locale);
      } catch (e: any) {
        this.logger.error(`runLlm: ${e?.message}`);
        reply = pick(
          {
            en: 'Sorry, something went wrong. Please try again in a moment.',
            es: 'Lo siento, algo salió mal. Intenta de nuevo en un momento.',
            pt: 'Desculpe, algo deu errado. Tente novamente em instantes.',
          },
          locale,
        );
      }
      return {
        newState: state,
        response: { sessionId, type: 'message', text: reply, buttons: [], links: [] },
      };
    }

    let parseProgress = { changed: false };
    if (args.message?.trim()) {
      const before = { ...(state.slots || {}) };
      const aiExtracted = await this.extractSignalsWithAi(
        args.message,
        locale,
        state.intent,
        state.slots || {},
      );
      if (aiExtracted) {
        state.slots = this.mergeExtractedSlots(state.slots || {}, aiExtracted);
      }
      state.slots = this.extractSignals(args.message, state.slots || {});
      state.slots = this.extractBudgetFromText(args.message, state.slots || {});
      if (state.intent === 'buy' || state.intent === 'rent' || state.intent === 'sell') {
        state.slots = this.applyPlainLocationFallback(args.message, state.intent, state.slots || {});
      }
      parseProgress = this.slotProgress(before, state.slots || {});
    }

    if (state.stage === 'collecting' && state.intent && ['buy', 'rent', 'sell'].includes(state.intent)) {
      const { question, qualified } = this.nextCollectingQuestion(state.intent, state.slots || {}, locale);
      if (!qualified) {
        const text =
          args.message?.trim() && !parseProgress.changed
            ? this.clarifyPrefix(locale) + question
            : question;
        return {
          newState: state,
          response: { sessionId, type: 'message', text, buttons: [], links: [] },
        };
      }
      state = { ...state, stage: 'chat' };
      const history = [...args.priorMessages, { role: 'user' as const, body: userLine || args.message?.trim() || '' }];
      let reply: string;
      try {
        reply = await this.runLlm(history, state, locale);
      } catch (e: any) {
        this.logger.error(`runLlm: ${e?.message}`);
        reply = pick(
          {
            en: 'Thanks! I have enough to search. Ask me anything else about these listings.',
            es: '¡Gracias! Ya puedo buscar. Pregúntame lo que necesites sobre estos anuncios.',
            pt: 'Obrigado! Já posso buscar. Pergunte o que precisar sobre esses anúncios.',
          },
          locale,
        );
      }
      return {
        newState: state,
        response: { sessionId, type: 'message', text: reply, buttons: [], links: [] },
      };
    }

    // chat / general
    state = { ...state, stage: 'chat', intent: state.intent || 'general' };
    const history = [...args.priorMessages, { role: 'user' as const, body: userLine || args.message?.trim() || 'Hello' }];
    let reply: string;
    try {
      reply = await this.runLlm(history, state, locale);
    } catch (e: any) {
      this.logger.error(`runLlm: ${e?.message}`);
      reply = pick(
        {
          en: 'Sorry, I could not generate a reply. Please try again.',
          es: 'No pude generar una respuesta. Intenta de nuevo.',
          pt: 'Não consegui gerar uma resposta. Tente novamente.',
        },
        locale,
      );
    }
    return {
      newState: state,
      response: { sessionId, type: 'message', text: reply, buttons: [], links: [] },
    };
  }
}
