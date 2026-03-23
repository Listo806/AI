export type SiteAssistLocale = 'en' | 'es' | 'pt';

export type SiteAssistStage = 'welcome' | 'collecting' | 'chat' | 'handoff';

export type SiteAssistIntent = 'buy' | 'rent' | 'sell' | 'general' | 'human';

export interface SiteAssistSlots {
  city?: string;
  property_type?: string;
  budget?: string;
  monthly_budget?: string;
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
