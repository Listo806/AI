import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { AiAssistantService, ChatMessage } from '../integrations/ai/ai-assistant.service';
import { PropertiesService } from '../properties/properties.service';
import {
  SiteAssistButton,
  SiteAssistIntent,
  SiteAssistLink,
  SiteAssistLocale,
  SiteAssistSlots,
  SiteAssistState,
  SiteAssistTurnResponse,
} from './site-assist.types';

const CONTEXT_LIMIT = 24;

function pick<T extends Record<SiteAssistLocale, string>>(m: T, locale: SiteAssistLocale): string {
  return m[locale] || m.en;
}

@Injectable()
export class SiteAssistOrchestratorService {
  private readonly logger = new Logger(SiteAssistOrchestratorService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly aiAssistant: AiAssistantService,
    private readonly propertiesService: PropertiesService,
  ) {}

  private handoffLinks(): SiteAssistLink[] {
    const raw = this.config.get('SITE_ASSIST_HANDOFF_LINKS');
    if (!raw?.trim()) return [];
    try {
      const parsed = JSON.parse(raw) as SiteAssistLink[];
      return Array.isArray(parsed)
        ? parsed.filter((x) => x && typeof x.url === 'string' && typeof x.label === 'string')
        : [];
    } catch {
      return [];
    }
  }

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
      { id: 'welcome_browse', label: pick({ en: 'Browse listings', es: 'Ver anuncios', pt: 'Ver anúncios' }, locale) },
      { id: 'welcome_human', label: pick({ en: 'Talk to a person', es: 'Hablar con una persona', pt: 'Falar com uma pessoa' }, locale) },
    ];
    return { sessionId, type: 'message', text, buttons, links: [] };
  }

  private handoffResponse(sessionId: string, locale: SiteAssistLocale): SiteAssistTurnResponse {
    const text = pick(
      {
        en: 'Here are the best ways to reach our team:',
        es: 'Aquí tienes las mejores formas de contactar a nuestro equipo:',
        pt: 'Aqui estão as melhores formas de falar com nossa equipe:',
      },
      locale,
    );
    return { sessionId, type: 'handoff', text, buttons: [], links: this.handoffLinks() };
  }

  private extractSignals(text: string, slots: SiteAssistSlots): SiteAssistSlots {
    const t = (text || '').toLowerCase();
    const next: SiteAssistSlots = { ...slots };

    const cityMatch =
      t.match(/(?:ciudad|city|cidade)\s*[:-]\s*([a-záéíóúãõç\s]{2,40})/i) ||
      t.match(/\b(?:en|in|em)\s+([a-záéíóúãõç\s]{2,30})\b/i);
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

    const money = t.match(/(\$|usd|eur)?\s*([0-9]{2,3}(?:[.,][0-9]{3})+|[0-9]{3,7})/);
    if (money) {
      const amount = money[2].replace(/\./g, '').replace(/,/g, '');
      const isMonthly = /(mensual|al mes|por mes|\/mes|per month|monthly|mês|por mês)/i.test(t);
      if (isMonthly) next.monthly_budget = amount;
      else next.budget = amount;
    }

    const zoneMatch =
      t.match(/(?:zona|barrio|vecindario|neighborhood|bairro)\s*[:-]?\s*([a-z0-9áéíóúãõç\s]{2,60})/i) ||
      t.match(/(?:direcci[oó]n|address|endereço)\s*[:-]?\s*([a-z0-9áéíóúãõç\s]{5,80})/i);
    if (zoneMatch) next.zone = (zoneMatch[1] || '').trim();

    return next;
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
      if (!s.budget)
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
      if (!s.monthly_budget)
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
    try {
      const { items } = await this.propertiesService.findPublic(
        {
          city: slots.city,
          propertyType: slots.property_type,
          mode,
          search: [slots.city, slots.zone].filter(Boolean).join(' ') || undefined,
        },
        { limit: 8, offset: 0 },
      );
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
    return `Always reply in ${names[locale]} (${locale}). Do not invent listing URLs; copy full https URLs exactly from the listing context. When you mention a property, include its full URL on its own line or after the title so users can open the listing page.`;
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

    if (args.actionId === 'welcome_human') {
      state = { ...state, stage: 'handoff', intent: 'human' };
      return { newState: state, response: this.handoffResponse(sessionId, locale) };
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

    if (state.stage === 'collecting' && state.intent && ['buy', 'rent', 'sell'].includes(state.intent)) {
      if (args.message?.trim()) {
        state.slots = this.extractSignals(args.message, state.slots || {});
      }
      const { question, qualified } = this.nextCollectingQuestion(state.intent, state.slots || {}, locale);
      if (!qualified) {
        return {
          newState: state,
          response: { sessionId, type: 'message', text: question, buttons: [], links: [] },
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

    if (state.stage === 'handoff') {
      return { newState: state, response: this.handoffResponse(sessionId, locale) };
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
