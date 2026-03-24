import IdeaCard from "./IdeaCard";
import type { IdeaItem } from "@/app/products/idea-vault/types/idea";

type Props = {
    ideas: IdeaItem[];
};

export default function IdeaList({ ideas }: Props) {
    if (ideas.length === 0) {
        return (
            <div className="mt-2 text-center text-slate-400">
            <p className="text-lg font-medium">
                No ideas yet
            </p>
            <p className="mt-2 text-sm">
                Start by adding your first idea to the vault.
            </p>
            </div>
        );
    }
    return (
        <div className="grid gap-4">
            {ideas.map((idea) => (
                <IdeaCard key={idea.id}
                idea={idea}/>
            ))} 
        </div>
    );
}