-- 読めるか（期待: A社もB社も、4件ぜんぶ見える。RLSをすり抜けるロールなので）
-- ※ 実行後に `rollback;` を実行してください
begin;
set local role demo_reader;
select t.name as tenant, i.title, i.amount_jpy
from public.invoices i join public.tenants t on t.id = i.tenant_id
order by i.id;
