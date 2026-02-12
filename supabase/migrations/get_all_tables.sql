create or replace function get_all_tables()
returns table (schemaname text, tablename text) as $$
select schemaname, tablename
  from pg_catalog.pg_tables
  where schemaname not in ('pg_catalog', 'information_schema');
$$ language sql stable;