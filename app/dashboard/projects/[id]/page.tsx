import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addProjectTask, toggleProjectTask, updateProjectStatus } from "./actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };
const statuses = [["planned","Planned"],["active","Active"],["paused","Paused"],["completed","Completed"],["archived","Archived"]];

export default async function ProjectPage({ params, searchParams }: Props) {
  const [{ id }, notices] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) redirect("/login");

  const { data: project, error } = await supabase.from("vault_projects")
    .select("id,workspace_id,source_idea_id,title,description,status,target_date,created_at")
    .eq("id", id).maybeSingle();
  if (error || !project) notFound();

  const [{ data: tasks }, { data: sourceIdea }] = await Promise.all([
    supabase.from("vault_project_tasks").select("*").eq("project_id", id).order("position", { ascending: true }),
    project.source_idea_id
      ? supabase.from("vault_ideas").select("id,title").eq("id", project.source_idea_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const completed = (tasks ?? []).filter((task) => task.is_completed).length;
  const total = tasks?.length ?? 0;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  return (
    <main className="shell pb-16">
      <header className="topbar">
        <Link href="/dashboard" className="brand"><span className="brand-mark">V</span> Idea Vault</Link>
        <Link href="/dashboard" className="btn btn-quiet text-sm">← Back to vault</Link>
      </header>
      <section className="py-9 sm:py-12">
        <p className="eyebrow">Project workspace</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{project.title}</h1>
        {project.description && <p className="muted mt-3 max-w-2xl leading-7">{project.description}</p>}
        {sourceIdea && <p className="muted mt-3 text-sm">Created from <Link className="text-cyan-300 hover:underline" href={`/dashboard/ideas/${sourceIdea.id}`}>{sourceIdea.title}</Link></p>}
      </section>

      {notices.error && <p role="alert" className="mb-4 text-sm text-red-300">{notices.error}</p>}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><p className="eyebrow">Execution</p><h2 className="mt-2 text-xl font-semibold">Next actions</h2><p className="muted mt-1 text-sm">{completed} of {total} tasks completed</p></div>
            <span className="status">{progress}% complete</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${progress}%` }} /></div>

          {!tasks?.length ? <div className="muted py-10 text-center text-sm">No tasks yet. Break the project into its first small action.</div> : <div className="mt-5 space-y-3">{tasks.map((task) => <div key={task.id} className="idea-row flex items-start gap-3"><form action={toggleProjectTask} className="pt-1"><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="completed" value={String(!task.is_completed)} /><button className={`grid h-5 w-5 place-items-center rounded-md border ${task.is_completed ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-500"}`} type="submit" aria-label={task.is_completed ? "Mark task incomplete" : "Mark task complete"}>{task.is_completed ? "✓" : ""}</button></form><div className="min-w-0 flex-1"><p className={task.is_completed ? "muted text-sm line-through" : "text-sm font-medium"}>{task.title}</p>{task.notes && <p className="muted mt-1 text-xs leading-5">{task.notes}</p>}{task.due_at && <p className="muted mt-2 text-xs">Due {new Date(task.due_at).toLocaleDateString()}</p>}</div></div>)}</div>}

          <form action={addProjectTask} className="mt-7 border-t border-slate-700/70 pt-6">
            <input type="hidden" name="projectId" value={project.id} />
            <p className="mb-3 text-sm font-semibold">Add a task</p>
            <div className="grid gap-3">
              <input className="field" name="title" placeholder="What is the next concrete action?" maxLength={200} required />
              <textarea className="field min-h-20" name="notes" placeholder="Notes or definition of done (optional)" maxLength={5000} />
              <div className="flex flex-col gap-3 sm:flex-row"><input className="field sm:max-w-56" name="dueAt" type="datetime-local" aria-label="Task due date" /><button className="btn btn-primary sm:ml-auto" type="submit">Add task ＋</button></div>
            </div>
          </form>
        </div>

        <aside className="panel h-fit p-5 sm:p-6">
          <p className="eyebrow">Project settings</p><h2 className="mt-2 text-lg font-semibold">Keep it moving.</h2>
          <form action={updateProjectStatus} className="mt-5 space-y-3">
            <input type="hidden" name="projectId" value={project.id} />
            <label className="block text-sm font-medium">Project status<select className="field mt-2" name="status" defaultValue={project.status}>{statuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button className="btn btn-quiet w-full" type="submit">Update status</button>
          </form>
          {project.target_date && <p className="muted mt-5 text-sm">Target date: {new Date(project.target_date).toLocaleDateString()}</p>}
          <p className="muted mt-5 text-xs leading-5">A project is a working plan, not a promise. Adjust tasks and dates as evidence changes.</p>
        </aside>
      </section>
    </main>
  );
}