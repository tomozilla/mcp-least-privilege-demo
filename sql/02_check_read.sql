-- Can it read? (Expected: both companies, all 4 rows, because the role skips RLS.)
-- Run `rollback;` after running this.
begin;
set local role demo_reader;
select t.name as tenant, i.title, i.amount_jpy
from public.invoices i join public.tenants t on t.id = i.tenant_id
order by i.id;
