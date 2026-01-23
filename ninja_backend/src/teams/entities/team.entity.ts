export interface Team {
  id: string;
  name: string;
  ownerId: string;
  seatLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamDto {
  name: string;
  seatLimit?: number;
}

export interface UpdateTeamDto {
  name?: string;
  seatLimit?: number;
}

