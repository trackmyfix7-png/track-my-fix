-- ============================================================
-- 007: Ordens de serviço, histórico de status e check-list de entrada
-- ============================================================

-- 1. Ordens de serviço
-- A tabela pode já existir no projeto transferido — garantimos que as novas colunas existam
CREATE TABLE IF NOT EXISTS service_orders (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id           uuid        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status               text        NOT NULL DEFAULT 'received',
  entry_date           timestamptz NOT NULL DEFAULT now(),
  exit_date            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Adiciona colunas novas sem quebrar tabela existente
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS workshop_id          uuid REFERENCES workshops(id) ON DELETE CASCADE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS problem_description  text;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS workshop_notes       text;

-- O status é um enum — adiciona os novos valores sem remover os existentes
-- (ALTER TYPE ADD VALUE não suporta IF NOT EXISTS antes do PG 9.6, mas Supabase usa PG 15+)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'diagnosis'
                 AND enumtypid = 'service_order_status'::regtype) THEN
    ALTER TYPE service_order_status ADD VALUE 'diagnosis';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'awaiting_approval'
                 AND enumtypid = 'service_order_status'::regtype) THEN
    ALTER TYPE service_order_status ADD VALUE 'awaiting_approval';
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS so_vehicle_id_idx   ON service_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS so_workshop_id_idx  ON service_orders(workshop_id);
CREATE INDEX IF NOT EXISTS so_status_idx       ON service_orders(status);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas para recriar de forma idempotente
DROP POLICY IF EXISTS "so_client_select"   ON service_orders;
DROP POLICY IF EXISTS "so_admin_select"    ON service_orders;
DROP POLICY IF EXISTS "so_employee_select" ON service_orders;
DROP POLICY IF EXISTS "so_admin_insert"    ON service_orders;
DROP POLICY IF EXISTS "so_employee_insert" ON service_orders;
DROP POLICY IF EXISTS "so_admin_update"    ON service_orders;
DROP POLICY IF EXISTS "so_employee_update" ON service_orders;

-- Cliente vê ordens de serviço dos seus veículos
CREATE POLICY "so_client_select" ON service_orders
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  );

-- Admin vê ordens da sua oficina
CREATE POLICY "so_admin_select" ON service_orders
  FOR SELECT USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- Funcionário vê ordens da oficina onde trabalha
CREATE POLICY "so_employee_select" ON service_orders
  FOR SELECT USING (
    workshop_id IN (
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

-- Admin insere ordens
CREATE POLICY "so_admin_insert" ON service_orders
  FOR INSERT WITH CHECK (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- Funcionário insere ordens
CREATE POLICY "so_employee_insert" ON service_orders
  FOR INSERT WITH CHECK (
    workshop_id IN (
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

-- Admin atualiza ordens da sua oficina
CREATE POLICY "so_admin_update" ON service_orders
  FOR UPDATE USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- Funcionário atualiza ordens da oficina onde trabalha
CREATE POLICY "so_employee_update" ON service_orders
  FOR UPDATE USING (
    workshop_id IN (
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

-- 2. Histórico de mudanças de status (linha do tempo — US-05)
CREATE TABLE IF NOT EXISTS service_order_status_history (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  status           text        NOT NULL,
  notes            text,        -- observação opcional visível ao cliente
  changed_by       uuid        NOT NULL REFERENCES profiles(id),
  changed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sosh_order_id_idx ON service_order_status_history(service_order_id);

ALTER TABLE service_order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sosh_client_select" ON service_order_status_history;
DROP POLICY IF EXISTS "sosh_staff_select"  ON service_order_status_history;
DROP POLICY IF EXISTS "sosh_staff_insert"  ON service_order_status_history;

-- Cliente vê histórico das suas ordens
CREATE POLICY "sosh_client_select" ON service_order_status_history
  FOR SELECT USING (
    service_order_id IN (
      SELECT so.id FROM service_orders so
      JOIN vehicles v ON v.id = so.vehicle_id
      WHERE v.owner_id = auth.uid()
    )
  );

-- Staff vê histórico das ordens da oficina
CREATE POLICY "sosh_staff_select" ON service_order_status_history
  FOR SELECT USING (
    service_order_id IN (
      SELECT id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- Staff insere histórico
CREATE POLICY "sosh_staff_insert" ON service_order_status_history
  FOR INSERT WITH CHECK (
    service_order_id IN (
      SELECT id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- 3. Check-list de entrada (US-11)
CREATE TABLE IF NOT EXISTS entry_checklist (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  item             text        NOT NULL,
  is_ok            boolean     NOT NULL DEFAULT false,
  notes            text,
  checked_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ecl_order_id_idx ON entry_checklist(service_order_id);

ALTER TABLE entry_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ecl_client_select" ON entry_checklist;
DROP POLICY IF EXISTS "ecl_staff_select"  ON entry_checklist;
DROP POLICY IF EXISTS "ecl_staff_insert"  ON entry_checklist;
DROP POLICY IF EXISTS "ecl_staff_update"  ON entry_checklist;

-- Cliente vê o check-list das suas ordens
CREATE POLICY "ecl_client_select" ON entry_checklist
  FOR SELECT USING (
    service_order_id IN (
      SELECT so.id FROM service_orders so
      JOIN vehicles v ON v.id = so.vehicle_id
      WHERE v.owner_id = auth.uid()
    )
  );

-- Staff gerencia check-list
CREATE POLICY "ecl_staff_select" ON entry_checklist
  FOR SELECT USING (
    service_order_id IN (
      SELECT id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

CREATE POLICY "ecl_staff_insert" ON entry_checklist
  FOR INSERT WITH CHECK (
    service_order_id IN (
      SELECT id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

CREATE POLICY "ecl_staff_update" ON entry_checklist
  FOR UPDATE USING (
    service_order_id IN (
      SELECT id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Agora que service_orders existe, adiciona políticas de workshop
-- para vehicles (complementa migration 006)
-- ============================================================

DROP POLICY IF EXISTS "vehicles_workshop_select" ON vehicles;
DROP POLICY IF EXISTS "vehicles_workshop_update" ON vehicles;

-- Staff vê veículos com ordens na sua oficina
CREATE POLICY "vehicles_workshop_select" ON vehicles
  FOR SELECT USING (
    id IN (
      SELECT vehicle_id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- Staff atualiza veículos com ordens na sua oficina (ex: atualizar km)
CREATE POLICY "vehicles_workshop_update" ON vehicles
  FOR UPDATE USING (
    id IN (
      SELECT vehicle_id FROM service_orders
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Trigger: registra histórico automaticamente ao mudar status
-- ============================================================

CREATE OR REPLACE FUNCTION trg_service_order_status_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO service_order_status_history (service_order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_order_status_changed ON service_orders;

CREATE TRIGGER service_order_status_changed
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_service_order_status_history();
