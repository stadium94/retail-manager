-- Allow workers to delete and update proforma sales in their assigned stores.
-- IMPORTANT: Restricted strictly to sale_type = 'proforma', NOT general unpaid sales or credit drafts.

-- 1. Sales Policies
DROP POLICY IF EXISTS "Workers can delete proforma sales" ON public.sales;
CREATE POLICY "Workers can delete proforma sales" ON public.sales
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'worker')
  AND store_id IN (SELECT public.get_user_store_ids(auth.uid()))
  AND sale_type = 'proforma'
);

DROP POLICY IF EXISTS "Workers can update proforma sales" ON public.sales;
CREATE POLICY "Workers can update proforma sales" ON public.sales
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'worker')
  AND store_id IN (SELECT public.get_user_store_ids(auth.uid()))
  AND sale_type = 'proforma'
)
WITH CHECK (
  public.has_role(auth.uid(), 'worker')
  AND store_id IN (SELECT public.get_user_store_ids(auth.uid()))
  AND sale_type = 'proforma'
);

-- 2. Sale Items Policies
DROP POLICY IF EXISTS "Workers can delete proforma sale items" ON public.sale_items;
CREATE POLICY "Workers can delete proforma sale items" ON public.sale_items
FOR DELETE TO authenticated
USING (
  sale_id IN (
    SELECT id FROM public.sales
    WHERE store_id IN (SELECT public.get_user_store_ids(auth.uid()))
      AND sale_type = 'proforma'
  )
);

DROP POLICY IF EXISTS "Workers can update proforma sale items" ON public.sale_items;
CREATE POLICY "Workers can update proforma sale items" ON public.sale_items
FOR UPDATE TO authenticated
USING (
  sale_id IN (
    SELECT id FROM public.sales
    WHERE store_id IN (SELECT public.get_user_store_ids(auth.uid()))
      AND sale_type = 'proforma'
  )
);

-- 3. Dedicated Security Definer RPC for reliable proforma deletion across all clients
CREATE OR REPLACE FUNCTION public.worker_delete_proforma(p_sale_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale public.sales%ROWTYPE;
  caller uuid := auth.uid();
  is_master boolean;
  is_worker boolean;
  store_matches boolean;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_sale FROM public.sales WHERE id = p_sale_id;
  IF NOT FOUND THEN
    RETURN true; -- idempotent
  END IF;

  is_master := (
    has_role(caller, 'master'::app_role)
    OR (auth.jwt() ->> 'role') = 'master'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'master'
  );

  is_worker := (
    has_role(caller, 'worker'::app_role)
    OR (auth.jwt() ->> 'role') = 'worker'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'worker'
  );

  store_matches := (
    v_sale.store_id IN (SELECT get_user_store_ids(caller))
    OR v_sale.store_id IN (SELECT get_user_stores(caller))
    OR ((auth.jwt() -> 'user_metadata' ->> 'store_id') IS NOT NULL AND (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid = v_sale.store_id)
  );

  IF NOT (is_master OR (is_worker AND store_matches)) THEN
    RAISE EXCEPTION 'Unauthorized to delete proforma for this store';
  END IF;

  -- Strictly allow deleting ONLY proformas for workers
  IF NOT is_master AND v_sale.sale_type <> 'proforma' THEN
    RAISE EXCEPTION 'Workers may only delete proforma drafts';
  END IF;

  DELETE FROM public.sale_items WHERE sale_id = p_sale_id;
  DELETE FROM public.sales WHERE id = p_sale_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.worker_delete_proforma(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.worker_delete_proforma(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.worker_delete_proforma(uuid) TO service_role;
