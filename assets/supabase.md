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

Tip: An example file is included at `calculator_frontend/.env.example`. Copy it to `.env` and fill in your values.

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

---

## Automated Backend Setup (Applied)

The following configuration has been automatically applied to your Supabase project:

1) Tables
   - Created: `public.calc_history` with columns:
     - `id uuid primary key default gen_random_uuid()`
     - `expression text not null`
     - `result text not null`
     - `created_at timestamptz default now()`

2) Row Level Security
   - Enabled RLS on `public.calc_history`
   - Policies created (idempotent):
     - `Allow insert for anon` (insert, role: anon, with check true)
     - `Allow select for anon` (select, role: anon, using true)

These policies are intended for demo/dev only. In production, you should:
- Replace anon policies with authenticated user policies.
- Consider adding a `user_id uuid` column referencing `auth.users` and scope selects/inserts to `auth.uid()`.

### Verification
You can verify the setup using SQL:
```sql
-- Check table exists
select table_schema, table_name from information_schema.tables
where table_schema = 'public' and table_name = 'calc_history';

-- Check policies
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where tablename = 'calc_history';
```

### Frontend Status
- The app uses `process.env.REACT_APP_SUPABASE_URL` and `process.env.REACT_APP_SUPABASE_KEY`.
- The UI will display a "Supabase Connected" badge once configured and when the `calc_history` table is accessible via REST.
- If variables are missing or requests fail, the app continues offline and stores history in memory only.

---

## Troubleshooting 404 Not Found on /rest/v1/calc_history

A 404 from `/rest/v1/calc_history` indicates PostgREST could not find the resource. Common causes:

1) Table does not exist
   - Ensure the table name is exactly `calc_history` and lives in the `public` schema.
   - Run:
     ```sql
     select table_schema, table_name
     from information_schema.tables
     where table_schema = 'public' and table_name = 'calc_history';
     ```

2) Wrong schema or schema not exposed
   - If you created the table in a non-`public` schema, either move it to `public` or expose that schema in API settings.
   - In Supabase Dashboard: Project Settings → API → Exposed schemas
     - Ensure `public` (or your target schema) is listed.
   - The frontend now explicitly targets `public:calc_history` to avoid mismatches.

3) Typo in endpoint or table name
   - The REST route is `/rest/v1/calc_history` (no schema prefix in the path). The framework infers schema from exposure settings.
   - In code, we use `from('public:calc_history')` for clarity.

4) RLS policy denies (usually 401/403, not 404)
   - If you see 401/403 instead of 404, verify RLS policies allow `select` and `insert` for the anon role.
   - Reapply the demo policies above as needed.

5) Project/API reconfiguration or paused project
   - Confirm your Supabase project is active and API is enabled in Project Settings → API.

Client-side diagnostic:
- The frontend calls a lightweight check on startup to verify `calc_history` is REST-accessible. If not, the UI marks Supabase as Offline and uses local-only history until connectivity is restored.

Deployment tip:
- Ensure environment variables are correctly set in your hosting provider so the build receives `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY`.
