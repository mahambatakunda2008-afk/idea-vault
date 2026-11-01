"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const projectStatuses = ["planned", "active", "paused", "completed", "archived"] as const;

async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");
  return { supabase, userId };
}

export async function addProjectTask(formData: FormData) {
  const { supabase } = await getUser();
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 5000);
  const dueValue = String(formData.get("dueAt") ?? "").trim();
  if (!projectId || !title) redirect("/dashboard");

  const { data: project } = await supabase.from("vault_projects")
    .select("id,workspace_id").eq("id", projectId).single();
  if (!project) redirect("/dashboard");

  const { data: lastTask } = await supabase.from("vault_project_tasks")
    .select("position").eq("project_id", projectId)
    .order("position", { ascending: false }).limit(1).maybeSingle();

  const { error } = await supabase.from("vault_project_tasks").insert({
    workspace_id: project.workspace_id,
    project_id: project.id,
    title,
    notes: notes || null,
    due_at: dueValue ? new Date(dueValue).toISOString() : null,
    position: (lastTask?.position ?? -1) + 1,
  });

  if (error) redirect(`/dashboard/projects/${projectId}?error=Could%20not%20add%20task`);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function toggleProjectTask(formData: FormData) {
  const { supabase } = await getUser();
  const projectId = String(formData.get("projectId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const nextValue = String(formData.get("completed") ?? "") === "true";
  const { error } = await supabase.from("vault_project_tasks")
    .update({ is_completed: nextValue }).eq("id", taskId).eq("project_id", projectId);
  if (error) redirect(`/dashboard/projects/${projectId}?error=Could%20not%20update%20task`);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateProjectStatus(formData: FormData) {
  const { supabase } = await getUser();
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!projectStatuses.includes(status as (typeof projectStatuses)[number])) redirect("/dashboard");
  const { error } = await supabase.from("vault_projects")
    .update({ status: status as (typeof projectStatuses)[number] }).eq("id", projectId);
  if (error) redirect(`/dashboard/projects/${projectId}?error=Could%20not%20update%20project`);
  revalidatePath(`/dashboard/projects/${projectId}`);
}