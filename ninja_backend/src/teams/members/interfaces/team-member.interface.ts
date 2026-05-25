export interface TeamMember {
  id: string;

  name: string;

  email: string;

  avatar?: string;

  role: string;

  isActive: boolean;

  lastSeenAt?: Date;

  totalLeads: number;

  dealsWon: number;

  pipelineValue: number;

  aiScore: number;
}