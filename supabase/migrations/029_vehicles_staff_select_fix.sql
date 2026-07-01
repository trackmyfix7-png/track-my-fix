-- ============================================================
-- 029: Corrige recursão infinita nas políticas de vehicles
--      A migration 028 referenciava service_orders, que tem uma
--      política (so_client_select) que por sua vez referencia vehicles
--      → ciclo infinito. A solução é usar apenas service_requests,
--      cujas políticas não referenciam vehicles.
-- ============================================================

DROP POLICY IF EXISTS "vehicles_admin_select"    ON vehicles;
DROP POLICY IF EXISTS "vehicles_employee_select" ON vehicles;

-- Admin vê veículos que aparecem em service_requests da oficina
CREATE POLICY "vehicles_admin_select" ON vehicles
  FOR SELECT USING (
    owner_id = auth.uid()                          -- próprio veículo (cliente)
    OR id IN (
      SELECT vehicle_id FROM service_requests
       WHERE workshop_id IN (
         SELECT id FROM workshops WHERE owner_id = auth.uid()
       )
    )
  );

-- Funcionário vê veículos que aparecem em service_requests da sua oficina
CREATE POLICY "vehicles_employee_select" ON vehicles
  FOR SELECT USING (
    id IN (
      SELECT vehicle_id FROM service_requests
       WHERE workshop_id IN (
         SELECT workshop_id FROM workshop_employees
          WHERE employee_id = auth.uid()
       )
    )
  );
