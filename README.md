# mcp-least-privilege-demo

English | [日本語](README.ja.md)

A small learning demo. Before letting an AI agent (MCP) touch your database, it shows how to narrow the "key" you hand over, and what "read-only" actually means inside the database.

> **A personal learning project.** It is not an official sample of any company, and not a complete example of security measures. It is not meant for production.
>
> Summary: notes on the Supabase MCP connection URL parameters (`project_ref`, `read_only`, `features`), plus SQL that shows what a read-only role can and cannot do (a look-alike role, because the real managed role can't be assumed from the SQL Editor). **I did not connect a real AI agent.**

This is the code for two Japanese articles on Qiita:
- How-to: *Before letting an AI agent touch your DB: Supabase MCP read-only mode and project scoping*
- Web app: *I built a "data inventory" web app to run before handing access to an AI: building the MCP connection URL and listing the tables the AI can see* (`app/` and `supabase/functions/exposure-report/`)

The page/UI texts and the comments are English. Sample data and example queries may stay Japanese; Japanese-commented copies of the code (with the Japanese UI) are in [`ja/`](ja/).

## Files

| Path | What it is |
|---|---|
| `mcp/connect-urls.md` | How to read the connection URL (scope, no writes, tools) |
| `mcp/checklist.md` | Checklist before letting an AI touch your data |
| `sql/00_inspect_read_only_role.sql` | Look at the read-only role's attributes (`rolbypassrls`) |
| `sql/01_create_demo_reader.sql` | Create a look-alike role, `demo_reader` |
| `sql/02_check_read.sql` | It can read (**it skips RLS, so it sees every company's rows**) |
| `sql/03_check_write_denied.sql` | It cannot write (`42501`) |
| `sql/04_check_drop_denied.sql` | It cannot drop (`42501`) |
| `sql/99_cleanup.sql` | Remove the demo role |
| `supabase/functions/exposure-report` | Edge Function for the inventory page (table names, columns, row counts, privileges, policy counts) |
| `app/` | One-file web app (no build step) |
| `ja/` | The same code with Japanese comments / Japanese UI |

## Data inventory page (`app/`)

For each table, the page shows how it looks from the browser, from a logged-in user, and from the AI (a read-only connection), and warns you when a table you marked "do not show" is readable. A second tab builds the MCP connection URL from checkboxes (one HTML file, no build step).

```bash
# Deploy supabase/functions/exposure-report/index.ts as "exposure-report" (Verify JWT off; the key is checked inside the function)
cd app
cp config.example.js config.js     # fill in the URL and the publishable key (config.js is git-ignored)
python3 -m http.server 8765 --bind 127.0.0.1   # -> http://127.0.0.1:8765/index.html
```

- The function returns only table names, column names, row counts, privileges and policy counts (never row contents). Even so, this is information you must not show outside your team. If you publish the page, put real login in front of it.
- "How it looks" is a rough guide. I do not read the policy conditions (`using`). I corrected the logic by comparing it with the number of rows I actually read through the API without logging in (only `posts` was readable) (October 2026).
- Cost: opening the page calls the function once (negligible against the Free plan's 500,000 invocations a month).
- Note: I did not connect a real AI agent. I also never ran SQL with the read-only role for real (the verdicts come from the privilege settings). The description of each connection-URL group is my reading of the tool names, and some of it is not checked against the docs.
- The UI texts and comments were translated to English after my run. I only syntax-checked the page script (`node --check`); I did not re-run the page against a live backend after the translation. The one Japanese string left in the page is a column-name pattern (`氏名`, "full name") used to flag personal data.

## Prerequisites

- A Supabase project (I checked on a Free plan demo)
- The tables from the previous article (`tenants` / `invoices`). Run `sql/01` to `05` of `rls-multitenancy-demo` first
- The MCP connection itself is configured in your own AI tool. This repo contains no code that connects to anything

## Steps

1. Read `mcp/connect-urls.md`, and in the dashboard's **Connect -> MCP** see how the URL changes when you flip the switches.
2. In the SQL Editor, run `sql/00` (checks that the read-only role exists).
3. Create the look-alike role with `sql/01`, then run `02` -> `03` -> `04` in order. `02` to `04` start with `begin;`, so run `rollback;` afterwards. `04` triggers a "destructive operation" confirmation, but it runs with the role's privileges and stops with an error (run it only in a demo project).

Expected results:

- `02`: both companies, all 4 rows visible
- `03`: `ERROR: 42501: permission denied for table invoices`
- `04`: `ERROR: 42501: must be owner of table invoices`

I ran them in this order and got the results above (October 2026).

## Cost

- The SQL and settings in this repo worked within the Free plan. No extra charges.
- The usage fees of your AI tool (your AI service's pricing) are outside this repo and I did not measure them.

## Not verified (honest list)

- **Connecting a real AI agent and checking that it behaves according to its permissions** (it needs authentication, so I skipped it)
- How often "the AI obeys instructions hidden in the data" really happens with a real AI
- `demo_reader` is a **look-alike role**, not Supabase's real role itself

## Warnings

- "Read-only" does not mean "nothing can leak". **A role that skips RLS can read all the data within its reach.** Combine it with scoping (`project_ref`) and human approval.
- Do not connect it to a project that holds real customer data.
- Demo-only shortcut: the `exposure-report` function runs with Verify JWT off and only checks the publishable key (public by design, so an entry ticket, not authentication). The safer alternative is real login (Supabase Auth) in front of the page.

## License

MIT (see `LICENSE`)
