-- 後片付け: デモ用ロールを消す
revoke select on public.invoices, public.tenants from demo_reader;
revoke usage on schema public from demo_reader;
revoke demo_reader from postgres;
drop role if exists demo_reader;
