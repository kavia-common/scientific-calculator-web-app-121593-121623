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

## 4) Row Level Security (RLS)

Enable RLS and add policies suitable for your environment. For demo/dev with the anon key:

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

Notes:
- Insert and Select permissions are independent. The app can work in write-only mode (insert without select), in which case the "recent history" list will be empty but inserts will succeed and show up in your table.
- Our insert call does NOT request `return=representation`, so INSERT doesn't require SELECT permission.

## 5) How It Works

- On each evaluation (pressing `=` or applying a unary function), the app tries to insert a record into `calc_history`.
- The history panel shows the last 10 items (descending by `created_at`) if SELECT is permitted by your RLS.
- If Supabase is not configured or read access is blocked, the app continues to function and stores history in memory only.

## 6) Environment Notes

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
- The UI displays "Supabase Connected" when environment variables are present. If read access is denied by RLS, the history list will stay empty but inserts still work.

---

## Troubleshooting

1) 404 Not Found on `/rest/v1/calc_history`
   - Ensure the table name is exactly `calc_history` and lives in the `public` schema.
   - Verify API → Exposed schemas includes `public`.

2) Inserts not appearing in table
   - Ensure your `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` are correct.
   - Confirm RLS allows INSERT for your role (anon if using the anon key).
   - Our code no longer requests SELECT on insert, so a missing SELECT policy will not block inserts.

3) History not showing in the UI
   - This requires SELECT permission. If RLS disallows SELECT for anon, the app will still insert but cannot read the recent history.
