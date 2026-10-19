-- I could not switch to the real read-only role from the SQL Editor (42501: permission denied to set role),
-- so I create a look-alike role with the same properties (SELECT only, skips RLS) and try that instead.
-- Prerequisite: the tenants / invoices tables from topic 03 (rls-multitenancy-demo) exist
create role demo_reader nologin bypassrls;
grant usage on schema public to demo_reader;
grant select on public.invoices, public.tenants to demo_reader;
grant demo_reader to postgres;   -- so the SQL Editor can switch to it
