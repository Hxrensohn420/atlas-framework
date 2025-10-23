-- ============================================================================
-- Atlas Framework - Axiom Integration Schema
-- ============================================================================
-- This adds Axiom-specific tables that extend the base atlas_schema.sql
-- Run AFTER atlas_schema.sql has been loaded
-- ============================================================================

-- Drop existing Axiom tables if they conflict (clean slate)
DROP TABLE IF EXISTS axiom_logs CASCADE;
DROP TABLE IF EXISTS axiom_files CASCADE;
DROP TABLE IF EXISTS axiom_scans CASCADE;
DROP TABLE IF EXISTS axiom_controllers CASCADE;

-- ============================================================================
-- Axiom Controllers (Multi-controller support)
-- ============================================================================
CREATE TABLE axiom_controllers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL,
    ssh_user VARCHAR(100) DEFAULT 'ubuntu',
    ssh_port INTEGER DEFAULT 22,
    ssh_key_path VARCHAR(500),
    provider VARCHAR(50) DEFAULT 'gcp',
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending',
    last_health_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Axiom Scans (uses axiom_fleets.id which is UUID from atlas_schema.sql)
-- ============================================================================
CREATE TABLE axiom_scans (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    fleet_id UUID REFERENCES axiom_fleets(id) ON DELETE SET NULL,  -- ✅ UUID!
    name VARCHAR(255) NOT NULL,
    scan_module VARCHAR(100) NOT NULL,
    targets TEXT NOT NULL,
    arguments TEXT,
    output_file VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    results_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Axiom Files
-- ============================================================================
CREATE TABLE axiom_files (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(500) NOT NULL,
    fleet_target VARCHAR(255),
    is_split BOOLEAN DEFAULT false,
    file_size BIGINT,
    upload_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Axiom Command Logs
-- ============================================================================
CREATE TABLE axiom_logs (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    output TEXT,
    exit_code INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Update axiom_instances to link to controllers
-- ============================================================================
-- Add controller_id to existing axiom_instances table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='axiom_instances' AND column_name='controller_id'
    ) THEN
        ALTER TABLE axiom_instances 
        ADD COLUMN controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Update axiom_fleets to link to controllers
-- ============================================================================
-- Add controller_id to existing axiom_fleets table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='axiom_fleets' AND column_name='controller_id'
    ) THEN
        ALTER TABLE axiom_fleets 
        ADD COLUMN controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_instances_controller ON axiom_instances(controller_id);
CREATE INDEX IF NOT EXISTS idx_fleets_controller ON axiom_fleets(controller_id);
CREATE INDEX IF NOT EXISTS idx_scans_controller ON axiom_scans(controller_id);
CREATE INDEX IF NOT EXISTS idx_scans_fleet ON axiom_scans(fleet_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON axiom_scans(status);
CREATE INDEX IF NOT EXISTS idx_files_controller ON axiom_files(controller_id);
CREATE INDEX IF NOT EXISTS idx_logs_controller ON axiom_logs(controller_id);

-- ============================================================================
-- Insert default controller
-- ============================================================================
INSERT INTO axiom_controllers (name, host, ssh_user, provider, region, is_active, status)
VALUES ('default-controller', '35.242.197.253', 'ubuntu', 'gcp', 'europe-north1', true, 'active')
ON CONFLICT (name) DO UPDATE SET 
    host = EXCLUDED.host,
    is_active = EXCLUDED.is_active,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ============================================================================
-- Done!
-- ============================================================================
