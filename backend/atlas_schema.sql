
-- Atlas Framework - Unified Security Research Platform Database Schema
-- Combines: VPN Management + Axiom Orchestration + Ars0n OSINT + Data Collection

-- ============================================================================
-- CORE INFRASTRUCTURE
-- ============================================================================

-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'researcher', -- admin, researcher, viewer
    api_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Cloud providers (AWS, GCP, DigitalOcean, Linode)
CREATE TABLE cloud_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'aws', 'gcp', 'digitalocean', 'linode'
    credentials_encrypted TEXT NOT NULL,
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VPN INFRASTRUCTURE
-- ============================================================================

-- WireGuard VPN nodes
CREATE TABLE vpn_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES cloud_providers(id) ON DELETE CASCADE,
    instance_id VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    country_code VARCHAR(2),
    lat DECIMAL(10, 7),
    lon DECIMAL(10, 7),
    public_ip INET,
    private_ip INET,
    wireguard_port INTEGER DEFAULT 51820,
    wireguard_public_key TEXT,
    wireguard_private_key_encrypted TEXT,
    config_data JSONB,
    qr_code TEXT,
    status VARCHAR(50), -- 'active', 'inactive', 'error'
    traffic_in_bytes BIGINT DEFAULT 0,
    traffic_out_bytes BIGINT DEFAULT 0,
    connected_clients INTEGER DEFAULT 0,
    cost_per_hour DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VPN client configurations
CREATE TABLE vpn_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vpn_node_id UUID REFERENCES vpn_nodes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(255),
    public_key TEXT,
    private_key_encrypted TEXT,
    assigned_ip INET,
    config_data TEXT,
    qr_code TEXT,
    last_handshake TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AXIOM FLEET MANAGEMENT
-- ============================================================================

-- Axiom fleets (groups of instances)
CREATE TABLE axiom_fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fleet_name VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50), -- 'aws', 'gcp', 'digitalocean'
    instance_type VARCHAR(100),
    instance_count INTEGER,
    regions TEXT[], -- Array of regions
    base_image VARCHAR(255),
    status VARCHAR(50), -- 'deploying', 'active', 'scaling', 'terminating'
    vpn_enabled BOOLEAN DEFAULT false,
    default_vpn_node_id UUID REFERENCES vpn_nodes(id),
    tags JSONB,
    cost_per_hour DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Axiom instances
CREATE TABLE axiom_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id UUID REFERENCES axiom_fleets(id) ON DELETE CASCADE,
    instance_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50),
    region VARCHAR(100),
    public_ip INET,
    private_ip INET,
    ssh_key_path TEXT,
    status VARCHAR(50), -- 'pending', 'running', 'stopped', 'terminated'
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_in BIGINT DEFAULT 0,
    network_out BIGINT DEFAULT 0,
    uptime_seconds INTEGER,
    vpn_node_id UUID REFERENCES vpn_nodes(id),
    last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ARS0N OSINT FRAMEWORK
-- ============================================================================

-- OSINT reconnaissance jobs
CREATE TABLE osint_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_name VARCHAR(255),
    target VARCHAR(255) NOT NULL, -- Domain, IP, or target identifier
    scan_type VARCHAR(50), -- 'subdomain', 'port', 'vuln', 'full'
    modules TEXT[], -- ['fire-starter', 'fire-scanner', 'nuclei', etc.]
    axiom_fleet_id UUID REFERENCES axiom_fleets(id),
    vpn_node_id UUID REFERENCES vpn_nodes(id),
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed'
    progress INTEGER DEFAULT 0,
    results JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OSINT findings (subdomains, endpoints, vulnerabilities)
CREATE TABLE osint_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES osint_jobs(id) ON DELETE CASCADE,
    finding_type VARCHAR(50), -- 'subdomain', 'endpoint', 'vulnerability', 'port'
    value TEXT,
    severity VARCHAR(20), -- 'info', 'low', 'medium', 'high', 'critical'
    metadata JSONB,
    verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DISTRIBUTED DATA COLLECTION
-- ============================================================================

-- Generic scraping/collection jobs
CREATE TABLE collection_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_name VARCHAR(255),
    job_type VARCHAR(100), -- 'web-scraping', 'api-collection', 'custom'
    target_list TEXT, -- CSV/JSON list of targets
    command TEXT, -- Command or script to execute
    axiom_fleet_id UUID REFERENCES axiom_fleets(id),
    vpn_rotation_enabled BOOLEAN DEFAULT false,
    distribution_strategy VARCHAR(50), -- 'round-robin', 'least-loaded', 'regional'
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    total_targets INTEGER,
    completed_targets INTEGER DEFAULT 0,
    failed_targets INTEGER DEFAULT 0,
    results_path TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection results
CREATE TABLE collection_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES collection_jobs(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES axiom_instances(id),
    target VARCHAR(500),
    status VARCHAR(50), -- 'success', 'failed', 'rate-limited'
    data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COST TRACKING & ANALYTICS
-- ============================================================================

-- Unified cost tracking
CREATE TABLE cost_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    provider VARCHAR(50), -- 'aws', 'gcp', 'digitalocean'
    service VARCHAR(100), -- 'vpn', 'axiom-fleet', 'cdn', 'storage'
    resource_id UUID, -- Reference to specific resource
    cost DECIMAL(10,4),
    currency VARCHAR(3) DEFAULT 'USD',
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily usage statistics
CREATE TABLE usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vpn_traffic_gb DECIMAL(10,2),
    axiom_instance_hours DECIMAL(10,2),
    osint_scans_count INTEGER,
    collection_jobs_count INTEGER,
    api_requests_count INTEGER,
    storage_gb DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- ============================================================================
-- WORKFLOW AUTOMATION
-- ============================================================================

-- Automated workflows
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255),
    description TEXT,
    trigger_type VARCHAR(50), -- 'scheduled', 'webhook', 'manual'
    trigger_config JSONB,
    actions JSONB, -- Array of actions to execute
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow execution logs
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(50), -- 'running', 'completed', 'failed'
    output JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================================================
-- AUDIT & SECURITY
-- ============================================================================

-- Comprehensive audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    response_status INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255),
    requests_count INTEGER,
    window_start TIMESTAMP,
    window_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_vpn_nodes_status ON vpn_nodes(status);
CREATE INDEX idx_vpn_nodes_region ON vpn_nodes(region);
CREATE INDEX idx_axiom_fleets_status ON axiom_fleets(status);
CREATE INDEX idx_axiom_instances_fleet ON axiom_instances(fleet_id);
CREATE INDEX idx_axiom_instances_status ON axiom_instances(status);
CREATE INDEX idx_osint_jobs_status ON osint_jobs(status);
CREATE INDEX idx_osint_jobs_user ON osint_jobs(user_id);
CREATE INDEX idx_osint_findings_job ON osint_findings(job_id);
CREATE INDEX idx_osint_findings_type ON osint_findings(finding_type);
CREATE INDEX idx_collection_jobs_status ON collection_jobs(status);
CREATE INDEX idx_collection_results_job ON collection_results(job_id);
CREATE INDEX idx_cost_records_date ON cost_records(date);
CREATE INDEX idx_cost_records_user ON cost_records(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Active infrastructure overview
CREATE VIEW v_infrastructure_overview AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT vn.id) as active_vpn_nodes,
    COUNT(DISTINCT af.id) as active_fleets,
    COUNT(DISTINCT ai.id) as running_instances,
    COUNT(DISTINCT oj.id) FILTER (WHERE oj.status = 'running') as active_osint_jobs,
    COUNT(DISTINCT cj.id) FILTER (WHERE cj.status IN ('pending', 'running')) as active_collection_jobs,
    SUM(vn.traffic_in_bytes + vn.traffic_out_bytes) as total_vpn_traffic,
    SUM(ai.network_in + ai.network_out) as total_axiom_traffic
FROM users u
LEFT JOIN vpn_nodes vn ON u.id = vn.provider_id AND vn.status = 'active'
LEFT JOIN axiom_fleets af ON u.id = af.user_id AND af.status = 'active'
LEFT JOIN axiom_instances ai ON af.id = ai.fleet_id AND ai.status = 'running'
LEFT JOIN osint_jobs oj ON u.id = oj.user_id
LEFT JOIN collection_jobs cj ON u.id = cj.user_id
GROUP BY u.id, u.email;

-- Daily cost summary
CREATE VIEW v_daily_costs AS
SELECT 
    user_id,
    date,
    SUM(CASE WHEN service = 'vpn' THEN cost ELSE 0 END) as vpn_cost,
    SUM(CASE WHEN service LIKE 'axiom%' THEN cost ELSE 0 END) as axiom_cost,
    SUM(CASE WHEN service = 'cdn' THEN cost ELSE 0 END) as cdn_cost,
    SUM(cost) as total_cost
FROM cost_records
GROUP BY user_id, date
ORDER BY date DESC;
