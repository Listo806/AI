export interface BuyerPreferences {
  buyerId: string;
  priceRange: {
    min: number | null;
    max: number | null;
  };
  bedrooms: {
    min: number | null;
    max: number | null;
  };
  propertyType: 'sale' | 'rent' | null; // Most common type
  zones: string[]; // List of zone IDs
  extractedAt: Date;
}

export interface BuyerEventWithMetadata {
  id: string;
  buyerId: string;
  eventType: string;
  propertyId: string | null;
  zoneId: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}
