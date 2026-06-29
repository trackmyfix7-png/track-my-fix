-- ============================================================
-- 008: Orçamentos, itens de orçamento e faturas
-- ============================================================

-- 1. Orçamentos
-- Tabela pode já existir — garantimos colunas novas e policies corretas
CREATE TABLE IF NOT EXISTS budgets (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_number    text          NOT NULL,
  service_order_id uuid          REFERENCES service_orders(id) ON DELETE SET NULL,
  vehicle_id       uuid          NOT NULL REFERENCES vehicles(id),
  status           text          NOT NULL DEFAULT 'awaiting_approval',
  total_amount     numeric(10,2) NOT NULL DEFAULT 0,
  valid_until      date,
  workshop_notes   text,
  issued_at        timestamptz   NOT NULL DEFAULT now(),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;

-- Garante que 'requested' (valor legado) ainda é aceito no CHECK
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_status_check;
ALTER TABLE budgets
  ADD CONSTRAINT budgets_status_check
  CHECK (status IN ('requested', 'awaiting_approval', 'approved', 'rejected', 'completed'));

CREATE INDEX IF NOT EXISTS budgets_vehicle_id_idx       ON budgets(vehicle_id);
CREATE INDEX IF NOT EXISTS budgets_workshop_id_idx      ON budgets(workshop_id);
CREATE INDEX IF NOT EXISTS budgets_service_order_id_idx ON budgets(service_order_id);
CREATE INDEX IF NOT EXISTS budgets_status_idx           ON budgets(status);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_client_select"   ON budgets;
DROP POLICY IF EXISTS "budgets_staff_select"    ON budgets;
DROP POLICY IF EXISTS "budgets_admin_insert"    ON budgets;
DROP POLICY IF EXISTS "budgets_employee_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_admin_update"    ON budgets;
DROP POLICY IF EXISTS "budgets_client_update"   ON budgets;

CREATE POLICY "budgets_client_select" ON budgets
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "budgets_staff_select" ON budgets
  FOR SELECT USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
      UNION ALL
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "budgets_admin_insert" ON budgets
  FOR INSERT WITH CHECK (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "budgets_employee_insert" ON budgets
  FOR INSERT WITH CHECK (
    workshop_id IN (
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "budgets_admin_update" ON budgets
  FOR UPDATE USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "budgets_client_update" ON budgets
  FOR UPDATE USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  );

-- 2. Itens do orçamento
CREATE TABLE IF NOT EXISTS budget_items (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id   uuid          NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  description text          NOT NULL,
  category    text          NOT NULL,
  quantity    int           NOT NULL DEFAULT 1,
  unit_price  numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- Normaliza o CHECK de categoria (pode já existir com nomes diferentes)
ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_category_check;
ALTER TABLE budget_items
  ADD CONSTRAINT budget_items_category_check
  CHECK (category IN ('part', 'service', 'labor', 'Peça', 'Serviço'));

CREATE INDEX IF NOT EXISTS bi_budget_id_idx ON budget_items(budget_id);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bi_client_select" ON budget_items;
DROP POLICY IF EXISTS "bi_staff_select"  ON budget_items;
DROP POLICY IF EXISTS "bi_staff_insert"  ON budget_items;
DROP POLICY IF EXISTS "bi_staff_delete"  ON budget_items;

CREATE POLICY "bi_client_select" ON budget_items
  FOR SELECT USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE v.owner_id = auth.uid()
    )
  );

CREATE POLICY "bi_staff_select" ON budget_items
  FOR SELECT USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

CREATE POLICY "bi_staff_insert" ON budget_items
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT id FROM budgets
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

CREATE POLICY "bi_staff_delete" ON budget_items
  FOR DELETE USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- 3. Faturas
CREATE TABLE IF NOT EXISTS invoices (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number      text          NOT NULL,
  budget_id           uuid          REFERENCES budgets(id) ON DELETE SET NULL,
  vehicle_id          uuid          NOT NULL REFERENCES vehicles(id),
  service_description text          NOT NULL,
  amount              numeric(10,2) NOT NULL,
  status              text          NOT NULL DEFAULT 'pending',
  issued_at           timestamptz   NOT NULL DEFAULT now(),
  due_date            date,
  paid_at             timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('pending', 'paid', 'overdue'));

CREATE INDEX IF NOT EXISTS invoices_vehicle_id_idx  ON invoices(vehicle_id);
CREATE INDEX IF NOT EXISTS invoices_workshop_id_idx ON invoices(workshop_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx      ON invoices(status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_client_select" ON invoices;
DROP POLICY IF EXISTS "invoices_admin_select"  ON invoices;
DROP POLICY IF EXISTS "invoices_admin_insert"  ON invoices;
DROP POLICY IF EXISTS "invoices_admin_update"  ON invoices;

CREATE POLICY "invoices_client_select" ON invoices
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "invoices_admin_select" ON invoices
  FOR SELECT USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "invoices_admin_insert" ON invoices
  FOR INSERT WITH CHECK (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "invoices_admin_update" ON invoices
  FOR UPDATE USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- ============================================================
-- Contadores de numeração por oficina
-- ============================================================
CREATE TABLE IF NOT EXISTS workshop_counters (
  workshop_id  uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  counter_type text NOT NULL,
  last_number  int  NOT NULL DEFAULT 0,
  PRIMARY KEY (workshop_id, counter_type)
);

CREATE OR REPLACE FUNCTION next_workshop_number(p_workshop_id uuid, p_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next int;
BEGIN
  INSERT INTO workshop_counters (workshop_id, counter_type, last_number)
  VALUES (p_workshop_id, p_type, 1)
  ON CONFLICT (workshop_id, counter_type)
  DO UPDATE SET last_number = workshop_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN '#' || LPAD(v_next::text, 3, '0');
END;
$$;
