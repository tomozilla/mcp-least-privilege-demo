-- Supabaseの「読み取り専用」MCPが使うロールが、DBの中にあるか確かめる
-- 注目するのは rolbypassrls（RLSをすり抜けるか）。私の環境では true でした。
select rolname, rolcanlogin, rolbypassrls
from pg_roles
where rolname = 'supabase_read_only_user';
