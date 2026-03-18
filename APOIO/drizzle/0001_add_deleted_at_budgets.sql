-- Migration: adicionar coluna deleted_at na tabela budgets para suporte a lixeira (soft delete)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
