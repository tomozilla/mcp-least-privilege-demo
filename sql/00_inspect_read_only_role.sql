-- Check whether the role used by the "read-only" MCP mode exists in the database.
-- What matters is rolbypassrls (does it skip RLS?). It was true in my environment.
select rolname, rolcanlogin, rolbypassrls
from pg_roles
where rolname = 'supabase_read_only_user';
