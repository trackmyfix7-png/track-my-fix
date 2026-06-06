-- 003: Adiciona campos de dados da oficina
ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone   text,
  ADD COLUMN IF NOT EXISTS cnpj    text;
