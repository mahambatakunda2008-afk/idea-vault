import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createIdea, updateIdeaStatus } from "./actions";

type Props = { searchParams: Promise<{ q?: string; saved?: string; error?: string }> };

const labels: Record<string, string> = {
  captured: "Captured", developing: "Developing", evaluating: "Evaluating",
  validated: "Validated", selected: "Selected", in_progress: "In progress",
  completed: "Completed", archived: "Archived",
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string") redirect("/login");

  const { data: workspace } = await supabase
    .from("vault_workspaces").select("id,name").eq("owner_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();

  let query = supabase.from("vault_ideas")
    .select("id,title,summary,status,priority,created_at,updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  const term = params.q?.trim();
  if (term) query = query.textSearch("search_document", term, { config: "english", type: "websearch" });
  if (workspace?.id) query = query.eq("workspace_id", workspace.id);
  else query = query.eq("workspace_id", "00000000-0000-0000-0000-000000000000");

  const { data: ideas, error } = await query;

  return (
    <main className="shell pb-16">
      <header className="topbar">
        <Link href="/dashboard" className="brand"><span className="brand-mark">V</span> Idea Vault</Link>
        <div className="flex items-center gap-4">
          <span className="muted hidden text-sm sm:inline">{auth.claims.email as string}</span>
          <form action="/auth/signout" method="post"><button className="btn btn-quiet text-sm" type="submit">Sign out</button></form>
        </div>
      </header>

      <section className="py-10 sm:py-14">
        <p className="eyebrow">Your private workspace</p>
        <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your ideas, in motion.</h1><p className="muted mt-2 max-w-xl">Capture the spark. Give it shape. Decide what deserves your next move.</p></div>
          <span className="status">{ideas?.length ?? 0} ideas in your vault</span>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold">Your vault</h2>
            <form className="flex gap-2" action="/dashboard" method="get">
              <input className="field min-w-0 sm:w-64" name="q" defaultValue={term} placeholder="Search ideas…" aria-label="Search ideas" />
              <button className="btn btn-quiet" type="submit">Search</button>
            </form>
          </div>
          {params.saved && <p role="status" className="text-sm text-cyan-300">Idea saved to your vault.</p>}
          {params.error && <p role="alert" className="text-sm text-red-300">{params.error}</p>}
          {error && <p role="alert" className="text-sm text-red-300">Your ideas could not be loaded. Refresh to try again.</p>}
          {!error && (!ideas || ideas.length === 0) && (
            <div className="panel p-8 text-center sm:p-12"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-cyan-900 bg-cyan-950/40 text-xl text-cyan-300">✳</div><h3 className="mt-4 text-lg font-semibold">{term ? "No matching ideas" : "Your first idea starts here"}</h3><p className="muted mx-auto mt-2 max-w-sm text-sm leading-6">{term ? "Try another search phrase." : "No scoring, forms or ceremony. Put the thought down first. You can develop it later."}</p></div>
          )}
          <div className="space-y-3">
            {(ideas ?? []).map((idea) => (
              <article key={idea.id} className="idea-row">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0"><h3 className="font-semibold"><Link className="hover:text-cyan-300" href={`/dashboard/ideas/${idea.id}`}>{idea.title}</Link></h3>{idea.summary && <p className="muted mt-1 text-sm leading-6">{idea.summary}</p>}<p className="muted mt-3 text-xs">Updated {new Date(idea.updated_at).toLocaleDateString()}</p></div>
                  <div className="flex items-center gap-2">
                    <span className="status">{labels[idea.status] ?? idea.status}</span>
                    <form action={updateIdeaStatus}><input type="hidden" name="ideaId" value={idea.id} /><input type="hidden" name="status" value={idea.status === "archived" ? "captured" : "archived"} /><button className="btn btn-quiet text-xs" type="submit">{idea.status === "archived" ? "Restore" : "Archive"}</button></form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel h-fit p-5 sm:p-6">
          <p className="eyebrow">Quick capture</p>
          <h2 className="mt-2 text-xl font-semibold">Catch the thought.</h2>
          <p className="muted mt-2 text-sm leading-6">Give it a name now. The deeper thinking can happen when you are ready.</p>
          <form action={createIdea} className="mt-5 space-y-3">
            <label htmlFor="title" className="block text-sm font-medium">Idea title</label>
            <input id="title" name="title" className="field" placeholder="What are you thinking about?" maxLength={200} required />
            <label htmlFor="summary" className="block text-sm font-medium">A little context <span className="muted">(optional)</span></label>
            <textarea id="summary" name="summary" className="field min-h-24 resize-y" placeholder="A sentence or two is enough." maxLength={500} />
            <button className="btn btn-primary w-full" type="submit">Save idea <span aria-hidden>＋</span></button>
          </form>
          <p className="muted mt-4 text-xs leading-5">Private by default. No AI required. No idea is judged at capture.</p>
        </aside>
      </section>
    </main>
  );
}