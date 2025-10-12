-- Grant execute permission on insert_product_admin to API roles
grant execute on function public.insert_product_admin(
  text, text, integer, integer, integer, text, text, text, integer, text, text
) to anon, authenticated, service_role;
