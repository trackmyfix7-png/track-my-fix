-- ============================================================
-- 015: Pré-cadastro de clientes pela oficina
-- ============================================================
-- clients: dados de clientes inseridos pelo admin antes (ou sem)
--          que o cliente tenha uma conta no sistema.
-- linked_user_id: preenchido automaticamente quando o cliente
--                 usa o link de convite e faz login com Google.

CREATE TABLE IF NOT EXISTS clients (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id    uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  phone          text,
  email          text,
  address        text,
  notes          text,
  linked_user_id uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_workshop_id_idx   ON clients(workshop_id);
CREATE INDEX IF NOT EXISTS clients_linked_user_id_idx ON clients(linked_user_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Admin gerencia clientes da sua oficina
CREATE POLICY "clients_admin_all" ON clients
  FOR ALL
  USING (workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid()))
  WITH CHECK (workshop_id IN (SELECT id FROM workshops WHERE owner_id = auth.uid()));

-- ============================================================
-- Função: vincula pré-cadastro ao usuário após login via convite
-- O caller é o próprio cliente (role=client) — RLS bloquearia,
-- por isso usamos SECURITY DEFINER.
-- ============================================================
CREATE OR REPLACE FUNCTION link_pre_registered_client(p_workshop_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_user_email  text;
  v_workshop_id uuid;
BEGIN
  -- Busca o e-mail do usuário autenticado
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  IF v_user_email IS NULL THEN RETURN; END IF;

  -- Busca a oficina pelo slug
  SELECT id INTO v_workshop_id FROM workshops WHERE slug = p_workshop_slug;

  IF v_workshop_id IS NULL THEN RETURN; END IF;

  -- Vincula o pré-cadastro ao usuário (por e-mail)
  UPDATE clients
  SET linked_user_id = v_user_id
  WHERE workshop_id = v_workshop_id
    AND lower(email) = lower(v_user_email)
    AND linked_user_id IS NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
