# How to read the MCP connection URL

In the dashboard's **Connect -> MCP** tab, the command you add to your AI tool changes when you flip the switches.
Below is what I saw on screen, copied as-is (replace `<PROJECT_REF>` with your own project's ID).

## Default (opened from a project's page)

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
```

## Read-only + tools narrowed to 3 groups

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>&read_only=true&features=docs%2Cdatabase%2Cdebugging"
```

## URL parts and what they mean

| URL part | Meaning |
|---|---|
| `project_ref=<PROJECT_REF>` | **Scope**: limited to this one project |
| `read_only=true` | **No writes**: queries run as a read-only Postgres user (as described in the docs) |
| `features=docs,database,debugging` | **Tools**: the groups of features you hand over |

## What I verified / what I did not

- Verified: in the dashboard, the URL changes like this when you flip the switches
- Verified: a role named `supabase_read_only_user` exists in the database (`sql/00_inspect_read_only_role.sql`)
- Partly: I could not switch to the real role, so I checked the behaviour with a look-alike role, `demo_reader` (`sql/01` to `04`)
- **Not done: I did not connect a real AI agent and check the behaviour.**
