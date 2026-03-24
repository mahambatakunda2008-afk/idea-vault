export type IdeaStatus = "raw" | "exploring" | "building" | "archived";

export type IdeaItem = {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  score?: number;
  aiRecommendedStatus?: IdeaStatus;
};
