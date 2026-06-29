-- ============================================================
-- 011: Notificações (US-06)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type           text        NOT NULL,
  title          text        NOT NULL,
  message        text        NOT NULL,
  is_read        boolean     NOT NULL DEFAULT false,
  reference_id   uuid,
  reference_type text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Adiciona colunas novas sem quebrar tabela existente
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE;

-- O campo type é um enum — adiciona os valores que ainda não existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'budget_rejected'
                 AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'budget_rejected';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'status_changed'
                 AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'status_changed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'service_request_received'
                 AND enumtypid = 'notification_type'::regtype) THEN
    ALTER TYPE notification_type ADD VALUE 'service_request_received';
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS notif_user_id_idx    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notif_is_read_idx    ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notif_created_at_idx ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_owner_select" ON notifications;
DROP POLICY IF EXISTS "notif_owner_update" ON notifications;

CREATE POLICY "notif_owner_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notif_owner_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- Função: cria notificação (chamada por triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id        uuid,
  p_workshop_id    uuid,
  p_type           text,
  p_title          text,
  p_message        text,
  p_reference_id   uuid   DEFAULT NULL,
  p_reference_type text   DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, workshop_id, type, title, message, reference_id, reference_type)
  VALUES (p_user_id, p_workshop_id, p_type, p_title, p_message, p_reference_id, p_reference_type)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- ============================================================
-- Trigger: notifica cliente quando status da ordem muda (US-06)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_notify_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id   uuid;
  v_workshop_id uuid;
  v_plate       text;
  v_title       text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT v.owner_id, so.workshop_id, v.plate
  INTO v_client_id, v_workshop_id, v_plate
  FROM service_orders so
  JOIN vehicles v ON v.id = so.vehicle_id
  WHERE so.id = NEW.id;

  v_title := CASE NEW.status
    WHEN 'diagnosis'         THEN 'Diagnóstico em andamento'
    WHEN 'awaiting_approval' THEN 'Orçamento aguardando aprovação'
    WHEN 'in_progress'       THEN 'Serviço iniciado'
    WHEN 'ready'             THEN 'Veículo pronto para retirada!'
    WHEN 'delivered'         THEN 'Veículo entregue'
    ELSE 'Status atualizado'
  END;

  PERFORM create_notification(
    p_user_id        => v_client_id,
    p_workshop_id    => v_workshop_id,
    p_type           => 'status_changed',
    p_title          => v_title,
    p_message        => 'Veículo ' || v_plate || ': ' || v_title,
    p_reference_id   => NEW.id,
    p_reference_type => 'service_order'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_order_notify_client ON service_orders;
CREATE TRIGGER service_order_notify_client
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_status_change();

-- ============================================================
-- Trigger: notifica cliente quando orçamento é criado (US-07)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_notify_budget_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_plate     text;
BEGIN
  SELECT v.owner_id, v.plate INTO v_client_id, v_plate
  FROM vehicles v WHERE v.id = NEW.vehicle_id;

  PERFORM create_notification(
    p_user_id        => v_client_id,
    p_workshop_id    => NEW.workshop_id,
    p_type           => 'budget_created',
    p_title          => 'Orçamento disponível',
    p_message        => 'Orçamento ' || NEW.budget_number || ' para ' || v_plate || ' aguarda sua aprovação.',
    p_reference_id   => NEW.id,
    p_reference_type => 'budget'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS budget_notify_client ON budgets;
CREATE TRIGGER budget_notify_client
  AFTER INSERT ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_budget_created();

-- ============================================================
-- Trigger: notifica admin quando cliente aprova/recusa (US-07)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_notify_budget_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_plate    text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT w.owner_id INTO v_admin_id FROM workshops w WHERE w.id = NEW.workshop_id;
  SELECT v.plate   INTO v_plate    FROM vehicles  v WHERE v.id = NEW.vehicle_id;

  PERFORM create_notification(
    p_user_id        => v_admin_id,
    p_workshop_id    => NEW.workshop_id,
    p_type           => CASE NEW.status WHEN 'approved' THEN 'budget_approved' ELSE 'budget_rejected' END,
    p_title          => CASE NEW.status WHEN 'approved' THEN 'Orçamento aprovado' ELSE 'Orçamento recusado' END,
    p_message        => 'O cliente ' || CASE NEW.status WHEN 'approved' THEN 'aprovou' ELSE 'recusou' END
                        || ' o orçamento ' || NEW.budget_number || ' (' || v_plate || ').',
    p_reference_id   => NEW.id,
    p_reference_type => 'budget'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS budget_response_notify_admin ON budgets;
CREATE TRIGGER budget_response_notify_admin
  AFTER UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trg_notify_budget_response();
