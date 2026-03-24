"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IdeaCard from "./components/IdeaCard";
import NewIdeaModal from "./components/NewIdeaModal";
import type { IdeaItem, IdeaStatus } from "./types/idea";

const LOCAL_STORAGE_KEY = "shadecode_ideas";
const STATUS_OPTIONS: IdeaStatus[] = ["raw", "exploring", "building", "archived"];
const STATUS_LABELS: Record<IdeaStatus, string> = {
  raw: "Raw",
  exploring: "Exploring",
  building: "Building",
  archived: "Archived",
};

const dropIdForStatus = (status: IdeaStatus) => `status-${status}`;

const isIdeaStatus = (value: unknown): value is IdeaStatus =>
  STATUS_OPTIONS.includes(value as IdeaStatus);

const normalizeScore = (score: unknown): number | undefined => {
  if (typeof score !== "number" || Number.isNaN(score) || !Number.isFinite(score)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const normalizeStatus = (status: unknown): IdeaStatus => {
  if (status === "raw" || status === "exploring" || status === "building" || status === "archived") {
    return status;
  }

  if (status === "Exploring") return "exploring";
  if (status === "Building") return "building";
  if (status === "Done") return "archived";

  return "raw";
};

const normalizeIdea = (
  item: unknown,
  fallbackTimestamp: string
): { idea: IdeaItem | null; migrated: boolean } => {
  // Normalize and migrate old idea data from localStorage
  // Handles missing fields: status, createdAt, updatedAt, tags
  if (!item || typeof item !== "object") return { idea: null, migrated: false };

  const raw = item as Partial<IdeaItem> & {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    status?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    tags?: unknown;
    score?: unknown;
    aiRecommendedStatus?: unknown;
  };

  if (typeof raw.id !== "string" || typeof raw.title !== "string" || typeof raw.description !== "string") {
    return { idea: null, migrated: false };
  }

  const normalizedStatus = normalizeStatus(raw.status);
  const hasCreatedAt = typeof raw.createdAt === "string";
  const hasUpdatedAt = typeof raw.updatedAt === "string";
  const createdAt: string = hasCreatedAt ? (raw.createdAt as string) : fallbackTimestamp;
  const updatedAt: string = hasUpdatedAt ? (raw.updatedAt as string) : createdAt;
  const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
  const normalizedTags = rawTags.filter((tag): tag is string => typeof tag === "string");
  const tagsMigrated = !Array.isArray(raw.tags) || rawTags.length !== normalizedTags.length;
  const normalizedScore = normalizeScore(raw.score);
  const hasScore = raw.score !== undefined;
  const scoreMigrated = hasScore && normalizedScore !== raw.score;
  const normalizedRecommendation = isIdeaStatus(raw.aiRecommendedStatus)
    ? raw.aiRecommendedStatus
    : undefined;
  const hasRecommendation = raw.aiRecommendedStatus !== undefined;
  const recommendationMigrated =
    hasRecommendation && normalizedRecommendation !== raw.aiRecommendedStatus;
  const migrated =
    raw.status !== normalizedStatus ||
    !hasCreatedAt ||
    !hasUpdatedAt ||
    tagsMigrated ||
    scoreMigrated ||
    recommendationMigrated;

  const idea: IdeaItem = {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    status: normalizedStatus, // Migration: if status is missing/invalid, normalizeStatus sets to "raw"
    createdAt,
    updatedAt,
    tags: normalizedTags,
  };


  if (typeof normalizedScore === "number") {
    idea.score = normalizedScore;
  }

  if (normalizedRecommendation) {
    idea.aiRecommendedStatus = normalizedRecommendation;
  }

  return { idea, migrated };
};

const pillBaseClasses = "rounded-full px-3 py-1 text-sm transition-colors";

type FilterPillProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function FilterPill({ label, isActive, onClick }: FilterPillProps) {
  const className = `${pillBaseClasses} ${
    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
  }`;

  if (isActive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed="true"
        className={className}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed="false"
      className={className}
    >
      {label}
    </button>
  );
}

type StatusFilterPillProps = {
  status: IdeaStatus;
  isActive: boolean;
  onClick: () => void;
};

function StatusFilterPill({ status, isActive, onClick }: StatusFilterPillProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dropIdForStatus(status) });
  const isActiveClasses = isActive
    ? "bg-slate-900 text-white"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200";
  const className = `${pillBaseClasses} ${isActiveClasses} ${isOver ? "ring-2 ring-slate-400" : ""}`;

  if (isActive) {
    return (
      <button
        type="button"
        ref={setNodeRef}
        onClick={onClick}
        aria-pressed="true"
        className={className}
      >
        {STATUS_LABELS[status]}
      </button>
    );
  }

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onClick}
      aria-pressed="false"
      className={className}
    >
      {STATUS_LABELS[status]}
    </button>
  );
}

const toTransformString = (
  transform: { x: number; y: number; scaleX?: number; scaleY?: number } | null
) => {
  if (!transform) return undefined;
  const scaleX = typeof transform.scaleX === "number" ? transform.scaleX : 1;
  const scaleY = typeof transform.scaleY === "number" ? transform.scaleY : 1;
  return `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${scaleX}, ${scaleY})`;
};

type DraggableIdeaCardProps = {
  idea: IdeaItem;
};

function DraggableIdeaCard({ idea }: DraggableIdeaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
  });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const attachRefs = useCallback(
    (node: HTMLDivElement | null) => {
      cardRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const transformValue = toTransformString(transform);
    if (transformValue) {
      node.style.setProperty("--drag-transform", transformValue);
    } else {
      node.style.removeProperty("--drag-transform");
    }

    if (transition) {
      node.style.setProperty("--drag-transition", transition);
    } else {
      node.style.removeProperty("--drag-transition");
    }
  }, [transform, transition]);

  return (
    <div
      ref={attachRefs}
      className={`draggable-idea-card ${isDragging ? "is-dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      <IdeaCard idea={idea} />
    </div>
  );
}

type StatusColumnProps = {
  status: IdeaStatus;
  ideas: IdeaItem[];
};

function StatusColumn({ status, ideas }: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: dropIdForStatus(status) });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-50 rounded-xl p-4 min-h-96 ${isOver ? "ring-2 ring-slate-300" : ""}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h3>
        <span className="text-xs text-slate-500">{ideas.length}</span>
      </div>

      <div className="mt-4 space-y-4">
        <SortableContext items={ideas.map((idea) => idea.id)} strategy={verticalListSortingStrategy}>
          {ideas.map((idea) => (
            <DraggableIdeaCard key={idea.id} idea={idea} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-2 text-center text-slate-400">
      <p className="text-lg font-medium">No ideas yet</p>
      <p className="mt-2 text-sm">
        Start by adding your first idea to the vault.
      </p>
    </div>
  );
}

export default function IdeaVaultPage() {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [hasLoadedIdeas, setHasLoadedIdeas] = useState(false);
  const [filter, setFilter] = useState<IdeaStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "updated" | "oldest" | "alpha">("newest");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      setHasLoadedIdeas(true);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        setHasLoadedIdeas(true);
        return;
      }

      const now = new Date().toISOString();
      let migrated = false;
      const normalized: IdeaItem[] = [];

      for (const entry of parsed) {
        const result = normalizeIdea(entry, now);
        if (result.idea) {
          normalized.push(result.idea);
        }
        if (result.migrated) {
          migrated = true;
        }
      }

      setIdeas(normalized);

      if (migrated) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch {
      console.error("Failed to parse ideas from localStorage");
    } finally {
      setHasLoadedIdeas(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedIdeas) return;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas, hasLoadedIdeas]);

  useEffect(() => {
    const message = localStorage.getItem("idea_vault_toast");
    if (!message) return;

    setToast(message);
    localStorage.removeItem("idea_vault_toast");

    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredIdeas = ideas.filter((idea) => {
    if (filter !== "all" && idea.status !== filter) return false;
    if (!normalizedSearch) return true;

    const inTitle = idea.title.toLowerCase().includes(normalizedSearch);
    const inDescription = idea.description.toLowerCase().includes(normalizedSearch);
    const inTags = idea.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

    return inTitle || inDescription || inTags;
  });

  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (sort === "newest") {
      return b.createdAt.localeCompare(a.createdAt);
    }
    if (sort === "updated") {
      return b.updatedAt.localeCompare(a.updatedAt);
    }
    if (sort === "oldest") {
      return a.createdAt.localeCompare(b.createdAt);
    }
    return a.title.localeCompare(b.title);
  });

  const ideasByStatus = useMemo(() => {
    const grouped: Record<IdeaStatus, IdeaItem[]> = {
      raw: [],
      exploring: [],
      building: [],
      archived: [],
    };

    for (const idea of sortedIdeas) {
      grouped[idea.status].push(idea);
    }

    return grouped;
  }, [sortedIdeas]);

  const updateIdeaStatus = (ideaId: string, nextStatus: IdeaStatus) => {
    const now = new Date().toISOString();
    let didChange = false;

    const updated = ideas.map((idea) => {
      if (idea.id !== ideaId) return idea;
      if (idea.status === nextStatus) return idea;

      didChange = true;
      return { ...idea, status: nextStatus, updatedAt: now };
    });

    if (!didChange) return;

    setIdeas(updated);

    if (hasLoadedIdeas) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let nextStatus: IdeaStatus | null = null;

    if (overId.startsWith("status-")) {
      const status = overId.replace("status-", "");
      if (STATUS_OPTIONS.includes(status as IdeaStatus)) {
        nextStatus = status as IdeaStatus;
      }
    } else {
      const overIdea = ideas.find((idea) => idea.id === overId);
      if (overIdea) {
        nextStatus = overIdea.status;
      }
    }

    if (!nextStatus) return;

    updateIdeaStatus(activeId, nextStatus);
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 px-4 py-3 rounded-md text-slate-200 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-xl font-semibold">Ideas</h1>

        <div className="flex flex-wrap items-center gap-3">
          <NewIdeaModal onCreate={(idea) => setIdeas((prev) => [idea, ...prev])} />

          <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                viewMode === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                viewMode === "board"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Board
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "updated" | "oldest" | "alpha")}
            aria-label="Sort ideas"
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-slate-200"
          >
            <option value="newest">Newest</option>
            <option value="updated">Recently Updated</option>
            <option value="oldest">Oldest</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <input
              type="search"
              placeholder="Search ideas..."
              aria-label="Search ideas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-3 py-2 border rounded-lg text-sm bg-slate-900 border-slate-800 text-slate-200 placeholder:text-slate-500"
            />
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                label="All"
                isActive={filter === "all"}
                onClick={() => setFilter("all")}
              />
              {STATUS_OPTIONS.map((status) =>
                viewMode === "list" ? (
                  <StatusFilterPill
                    key={status}
                    status={status}
                    isActive={filter === status}
                    onClick={() => setFilter(status)}
                  />
                ) : (
                  <FilterPill
                    key={status}
                    label={STATUS_LABELS[status]}
                    isActive={filter === status}
                    onClick={() => setFilter(status)}
                  />
                )
              )}
            </div>
          </div>

          {viewMode === "list" ? (
            sortedIdeas.length === 0 ? (
              <EmptyState />
            ) : (
              <SortableContext
                items={sortedIdeas.map((idea) => idea.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-4">
                  {sortedIdeas.map((idea) => (
                    <DraggableIdeaCard key={idea.id} idea={idea} />
                  ))}
                </div>
              </SortableContext>
            )
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {STATUS_OPTIONS.map((status) => (
                <StatusColumn
                  key={status}
                  status={status}
                  ideas={ideasByStatus[status]}
                />
              ))}
            </div>
          )}
        </div>
      </DndContext>
    </main>
  );
}
