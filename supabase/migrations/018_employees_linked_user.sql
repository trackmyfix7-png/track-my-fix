-- ============================================================
-- 018: Vínculo automático entre registro HR e acesso ao portal
-- ============================================================
-- Adiciona linked_user_id à tabela employees e atualiza
-- join_as_employee para auto-vincular pelo e-mail do Google.
-- Assim, ao acessar o portal, o funcionário já aparece como
-- "Com acesso ao portal" na aba de equipe do admin.
-- ============================================================

-- 1. Coluna de vínculo com o usuário do portal
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS linked_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Índice para lookup reverso (portal → HR)
CREATE INDEX IF NOT EXISTS employees_linked_user_idx ON employees(linked_user_id);

-- 2. Atualiza join_as_employee para auto-vincular pelo e-mail
CREATE OR REPLACE FUNCTION join_as_employee(p_workshop_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workshop_id uuid;
  v_user_id     uuid := auth.uid();
  v_user_email  text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_workshop_id
  FROM workshops
  WHERE slug = p_workshop_slug;

  IF v_workshop_id IS NULL THEN
    RAISE EXCEPTION 'workshop_not_found';
  END IF;

  -- Vincula à oficina (idempotente)
  INSERT INTO workshop_employees (employee_id, workshop_id)
  VALUES (v_user_id, v_workshop_id)
  ON CONFLICT (employee_id, workshop_id) DO NOTHING;

  -- Promove para employee apenas se ainda for client
  UPDATE profiles
  SET role = 'employee'
  WHERE id = v_user_id AND role = 'client';

  -- Auto-vínculo com registro HR pelo e-mail (case-insensitive)
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NOT NULL THEN
    UPDATE employees
    SET linked_user_id = v_user_id
    WHERE workshop_id    = v_workshop_id
      AND lower(email)   = lower(v_user_email)
      AND linked_user_id IS NULL;
  END IF;

  RETURN json_build_object('status', 'ok', 'workshop_id', v_workshop_id);
END;
$$;

NOTIFY pgrst, 'reload schema';
