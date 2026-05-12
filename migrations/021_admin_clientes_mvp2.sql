-- ============================================================================
-- Migration 021: Admin Clientes MVP.2 - Gestión operativa de clientes
-- ============================================================================
-- Fecha: 2026-05-12
-- Autor: Kepler
-- Objetivo: Agregar campos para gestión de clientes (notas internas, archivado)
-- Backward compatible: SÍ (columnas opcionales)
-- Rollback: Ver 021_rollback_admin_clientes_mvp2.sql
-- Validación: Ver 021_validation_admin_clientes_mvp2.sql
-- ============================================================================

-- ============================================================================
-- PASO 1: Agregar columna internal_notes
-- ============================================================================
-- Propósito: Notas internas del admin (NO visible para clientes)
-- Tipo: TEXT (permite notas largas)
-- Restricción: Máximo 1000 caracteres (validado en frontend + backend API)
-- Uso: Solo admin puede ver/editar

ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS internal_notes TEXT NULL;

-- Comentario para documentación
COMMENT ON COLUMN customer_profiles.internal_notes IS 
'Notas internas del admin. NO visible para clientes. Máximo 1000 caracteres (validar en API).';

-- ============================================================================
-- PASO 2: Agregar columna archived_at
-- ============================================================================
-- Propósito: Soft delete / archivado de clientes
-- Tipo: TIMESTAMPTZ (guarda cuándo se archivó)
-- NULL = cliente activo
-- NOT NULL = cliente archivado

ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

-- Comentario para documentación
COMMENT ON COLUMN customer_profiles.archived_at IS 
'Timestamp de archivado. NULL = activo, NOT NULL = archivado. Soft delete reversible.';

-- ============================================================================
-- PASO 3: Crear índice para performance
-- ============================================================================
-- Propósito: Optimizar filtros WHERE archived_at IS NULL / IS NOT NULL
-- Beneficio: Queries rápidas en lista de clientes (activos vs archivados)

CREATE INDEX IF NOT EXISTS idx_customer_profiles_archived_at 
ON customer_profiles(archived_at);

-- ============================================================================
-- VALIDACIONES POST-MIGRATION
-- ============================================================================
-- (Ejecutar manualmente después de migration para confirmar éxito)
-- Ver: 021_validation_admin_clientes_mvp2.sql

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Columnas opcionales (NULL) → no rompe funcionalidad existente
-- 2. Índice mejora performance de filtros archivados
-- 3. NO afecta customer panel (/account) - solo admin
-- 4. NO afecta RLS existente
-- 5. NO afecta checkout, pagos, emails
-- 6. Backward compatible al 100%

-- ============================================================================
-- Migration 021 complete
-- ============================================================================
