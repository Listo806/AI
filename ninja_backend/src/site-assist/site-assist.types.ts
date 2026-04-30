export type SiteAssistLocale = 'en' | 'es' | 'pt';

export type SiteAssistStage = 'welcome' | 'collecting' | 'chat' | 'handoff';

export type SiteAssistIntent = 'buy' | 'rent' | 'sell' | 'general' | 'human';

export interface SiteAssistSlots {
  city?: string;
  property_type?: string;
  /** Raw budget text (optional; for display / LLM) */
  budget?: string;
  monthly_budget?: string;
  /** Parsed purchase budget (buy) or price band for listing search */
  budget_min?: number;
  budget_max?: number;
  zone?: string;
  mode?: 'sale' | 'rent';
}

export interface SiteAssistState {
  stage: SiteAssistStage;
  intent?: SiteAssistIntent;
  slots?: SiteAssistSlots;
}

export interface SiteAssistButton {
  id: string;
  label: string;
}

export interface SiteAssistLink {
  label: string;
  url: string;
}

export interface SiteAssistTurnResponse {
  sessionId: string;
  type: 'message' | 'handoff';
  text: string;
  buttons: SiteAssistButton[];
  links: SiteAssistLink[];
}
