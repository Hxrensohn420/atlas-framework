-- Atlas Framework - Axiom Dashboard Database Schema
-- Run: psql -U postgres -d atlas_db -f backend/db/axiom-migrations.sql

-- Axiom Controllers table (multi-controller support)
CREATE TABLE IF NOT EXISTS axiom_controllers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL,
    ssh_user VARCHAR(100) DEFAULT 'ubuntu',
    ssh_port INTEGER DEFAULT 22,
    ssh_key_path VARCHAR(500) DEFAULT '/app/keys/axiom_controller_key',
    provider VARCHAR(50) DEFAULT 'gcp',
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending',
    last_health_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Axiom Instances table
CREATE TABLE IF NOT EXISTS axiom_instances (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    instance_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    provider VARCHAR(50),
    region VARCHAR(100),
    public_ip VARCHAR(50),
    private_ip VARCHAR(50),
    instance_type VARCHAR(100),
    status VARCHAR(50),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    cost_per_hour DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(controller_id, instance_id)
);

-- Axiom Fleets table
CREATE TABLE IF NOT EXISTS axiom_fleets (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50),
    instance_type VARCHAR(100),
    instance_count INTEGER,
    regions TEXT[], -- Array of regions
    status VARCHAR(50) DEFAULT 'pending',
    preemptible BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Axiom Scans table
CREATE TABLE IF NOT EXISTS axiom_scans (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    fleet_id INTEGER REFERENCES axiom_fleets(id) ON DELETE SET NULL,
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

-- Axiom Files table
CREATE TABLE IF NOT EXISTS axiom_files (
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

-- Axiom Command Logs table
CREATE TABLE IF NOT EXISTS axiom_logs (
    id SERIAL PRIMARY KEY,
    controller_id INTEGER REFERENCES axiom_controllers(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    output TEXT,
    exit_code INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instances_controller ON axiom_instances(controller_id);
CREATE INDEX IF NOT EXISTS idx_fleets_controller ON axiom_fleets(controller_id);
CREATE INDEX IF NOT EXISTS idx_scans_controller ON axiom_scans(controller_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON axiom_scans(status);
CREATE INDEX IF NOT EXISTS idx_files_controller ON axiom_files(controller_id);
CREATE INDEX IF NOT EXISTS idx_logs_controller ON axiom_logs(controller_id);

-- Insert default controller (update with your actual values)
INSERT INTO axiom_controllers (name, host, ssh_user, provider, region, is_active, status)
VALUES ('default-gcp', '13.53.50.201', 'ubuntu', 'gcp', 'europe-north1', true, 'active')
ON CONFLICT (name) DO NOTHING;

COMMIT;