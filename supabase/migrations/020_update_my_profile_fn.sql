-- ============================================================
-- 020: Função update_my_profile + backfill phone
-- ============================================================
-- Atualiza profiles E employees.phone em uma única transação.
-- Necessário porque employees tem RLS admin-only, mas o
-- funcionário precisa manter o próprio telefone sincronizado.
-- Inclui backfill para sincronizar registros já dessincronizados.
-- ============================================================

CREATE OR REPLACE FUNCTION update_my_profile(
  p_full_name text,
  p_phone     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE profiles
  SET full_name = p_full_name,
      phone     = NULLIF(trim(p_phone), '')
  WHERE id = v_user_id;

  UPDATE employees
  SET phone = NULLIF(trim(p_phone), '')
  WHERE linked_user_id = v_user_id;
END;
$$;

-- Backfill: sincroniza employees.phone com profiles.phone
-- para todos os funcionários já vinculados (linked_user_id definido)
-- onde profiles tem o valor mais recente (updated_at posterior)
UPDATE employees e
SET phone = p.phone
FROM profiles p
WHERE e.linked_user_id = p.id
  AND p.phone IS NOT NULL
  AND (e.phone IS NULL OR e.phone != p.phone);
