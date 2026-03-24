import type { IdeaStatus } from "../types/idea";

type Props = {
  status: IdeaStatus;
};

const STATUS_STYLES: Record<IdeaStatus, string> = {
  raw: "bg-slate-100 text-slate-700",
  exploring: "bg-blue-100 text-blue-700",
  building: "bg-amber-100 text-amber-700",
  archived: "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ease-in-out animate-fade-in hover:scale-105 transition-transform ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}
