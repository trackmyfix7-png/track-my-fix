-- ============================================================
-- 010: Solicitações de orçamento livre (US-08, US-18)
-- ============================================================

-- 1. Solicitações
CREATE TABLE IF NOT EXISTS service_requests (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id          uuid        NOT NULL REFERENCES vehicles(id),
  problem_description text        NOT NULL,
  status              text        NOT NULL DEFAULT 'pending',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Adiciona colunas novas sem quebrar tabela existente
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS category    text;

ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_status_check;
ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_status_check
  CHECK (status IN ('pending', 'analyzing', 'budget_created'));

CREATE INDEX IF NOT EXISTS sr_owner_id_idx    ON service_requests(owner_id);
CREATE INDEX IF NOT EXISTS sr_workshop_id_idx ON service_requests(workshop_id);
CREATE INDEX IF NOT EXISTS sr_status_idx      ON service_requests(status);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sr_client_select" ON service_requests;
DROP POLICY IF EXISTS "sr_client_insert" ON service_requests;
DROP POLICY IF EXISTS "sr_staff_select"  ON service_requests;
DROP POLICY IF EXISTS "sr_staff_update"  ON service_requests;

CREATE POLICY "sr_client_select" ON service_requests
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "sr_client_insert" ON service_requests
  FOR INSERT WITH CHECK (
    owner_id = auth.uid()
    AND workshop_id IN (
      SELECT workshop_id FROM client_workshops WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "sr_staff_select" ON service_requests
  FOR SELECT USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
      UNION ALL
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "sr_staff_update" ON service_requests
  FOR UPDATE USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
      UNION ALL
      SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
    )
  );

-- 2. Imagens das solicitações
CREATE TABLE IF NOT EXISTS service_request_images (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid        NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  storage_path text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sri_request_id_idx ON service_request_images(request_id);

ALTER TABLE service_request_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sri_client_select" ON service_request_images;
DROP POLICY IF EXISTS "sri_client_insert" ON service_request_images;
DROP POLICY IF EXISTS "sri_staff_select"  ON service_request_images;

CREATE POLICY "sri_client_select" ON service_request_images
  FOR SELECT USING (
    request_id IN (SELECT id FROM service_requests WHERE owner_id = auth.uid())
  );

CREATE POLICY "sri_client_insert" ON service_request_images
  FOR INSERT WITH CHECK (
    request_id IN (SELECT id FROM service_requests WHERE owner_id = auth.uid())
  );

CREATE POLICY "sri_staff_select" ON service_request_images
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM service_requests
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );
