-- ============================================================
-- 030: Backfill service_id em service_requests existentes
--
-- Estratégia:
--   • Categorias com 1 serviço → atualiza automaticamente
--   • Categorias ambíguas      → usuário decide (scripts separados abaixo,
--                                comentados — descomentar conforme necessário)
--
-- Categorias 1:1 (automáticas):
--   Arrefecimento → Troca de líquido de arrefecimento
--   Direção       → Troca de fluido de direção
--
-- Categorias ambíguas (comentadas):
--   Manutenção     → 3 serviços
--   Freios         → 3 serviços
--   Motor          → 3 serviços
--   Pneus e Suspensão → 4 serviços
--   Elétrica       → 3 serviços
--   Ar-condicionado → 2 serviços
--   Revisão        → 2 serviços
-- ============================================================

-- ── 1. Backfill automático: categorias com exatamente 1 serviço ──────────────
UPDATE service_requests sr
SET service_id = (
  SELECT s.id FROM services s
  WHERE s.workshop_id = sr.workshop_id
    AND s.category    = sr.category
  LIMIT 1
)
WHERE sr.service_id IS NULL
  AND (
    SELECT COUNT(*) FROM services s
    WHERE s.workshop_id = sr.workshop_id
      AND s.category    = sr.category
  ) = 1;


-- ── 2. Manutenção ─────────────────────────────────────────────────────────────
-- Descomentar apenas UM dos blocos abaixo conforme o que foi pedido.

-- Troca de óleo e filtro
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de óleo e filtro' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Manutenção';

-- Troca de filtro de ar
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de filtro de ar' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Manutenção';

-- Troca de filtro de combustível
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de filtro de combustível' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Manutenção';


-- ── 3. Freios ─────────────────────────────────────────────────────────────────

-- Troca de pastilhas de freio
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de pastilhas de freio' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Freios';

-- Troca de disco de freio
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de disco de freio' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Freios';

-- Sangria de freios
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Sangria de freios' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Freios';


-- ── 4. Motor ──────────────────────────────────────────────────────────────────

-- Troca de correia dentada
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de correia dentada' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Motor';

-- Troca de velas de ignição
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de velas de ignição' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Motor';

-- Troca de correia do alternador
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de correia do alternador' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Motor';


-- ── 5. Pneus e Suspensão ──────────────────────────────────────────────────────

-- Alinhamento
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Alinhamento' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Pneus e Suspensão';

-- Balanceamento
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Balanceamento' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Pneus e Suspensão';

-- Troca de amortecedor
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de amortecedor' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Pneus e Suspensão';

-- Troca de pivô e terminal
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de pivô e terminal' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Pneus e Suspensão';


-- ── 6. Elétrica ───────────────────────────────────────────────────────────────

-- Diagnóstico eletrônico
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Diagnóstico eletrônico' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Elétrica';

-- Troca de bateria
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Troca de bateria' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Elétrica';

-- Revisão elétrica geral
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Revisão elétrica geral' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Elétrica';


-- ── 7. Ar-condicionado ────────────────────────────────────────────────────────

-- Recarga de ar-condicionado
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Recarga de ar-condicionado' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Ar-condicionado';

-- Higienização de ar-condicionado
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Higienização de ar-condicionado' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Ar-condicionado';


-- ── 8. Revisão ────────────────────────────────────────────────────────────────

-- Revisão completa 10.000 km
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Revisão completa 10.000 km' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Revisão';

-- Revisão completa 20.000 km
-- UPDATE service_requests sr
-- SET service_id = (SELECT id FROM services WHERE workshop_id = sr.workshop_id AND name = 'Revisão completa 20.000 km' LIMIT 1)
-- WHERE sr.service_id IS NULL AND sr.category = 'Revisão';
