-- ============================================================
-- 017: RLS em profiles — admin vê perfis dos funcionários
-- ============================================================
-- O join profiles!employee_id em workshop_employees retornava null
-- porque o admin não tinha policy para ler perfis de outros usuários.
-- Esta migration garante que:
--   1. admins vejam perfis de todos os funcionários da sua oficina
--   2. funcionários vejam perfis dos colegas da mesma oficina
--   3. qualquer usuário autenticado veja o próprio perfil
-- ============================================================

-- Habilita RLS na tabela (seguro repetir — idempotente)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas conflitantes se existirem
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_see_employees" ON profiles;
DROP POLICY IF EXISTS "profiles_workshop_staff_view" ON profiles;

-- 1. Usuário vê o próprio perfil
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT USING (id = auth.uid());

-- 2. Admin vê perfis de todos os funcionários da sua oficina
CREATE POLICY "profiles_admin_sees_employees" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT employee_id
      FROM workshop_employees
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
      )
    )
  );

-- 3. Funcionário vê perfis dos colegas da mesma oficina
CREATE POLICY "profiles_employee_sees_colleagues" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT employee_id
      FROM workshop_employees
      WHERE workshop_id IN (
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- 4. Admin / funcionário vê perfis dos clientes vinculados à sua oficina
CREATE POLICY "profiles_staff_sees_clients" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT client_id
      FROM client_workshops
      WHERE workshop_id IN (
        SELECT id FROM workshops WHERE owner_id = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- Políticas de escrita permanecem restritas ao próprio usuário
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "profiles_own_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;

CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

NOTIFY pgrst, 'reload schema';
