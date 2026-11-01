import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addEvaluation, convertIdeaToProject, saveIdea } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; evaluated?: string; error?: string }>;
};

const statuses = [
  ["captured", "Captured"], ["developing", "Developing"], ["evaluating", "Evaluating"],
  ["validated", "Validated"], ["selected", "Selected"], ["in_progress", "In progress"],
  ["completed", "Completed"], ["archived", "Archived"],
];
const priorities = [["low", "Low"], ["normal", "Normal"], ["high", "High"], ["critical", "Critical"]];
const dimensions = [
  ["problem_importance", "Problem importance", "How painful or consequential is the problem?"],
  ["demand_evidence", "Demand evidence", "What evidence shows people want this?"],
  ["feasibility", "Feasibility", "Can you realistically build or deliver it?"],
  ["cost_accessibility", "Cost accessibility", "Can you access the money, tools and people needed?"],
  ["differentiation", "Differentiation", "Is there a meaningful reason to choose this?"],
  ["risk_level", "Risk level", "How serious are the unresolved risks?"],
];

export default async function IdeaStudioPage({ params, searchParams }: Props) {
  const [{ id }, notices] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/login");

  const { data: idea, error } = await supabase.from("vault_ideas")
    .select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error || !idea) notFound();

  const [{ data: evaluations }, { data: project }] = await Promise.all([
    supabase.from("vault_evaluations").select("*").eq("idea_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("vault_projects").select("id,title,status").eq("source_idea_id", id).maybeSingle(),
  ]);

  return (
    <main className="shell pb-16">
      <header className="topbar">
        <Link href="/dashboard" className="brand"><span className="brand-mark">V</span> Idea Vault</Link>
        <Link href="/dashboard" className="btn btn-quiet text-sm">← Back to vault</Link>
      </header>

      <section className="py-9 sm:py-12">
        <p className="eyebrow">Idea Studio</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{idea.title}</h1>
        <p className="muted mt-2">Move from a raw thought to a clear, testable concept. You control its status.</p>
      </section>

      {notices.saved && <p role="status" className="mb-4 text-sm text-cyan-300">Changes saved.</p>}
      {notices.evaluated && <p role="status" className="mb-4 text-sm text-cyan-300">Evaluation added to the history.</p>}
      {notices.error && <p role="alert" className="mb-4 text-sm text-red-300">{notices.error}</p>}

      <form action={saveIdea} className="space-y-5">
        <input type="hidden" name="ideaId" value={idea.id} />
        <section className="panel p-5 sm:p-7">
          <div className="mb-6"><p className="eyebrow">01 · Shape the idea</p><h2 className="mt-2 text-xl font-semibold">The concept</h2><p className="muted mt-1 text-sm">Fill in what you know. Leave the rest for later.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium sm:col-span-2">Title<input className="field mt-2" name="title" defaultValue={idea.title} maxLength={200} required /></label>
            <label className="block text-sm font-medium sm:col-span-2">Short summary<textarea className="field mt-2 min-h-20" name="summary" defaultValue={idea.summary ?? ""} maxLength={500} /></label>
            <label className="block text-sm font-medium sm:col-span-2">Problem worth solving<textarea className="field mt-2 min-h-28" name="problem" defaultValue={idea.problem ?? ""} placeholder="Who experiences what problem, and why does it matter?" /></label>
            <label className="block text-sm font-medium sm:col-span-2">Proposed solution<textarea className="field mt-2 min-h-28" name="proposed_solution" defaultValue={idea.proposed_solution ?? ""} placeholder="What could solve the problem?" /></label>
            <label className="block text-sm font-medium">Target audience<textarea className="field mt-2 min-h-24" name="target_audience" defaultValue={idea.target_audience ?? ""} placeholder="Who would use or benefit from it?" /></label>
            <label className="block text-sm font-medium">What makes it different?<textarea className="field mt-2 min-h-24" name="differentiation" defaultValue={idea.differentiation ?? ""} /></label>
            <label className="block text-sm font-medium">Resources needed<textarea className="field mt-2 min-h-24" name="resources" defaultValue={idea.resources ?? ""} placeholder="Skills, tools, people, materials, money…" /></label>
            <label className="block text-sm font-medium">Risks and unknowns<textarea className="field mt-2 min-h-24" name="risks" defaultValue={idea.risks ?? ""} /></label>
            <label className="block text-sm font-medium sm:col-span-2">Working notes<textarea className="field mt-2 min-h-32" name="description" defaultValue={idea.description ?? ""} /></label>
            <label className="block text-sm font-medium">Status<select className="field mt-2" name="status" defaultValue={idea.status}>{statuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm font-medium">Priority<select className="field mt-2" name="priority" defaultValue={idea.priority}>{priorities.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <div className="mt-6 flex justify-end"><button className="btn btn-primary" type="submit">Save changes</button></div>
        </section>
      </form>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel p-5 sm:p-7">
          <p className="eyebrow">02 · Evaluation lab</p><h2 className="mt-2 text-xl font-semibold">Test the thinking, not your optimism.</h2>
          <p className="muted mt-2 text-sm leading-6">Rate each dimension from 1 to 5. These scores organise your judgement. They do not predict success or validate an idea automatically.</p>
          <form action={addEvaluation} className="mt-6 space-y-5">
            <input type="hidden" name="ideaId" value={idea.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              {dimensions.map(([name,label,hint]) => <label key={name} className="block text-sm font-medium">{label}<span className="muted mt-1 block text-xs font-normal">{hint}</span><select className="field mt-2" name={name}><option value="">Not assessed</option>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select></label>)}
            </div>
            <label className="block text-sm font-medium">Evidence gathered<textarea className="field mt-2 min-h-24" name="evidence" placeholder="Interviews, observations, research, tests, comparable products…" /></label>
            <label className="block text-sm font-medium">Assumptions to test <span className="muted font-normal">(one per line)</span><textarea className="field mt-2 min-h-24" name="assumptions" placeholder="People will pay for this…&#10;The prototype can be built in two weeks…" /></label>
            <button className="btn btn-quiet" type="submit">Save evaluation</button>
          </form>
        </div>

        <aside className="space-y-5">
          <div className="panel p-5">
            <p className="eyebrow">03 · Execution</p><h2 className="mt-2 text-lg font-semibold">Ready to make it real?</h2>
            {project ? <div className="mt-4"><p className="muted text-sm">This idea already has a project.</p><Link className="btn btn-primary mt-3 w-full" href={`/dashboard/projects/${project.id}`}>Open project ↗</Link></div> : <form action={convertIdeaToProject} className="mt-4 space-y-3"><input type="hidden" name="ideaId" value={idea.id} /><label className="block text-sm font-medium">Target date <span className="muted">(optional)</span><input className="field mt-2" name="targetDate" type="date" /></label><button className="btn btn-primary w-full" type="submit">Turn into a project ↗</button><p className="muted text-xs leading-5">Creates a project linked to this idea and moves its status to In progress.</p></form>}
          </div>
          <div className="panel p-5">
            <p className="eyebrow">Evaluation history</p><h2 className="mt-2 text-lg font-semibold">What changed over time</h2>
            {!evaluations?.length ? <p className="muted mt-3 text-sm">No evaluations yet. Your first assessment will appear here.</p> : <div className="mt-4 space-y-4">{evaluations.map((item) => <div key={item.id} className="border-t border-slate-700/70 pt-3"><p className="muted text-xs">{new Date(item.created_at).toLocaleDateString()}</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs">{dimensions.map(([key,label]) => <div key={key}><span className="muted">{label}</span><p className="mt-1 font-semibold">{item[key as keyof typeof item] ?? "Not assessed"}{item[key as keyof typeof item] ? " / 5" : ""}</p></div>)}</div>{item.evidence && <p className="muted mt-3 text-xs leading-5">{item.evidence}</p>}</div>)}</div>}
          </div>
        </aside>
      </section>
    </main>
  );
}