-- Can it drop? (Expected: ERROR 42501: must be owner of table invoices)
-- The SQL Editor shows a "destructive operation" confirmation. It stops with an error because the statement runs with the role's privileges.
-- Run `rollback;` after running this. Run it only in a demo project.
begin;
set local role demo_reader;
drop table public.invoices;
