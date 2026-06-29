-- ============================================================
-- 005: Adiciona role 'employee' e tabela workshop_employees
-- ============================================================

-- 1. Atualiza o CHECK constraint do role para incluir 'employee'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'client', 'employee'));

-- 2. Tabela de funcionários vinculados a oficinas
CREATE TABLE IF NOT EXISTS workshop_employees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workshop_id uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  linked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS we_employee_id_idx ON workshop_employees(employee_id);
CREATE INDEX IF NOT EXISTS we_workshop_id_idx ON workshop_employees(workshop_id);

ALTER TABLE workshop_employees ENABLE ROW LEVEL SECURITY;

-- Admin vê os funcionários da sua oficina
CREATE POLICY "we_admin_select" ON workshop_employees
  FOR SELECT USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- Funcionário vê o seu próprio vínculo
CREATE POLICY "we_employee_select" ON workshop_employees
  FOR SELECT USING (employee_id = auth.uid());

-- Admin gerencia funcionários
CREATE POLICY "we_admin_insert" ON workshop_employees
  FOR INSERT WITH CHECK (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "we_admin_delete" ON workshop_employees
  FOR DELETE USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- 3. Função helper: adicionar funcionário (promove role para 'employee' e vincula)
CREATE OR REPLACE FUNCTION add_workshop_employee(
  p_employee_email text,
  p_workshop_id    uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id  uuid := auth.uid();
  v_employee   profiles%ROWTYPE;
BEGIN
  -- Confirma que o caller é dono da oficina
  IF NOT EXISTS (
    SELECT 1 FROM workshops WHERE id = p_workshop_id AND owner_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Busca o perfil pelo e-mail via auth.users
  SELECT p.* INTO v_employee
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = p_employee_email
  LIMIT 1;

  IF v_employee.id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Atualiza role para employee (se ainda for client)
  IF v_employee.role = 'client' THEN
    UPDATE profiles SET role = 'employee' WHERE id = v_employee.id;
  END IF;

  -- Vincula à oficina (ignora se já existir)
  INSERT INTO workshop_employees (employee_id, workshop_id)
  VALUES (v_employee.id, p_workshop_id)
  ON CONFLICT (employee_id, workshop_id) DO NOTHING;

  RETURN json_build_object('employee_id', v_employee.id, 'name', v_employee.full_name);
END;
$$;
