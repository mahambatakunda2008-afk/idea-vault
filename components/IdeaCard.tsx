import type { IdeaItem } from "@/app/products/idea-vault/types/idea";
import Link from "next/link";
import StatusBadge from "./StatusBadge";

type Props = {
  idea: IdeaItem;
};

const formatUpdatedDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
};

const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 14;
const STALE_CUTOFF_MS = Date.now() - STALE_THRESHOLD_MS;

export default function IdeaCard({ idea }: Props) {
  const updatedAtTime = Date.parse(idea.updatedAt);
  const isStale =
    idea.status === "raw" &&
    !Number.isNaN(updatedAtTime) &&
    updatedAtTime < STALE_CUTOFF_MS;
  const hasScore = typeof idea.score === "number";

  return (
    <Link
      href={`/products/idea-vault/detail?id=${encodeURIComponent(idea.id)}`}
      className="block border border-slate-800 p-4 rounded-lg hover:bg-slate-900 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-200">{idea.title}</h3>
        <div className="flex items-center gap-2">
          {hasScore && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              Score: {idea.score}
            </span>
          )}
          <StatusBadge status={idea.status} />
        </div>
      </div>
      <p className="mt-2 text-slate-400 text-sm line-clamp-2">{idea.description}</p>
      <p className="mt-2 text-xs text-slate-500">
        Updated: {formatUpdatedDate(idea.updatedAt)}
      </p>
      {isStale && (
        <p className="text-xs text-amber-600 mt-1">⚠ Stale idea</p>
      )}
    </Link>
  );
}
