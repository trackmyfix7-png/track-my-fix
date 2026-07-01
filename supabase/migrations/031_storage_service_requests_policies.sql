-- ============================================================
-- 031: Políticas de storage para o bucket service-requests
--
-- Sem essas políticas, createSignedUrl falha silenciosamente
-- (retorna null) mesmo que o arquivo exista no bucket.
--
-- Path format: {owner_id}/{request_id}/{index}.{ext}
-- ============================================================

-- Cliente lê suas próprias imagens (primeiro segmento = owner_id)
CREATE POLICY "sr_images_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'service-requests'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin e funcionário leem imagens das solicitações da oficina deles
-- (segundo segmento do path = request_id)
CREATE POLICY "sr_images_staff_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'service-requests'
    AND (storage.foldername(name))[2] IN (
      SELECT id::text FROM service_requests
      WHERE workshop_id IN (
        SELECT id          FROM workshops         WHERE owner_id   = auth.uid()
        UNION ALL
        SELECT workshop_id FROM workshop_employees WHERE employee_id = auth.uid()
      )
    )
  );

-- Cliente faz upload para a própria pasta
CREATE POLICY "sr_images_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-requests'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
