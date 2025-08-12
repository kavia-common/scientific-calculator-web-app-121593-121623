# Supabase Integration Guide

This frontend uses Supabase to optionally store and display recent calculator history. The app gracefully degrades if Supabase is not configured.

## 1) Environment Variables

Create a `.env` file in `calculator_frontend/` (same folder as `package.json`) and set:

- `REACT_APP_SUPABASE_URL` – Your Supabase project URL
- `REACT_APP_SUPABASE_KEY` – Your public anon key

Example:
```
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_KEY=YOUR_PUBLIC_ANON_KEY
```

Note: CRA requires variables to be prefixed with `REACT_APP_` to be available in the browser.

## 2) Install Dependencies

From the `calculator_frontend` directory:

```
npm install
```

(We already added `@supabase/supabase-js` to package.json.)

## 3) Database Table

Create the table `calc_history` in your Supabase project:

```sql
create table if not exists public.calc_history (
  id uuid primary key default gen_random_uuid(),
  expression text not null,
  result text not null,
  created_at timestamp with time zone default now()
);
```

Add Row Level Security (RLS) policy to allow inserts and reads for anon key (adjust for your needs):

```sql
alter table public.calc_history enable row level security;

create policy "Allow insert for anon"
on public.calc_history
for insert
to anon
with check (true);

create policy "Allow select for anon"
on public.calc_history
for select
to anon
using (true);
```

Important: This is intended for demo/dev purposes. For production, secure policies to your auth model.

## 4) How It Works

- On each evaluation (pressing `=` or applying a unary function), the app tries to insert a record into `calc_history`.
- The history panel shows the last 10 items (descending by `created_at`).
- If Supabase is not configured or an error occurs, the app continues to function without history syncing.

## 5) Environment Notes

- Do not commit real credentials. Use `.env` which is ignored by VCS.
- The deployment process should set these variables in the environment. The app reads them at build time.

