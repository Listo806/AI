export interface TeamAIAlert {
  type: "warning" | "danger" | "success" | "info";

  title: string;

  description: string;
}