-- ============================================================
-- 014: Corrige recursão infinita em vehicles / service_orders
-- ============================================================
-- Causa: vehicles_workshop_select consultava service_orders,
-- que por sua vez consultava vehicles em so_client_select
-- → loop detectado pelo Postgres (42P17)
--
-- Solução: vehicles_workshop_select passa a usar client_workshops
-- em vez de service_orders, eliminando a dependência circular.
-- Semanticamente correto: staff deve ver todos os veículos de
-- clientes vinculados à oficina, não apenas os que já têm OS.

DROP POLICY IF EXISTS "vehicles_workshop_select" ON vehicles;
DROP POLICY IF EXISTS "vehicles_workshop_update" ON vehicles;

CREATE POLICY "vehicles_workshop_select" ON vehicles
  FOR SELECT USING (
    owner_id IN (
      SELECT client_id FROM client_workshops
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

CREATE POLICY "vehicles_workshop_update" ON vehicles
  FOR UPDATE USING (
    owner_id IN (
      SELECT client_id FROM client_workshops
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Recarrega o cache do PostgREST (resolve "table not found")
-- ============================================================
NOTIFY pgrst, 'reload schema';
