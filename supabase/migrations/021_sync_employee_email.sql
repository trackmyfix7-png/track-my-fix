-- ============================================================
-- 021: Sincroniza employees.email a partir de profiles.email
-- ============================================================
-- Fichas HR criadas antes da migration 019 ficaram sem email
-- porque profiles.email ainda não existia. Este backfill
-- preenche o email onde a ficha está vinculada (linked_user_id)
-- mas o campo email ainda está vazio.
-- ============================================================

-- Backfill: preenche employees.email a partir de profiles.email
-- somente onde a ficha não tem email mas o perfil tem
UPDATE employees e
SET email = p.email
FROM profiles p
WHERE e.linked_user_id = p.id
  AND p.email IS NOT NULL
  AND e.email IS NULL;

-- Atualiza join_as_employee para também sincronizar email na ficha HR
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

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  INSERT INTO workshop_employees (employee_id, workshop_id)
  VALUES (v_user_id, v_workshop_id)
  ON CONFLICT (employee_id, workshop_id) DO NOTHING;

  UPDATE profiles
  SET role = 'employee', email = v_user_email
  WHERE id = v_user_id AND role = 'client';

  UPDATE profiles
  SET email = v_user_email
  WHERE id = v_user_id AND email IS NULL;

  -- Auto-vínculo pelo e-mail + sincroniza email na ficha HR
  IF v_user_email IS NOT NULL THEN
    UPDATE employees
    SET linked_user_id = v_user_id,
        email          = COALESCE(email, v_user_email)
    WHERE workshop_id    = v_workshop_id
      AND lower(email)   = lower(v_user_email)
      AND linked_user_id IS NULL;

    -- Sincroniza email na ficha já vinculada (se estiver vazio)
    UPDATE employees
    SET email = v_user_email
    WHERE linked_user_id = v_user_id
      AND email IS NULL;
  END IF;

  RETURN json_build_object('status', 'ok', 'workshop_id', v_workshop_id);
END;
$$;
