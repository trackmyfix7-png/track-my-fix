-- ============================================================
-- 016: Capacidade de vagas da oficina
-- ============================================================
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS capacity int DEFAULT 10;

NOTIFY pgrst, 'reload schema';
