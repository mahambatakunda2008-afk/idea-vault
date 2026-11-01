import Link from "next/link";
import { sendMagicLink } from "./actions";

type Props = { searchParams: Promise<{ sent?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">V</span> Idea Vault</Link>
        <span className="muted text-sm">A Shadecode product</span>
      </header>
      <section className="min-h-[78vh] grid place-items-center py-12">
        <div className="panel w-full max-w-md p-7 sm:p-9">
          <p className="eyebrow">Your ideas deserve a home</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Open your vault.</h1>
          <p className="muted mt-3 leading-7">Sign in with a secure email link. No password to remember.</p>
          {params.sent && <p role="status" className="mt-5 rounded-xl border border-cyan-900 bg-cyan-950/40 p-3 text-sm text-cyan-200">Sign-in link sent. Check your inbox, then return here.</p>}
          {params.error && <p role="alert" className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{params.error}</p>}
          <form action={sendMagicLink} className="mt-7 space-y-4">
            <label className="block text-sm font-medium" htmlFor="email">Email address</label>
            <input className="field" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            <button className="btn btn-primary w-full" type="submit">Send me a sign-in link <span aria-hidden>↗</span></button>
          </form>
          <p className="muted mt-6 text-xs leading-5">Your vault is private by default. Your ideas are not published or sold.</p>
        </div>
      </section>
    </main>
  );
}