-- ============================================================
-- 027: Política UPDATE para workshop_employees
--      Admin pode atualizar campos dos funcionários da sua oficina
--      (ex: can_approve_budgets). Sem essa policy, o PATCH retorna
--      204 mas não altera nenhuma linha (RLS silencioso).
-- ============================================================

CREATE POLICY "we_admin_update" ON workshop_employees
  FOR UPDATE
  USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );
