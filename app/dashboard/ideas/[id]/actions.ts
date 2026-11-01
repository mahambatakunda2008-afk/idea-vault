"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const statuses = ["captured", "developing", "evaluating", "validated", "selected", "in_progress", "completed", "archived"] as const;
const priorities = ["low", "normal", "high", "critical"] as const;

function text(formData: FormData, key: string, max = 10000) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function score(formData: FormData, key: string) {
  const value = text(formData, key, 2);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");
  return { supabase, userId };
}

export async function saveIdea(formData: FormData) {
  const { supabase } = await authenticatedClient();
  const id = text(formData, "ideaId", 64);
  const title = text(formData, "title", 200);
  const status = text(formData, "status", 32);
  const priority = text(formData, "priority", 16);
  if (!id || !title || !statuses.includes(status as (typeof statuses)[number]) || !priorities.includes(priority as (typeof priorities)[number])) {
    redirect("/dashboard?error=Please%20check%20the%20idea%20details");
  }

  const { error } = await supabase.from("vault_ideas").update({
    title,
    summary: text(formData, "summary", 500) || null,
    description: text(formData, "description") || null,
    problem: text(formData, "problem") || null,
    proposed_solution: text(formData, "proposed_solution") || null,
    target_audience: text(formData, "target_audience") || null,
    differentiation: text(formData, "differentiation") || null,
    resources: text(formData, "resources") || null,
    risks: text(formData, "risks") || null,
    status: status as (typeof statuses)[number],
    priority: priority as (typeof priorities)[number],
  }).eq("id", id);

  if (error) redirect(`/dashboard/ideas/${id}?error=Could%20not%20save%20changes`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/ideas/${id}`);
  redirect(`/dashboard/ideas/${id}?saved=1`);
}

export async function addEvaluation(formData: FormData) {
  const { supabase, userId } = await authenticatedClient();
  const ideaId = text(formData, "ideaId", 64);
  const { data: idea } = await supabase.from("vault_ideas").select("id,workspace_id").eq("id", ideaId).single();
  if (!idea) redirect("/dashboard");

  const assumptions = text(formData, "assumptions", 5000)
    .split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 30);

  const { error } = await supabase.from("vault_evaluations").insert({
    workspace_id: idea.workspace_id,
    idea_id: idea.id,
    evaluated_by: userId,
    problem_importance: score(formData, "problem_importance"),
    demand_evidence: score(formData, "demand_evidence"),
    feasibility: score(formData, "feasibility"),
    cost_accessibility: score(formData, "cost_accessibility"),
    differentiation: score(formData, "differentiation"),
    risk_level: score(formData, "risk_level"),
    evidence: text(formData, "evidence", 10000) || null,
    assumptions,
  });

  if (error) redirect(`/dashboard/ideas/${ideaId}?error=Could%20not%20save%20evaluation`);
  revalidatePath(`/dashboard/ideas/${ideaId}`);
  redirect(`/dashboard/ideas/${ideaId}?evaluated=1`);
}

export async function convertIdeaToProject(formData: FormData) {
  const { supabase } = await authenticatedClient();
  const ideaId = text(formData, "ideaId", 64);
  const targetDate = text(formData, "targetDate", 10) || null;
  const { data: projectId, error } = await supabase.rpc("vault_convert_idea_to_project", {
    p_idea_id: ideaId,
    p_target_date: targetDate,
  });

  if (error || !projectId) redirect(`/dashboard/ideas/${ideaId}?error=Could%20not%20convert%20idea%20to%20project`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/ideas/${ideaId}`);
  redirect(`/dashboard/projects/${projectId}`);
}