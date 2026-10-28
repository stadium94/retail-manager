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
