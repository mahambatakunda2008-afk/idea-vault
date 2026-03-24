/// <reference types="vitest" />
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IdeaDetailClient from "./IdeaDetailClient";

let currentParams: { id?: string } = { id: "idea-1" };

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "id" ? currentParams.id ?? null : null),
  }),
  useRouter: () => ({ push: vi.fn() }),
}));

const LOCAL_STORAGE_KEY = "shadecode_ideas";

const setIdeas = (ideas: Array<Record<string, unknown>>) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ideas));
};

describe("IdeaDetailClient", () => {
  beforeEach(() => {
    currentParams = { id: "idea-1" };
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
  });

  it("regression: loads lowercase status and keeps it in edit mode", () => {
    setIdeas([
      {
        id: "idea-1",
        title: "Test idea",
        description: "Some description",
        status: "exploring",
      },
    ]);

    render(<IdeaDetailClient />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const statusSelect = screen.getByRole("combobox");
    expect(statusSelect).toHaveValue("exploring");
  });

  it("empty state: shows not found when id is missing", () => {
    setIdeas([
      {
        id: "idea-2",
        title: "Other idea",
        description: "Different",
        status: "building",
      },
    ]);
    currentParams = { id: "missing" };

    render(<IdeaDetailClient />);

    expect(screen.getByText(/idea not found/i)).toBeInTheDocument();
  });

  it("invalid input: falls back to exploring without crashing", () => {
    setIdeas([
      {
        id: "idea-1",
        title: "Odd idea",
        description: "Weird status",
        status: "invalid",
      },
    ]);

    render(<IdeaDetailClient />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    const statusSelect = screen.getByRole("combobox");
    expect(statusSelect).toHaveValue("exploring");
  });
});
