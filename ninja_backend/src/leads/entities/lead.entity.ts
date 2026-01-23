export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  FOLLOW_UP = 'follow-up',
  CLOSED_WON = 'closed-won',
  CLOSED_LOST = 'closed-lost',
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  assignedTo: string | null;
  createdBy: string;
  teamId: string | null;
  propertyId: string | null;
  notes: string | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLeadDto {
  name: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  assignedTo?: string;
  propertyId?: string;
  notes?: string;
  source?: string;
}

export interface UpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  assignedTo?: string;
  propertyId?: string;
  notes?: string;
  source?: string;
}

