export type IdeaStatus = "exploring" | "building" | "done";
export interface Idea {
    id: string;
    title: string;
    description: string;
    status: IdeaStatus;
}
