-- ============================================================
-- 013: Cadastro HR de funcionários e treinamentos
-- ============================================================
-- employees: registro de funcionários da oficina, independente
--            de autenticação (não exige conta no sistema)
-- employee_trainings: treinamentos vinculados a cada funcionário

-- 1. Tabela de funcionários (cadastro HR)
CREATE TABLE IF NOT EXISTS employees (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  position    text,
  phone       text,
  email       text,
  hired_at    date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS emp_workshop_id_idx ON employees(workshop_id);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emp_admin_all" ON employees
  FOR ALL
  USING (workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid()))
  WITH CHECK (workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid()));

-- 2. Tabela de treinamentos
CREATE TABLE IF NOT EXISTS employee_trainings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  workshop_id  uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  provider     text,
  completed_at date,
  valid_until  date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS et_employee_id_idx ON employee_trainings(employee_id);
CREATE INDEX IF NOT EXISTS et_workshop_id_idx ON employee_trainings(workshop_id);

ALTER TABLE employee_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "et_admin_all" ON employee_trainings
  FOR ALL
  USING (workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid()))
  WITH CHECK (workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid()));
