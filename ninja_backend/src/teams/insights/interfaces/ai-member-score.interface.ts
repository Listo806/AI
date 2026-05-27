export interface AIMemberScore {
  id: string;

  name: string;

  totalLeads: number;

  dealsWon: number;

  pipelineValue: number;

  lastSeenAt?: Date | null;

  aiScore: number;

  engagementScore: number;

  performanceScore: number;

  responseScore: number;
}
