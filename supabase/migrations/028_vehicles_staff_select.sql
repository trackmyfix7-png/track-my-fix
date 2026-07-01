-- ============================================================
-- 028: SELECT em vehicles para admin e funcionário
--      A migration 006 prometia isso mas nunca foi implementado.
--      Sem essa policy, o join vehicle:vehicles(...) em service_requests
--      e service_orders retorna null para o funcionário, desabilitando
--      ações que dependem do veículo.
-- ============================================================

-- Admin vê veículos que aparecem em service_requests ou service_orders da oficina
CREATE POLICY "vehicles_admin_select" ON vehicles
  FOR SELECT USING (
    id IN (
      SELECT vehicle_id FROM service_requests
       WHERE workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
      UNION
      SELECT vehicle_id FROM service_orders
       WHERE workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
    )
  );

-- Funcionário vê veículos que aparecem na oficina em que trabalha
CREATE POLICY "vehicles_employee_select" ON vehicles
  FOR SELECT USING (
    id IN (
      SELECT vehicle_id FROM service_requests
       WHERE workshop_id IN (
         SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
       )
      UNION
      SELECT vehicle_id FROM service_orders
       WHERE workshop_id IN (
         SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
       )
    )
  );
