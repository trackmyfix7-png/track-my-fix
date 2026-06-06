-- 004: Função para registrar admin + criar oficina atomicamente
-- SECURITY DEFINER permite atualizar profiles.role sem expor a operação via RLS

CREATE OR REPLACE FUNCTION register_workshop_admin(p_name text, p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_workshop_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM workshops WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'slug_taken';
  END IF;

  IF EXISTS (SELECT 1 FROM workshops WHERE owner_id = v_user_id) THEN
    RAISE EXCEPTION 'already_registered';
  END IF;

  UPDATE profiles SET role = 'admin' WHERE id = v_user_id;

  INSERT INTO workshops (name, slug, owner_id)
  VALUES (p_name, p_slug, v_user_id)
  RETURNING id INTO v_workshop_id;

  RETURN json_build_object('workshop_id', v_workshop_id, 'slug', p_slug);
END;
$$;
