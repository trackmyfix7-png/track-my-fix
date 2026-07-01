-- ============================================================
-- 025: Vincula orçamentos à solicitação de origem
-- ============================================================
-- budgets já tinha service_order_id (aponta para service_orders, a OS
-- de execução), mas nenhuma coluna apontava para service_requests
-- (o pedido de orçamento original do cliente). Por isso o cliente não
-- via, na tela de aprovação, a qual solicitação aquele orçamento se referia.

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS service_request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS budgets_service_request_id_idx ON budgets(service_request_id);
