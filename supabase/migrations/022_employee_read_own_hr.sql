-- ============================================================
-- 022: Funcionário pode ler o próprio registro HR
-- ============================================================
-- Necessário para exibir cargo e outros dados da ficha HR
-- no portal do funcionário (somente leitura).
-- ============================================================

CREATE POLICY "emp_employee_read_own" ON employees
  FOR SELECT
  USING (linked_user_id = auth.uid());
