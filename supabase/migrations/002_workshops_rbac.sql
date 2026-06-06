-- ============================================================
-- 002: RBAC — profiles.role + workshops + client_workshops
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client'
  CHECK (role IN ('admin', 'client'));

-- 2. Workshops
CREATE TABLE IF NOT EXISTS workshops (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  owner_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workshops_slug_idx     ON workshops(slug);
CREATE INDEX IF NOT EXISTS workshops_owner_id_idx ON workshops(owner_id);

-- 3. Client ↔ Workshop relationship
CREATE TABLE IF NOT EXISTS client_workshops (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workshop_id uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  linked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS cw_client_id_idx   ON client_workshops(client_id);
CREATE INDEX IF NOT EXISTS cw_workshop_id_idx ON client_workshops(workshop_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE workshops       ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_workshops ENABLE ROW LEVEL SECURITY;

-- workshops: anyone can read (needed for entry page before login)
CREATE POLICY "workshops_public_read" ON workshops
  FOR SELECT USING (true);

-- workshops: owner can insert/update
CREATE POLICY "workshops_owner_insert" ON workshops
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workshops_owner_update" ON workshops
  FOR UPDATE USING (owner_id = auth.uid());

-- client_workshops: clients see their own links
CREATE POLICY "cw_client_select" ON client_workshops
  FOR SELECT USING (client_id = auth.uid());

-- client_workshops: admins see all links to their workshop
CREATE POLICY "cw_admin_select" ON client_workshops
  FOR SELECT USING (
    workshop_id IN (
      SELECT id FROM workshops WHERE owner_id = auth.uid()
    )
  );

-- client_workshops: authenticated users can create their own link
CREATE POLICY "cw_client_insert" ON client_workshops
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- ============================================================
-- Helper: admin seed
-- After running this migration, set an admin manually:
--   UPDATE profiles SET role = 'admin' WHERE id = '<uuid>';
-- Then create their workshop:
--   INSERT INTO workshops (name, slug, owner_id) VALUES ('Nome da Oficina', 'slug-da-oficina', '<uuid>');
-- ============================================================
