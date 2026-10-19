-- 本物の読み取り専用ロールには SQL Editor から切り替えられなかったので（42501: permission denied to set role）、
-- 「同じ性質（SELECTだけできる・RLSはすり抜ける）」の、似たロールを自分で作って試します。
-- 前提: topic 03 の tenants / invoices テーブル（rls-multitenancy-demo）がある
create role demo_reader nologin bypassrls;
grant usage on schema public to demo_reader;
grant select on public.invoices, public.tenants to demo_reader;
grant demo_reader to postgres;   -- SQL Editorから切り替えられるようにするため
