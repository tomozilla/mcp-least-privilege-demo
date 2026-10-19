import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

// 「AIエージェント（読み取り専用）から、どのテーブルが読めるか」を調べて返す、読むだけの関数です。
// 調べるのは、テーブル名・RLSの有無・ロールごとの読み取り権限・行数・列名です。中身（行のデータ）は返しません。
// ※ Verify JWT はオフにして、代わりに「アプリの publishable キーが付いているか」を関数の中で確認します（簡単な入場券）。
//    テーブルの一覧は、公開してはいけない情報です。社外に出すページには、本物のログインを付けてください。
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!);
const PUBLISHABLE_KEYS: string[] = Object.values(JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"));
const MCP_ROLE = "supabase_read_only_user";   // 読み取り専用MCPが使うロール（ドキュメントの説明）

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
             -- 「読む（SELECT）ための」ポリシーが、そのロールに当てはまる数（ポリシーの対象ロールまで見る）
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

    // 行数は正確に数える（小さなデモ用。大きなテーブルでは、概算値 reltuples を使うほうが安全です）
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
