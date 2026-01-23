export interface Buyer {
  id: string;
  userId: string | null;
  sessionId: string | null;
  ipHash: string | null;
  userAgentHash: string | null;
  firstSeenAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyerEvent {
  id: string;
  buyerId: string;
  eventType: string;
  propertyId: string | null;
  zoneId: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface BuyerIntentScore {
  id: string;
  buyerId: string;
  score: number;
  lastCalculatedAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyerIntentScoreLog {
  id: string;
  buyerId: string;
  scoreBefore: number;
  scoreAfter: number;
  changeReason: string;
  eventId: string | null;
  createdAt: Date;
}

export interface BuyerPropertyView {
  buyerId: string;
  propertyId: string;
  firstViewedAt: Date;
  lastViewedAt: Date;
  viewCount: number;
}

export interface Zone {
  id: string;
  city: string;
  neighborhood: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
