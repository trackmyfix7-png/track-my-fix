-- ============================================================
-- 019: Adiciona email à tabela profiles
-- ============================================================
-- O email do usuário fica em auth.users mas não era espelhado
-- em profiles, impossibilitando exibição e pré-preenchimento
-- no portal do funcionário e na listagem do admin.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill para usuários existentes (SECURITY DEFINER necessário
-- para acessar auth.users)
CREATE OR REPLACE FUNCTION backfill_profiles_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
    AND p.email IS NULL;
END;
$$;

SELECT backfill_profiles_email();
DROP FUNCTION backfill_profiles_email();

-- Atualiza join_as_employee para sempre sincronizar o email
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

  -- Recupera o e-mail do usuário
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Vincula à oficina (idempotente)
  INSERT INTO workshop_employees (employee_id, workshop_id)
  VALUES (v_user_id, v_workshop_id)
  ON CONFLICT (employee_id, workshop_id) DO NOTHING;

  -- Promove para employee apenas se ainda for client
  UPDATE profiles
  SET role = 'employee', email = v_user_email
  WHERE id = v_user_id AND role = 'client';

  -- Sincroniza email mesmo para quem já era employee
  UPDATE profiles
  SET email = v_user_email
  WHERE id = v_user_id AND email IS NULL;

  -- Auto-vínculo com registro HR pelo e-mail (case-insensitive)
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
