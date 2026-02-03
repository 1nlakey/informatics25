# informatics25

Simple Node.js static server with small JSON-based DB for attendance, quiz, and messages.

Run:

```powershell
npm install
npm start
```

Project layout:

- `src/` - server implementation
- `public/` - static frontend files
- `db/` - JSON data files

Vercel deployment notes:

- Vercel serves static files from `public/` automatically and serverless functions
	live under an `/api/*` path when you place files in an `api/` directory.
- This project uses file-based JSON storage in `db/`. Vercel functions run on
	ephemeral instances — writes to the local filesystem do NOT persist. For
	production you should replace the JSON files with an external database
	(recommended: Supabase, PlanetScale, Firebase, etc.).
- For a quick demo you can add serverless functions that read/write `db/*.json`,
	but expect data to be lost between function invocations or deploys.

Quick steps to deploy to Vercel:

1. Create a Git repository and push to GitHub.
2. Go to https://vercel.com and import the GitHub repo.
3. In Vercel dashboard set any needed environment variables (e.g. DB keys).
4. If you switch to an external DB, store credentials in Vercel env vars and
	 use them from `process.env` in your `api/` functions.

If you want, I can:

- Convert the project's API endpoints into Vercel serverless functions (example
	`api/attendance.js` has been added) and update the frontend to call those
	endpoints.
- Replace file storage with Supabase example code and instructions to set
	environment variables in Vercel.

Supabase migration (recommended)

1. Create a Free Supabase project at https://app.supabase.com/
2. In the SQL editor run a migration like:

```sql
create table attendance (
	id serial primary key,
	name text not null,
	at timestamptz not null default now()
);

create table quiz_entries (
	id serial primary key,
	name text not null,
	answer text not null,
	at timestamptz not null default now()
);

create table messages (
	id serial primary key,
	name text not null,
	message text not null,
	at timestamptz not null default now()
);
```

3. Get `SUPABASE_URL` and `SUPABASE_KEY` from the project (Settings → API).
4. In the Vercel project settings add environment variables `SUPABASE_URL` and
	 `SUPABASE_KEY` for Production/Preview as needed.
5. Update frontend if necessary to call `/api/*` (Vercel routes these to files in `api/`).

Local dev: keep the `db/*.json` files for quick testing. The API files in
`api/` will automatically use Supabase when `SUPABASE_URL` and `SUPABASE_KEY`
are present, otherwise they fall back to file storage (development only).


