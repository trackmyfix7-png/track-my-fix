-- ============================================================
-- 009: Catálogo de serviços por oficina (US-15)
-- ============================================================

CREATE TABLE IF NOT EXISTS services (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text          NOT NULL,
  description  text,
  base_price   numeric(10,2) NOT NULL,
  is_active    boolean       NOT NULL DEFAULT true,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now()
);

-- Adiciona colunas novas sem quebrar tabela existente
ALTER TABLE services ADD COLUMN IF NOT EXISTS workshop_id    uuid REFERENCES workshops(id) ON DELETE CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category       text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_time text;

CREATE INDEX IF NOT EXISTS services_workshop_id_idx ON services(workshop_id);
CREATE INDEX IF NOT EXISTS services_is_active_idx   ON services(is_active);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_linked_select"    ON services;
DROP POLICY IF EXISTS "services_admin_select_all" ON services;
DROP POLICY IF EXISTS "services_admin_insert"     ON services;
DROP POLICY IF EXISTS "services_admin_update"     ON services;
DROP POLICY IF EXISTS "services_admin_delete"     ON services;

-- Clientes e funcionários veem serviços ativos da oficina vinculada
CREATE POLICY "services_linked_select" ON services
  FOR SELECT USING (
    is_active = true
    AND workshop_id IN (
      SELECT id          FROM workshops        WHERE owner_id  = auth.uid()
      UNION ALL
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      UNION ALL
      SELECT workshop_id FROM client_workshops   WHERE client_id   = auth.uid()
    )
  );

-- Admin vê todos os serviços (ativos e inativos) da sua oficina
CREATE POLICY "services_admin_select_all" ON services
  FOR SELECT USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

-- Admin gerencia serviços
CREATE POLICY "services_admin_insert" ON services
  FOR INSERT WITH CHECK (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "services_admin_update" ON services
  FOR UPDATE USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );

CREATE POLICY "services_admin_delete" ON services
  FOR DELETE USING (
    workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid())
  );
