"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getOwnedWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: workspace, error } = await supabase
    .from("vault_workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("Could not load your workspace.");
  if (workspace) return workspace;

  const { data: created, error: createError } = await supabase
    .from("vault_workspaces")
    .insert({ owner_id: userId, name: "My Idea Vault" })
    .select("id")
    .single();

  if (createError || !created) throw new Error("Could not create your workspace.");
  return created;
}

export async function createIdea(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  if (!title || title.length > 200) redirect("/dashboard?error=Add%20a%20title%20under%20200%20characters");

  const workspace = await getOwnedWorkspace(supabase, userId);
  const { error } = await supabase.from("vault_ideas").insert({
    workspace_id: workspace.id,
    created_by: userId,
    title,
    summary: summary || null,
  });

  if (error) redirect("/dashboard?error=Could%20not%20save%20that%20idea");
  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function updateIdeaStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");

  const ideaId = String(formData.get("ideaId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["captured", "developing", "evaluating", "validated", "selected", "in_progress", "completed", "archived"];
  if (!ideaId || !allowed.includes(status)) redirect("/dashboard");

  const { error } = await supabase.from("vault_ideas").update({ status }).eq("id", ideaId);
  if (error) redirect("/dashboard?error=Could%20not%20update%20the%20idea");
  revalidatePath("/dashboard");
}