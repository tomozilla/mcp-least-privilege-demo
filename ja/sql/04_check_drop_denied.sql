-- 消せるか（期待: ERROR 42501: must be owner of table invoices）
-- SQL Editorが「破壊的な操作が含まれています」と確認を出します。上のロールの権限で実行しているのでエラーで止まります。
-- ※ 実行後に `rollback;` を実行してください。デモ用プロジェクトでだけ実行してください。
begin;
set local role demo_reader;
drop table public.invoices;
