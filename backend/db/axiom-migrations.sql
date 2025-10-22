-- Atlas Axiom Dashboard - Database Migrations
-- Run this file to set up Axiom-specific tables
-- Usage: psql -U postgres -d atlas_db -f backend/db/axiom-migrations.sql

-- =============================================================================
-- MIGRATION 001: Axiom Controllers
-- =============================================================================

CREATE TABLE IF NOT EXISTS axiom_controllers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    host VARCHAR(255) NOT NULL,
    internal_ip VARCHAR(255),
    ssh_user VARCHAR(50) DEFAULT 'ubuntu',
    ssh_key_path VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    provider VARCHAR(50) DEFAULT 'gcp',
    is_active BOOLEAN DEFAULT false,
    last_seen TIMESTAMP,
    health_status VARCHAR(20) DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast active controller lookup
CREATE INDEX IF NOT EXISTS idx_active_controller 
ON axiom_controllers(is_active) 
WHERE is_active = true;

-- Index for provider filtering
CREATE INDEX IF NOT EXISTS idx_controller_provider 
ON axiom_controllers(provider);

COMMENT ON TABLE axiom_controllers IS 'Stores Axiom controller configurations';
COMMENT ON COLUMN axiom_controllers.health_status IS 'Current health: healthy, degraded, down, unknown';

-- =============================================================================
-- MIGRATION 002: Axiom Instances
-- =============================================================================

CREATE TABLE IF NOT EXISTS axiom_instances (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) DEFAULT 'gcp',
    region VARCHAR(100),
    zone VARCHAR(100),
    instance_type VARCHAR(50),
    public_ip VARCHAR(45),
    private_ip VARCHAR(45),
    status VARCHAR(20) DEFAULT 'unknown',
    is_preemptible BOOLEAN DEFAULT false,
    cost_per_hour DECI