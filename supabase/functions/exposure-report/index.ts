import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

// A read-only function that reports which tables an AI agent (read-only connection) can read.
// It looks at table names, whether RLS is on, read privileges per role, row counts and column names. It never returns row contents.
// NOTE: Verify JWT is off; instead the function checks that the app's publishable key is sent (a simple entry ticket).
//    A table list is information you should not make public. Put real login in front of any page you expose outside your team.
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const PUBLISHABLE_KEYS: string[] = Object.values(JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"));
const MCP_ROLE = "supabase_read_only_user";   // the role the read-only MCP uses (as described in the docs)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const key = req.headers.get("apikey");
  if (!key || !PUBLISHABLE_KEYS.includes(key)) return json({ error: "unauthorized" }, 401);

  try {
    const [role] = await sql`select rolname, rolcanlogin, rolbypassrls from pg_roles where rolname = ${MCP_ROLE}`;

    const tables = await sql`
      select c.relname as name,
             c.relrowsecurity as rls_enabled,
             (select count(*)::int from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies,
             -- number of SELECT policies that apply to that role (looks at the policy's target roles too)
             (select count(*)::int from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname
                and p.cmd in ('SELECT', 'ALL') and (p.roles && array['anon', 'public']::name[])) as anon_select_policies,
             (select count(*)::int from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname
                and p.cmd in ('SELECT', 'ALL') and (p.roles && array['authenticated', 'public']::name[])) as auth_select_policies,
             has_table_privilege('anon', c.oid, 'select') as anon_select,
             has_table_privilege('authenticated', c.oid, 'select') as authenticated_select,
             case when ${role ? true : false} then has_table_privilege(${MCP_ROLE}, c.oid, 'select') else null end as mcp_select,
             (select array_agg(a.attname order by a.attnum) from pg_attribute a
               where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`;

    // exact row counts (fine for a small demo; for big tables the estimate reltuples is safer)
    for (const t of tables) {
      const [r] = await sql`select count(*)::int as n from public.${sql(t.name)}`;
      t.rows = r.n;
    }

    return json({ role: role ?? null, tables });
  } catch (e) {
    console.error(String(e));
    return json({ error: "server error" }, 500);
  }
});
