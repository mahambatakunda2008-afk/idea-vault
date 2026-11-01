# Idea Vault

A private workspace for capturing, developing, evaluating and executing ideas. Built as a standalone Shadecode product.

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth, Postgres and private Storage
- Supabase Row Level Security on all vault tables

## Local setup

1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase project URL and publishable key.
4. Set `NEXT_PUBLIC_SITE_URL` to the local or deployed origin, for example `http://localhost:3000`.
5. Install dependencies with `npm install`.
6. Run `npm run dev`.

## Supabase project

Project ref: `kaqqzslcnkhktlfiuwcu`

The database migrations have been applied directly to the dedicated Idea Vault project. The application uses the publishable key only. Never add a Supabase secret/service-role key to a browser bundle or commit it to Git.

Configure the Supabase Auth URL settings before testing email sign-in:
- Site URL: your deployed application origin
- Redirect URL allowlist: `http://localhost:3000/auth/callback` and your deployed `/auth/callback` URL

Email delivery and confirmation settings are managed in Supabase Auth. Verify SMTP and email templates before inviting real users.

## Current implementation

- Email magic-link sign-in and callback
- Server-side session refresh through Next.js Proxy
- Private workspace lookup and quick idea capture
- Full-text search
- Archive and restore
- RLS-backed database and private attachment bucket

## Product rules

- Ideas are private by default.
- AI is optional and must never be required to capture or manage ideas.
- Evaluation scores are decision aids, not predictions of success.
- Users retain control over idea status; AI cannot mark an idea validated.
