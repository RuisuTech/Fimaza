-- Least privilege: funciones internas y RPCs no deben ejecutarse como anon.

revoke execute on function public.app_next_id() from public, anon, authenticated;
revoke execute on function public.current_employee_id() from public, anon, authenticated;
revoke execute on function public.is_active_user() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.get_my_profile() from public, anon;

revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.sync_entry_order_status() from public, anon, authenticated;
revoke execute on function public.sync_invoice_order_status() from public, anon, authenticated;

revoke execute on function public.create_sale(bigint, jsonb, text) from public, anon;
revoke execute on function public.create_exit_guide(text, date, text, text, jsonb) from public, anon;
revoke execute on function public.create_entry_guide(text, date, bigint, bigint, text, jsonb) from public, anon;
revoke execute on function public.create_purchase_order(bigint, date, date, jsonb) from public, anon;
revoke execute on function public.create_quote(bigint, date, date, jsonb) from public, anon;
revoke execute on function public.create_order_from_quote(bigint, text, date) from public, anon;
revoke execute on function public.create_invoice(text, text, bigint, bigint, date, date, numeric, text) from public, anon;
