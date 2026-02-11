export enum PropertyType {
  SALE = 'sale',
  RENT = 'rent',
}

export enum PropertyStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  RESERVED = 'reserved',
  SOLD = 'sold',
  RENTED = 'rented',
  ARCHIVED = 'archived',
}

export enum PropertyOrigin {
  PLATFORM = 'platform',
  VA = 'va',
  CRM = 'crm',
}

export interface Property {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  price: number | null;
  type: PropertyType;
  status: PropertyStatus;
  origin: PropertyOrigin | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  createdBy: string;
  editedBy: string | null;
  teamId: string | null;
  zoneId: string | null;
  latitude: number | null;
  longitude: number | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  url: string;
  type: 'image' | 'video' | 'document';
  isPrimary: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface CreatePropertyDto {
  title: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  type: PropertyType;
  status?: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  teamId?: string | null;
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  type?: PropertyType;
  status?: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  latitude?: number;
  longitude?: number;
  teamId?: string | null;
  thumbnailUrl?: string | null;
}

