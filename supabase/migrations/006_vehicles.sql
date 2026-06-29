-- ============================================================
-- 006: Tabela vehicles com RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand       text        NOT NULL,
  model       text        NOT NULL,
  year        int         NOT NULL,
  plate       text        NOT NULL,
  color       text,
  fuel_type   text,        -- Flex, Gasolina, Diesel, Elétrico, Híbrido
  mileage     int,
  notes       text,
  photo_url   text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicles_owner_id_idx ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS vehicles_plate_idx    ON vehicles(plate);

-- Adiciona coluna fuel_type se ainda não existir (projeto transferido pode não ter)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type text;

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Remove policies antigas para recriar de forma idempotente
DROP POLICY IF EXISTS "vehicles_owner_select" ON vehicles;
DROP POLICY IF EXISTS "vehicles_owner_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicles_owner_update" ON vehicles;

-- Cliente vê seus próprios veículos
CREATE POLICY "vehicles_owner_select" ON vehicles
  FOR SELECT USING (owner_id = auth.uid());

-- Cliente insere seus próprios veículos
CREATE POLICY "vehicles_owner_insert" ON vehicles
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Cliente atualiza seus próprios veículos
CREATE POLICY "vehicles_owner_update" ON vehicles
  FOR UPDATE USING (owner_id = auth.uid());

-- Nota: as políticas de acesso para admin/funcionário são adicionadas
-- na migration 007 (service_orders), pois dependem dessa tabela.

-- ============================================================
-- Função: admin/funcionário registra veículo em nome do cliente
-- ============================================================
CREATE OR REPLACE FUNCTION register_vehicle_for_client(
  p_client_id  uuid,
  p_brand      text,
  p_model      text,
  p_year       int,
  p_plate      text,
  p_color      text    DEFAULT NULL,
  p_fuel_type  text    DEFAULT NULL,
  p_mileage    int     DEFAULT NULL,
  p_notes      text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id  uuid := auth.uid();
  v_vehicle_id uuid;
BEGIN
  -- Confirma que o caller é admin ou funcionário de alguma oficina
  IF NOT EXISTS (
    SELECT 1 FROM workshops WHERE owner_id = v_caller_id
    UNION ALL
    SELECT 1 FROM workshop_employees WHERE employee_id = v_caller_id
  ) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Confirma que o cliente existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'client_not_found';
  END IF;

  INSERT INTO vehicles (owner_id, brand, model, year, plate, color, fuel_type, mileage, notes)
  VALUES (p_client_id, p_brand, p_model, p_year, p_plate, p_color, p_fuel_type, p_mileage, p_notes)
  RETURNING id INTO v_vehicle_id;

  RETURN v_vehicle_id;
END;
$$;
