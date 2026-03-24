"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { IdeaItem, IdeaStatus } from "../types/idea";
import StatusBadge from "../components/StatusBadge";

const LOCAL_STORAGE_KEY = "shadecode_ideas";
const STATUS_OPTIONS: IdeaStatus[] = ["raw", "exploring", "building", "archived"];

const normalizeStatus = (status: unknown): IdeaStatus => {
  if (status === "raw" || status === "exploring" || status === "building" || status === "archived") {
    return status;
  }

  return "exploring";
};

const normalizeTags = (tags: unknown): string[] => {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag): tag is string => typeof tag === "string");
};

const normalizeScore = (score: unknown): number | undefined => {
  if (typeof score !== "number" || Number.isNaN(score) || !Number.isFinite(score)) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const isIdeaStatus = (value: unknown): value is IdeaStatus =>
  STATUS_OPTIONS.includes(value as IdeaStatus);

const mergeTags = (current: string[], incoming: string[]) => {
  const seen = new Set(current.map((tag) => tag.toLowerCase()));
  const merged = [...current];

  for (const tag of incoming) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
};

export default function IdeaDetailClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [idea, setIdea] = useState<IdeaItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("exploring");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisReasoning, setAnalysisReasoning] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    const ideas: IdeaItem[] = JSON.parse(stored);
    const found = ideas.find((i) => i.id === id);

    if (found) {
      const normalizedStatus = normalizeStatus(found.status);
      const normalizedTags = normalizeTags(found.tags);
      const normalizedScore = normalizeScore(found.score);
      const normalizedRecommendation = isIdeaStatus(found.aiRecommendedStatus)
        ? found.aiRecommendedStatus
        : undefined;

      setIdea({
        ...found,
        status: normalizedStatus,
        tags: normalizedTags,
        score: normalizedScore,
        aiRecommendedStatus: normalizedRecommendation,
      });
      setTitle(found.title);
      setDescription(found.description);
      setStatus(normalizedStatus);
      setTags(normalizedTags);
    }
  }, [id]);

  if (!idea) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-slate-400">
        Idea not found
      </main>
    );
  }

  const handleSave = () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    const now = new Date().toISOString();
    const ideas: IdeaItem[] = JSON.parse(stored);
    const updated = ideas.map((i) =>
      i.id === id ? { ...i, title, description, status, tags, updatedAt: now } : i
    );

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("idea_vault_toast", "Idea updated");

    setIdea({ ...idea, title, description, status, tags, updatedAt: now });
    setEditing(false);
  };

  const updateTags = (nextTags: string[]) => {
    if (!id) return;

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    const now = new Date().toISOString();

    try {
      const ideas: IdeaItem[] = JSON.parse(stored);
      const updated = ideas.map((i) =>
        i.id === id ? { ...i, tags: nextTags, updatedAt: now } : i
      );

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setIdea({ ...idea, tags: nextTags, updatedAt: now });
      setTags(nextTags);
    } catch {
      console.error("Failed to update idea tags");
    }
  };

  const handleAddTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) return;
    if (tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setTagInput("");
      return;
    }

    updateTags([...tags, nextTag]);
    setTagInput("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleAddTag();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAnalyze = async () => {
    if (!id) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisReasoning(null);

    try {
      const response = await fetch("/api/idea-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          tags,
          status: idea.status,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const message =
          typeof errorPayload.error === "string"
            ? errorPayload.error
            : "Failed to analyze idea";
        throw new Error(message);
      }

      const result = (await response.json()) as {
        suggestedTags?: unknown;
        score?: unknown;
        recommendedStatus?: unknown;
        reasoning?: unknown;
      };

      const suggestedTags = Array.isArray(result.suggestedTags)
        ? result.suggestedTags.filter((tag): tag is string => typeof tag === "string")
        : [];
      const normalizedScore = normalizeScore(result.score);
      const normalizedRecommendation = isIdeaStatus(result.recommendedStatus)
        ? result.recommendedStatus
        : undefined;
      const reasoning = typeof result.reasoning === "string" ? result.reasoning : null;
      const mergedTags = mergeTags(tags, suggestedTags);
      const now = new Date().toISOString();

      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const ideas: IdeaItem[] = JSON.parse(stored);
        const updated = ideas.map((i) =>
          i.id === id
            ? {
                ...i,
                tags: mergedTags,
                score: normalizedScore,
                aiRecommendedStatus: normalizedRecommendation,
                updatedAt: now,
              }
            : i
        );

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }

      setIdea({
        ...idea,
        tags: mergedTags,
        score: normalizedScore,
        aiRecommendedStatus: normalizedRecommendation,
        updatedAt: now,
      });
      setTags(mergedTags);
      setAnalysisReasoning(reasoning);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze idea");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = (nextStatus: IdeaStatus) => {
    if (!id) return;

    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    const now = new Date().toISOString();

    try {
      const ideas: IdeaItem[] = JSON.parse(stored);
      const updated = ideas.map((i) =>
        i.id === id ? { ...i, status: nextStatus, updatedAt: now } : i
      );

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setIdea({ ...idea, status: nextStatus, updatedAt: now });
      setStatus(nextStatus);
    } catch {
      console.error("Failed to update idea status");
    }
  };

  const handleApplyRecommendation = () => {
    if (!idea.aiRecommendedStatus) return;
    if (idea.aiRecommendedStatus === idea.status) return;
    handleStatusChange(idea.aiRecommendedStatus);
  };

  const handleDelete = () => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return;

    const ideas: IdeaItem[] = JSON.parse(stored);
    const updated = ideas.filter((i) => i.id !== id);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("idea_vault_toast", "Idea deleted");

    router.push("/products/idea-vault");
  };

  const showScore = typeof idea.score === "number";
  const showRecommendation = Boolean(idea.aiRecommendedStatus);

  return (
    <main className="max-w-4xl mx-auto px-6 py-20 space-y-6">
      {editing ? (
        <div className="space-y-4">
          <input
            value={title}
            aria-label="Idea title"
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
          />

          <textarea
            value={description}
            aria-label="Idea description"
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
          />

          <select
            value={status}
            aria-label="Idea status"
            onChange={(e) => setStatus(e.target.value as IdeaStatus)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
          >
            <option value="raw">Raw</option>
            <option value="exploring">Exploring</option>
            <option value="building">Building</option>
            <option value="archived">Archived</option>
          </select>

          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary">Save</button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-200">{idea.title}</h1>
            <StatusBadge status={idea.status} />
          </div>
          <p className="text-slate-400">{idea.description}</p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="btn-primary"
            >
              {isAnalyzing ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
                  Analyzing...
                </span>
              ) : (
                "Analyze Idea"
              )}
            </button>
            {analysisError && (
              <p className="text-sm text-red-400">{analysisError}</p>
            )}
          </div>

          {(showScore || showRecommendation) && (
            <div className="grid gap-4 md:grid-cols-2">
              {showScore && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <p className="text-xs uppercase text-slate-500">Score</p>
                  <p className="text-3xl font-bold text-slate-200">{idea.score}</p>
                </div>
              )}
              {showRecommendation && idea.aiRecommendedStatus && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase text-slate-500">Recommended Status</p>
                    <StatusBadge status={idea.aiRecommendedStatus} />
                  </div>
                  {analysisReasoning && (
                    <p className="text-sm text-slate-400">{analysisReasoning}</p>
                  )}
                  {idea.aiRecommendedStatus !== idea.status && (
                    <button
                      type="button"
                      onClick={handleApplyRecommendation}
                      className="btn-secondary"
                    >
                      Apply Recommendation
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="tag-input" className="text-sm text-slate-400">
              Tags
            </label>
            <input
              id="tag-input"
              type="text"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder:text-slate-500"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-500 hover:text-slate-700"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="idea-status" className="text-sm text-slate-400">
              Status
            </label>
            <select
              id="idea-status"
              value={idea.status}
              onChange={(e) => handleStatusChange(e.target.value as IdeaStatus)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200"
            >
              <option value="raw">Raw</option>
              <option value="exploring">Exploring</option>
              <option value="building">Building</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-400 hover:text-red-300"
            >
              Delete idea
            </button>
          </div>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <p className="text-slate-200 mb-4">
              Delete this idea permanently?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
              <button onClick={handleDelete} className="bg-red-600 px-4 py-2 rounded">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}