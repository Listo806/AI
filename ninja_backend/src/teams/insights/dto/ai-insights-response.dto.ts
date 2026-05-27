export class AIInsightsResponseDto {
  teamHealthScore: number;

  summary: string;

  productivityScore: number;

  collaborationScore: number;

  efficiencyScore: number;

  risks: string[];

  recommendations: string[];

  topPerformers: any[];

  nextActions: {
    label: string;
    route: string;
  }[];
}
