export interface CreatePlanDto {
  name: string;
  description?: string;
  price: number;
  seatLimit: number;
  stripePriceId?: string;
  stripeProductId?: string;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  price?: number;
  seatLimit?: number;
  stripePriceId?: string;
  stripeProductId?: string;
  isActive?: boolean;
}

