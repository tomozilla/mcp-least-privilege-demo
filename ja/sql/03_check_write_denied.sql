-- 書けるか（期待: ERROR 42501: permission denied for table invoices）
-- ※ 実行後に `rollback;` を実行してください
begin;
set local role demo_reader;
insert into public.invoices (tenant_id, title, amount_jpy)
select id, 'AI wrote this', 1 from public.tenants limit 1;
