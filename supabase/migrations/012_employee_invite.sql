-- ============================================================
-- 012: Função para o funcionário aceitar convite via link
-- ============================================================
-- O funcionário chama esta função no callback do OAuth.
-- SECURITY DEFINER permite inserir em workshop_employees e
-- atualizar profiles.role sem expor RLS extra ao cliente.

CREATE OR REPLACE FUNCTION join_as_employee(p_workshop_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workshop_id uuid;
  v_user_id     uuid := auth.uid();
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

  RETURN json_build_object('status', 'ok', 'workshop_id', v_workshop_id);
END;
$$;
