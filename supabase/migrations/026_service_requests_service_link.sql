-- ============================================================
-- 026: Expansão — rascunhos de funcionários + permissões por funcionário
-- ============================================================

-- 1. Vínculo service_request → serviço do catálogo (propósito original)
--    Quando o cliente solicita a partir de um serviço específico, o preço-base
--    do catálogo agora chega na hora de montar o orçamento.

ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sr_service_id_idx ON service_requests(service_id);

-- 2. Suporte a rascunhos de orçamento criados por funcionários
--    is_draft = true  → orçamento interno, cliente ainda não vê
--    is_draft = false → orçamento publicado, cliente pode aprovar/recusar
--    created_by_employee_id → quem preparou (workshop_employees.id)
--    review_notes → nota do admin ao devolver para o funcionário

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS is_draft               boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_employee_id uuid    REFERENCES workshop_employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_notes           text;

CREATE INDEX IF NOT EXISTS budgets_draft_idx
  ON budgets(workshop_id, is_draft)
  WHERE is_draft = true;

-- 3. Permissão por funcionário: pode enviar orçamento direto ao cliente?
--    false (padrão): cria rascunho → admin revisa → publica
--    true:           cria e envia direto para o cliente

ALTER TABLE workshop_employees
  ADD COLUMN IF NOT EXISTS can_approve_budgets boolean NOT NULL DEFAULT false;

-- 4. Função SECURITY DEFINER para funcionário criar orçamento
--    Valida que o chamador é funcionário da oficina.
--    Define is_draft com base em can_approve_budgets.
--    Atualiza service_request.status para 'analyzing'.

CREATE OR REPLACE FUNCTION create_employee_budget(
  p_workshop_id        uuid,
  p_vehicle_id         uuid,
  p_service_request_id uuid,
  p_items              jsonb,
  p_notes              text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link          workshop_employees%ROWTYPE;
  v_budget_number text;
  v_budget_id     uuid;
  v_total         numeric := 0;
BEGIN
  -- Verificar que o chamador é funcionário desta oficina
  SELECT * INTO v_link
  FROM workshop_employees
  WHERE employee_id = auth.uid()
    AND workshop_id  = p_workshop_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Calcular total a partir dos itens
  SELECT COALESCE(SUM((item->>'quantity')::numeric * (item->>'unit_price')::numeric), 0)
  INTO v_total
  FROM jsonb_array_elements(p_items) item;

  -- Número sequencial da oficina
  SELECT next_workshop_number(p_workshop_id, 'budget') INTO v_budget_number;

  -- Criar orçamento
  --   is_draft = true  quando funcionário NÃO tem can_approve_budgets
  --   is_draft = false quando funcionário PODE enviar direto
  INSERT INTO budgets (
    budget_number,
    vehicle_id,
    workshop_id,
    service_request_id,
    status,
    total_amount,
    workshop_notes,
    issued_at,
    is_draft,
    created_by_employee_id
  )
  VALUES (
    v_budget_number,
    p_vehicle_id,
    p_workshop_id,
    p_service_request_id,
    'awaiting_approval',
    v_total,
    p_notes,
    now(),
    NOT v_link.can_approve_budgets,
    v_link.id
  )
  RETURNING id INTO v_budget_id;

  -- Itens do orçamento
  INSERT INTO budget_items (budget_id, description, category, quantity, unit_price, total_price)
  SELECT
    v_budget_id,
    item->>'description',
    item->>'category',
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric,
    (item->>'quantity')::integer * (item->>'unit_price')::numeric
  FROM jsonb_array_elements(p_items) item;

  -- Atualizar status da solicitação para 'analyzing'
  IF p_service_request_id IS NOT NULL THEN
    UPDATE service_requests
    SET status = 'analyzing'
    WHERE id = p_service_request_id
      AND status = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'budget_id',     v_budget_id,
    'budget_number', v_budget_number,
    'is_draft',      NOT v_link.can_approve_budgets
  );
END;
$$;
