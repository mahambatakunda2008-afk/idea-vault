"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { IdeaItem } from "../types/idea";

type Props = {
  onCreate: (idea: IdeaItem) => void;
};

export default function NewIdeaModal({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const now = new Date().toISOString();

    onCreate({
      id: crypto.randomUUID(),
      title: trimmedTitle,
      description,
      status: "raw",
      createdAt: now,
      updatedAt: now,
      tags: [],
    });

    setTitle("");
    setDescription("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 text-slate-900 hover:bg-white transition"
      >
        New Idea
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-200">New Idea</h2>

              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Idea title"
                aria-label="Idea title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-600"
              />

              <textarea
                placeholder="Describe the idea..."
                aria-label="Describe the idea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 hover:bg-slate-900 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-slate-700 text-slate-300 disabled:opacity-50 hover:bg-slate-600 transition"
                >
                  Save Idea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
