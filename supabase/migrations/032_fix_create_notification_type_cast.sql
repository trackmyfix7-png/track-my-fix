-- ============================================================
-- 032: Corrige create_notification — cast explícito text → notification_type
--
-- A coluna notifications.type foi alterada para o enum notification_type,
-- mas a função ainda inseria p_type como text sem cast, causando erro 42804.
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
  VALUES (p_user_id, p_workshop_id, p_type::notification_type, p_title, p_message, p_reference_id, p_reference_type)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;
