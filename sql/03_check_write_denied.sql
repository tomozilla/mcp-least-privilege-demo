-- Can it write? (Expected: ERROR 42501: permission denied for table invoices)
-- Run `rollback;` after running this.
begin;
set local role demo_reader;
insert into public.invoices (tenant_id, title, amount_jpy)
select id, 'AI wrote this', 1 from public.tenants limit 1;
