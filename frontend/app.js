// Atlas Framework - Ultimate Security Research Platform
const { useState, useEffect, useRef, createContext, useContext } = React;

// Atlas Framework Data from JSON
const atlasData = {
  vpnNodes: [
    {
      id: 'vpn-001',
      provider: 'AWS',
      region: 'us-east-1',
      regionName: 'Virginia, USA',
      countryCode: 'US',
      publicIp: '54.123.45.67',
      privateIp: '10.0.1.10',
      port: 51820,
      lat: 38.13,
      lon: -78.45,
      status: 'active',
      trafficIn: 15600000000,
      trafficOut: 8900000000,
      connectedClients: 3,
      costPerHour: 0.0104
    },
    {
      id: 'vpn-002',
      provider: 'GCP',
      region: 'europe-west1',
      regionName: 'Belgium',
      countryCode: 'BE',
      publicIp: '35.195.10.20',
      privateIp: '10.132.0.5',
      port: 51820,
      lat: 50.85,
      lon: 4.35,
      status: 'active',
      trafficIn: 8200000000,
      trafficOut: 5100000000,
      connectedClients: 2,
      costPerHour: 0.007
    },
    {
      id: 'vpn-003',
      provider: 'DigitalOcean',
      region: 'sgp1',
      regionName: 'Singapore',
      countryCode: 'SG',
      publicIp: '128.199.50.75',
      privateIp: '10.20.0.3',
      port: 51820,
      lat: 1.35,
      lon: 103.82,
      status: 'active',
      trafficIn: 12500000000,
      trafficOut: 7800000000,
      connectedClients: 5,
      costPerHour: 0.006
    },
    {
      id: 'vpn-004',
      provider: 'AWS',
      region: 'ap-northeast-1',
      regionName: 'Tokyo, JP',
      countryCode: 'JP',
      publicIp: '54.199.23.67',
      privateIp: '10.0.2.10',
      port: 51820,
      lat: 35.68,
      lon: 139.77,
      status: 'active',
      trafficIn: 18900000000,
      trafficOut: 11200000000,
      connectedClients: 4,
      costPerHour: 0.012
    },
    {
      id: 'vpn-005',
      provider: 'DigitalOcean',
      region: 'fra1',
      regionName: 'Frankfurt, DE',
      countryCode: 'DE',
      publicIp: '167.99.123.45',
      privateIp: '10.30.0.5',
      port: 51820,
      lat: 50.11,
      lon: 8.68,
      status: 'active',
      trafficIn: 9800000000,
      trafficOut: 6400000000,
      connectedClients: 2,
      costPerHour: 0.006
    }
  ],
  
  axiomFleets: [
    {
      id: 'fleet-001',
      name: 'recon-fleet-alpha',
      provider: 'AWS',
      instanceType: 'c5.xlarge',
      instanceCount: 8,
      regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      status: 'active',
      vpnEnabled: true,
      vpnNodeId: 'vpn-001',
      costPerHour: 1.36
    },
    {
      id: 'fleet-002',
      name: 'scan-fleet-beta',
      provider: 'GCP',
      instanceType: 'n2-standard-4',
      instanceCount: 5,
      regions: ['us-central1', 'asia-east1'],
      status: 'active',
      vpnEnabled: true,
      vpnNodeId: 'vpn-003',
      costPerHour: 0.95
    }
  ],
  
  axiomInstances: [
    {
      id: 'inst-001',
      fleetId: 'fleet-001',
      instanceId: 'i-0a1b2c3d4e5f6',
      provider: 'AWS',
      region: 'us-east-1',
      publicIp: '54.234.56.78',
      privateIp: '10.0.1.45',
      status: 'running',
      cpuUsage: 45.2,
      memoryUsage: 62.8,
      networkIn: 1250000000,
      networkOut: 890000000,
      uptime: 14400
    },
    {
      id: 'inst-002',
      fleetId: 'fleet-001',
      instanceId: 'i-9z8y7x6w5v4u3',
      provider: 'AWS',
      region: 'us-west-2',
      publicIp: '34.210.12.89',
      privateIp: '10.0.2.12',
      status: 'running',
      cpuUsage: 28.5,
      memoryUsage: 51.3,
      networkIn: 890000000,
      networkOut: 450000000,
      uptime: 12000
    }
  ],
  
  osintJobs: [
    {
      id: 'osint-001',
      jobName: 'HackerOne Recon',
      target: 'hackerone.com',
      scanType: 'full',
      modules: ['fire-starter', 'fire-scanner', 'nuclei'],
      axiomFleetId: 'fleet-001',
      vpnNodeId: 'vpn-001',
      status: 'running',
      progress: 67,
      startedAt: '2025-10-18T19:30:00Z'
    },
    {
      id: 'osint-002',
      jobName: 'Bugcrowd Subdomain Enum',
      target: 'bugcrowd.com',
      scanType: 'subdomain',
      modules: ['amass', 'subfinder', 'sublist3r'],
      axiomFleetId: 'fleet-002',
      vpnNodeId: 'vpn-003',
      status: 'running',
      progress: 23,
      startedAt: '2025-10-18T20:15:00Z'
    }
  ],
  
  osintFindings: [
    {
      id: 'finding-001',
      jobId: 'osint-001',
      type: 'subdomain',
      value: 'api.hackerone.com',
      severity: 'info',
      verified: true
    },
    {
      id: 'finding-002',
      jobId: 'osint-001',
      type: 'vulnerability',
      value: 'XSS in /search endpoint',
      severity: 'high',
      verified: false
    },
    {
      id: 'finding-003',
      jobId: 'osint-002',
      type: 'subdomain',
      value: 'admin.bugcrowd.com',
      severity: 'info',
      verified: true
    }
  ],
  
  collectionJobs: [
    {
      id: 'coll-001',
      jobName: 'Market Research Data',
      jobType: 'web-scraping',
      axiomFleetId: 'fleet-001',
      status: 'running',
      progress: 78,
      totalTargets: 10000,
      completedTargets: 7800,
      failedTargets: 45,
      startedAt: '2025-10-18T18:00:00Z'
    },
    {
      id: 'coll-002',
      jobName: 'API Data Collection',
      jobType: 'api-collection',
      axiomFleetId: 'fleet-002',
      status: 'pending',
      progress: 0,
      totalTargets: 5000,
      completedTargets: 0,
      failedTargets: 0
    }
  ],
  
  costData: [
    { date: '2025-10-01', aws: 145.23, gcp: 89.45, digitalocean: 24.50 },
    { date: '2025-10-05', aws: 156.78, gcp: 92.10, digitalocean: 26.00 },
    { date: '2025-10-10', aws: 178.90, gcp: 105.60, digitalocean: 30.25 },
    { date: '2025-10-15', aws: 198.45, gcp: 115.20, digitalocean: 32.80 },
    { date: '2025-10-18', aws: 212.30, gcp: 125.80, digitalocean: 35.60 }
  ]
};

// === API DATA LOADING ===
if (!sessionStorage.getItem('vpn_data_loaded')) {
  fetch('http://localhost:5000/api/vpn/nodes')
    .then(r => r.json())
    .then(nodes => {
      console.log('✅ Loaded', nodes.length, 'VPN nodes from API');
      atlasData.vpnNodes = nodes;
      sessionStorage.setItem('vpn_data_loaded', 'true');
      location.reload();
    })
    .catch(err => console.error('❌ Failed to load VPN nodes:', err));
  console.log('🔄 Fetching VPN data from API...');
} else {
  console.log('✅ Using cached VPN data (5 nodes)');
}
// === END API LOADING ===
// Legacy instances data for compatibility
const sampleInstances = [
  {
    id: "i-0a1b2c3d4e5f6",
    provider: "AWS",
    type: "c5.2xlarge",
    region: "us-east-1",
    regionName: "US East (Virginia)",
    status: "running",
    publicIp: "54.123.45.67",
    privateIp: "10.0.1.45",
    cpuUsage: 45.2,
    memoryUsage: 62.8,
    networkIn: 1250000,
    networkOut: 890000,
    costPerHour: 0.34,
    lat: 38.13,
    lon: -78.45
  },
  {
    id: "i-9z8y7x6w5v4u3",
    provider: "AWS",
    type: "c5.xlarge",
    region: "us-west-2",
    regionName: "US West (Oregon)",
    status: "running",
    publicIp: "34.210.12.89",
    privateIp: "10.0.2.12",
    cpuUsage: 28.5,
    memoryUsage: 51.3,
    networkIn: 890000,
    networkOut: 450000,
    costPerHour: 0.17,
    lat: 45.87,
    lon: -119.69
  },
  {
    id: "gcp-inst-abc123",
    provider: "GCP",
    type: "n2-standard-4",
    region: "us-central1",
    regionName: "US Central (Iowa)",
    status: "running",
    publicIp: "35.192.45.120",
    privateIp: "10.128.0.5",
    cpuUsage: 67.9,
    memoryUsage: 73.1,
    networkIn: 2100000,
    networkOut: 1800000,
    costPerHour: 0.19,
    lat: 41.26,
    lon: -95.86
  },
  {
    id: "i-7f8g9h0i1j2k3",
    provider: "AWS",
    type: "t3.medium",
    region: "eu-west-1",
    regionName: "EU West (Ireland)",
    status: "stopped",
    publicIp: "52.210.45.123",
    privateIp: "10.0.3.78",
    cpuUsage: 0,
    memoryUsage: 0,
    networkIn: 0,
    networkOut: 0,
    costPerHour: 0.0416,
    lat: 53.35,
    lon: -6.26
  },
  {
    id: "gcp-inst-def456",
    provider: "GCP",
    type: "n1-standard-2",
    region: "europe-west1",
    regionName: "Europe West (Belgium)",
    status: "running",
    publicIp: "35.195.123.89",
    privateIp: "10.132.0.8",
    cpuUsage: 34.7,
    memoryUsage: 58.2,
    networkIn: 567000,
    networkOut: 234000,
    costPerHour: 0.095,
    lat: 50.85,
    lon: 4.35
  },
  {
    id: "i-4l5m6n7o8p9q0",
    provider: "AWS",
    type: "m5.large",
    region: "ap-southeast-1",
    regionName: "Asia Pacific (Singapore)",
    status: "running",
    publicIp: "13.250.89.156",
    privateIp: "10.0.4.23",
    cpuUsage: 52.3,
    memoryUsage: 47.8,
    networkIn: 1890000,
    networkOut: 1234000,
    costPerHour: 0.096,
    lat: 1.35,
    lon: 103.82
  }]

const cloudRegions = {
  aws: [
    { code: "us-east-1", name: "US East (Virginia)", lat: 38.13, lon: -78.45 },
    { code: "us-west-2", name: "US West (Oregon)", lat: 45.87, lon: -119.69 },
    { code: "eu-west-1", name: "EU West (Ireland)", lat: 53.35, lon: -6.26 },
    { code: "ap-southeast-1", name: "Asia Pacific (Singapore)", lat: 1.35, lon: 103.82 },
    { code: "ap-northeast-1", name: "Asia Pacific (Tokyo)", lat: 35.68, lon: 139.77 }
  ],
  gcp: [
    { code: "us-central1", name: "US Central (Iowa)", lat: 41.26, lon: -95.86 },
    { code: "europe-west1", name: "Europe West (Belgium)", lat: 50.85, lon: 4.35 },
    { code: "asia-east1", name: "Asia East (Taiwan)", lat: 25.03, lon: 121.56 },
    { code: "australia-southeast1", name: "Australia Southeast (Sydney)", lat: -33.87, lon: 151.21 }
  ]
};

// Convert Atlas data to legacy format for compatibility
const vpnConfigs = atlasData.vpnNodes.map(node => ({
  id: node.id,
  instanceId: node.id,
  type: 'wireguard',
  endpoint: `${node.publicIp}:${node.port}`,
  publicKey: `${node.id}Key123aBc456dEf789gHi012jKl345mNo678pQr901sTu234=`,
  status: node.status,
  uploadBytes: node.trafficOut,
  downloadBytes: node.trafficIn
}));

// Convert collection jobs to workloads format
const workloads = atlasData.collectionJobs.map(job => ({
  id: job.id,
  name: job.jobName,
  type: job.jobType,
  status: job.status,
  progress: job.progress,
  instanceCount: job.axiomFleetId ? atlasData.axiomFleets.find(f => f.id === job.axiomFleetId)?.instanceCount || 1 : 1,
  totalTargets: job.totalTargets,
  completedTargets: job.completedTargets,
  startTime: job.startedAt
}));

// Context for global state
const AppContext = createContext();

// Auth Context
const AuthContext = createContext();

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Auth Provider
function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session token in memory (simulated)
    // Note: In production, this would check a secure session
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
// Call backend API
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('atlas_token', data.token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Connection error' };
    }
  };

  const logout = () => {
    // Clear session (in production, would clear secure session)
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Atlas App Provider
function AppProvider({ children }) {
  // Atlas data state
  const [vpnNodes, setVpnNodes] = useState(atlasData.vpnNodes);
  const [axiomFleets, setAxiomFleets] = useState(atlasData.axiomFleets);
  const [axiomInstances, setAxiomInstances] = useState(atlasData.axiomInstances);
  const [osintJobs, setOsintJobs] = useState(atlasData.osintJobs);
  const [osintFindings, setOsintFindings] = useState(atlasData.osintFindings);
  const [collectionJobs, setCollectionJobs] = useState(atlasData.collectionJobs);
  const [costData, setCostData] = useState(atlasData.costData);
  
  // Legacy compatibility
  const [instances, setInstances] = useState(sampleInstances);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedInstances, setSelectedInstances] = useState([]);
  const [workloadList, setWorkloadList] = useState(workloads);
  const [vpnList, setVpnList] = useState(vpnConfigs);

  // Simulate real-time updates for Atlas components
  useEffect(() => {
    const interval = setInterval(() => {
      // Update OSINT job progress
      setOsintJobs(prev => prev.map(job => job.status === 'running' ? {
        ...job,
        progress: Math.min(95, job.progress + Math.random() * 2)
      } : job));
      
      // Update collection job progress  
      setCollectionJobs(prev => prev.map(job => job.status === 'running' ? {
        ...job,
        progress: Math.min(95, job.progress + Math.random() * 1.5),
        completedTargets: Math.min(job.totalTargets, Math.floor(job.totalTargets * job.progress / 100))
      } : job));
      
      // Update Axiom instances metrics
      setAxiomInstances(prev => prev.map(instance => ({
        ...instance,
        cpuUsage: Math.max(10, Math.min(90, instance.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(85, instance.memoryUsage + (Math.random() - 0.5) * 8)),
        networkIn: Math.max(100000, instance.networkIn + Math.random() * 200000 - 100000),
        networkOut: Math.max(50000, instance.networkOut + Math.random() * 150000 - 75000)
      })));
      
      // Legacy instance updates
      setInstances(prev => prev.map(instance => ({
        ...instance,
        cpuUsage: Math.max(10, Math.min(90, instance.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(85, instance.memoryUsage + (Math.random() - 0.5) * 8)),
        networkIn: Math.max(100000, instance.networkIn + Math.random() * 200000 - 100000),
        networkOut: Math.max(50000, instance.networkOut + Math.random() * 150000 - 75000)
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{
      // Atlas data
      vpnNodes,
      setVpnNodes,
      axiomFleets,
      setAxiomFleets,
      axiomInstances,
      setAxiomInstances,
      osintJobs,
      setOsintJobs,
      osintFindings,
      setOsintFindings,
      collectionJobs,
      setCollectionJobs,
      costData,
      setCostData,
      
      // Legacy compatibility
      instances,
      setInstances,
      currentPage,
      setCurrentPage,
      selectedInstances,
      setSelectedInstances,
      workloadList,
      setWorkloadList,
      vpnList,
      setVpnList
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Login Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      showToast('Login successful!', 'success');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">🎯 Atlas Framework</h1>
          <p className="login-subtitle">Ultimate Security Research Platform</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cloud.dev"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>
          
          {error && (
            <div className="form-group">
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)' }}>
                {error}
              </p>
            </div>
          )}
          
          <div className="form-group">
            <div className="form-checkbox">
              <input type="checkbox" className="checkbox" />
              <label className="checkbox-label">Remember me</label>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-16 text-sm text-muted" style={{ textAlign: 'center' }}>
          Demo credentials: admin@cloud.dev / password
        </div>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar() {
  const { currentPage, setCurrentPage } = useContext(AppContext);
  const { logout } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'vpn', name: 'VPN', icon: '🔒' },
    { id: 'axiom', name: 'Axiom', icon: '☁️' },
    { id: 'ars0n', name: 'Ars0n', icon: '🔍' },
    { id: 'collections', name: 'Collections', icon: '🗂️' },
    { id: 'analytics', name: 'Analytics', icon: '💰' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span>☁️</span>
          <span>Cloud Orchestrator</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <a
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.name}</span>
          </a>
        ))}
        
        <div style={{ marginTop: 'auto' }}>
          <a className="nav-item" onClick={handleLogout}>
            <span className="nav-item-icon">🚪</span>
            <span>Logout</span>
          </a>
        </div>
      </nav>
    </div>
  );
}

// Header Component
function Header({ title }) {
  return (
    <div className="main-header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <div className="text-sm text-muted">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Atlas Dashboard Component
function Dashboard() {
  const { vpnNodes, axiomFleets, osintJobs, collectionJobs } = useContext(AppContext);
  
  const activeVpns = vpnNodes.filter(v => v.status === 'active').length;
  const runningInstances = axiomFleets.reduce((sum, fleet) => sum + (fleet.status === 'active' ? fleet.instanceCount : 0), 0);
  const activeOsintJobs = osintJobs.filter(j => j.status === 'running').length;
  const collectionProgress = collectionJobs.reduce((sum, job) => sum + job.progress, 0) / collectionJobs.length || 0;

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card" style={{borderLeft: '4px solid var(--color-vpn-green)'}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value" style={{color: 'var(--color-vpn-green)'}}>{activeVpns}</div>
              <div className="metric-label">Active VPN Nodes</div>
              <div className="metric-change">🟢 All operational</div>
            </div>
            <div style={{fontSize: '2rem'}}>🔒</div>
          </div>
        </div>
        
        <div className="metric-card" style={{borderLeft: '4px solid var(--color-axiom-blue)'}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value" style={{color: 'var(--color-axiom-blue)'}}>{runningInstances}</div>
              <div className="metric-label">Running Axiom Instances</div>
              <div className="metric-change positive">+3 from yesterday</div>
            </div>
            <div style={{fontSize: '2rem'}}>☁️</div>
          </div>
        </div>
        
        <div className="metric-card" style={{borderLeft: '4px solid var(--color-ars0n-orange)'}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value" style={{color: 'var(--color-ars0n-orange)'}}>{activeOsintJobs}</div>
              <div className="metric-label">OSINT Jobs Active</div>
              <div className="metric-change positive">+1 new scan</div>
            </div>
            <div style={{fontSize: '2rem'}}>🔍</div>
          </div>
        </div>
        
        <div className="metric-card" style={{borderLeft: '4px solid var(--color-collection-purple)'}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-value" style={{color: 'var(--color-collection-purple)'}}>{collectionProgress.toFixed(0)}%</div>
              <div className="metric-label">Collection Progress</div>
              <div className="metric-change positive">Overall completion</div>
            </div>
            <div style={{fontSize: '2rem'}}>📥</div>
          </div>
        </div>
      </div>
      
      {/* Atlas Interactive Map */}
      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">🌍 Atlas Global Infrastructure</h3>
          <p className="text-muted text-sm">Real-time view of your security research infrastructure</p>
        </div>
        <div className="card-body">
          <AtlasWorldMap />
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-12">
            <div className="flex items-center gap-12">
              <span className="status-badge running">Axiom</span>
              <span>Fleet 'recon-fleet-alpha' deployed 8 instances across 3 regions</span>
              <span className="text-muted text-sm">5 minutes ago</span>
            </div>
            <div className="flex items-center gap-12">
              <span className="status-badge" style={{background: 'var(--color-bg-3)', color: 'var(--color-ars0n-orange)'}}>Ars0n</span>
              <span>OSINT scan on hackerone.com found 15 new subdomains</span>
              <span className="text-muted text-sm">12 minutes ago</span>
            </div>
            <div className="flex items-center gap-12">
              <span className="status-badge" style={{background: 'var(--color-bg-1)', color: 'var(--color-vpn-green)'}}>VPN</span>
              <span>WireGuard node vpn-003 handling 5 concurrent connections</span>
              <span className="text-muted text-sm">18 minutes ago</span>
            </div>
            <div className="flex items-center gap-12">
              <span className="status-badge" style={{background: 'var(--color-bg-5)', color: 'var(--color-collection-purple)'}}>Collection</span>
              <span>Market Research Data: 7,800/10,000 targets completed (78%)</span>
              <span className="text-muted text-sm">25 minutes ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// Deploy VPN Modal
function DeployVpnModal({ onClose, onDeploy }) {
  const [config, setConfig] = useState({
    provider: 'aws',
    region: 'us-east-1',
    instanceType: 't3.micro'
  });

  {showDeployModal && (
        <DeployVpnModal 
          onClose={() => setShowDeployModal(false)}
          onDeploy={handleDeployVpn}
        />
      )}

  const regions = {
    aws: cloudRegions.aws,
    gcp: cloudRegions.gcp,
    digitalocean: [{ code: 'nyc1', name: 'New York' }, { code: 'sgp1', name: 'Singapore' }]
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeploy(config);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">🔒 Deploy VPN Node</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select 
                className="form-input"
                value={config.provider}
                onChange={(e) => setConfig({...config, provider: e.target.value})}
              >
                <option value="aws">Amazon Web Services</option>
                <option value="gcp">Google Cloud Platform</option>
                <option value="digitalocean">DigitalOcean</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Region</label>
              <select 
                className="form-input"
                value={config.region}
                onChange={(e) => setConfig({...config, region: e.target.value})}
              >
                {regions[config.provider]?.map(region => (
                  <option key={region.code} value={region.code}>{region.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Instance Type</label>
              <select 
                className="form-input"
                value={config.instanceType}
                onChange={(e) => setConfig({...config, instanceType: e.target.value})}
              >
                <option value="t3.micro">t3.micro ($0.0104/hr)</option>
                <option value="t3.small">t3.small ($0.0208/hr)</option>
                <option value="t3.medium">t3.medium ($0.0416/hr)</option>
              </select>
            </div>
            
            <div className="card" style={{background: 'var(--color-bg-3)', border: 'none'}}>
              <div className="card-body">
                <h4>💰 Estimated Cost</h4>
                <p>$0.75/day • $22.50/month</p>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              🚀 Deploy VPN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Atlas World Map Component
function AtlasWorldMap() {
  const { vpnNodes, axiomFleets, osintJobs, collectionJobs } = useContext(AppContext);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current, {
      center: [30, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 18
    }).addTo(map);

    leafletMapRef.current = map;

    // Add VPN node markers
    vpnNodes.forEach(node => {
      const markerHtml = `
        <div class="custom-marker vpn ${node.status === 'active' ? 'active' : ''}">
          🔒
        </div>
      `;
      
      const marker = L.marker([node.lat, node.lon], {
        icon: L.divIcon({
          html: markerHtml,
          className: 'custom-div-icon',
          iconSize: [35, 35],
          iconAnchor: [17, 17]
        })
      }).addTo(map);
      
      const popupContent = `
        <div style="color: var(--color-text); padding: 12px; min-width: 200px;">
          <h4>🔒 VPN Node</h4>
          <p><strong>Region:</strong> ${node.regionName}</p>
          <p><strong>Provider:</strong> ${node.provider}</p>
          <p><strong>IP:</strong> ${node.publicIp}</p>
          <p><strong>Clients:</strong> ${node.connectedClients}</p>
          <p><strong>Status:</strong> <span style="color: var(--color-vpn-green)">${node.status}</span></p>
          <p><strong>Traffic:</strong> ↑${(node.trafficOut/1024/1024/1024).toFixed(1)}GB ↓${(node.trafficIn/1024/1024/1024).toFixed(1)}GB</p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
    });

    // Add Axiom fleet markers
    axiomFleets.forEach(fleet => {
      fleet.regions.forEach(regionCode => {
        // Find region coordinates
        const region = [...cloudRegions.aws, ...cloudRegions.gcp].find(r => r.code === regionCode);
        if (!region) return;
        
        const markerHtml = `
          <div class="custom-marker axiom ${fleet.status === 'active' ? 'active' : ''}">
            ☁️
          </div>
        `;
        
        const marker = L.marker([region.lat + Math.random() * 0.5 - 0.25, region.lon + Math.random() * 0.5 - 0.25], {
          icon: L.divIcon({
            html: markerHtml,
            className: 'custom-div-icon',
            iconSize: [35, 35],
            iconAnchor: [17, 17]
          })
        }).addTo(map);
        
        const popupContent = `
          <div style="color: var(--color-text); padding: 12px; min-width: 200px;">
            <h4>☁️ Axiom Fleet</h4>
            <p><strong>Fleet:</strong> ${fleet.name}</p>
            <p><strong>Provider:</strong> ${fleet.provider}</p>
            <p><strong>Region:</strong> ${region.name}</p>
            <p><strong>Instances:</strong> ${fleet.instanceCount}</p>
            <p><strong>Type:</strong> ${fleet.instanceType}</p>
            <p><strong>VPN:</strong> ${fleet.vpnEnabled ? '🟢 Enabled' : '🔴 Disabled'}</p>
            <p><strong>Cost:</strong> $${fleet.costPerHour}/hr</p>
          </div>
        `;
        
        marker.bindPopup(popupContent);
      });
    });

    // Add OSINT job target markers
    osintJobs.forEach((job, index) => {
      const lat = 40 + Math.random() * 20; // Random positions for demo
      const lon = -100 + Math.random() * 180;
      
      const markerHtml = `
        <div class="custom-marker ars0n ${job.status === 'running' ? 'active' : ''}">
          🎯
        </div>
      `;
      
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          html: markerHtml,
          className: 'custom-div-icon',
          iconSize: [35, 35],
          iconAnchor: [17, 17]
        })
      }).addTo(map);
      
      const popupContent = `
        <div style="color: var(--color-text); padding: 12px; min-width: 200px;">
          <h4>🎯 OSINT Target</h4>
          <p><strong>Job:</strong> ${job.jobName}</p>
          <p><strong>Target:</strong> ${job.target}</p>
          <p><strong>Type:</strong> ${job.scanType}</p>
          <p><strong>Progress:</strong> ${job.progress}%</p>
          <p><strong>Fleet:</strong> ${job.axiomFleetId}</p>
          <p><strong>Modules:</strong> ${job.modules.join(', ')}</p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
    });

    // Add collection job markers
    collectionJobs.forEach((job, index) => {
      const lat = 20 + Math.random() * 30;
      const lon = -50 + Math.random() * 100;
      
      const markerHtml = `
        <div class="custom-marker collection ${job.status === 'running' ? 'active' : ''}">
          📊
        </div>
      `;
      
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          html: markerHtml,
          className: 'custom-div-icon',
          iconSize: [35, 35],
          iconAnchor: [17, 17]
        })
      }).addTo(map);
      
      const popupContent = `
        <div style="color: var(--color-text); padding: 12px; min-width: 200px;">
          <h4>📊 Collection Job</h4>
          <p><strong>Job:</strong> ${job.jobName}</p>
          <p><strong>Type:</strong> ${job.jobType}</p>
          <p><strong>Progress:</strong> ${job.progress}%</p>
          <p><strong>Targets:</strong> ${job.completedTargets}/${job.totalTargets}</p>
          <p><strong>Fleet:</strong> ${job.axiomFleetId}</p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [vpnNodes, axiomFleets, osintJobs, collectionJobs]);

  return (
    <div>
      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">Atlas Global Infrastructure Map</h3>
          <p className="text-muted text-sm">Interactive view of VPN nodes, Axiom fleets, OSINT targets and data collection jobs</p>
        </div>
        <div className="card-body">
          <div className="map-container">
            <div ref={mapRef} id="map"></div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Atlas Legend</h3>
        </div>
        <div className="card-body">
          <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-8">
              <div className="custom-marker vpn">🔒</div>
              <span>VPN Nodes ({vpnNodes.length})</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="custom-marker axiom">☁️</div>
              <span>Axiom Fleets ({axiomFleets.length})</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="custom-marker ars0n">🎯</div>
              <span>OSINT Targets ({osintJobs.length})</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="custom-marker collection">📊</div>
              <span>Collection Jobs ({collectionJobs.length})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fleet Manager Component
function FleetManager() {
  const { instances, setInstances, selectedInstances, setSelectedInstances } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const handleInstanceAction = (instanceId, action) => {
    setInstances(prev => prev.map(instance => 
      instance.id === instanceId 
        ? { ...instance, status: action === 'start' ? 'running' : 'stopped' }
        : instance
    ));
    showToast(`Instance ${instanceId} ${action}ed successfully`, 'success');
  };

  const handleSelectInstance = (instanceId) => {
    setSelectedInstances(prev => 
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>Fleet Manager</h2>
          <p className="text-muted">Manage your cloud instances across providers</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowDeployModal(true)}
        >
          Deploy New Fleet
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Instance Overview ({instances.length} total)</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedInstances(
                      e.target.checked ? instances.map(i => i.id) : []
                    )}
                  />
                </th>
                <th>Instance ID</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Region</th>
                <th>Status</th>
                <th>Public IP</th>
                <th>CPU %</th>
                <th>Memory %</th>
                <th>Cost/hr</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.map(instance => (
                <tr key={instance.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedInstances.includes(instance.id)}
                      onChange={() => handleSelectInstance(instance.id)}
                    />
                  </td>
                  <td className="font-medium">{instance.id}</td>
                  <td>
                    <span className={`status-badge ${instance.provider.toLowerCase()}`}>
                      {instance.provider}
                    </span>
                  </td>
                  <td>{instance.type}</td>
                  <td>{instance.region}</td>
                  <td>
                    <span className={`status-badge ${instance.status}`}>
                      {instance.status}
                    </span>
                  </td>
                  <td className="font-mono text-sm">{instance.publicIp}</td>
                  <td>{instance.status === 'running' ? `${instance.cpuUsage.toFixed(1)}%` : '-'}</td>
                  <td>{instance.status === 'running' ? `${instance.memoryUsage.toFixed(1)}%` : '-'}</td>
                  <td>${instance.costPerHour}</td>
                  <td>
                    <div className="flex gap-4">
                      {instance.status === 'running' ? (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleInstanceAction(instance.id, 'stop')}
                        >
                          Stop
                        </button>
                      ) : (
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleInstanceAction(instance.id, 'start')}
                        >
                          Start
                        </button>
                      )}
                      <button className="btn btn-sm btn-secondary">
                        SSH
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {showDeployModal && (
        <DeployModal 
          onClose={() => setShowDeployModal(false)}
          onDeploy={(config) => {
            showToast(`Deploying ${config.quantity} instances in ${config.region}`, 'success');
            setShowDeployModal(false);
          }}
        />
      )}
    </div>
  );
}

// Deploy Modal Component
function DeployModal({ onClose, onDeploy }) {
  const [config, setConfig] = useState({
    provider: 'aws',
    instanceType: 'c5.large',
    region: 'us-east-1',
    quantity: 1
  });

  const instanceTypes = {
    aws: ['t3.micro', 't3.small', 't3.medium', 'c5.large', 'c5.xlarge', 'c5.2xlarge'],
    gcp: ['n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'n2-standard-2', 'n2-standard-4']
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeploy(config);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Deploy New Fleet</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Cloud Provider</label>
              <select 
                className="form-input"
                value={config.provider}
                onChange={(e) => setConfig({...config, provider: e.target.value})}
              >
                <option value="aws">Amazon Web Services</option>
                <option value="gcp">Google Cloud Platform</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Instance Type</label>
              <select 
                className="form-input"
                value={config.instanceType}
                onChange={(e) => setConfig({...config, instanceType: e.target.value})}
              >
                {instanceTypes[config.provider].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Region</label>
              <select 
                className="form-input"
                value={config.region}
                onChange={(e) => setConfig({...config, region: e.target.value})}
              >
                {cloudRegions[config.provider].map(region => (
                  <option key={region.code} value={region.code}>{region.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Quantity ({config.quantity})</label>
              <input 
                type="range"
                min="1"
                max="10"
                value={config.quantity}
                onChange={(e) => setConfig({...config, quantity: parseInt(e.target.value)})}
                className="form-input"
              />
            </div>
            
            <div className="card" style={{background: 'var(--color-bg-2)', border: 'none'}}>
              <div className="card-body">
                <h4>Estimated Cost</h4>
                <p>~${(config.quantity * 0.096 * 24).toFixed(2)} per day</p>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Deploy Fleet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Atlas VPN Dashboard Component
function VpnDashboard() {
  const { vpnNodes } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const generateConfig = (node) => {
    return `[Interface]
PrivateKey = YOUR_PRIVATE_KEY_HERE
Address = 10.0.0.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ${node.id}Key123aBc456dEf789gHi012jKl345mNo678pQr901sTu234=
Endpoint = ${node.publicIp}:${node.port}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Configuration copied to clipboard', 'success');
  };

  const downloadConfig = (node) => {
    const config = generateConfig(node);
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wireguard-${node.id}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Configuration downloaded', 'success');
  };
  
  const handleDeployVpn = (config) => {
    showToast(`Deploying VPN node in ${config.region}`, 'success');
    setShowDeployModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>🔒 VPN Infrastructure</h2>
          <p className="text-muted">WireGuard VPN nodes for secure research operations</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowDeployModal(true)}
        >
          🚀 Deploy New VPN
        </button>
      </div>
      
      <div className="metrics-grid mb-24">
        <div className="metric-card">
          <div className="metric-value" style={{color: 'var(--color-vpn-green)'}}>{vpnNodes.filter(n => n.status === 'active').length}</div>
          <div className="metric-label">Active VPN Nodes</div>
          <div className="metric-change">🟢 All operational</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{vpnNodes.reduce((sum, node) => sum + node.connectedClients, 0)}</div>
          <div className="metric-label">Connected Clients</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{(vpnNodes.reduce((sum, node) => sum + node.trafficIn + node.trafficOut, 0) / 1024 / 1024 / 1024).toFixed(1)}</div>
          <div className="metric-label">Total Traffic (GB)</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${(vpnNodes.reduce((sum, node) => sum + node.costPerHour, 0) * 24 * 30).toFixed(0)}</div>
          <div className="metric-label">Monthly Cost</div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">VPN Configurations</h3>
        </div>
        <div className="card-body">
          <div className="atlas-grid">
            {vpnNodes.map(node => (
              <div key={node.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="flex items-center gap-12 mb-8">
                        <h4>🔒 {node.regionName}</h4>
                        <span className={`status-badge ${node.status}`}>{node.status}</span>
                      </div>
                      <div className="flex items-center gap-8 mb-4">
                        <span className={`status-badge ${node.provider.toLowerCase()}`}>{node.provider}</span>
                        <span className="text-muted text-sm">{node.countryCode}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted">Cost/hr</div>
                      <div className="font-semibold">${node.costPerHour}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-12 text-sm">
                    <div>
                      <span className="text-muted">Endpoint:</span>
                      <div className="font-mono">{node.publicIp}:{node.port}</div>
                    </div>
                    <div>
                      <span className="text-muted">Clients:</span>
                      <div>{node.connectedClients} connected</div>
                    </div>
                    <div>
                      <span className="text-muted">Traffic In:</span>
                      <div>{(node.trafficIn / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                    </div>
                    <div>
                      <span className="text-muted">Traffic Out:</span>
                      <div>{(node.trafficOut / 1024 / 1024 / 1024).toFixed(2)} GB</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => copyToClipboard(generateConfig(node))}
                    >
                      📋 Copy Config
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => downloadConfig(node)}
                    >
                      📥 Download
                    </button>
                    <button className="btn btn-sm btn-secondary">
                      📱 QR Code
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Workload Scheduler Component
function WorkloadScheduler() {
  const { workloadList } = useContext(AppContext);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>Workload Scheduler</h2>
          <p className="text-muted">Manage distributed workloads across your fleet</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create Workload
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Active Workloads</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-16">
            {workloadList.map(workload => (
              <div key={workload.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h4>{workload.name}</h4>
                      <p className="text-muted text-sm">
                        {workload.instanceCount} instances • Started {new Date(workload.startTime).toLocaleString()}
                      </p>
                    </div>
                    <span className={`status-badge ${workload.status}`}>
                      {workload.status}
                    </span>
                  </div>
                  
                  <div className="mb-12">
                    <div className="flex justify-between text-sm mb-4">
                      <span>Progress</span>
                      <span>{workload.completedTargets.toLocaleString()} / {workload.totalTargets.toLocaleString()} ({workload.progress}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${workload.progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8">
                    <button className="btn btn-sm btn-secondary">
                      View Details
                    </button>
                    <button className="btn btn-sm btn-danger">
                      Stop
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showCreateModal && (
        <CreateWorkloadModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// New OSINT Scan Modal
function NewScanModal({ onClose, onStart, axiomFleets, vpnNodes }) {
  const [scanConfig, setScanConfig] = useState({
    target: '',
    scanType: 'subdomain',
    modules: ['amass', 'subfinder'],
    axiomFleet: '',
    vpnNode: '',
    useAxiom: true,
    useVpn: true
  });

  const scanTypes = {
    'subdomain': { name: 'Subdomain Enumeration', modules: ['amass', 'subfinder', 'sublist3r'] },
    'port': { name: 'Port Scanning', modules: ['nmap', 'masscan', 'naabu'] },
    'vuln': { name: 'Vulnerability Scan', modules: ['nuclei', 'nmap', 'nikto'] },
    'full': { name: 'Full Reconnaissance', modules: ['amass', 'subfinder', 'nmap', 'nuclei', 'waybackurls'] }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(scanConfig);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth: '600px'}}>
        <div className="modal-header">
          <h3 className="modal-title">🔍 New OSINT Scan</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Target Domain/IP</label>
              <input 
                type="text"
                className="form-input"
                value={scanConfig.target}
                onChange={(e) => setScanConfig({...scanConfig, target: e.target.value})}
                placeholder="example.com or 192.168.1.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Scan Type</label>
              <select 
                className="form-input"
                value={scanConfig.scanType}
                onChange={(e) => setScanConfig({...scanConfig, scanType: e.target.value, modules: scanTypes[e.target.value].modules})}
              >
                {Object.entries(scanTypes).map(([key, type]) => (
                  <option key={key} value={key}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <div className="form-checkbox mb-16">
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={scanConfig.useAxiom}
                  onChange={(e) => setScanConfig({...scanConfig, useAxiom: e.target.checked})}
                />
                <label className="checkbox-label">Use Axiom Fleet</label>
              </div>
              {scanConfig.useAxiom && (
                <select 
                  className="form-input"
                  value={scanConfig.axiomFleet}
                  onChange={(e) => setScanConfig({...scanConfig, axiomFleet: e.target.value})}
                >
                  <option value="">Select Fleet</option>
                  {axiomFleets.map(fleet => (
                    <option key={fleet.id} value={fleet.id}>{fleet.name} ({fleet.instanceCount} instances)</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="form-group">
              <div className="form-checkbox mb-16">
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={scanConfig.useVpn}
                  onChange={(e) => setScanConfig({...scanConfig, useVpn: e.target.checked})}
                />
                <label className="checkbox-label">Route through VPN</label>
              </div>
              {scanConfig.useVpn && (
                <select 
                  className="form-input"
                  value={scanConfig.vpnNode}
                  onChange={(e) => setScanConfig({...scanConfig, vpnNode: e.target.value})}
                >
                  <option value="">Select VPN Node</option>
                  {vpnNodes.map(node => (
                    <option key={node.id} value={node.id}>{node.regionName} ({node.publicIp})</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Modules</label>
              <div className="flex gap-8" style={{flexWrap: 'wrap'}}>
                {scanConfig.modules.map(module => (
                  <span key={module} className="scan-type-badge subdomain">{module}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              🚀 Start Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Collection Job Modal
function CreateCollectionJobModal({ onClose, axiomFleets }) {
  const [jobConfig, setJobConfig] = useState({
    name: '',
    type: 'web-scraping',
    targets: '',
    axiomFleet: '',
    rateLimit: 10,
    delay: 1000
  });
  const { showToast } = useContext(ToastContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Collection job "${jobConfig.name}" created successfully`, 'success');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth: '600px'}}>
        <div className="modal-header">
          <h3 className="modal-title">📊 Create Collection Job</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Job Name</label>
              <input 
                type="text"
                className="form-input"
                value={jobConfig.name}
                onChange={(e) => setJobConfig({...jobConfig, name: e.target.value})}
                placeholder="Social Media Data Collection"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Job Type</label>
              <select 
                className="form-input"
                value={jobConfig.type}
                onChange={(e) => setJobConfig({...jobConfig, type: e.target.value})}
              >
                <option value="web-scraping">Web Scraping</option>
                <option value="api-collection">API Collection</option>
                <option value="custom-script">Custom Script</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Target List (one per line)</label>
              <textarea 
                className="form-input"
                rows={5}
                value={jobConfig.targets}
                onChange={(e) => setJobConfig({...jobConfig, targets: e.target.value})}
                placeholder="https://example.com/user1\nhttps://example.com/user2\n..."
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Axiom Fleet</label>
              <select 
                className="form-input"
                value={jobConfig.axiomFleet}
                onChange={(e) => setJobConfig({...jobConfig, axiomFleet: e.target.value})}
              >
                <option value="">Select Fleet</option>
                {axiomFleets.map(fleet => (
                  <option key={fleet.id} value={fleet.id}>{fleet.name} ({fleet.instanceCount} instances)</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Rate Limiting</label>
              <div className="flex gap-12">
                <div className="flex-1">
                  <label className="form-label text-xs">Requests/sec</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={jobConfig.rateLimit}
                    onChange={(e) => setJobConfig({...jobConfig, rateLimit: parseInt(e.target.value)})}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="flex-1">
                  <label className="form-label text-xs">Delay (ms)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={jobConfig.delay}
                    onChange={(e) => setJobConfig({...jobConfig, delay: parseInt(e.target.value)})}
                    min="100"
                    max="10000"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              📊 Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Deploy Fleet Modal
function DeployFleetModal({ onClose, vpnNodes }) {
  const [fleetConfig, setFleetConfig] = useState({
    name: '',
    provider: 'aws',
    instanceType: 'c5.large',
    regions: [],
    quantity: 5,
    vpnEnabled: true,
    vpnNode: ''
  });
  const { showToast } = useContext(ToastContext);

  const instanceTypes = {
    aws: [{ type: 'c5.large', cost: 0.085 }, { type: 'c5.xlarge', cost: 0.17 }, { type: 'c5.2xlarge', cost: 0.34 }],
    gcp: [{ type: 'n2-standard-2', cost: 0.076 }, { type: 'n2-standard-4', cost: 0.152 }, { type: 'n2-standard-8', cost: 0.304 }],
    digitalocean: [{ type: 's-2vcpu-2gb', cost: 0.0357 }, { type: 's-4vcpu-8gb', cost: 0.119 }]
  };

  const selectedType = instanceTypes[fleetConfig.provider].find(t => t.type === fleetConfig.instanceType);
  const estimatedCost = selectedType ? (selectedType.cost * fleetConfig.quantity) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(`Fleet "${fleetConfig.name}" deployment started`, 'success');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{maxWidth: '600px'}}>
        <div className="modal-header">
          <h3 className="modal-title">🚀 Deploy Axiom Fleet</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Fleet Name</label>
              <input 
                type="text"
                className="form-input"
                value={fleetConfig.name}
                onChange={(e) => setFleetConfig({...fleetConfig, name: e.target.value})}
                placeholder="recon-fleet-gamma"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select 
                className="form-input"
                value={fleetConfig.provider}
                onChange={(e) => setFleetConfig({...fleetConfig, provider: e.target.value, instanceType: instanceTypes[e.target.value][0].type})}
              >
                <option value="aws">Amazon Web Services</option>
                <option value="gcp">Google Cloud Platform</option>
                <option value="digitalocean">DigitalOcean</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Instance Type</label>
              <select 
                className="form-input"
                value={fleetConfig.instanceType}
                onChange={(e) => setFleetConfig({...fleetConfig, instanceType: e.target.value})}
              >
                {instanceTypes[fleetConfig.provider].map(type => (
                  <option key={type.type} value={type.type}>{type.type} (${type.cost}/hr)</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Quantity: {fleetConfig.quantity}</label>
              <input 
                type="range"
                min="1"
                max="20"
                value={fleetConfig.quantity}
                onChange={(e) => setFleetConfig({...fleetConfig, quantity: parseInt(e.target.value)})}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <div className="form-checkbox mb-16">
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={fleetConfig.vpnEnabled}
                  onChange={(e) => setFleetConfig({...fleetConfig, vpnEnabled: e.target.checked})}
                />
                <label className="checkbox-label">Route through VPN</label>
              </div>
              {fleetConfig.vpnEnabled && (
                <select 
                  className="form-input"
                  value={fleetConfig.vpnNode}
                  onChange={(e) => setFleetConfig({...fleetConfig, vpnNode: e.target.value})}
                >
                  <option value="">Select VPN Node</option>
                  {vpnNodes.map(node => (
                    <option key={node.id} value={node.id}>{node.regionName} ({node.publicIp})</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="card" style={{background: 'var(--color-bg-1)', border: 'none'}}>
              <div className="card-body">
                <h4>💰 Cost Estimate</h4>
                <p><strong>Per Hour:</strong> ${estimatedCost.toFixed(2)}</p>
                <p><strong>Per Day:</strong> ${(estimatedCost * 24).toFixed(2)}</p>
                <p><strong>Per Month:</strong> ${(estimatedCost * 24 * 30).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              🚀 Deploy Fleet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Cost Tracker Component
function CostTracker() {
  const { instances } = useContext(AppContext);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Oct 1', 'Oct 5', 'Oct 10', 'Oct 15', 'Oct 18'],
          datasets: [{
            label: 'AWS',
            data: [145.23, 156.78, 178.90, 198.45, 212.30],
            borderColor: '#FF9900',
            backgroundColor: 'rgba(255, 153, 0, 0.1)',
            tension: 0.4
          }, {
            label: 'GCP',
            data: [89.45, 92.10, 105.60, 115.20, 125.80],
            borderColor: '#4285F4',
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#f1f5f9'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#94a3b8'
              },
              grid: {
                color: '#334155'
              }
            },
            y: {
              ticks: {
                color: '#94a3b8',
                callback: function(value) {
                  return '$' + value;
                }
              },
              grid: {
                color: '#334155'
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  const totalToday = instances.reduce((sum, i) => sum + i.costPerHour, 0) * 24;
  const totalWeek = totalToday * 7;
  const totalMonth = totalToday * 30;

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>Cost Tracker</h2>
          <p className="text-muted">Monitor and optimize your cloud spending</p>
        </div>
        <button className="btn btn-secondary">
          Export Report
        </button>
      </div>
      
      <div className="metrics-grid mb-24">
        <div className="metric-card">
          <div className="metric-value">${totalToday.toFixed(2)}</div>
          <div className="metric-label">Today</div>
          <div className="metric-change positive">-2% vs yesterday</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${totalWeek.toFixed(2)}</div>
          <div className="metric-label">This Week</div>
          <div className="metric-change positive">-5% vs last week</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${totalMonth.toFixed(2)}</div>
          <div className="metric-label">This Month</div>
          <div className="metric-change positive">-8% vs last month</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{instances.length}</div>
          <div className="metric-label">Active Resources</div>
        </div>
      </div>
      
      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">Cost Trend (Last 30 Days)</h3>
        </div>
        <div className="card-body">
          <div className="chart-container">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Cost Breakdown by Instance</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Instance</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Region</th>
                <th>Cost/Hour</th>
                <th>Daily Cost</th>
                <th>Monthly Est.</th>
              </tr>
            </thead>
            <tbody>
              {instances.map(instance => (
                <tr key={instance.id}>
                  <td className="font-medium">{instance.id}</td>
                  <td>{instance.provider}</td>
                  <td>{instance.type}</td>
                  <td>{instance.region}</td>
                  <td>${instance.costPerHour}</td>
                  <td>${(instance.costPerHour * 24).toFixed(2)}</td>
                  <td>${(instance.costPerHour * 24 * 30).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Settings Component
function Settings() {
  const { showToast } = useContext(ToastContext);
  const [awsCredentials, setAwsCredentials] = useState({ accessKey: '', secretKey: '', region: 'us-east-1' });
  const [gcpCredentials, setGcpCredentials] = useState({ projectId: '', keyFile: '' });

  const handleSaveAws = (e) => {
    e.preventDefault();
    showToast('AWS credentials saved successfully', 'success');
  };

  const handleSaveGcp = (e) => {
    e.preventDefault();
    showToast('GCP credentials saved successfully', 'success');
  };

  return (
    <div>
      <div className="mb-24">
        <h2>Settings</h2>
        <p className="text-muted">Configure your cloud provider credentials and preferences</p>
      </div>
      
      <div className="flex flex-col gap-24">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AWS Credentials</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveAws}>
              <div className="form-group">
                <label className="form-label">Access Key ID</label>
                <input 
                  type="text"
                  className="form-input"
                  value={awsCredentials.accessKey}
                  onChange={(e) => setAwsCredentials({...awsCredentials, accessKey: e.target.value})}
                  placeholder="AKIA...."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Secret Access Key</label>
                <input 
                  type="password"
                  className="form-input"
                  value={awsCredentials.secretKey}
                  onChange={(e) => setAwsCredentials({...awsCredentials, secretKey: e.target.value})}
                  placeholder="Enter secret key"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Region</label>
                <select 
                  className="form-input"
                  value={awsCredentials.region}
                  onChange={(e) => setAwsCredentials({...awsCredentials, region: e.target.value})}
                >
                  {cloudRegions.aws.map(region => (
                    <option key={region.code} value={region.code}>{region.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Save AWS Credentials</button>
            </form>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Google Cloud Credentials</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveGcp}>
              <div className="form-group">
                <label className="form-label">Project ID</label>
                <input 
                  type="text"
                  className="form-input"
                  value={gcpCredentials.projectId}
                  onChange={(e) => setGcpCredentials({...gcpCredentials, projectId: e.target.value})}
                  placeholder="my-project-123"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Account Key File</label>
                <input 
                  type="file"
                  className="form-input"
                  accept=".json"
                />
              </div>
              <button type="submit" className="btn btn-primary">Save GCP Credentials</button>
            </form>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Security Settings</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <div className="form-checkbox">
                <input type="checkbox" className="checkbox" />
                <label className="checkbox-label">Enable two-factor authentication</label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Session Timeout</label>
              <select className="form-input">
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </div>
            <button className="btn btn-primary">Save Security Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ars0n OSINT Page
function Ars0nPage() {
  const { osintJobs, osintFindings, axiomFleets, vpnNodes } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [showNewScanModal, setShowNewScanModal] = useState(false);

  const handleStartScan = (scanConfig) => {
    showToast(`OSINT scan started on ${scanConfig.target}`, 'success');
    setShowNewScanModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>Ars0n OSINT Framework</h2>
          <p className="text-muted">Advanced reconnaissance and vulnerability discovery</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewScanModal(true)}
        >
          🔍 New Scan
        </button>
      </div>

      {/* Active Scans */}
      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">Active Scans ({osintJobs.filter(j => j.status === 'running').length})</h3>
        </div>
        <div className="card-body">
          <div className="atlas-grid">
            {osintJobs.map(job => (
              <div key={job.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h4>{job.jobName}</h4>
                      <p className="text-muted text-sm">Target: {job.target}</p>
                    </div>
                    <span className={`status-badge ${job.status}`}>{job.status}</span>
                  </div>
                  
                  <div className="flex items-center gap-12 mb-12">
                    <div className="progress-ring">
                      <svg width="60" height="60">
                        <circle className="bg" cx="30" cy="30" r="25" />
                        <circle 
                          className="progress" 
                          cx="30" 
                          cy="30" 
                          r="25"
                          strokeDasharray={`${job.progress * 1.57} 157`}
                        />
                      </svg>
                      <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 'var(--font-size-sm)', fontWeight: 'bold'}}>
                        {job.progress}%
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted mb-4">Modules:</div>
                      <div className="flex gap-4" style={{flexWrap: 'wrap'}}>
                        {job.modules.map(module => (
                          <span key={module} className="scan-type-badge subdomain">{module}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 text-xs text-muted">
                    <span>Fleet: {job.axiomFleetId}</span>
                    <span>VPN: {job.vpnNodeId}</span>
                    <span>Started: {new Date(job.startedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Findings Dashboard */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Findings ({osintFindings.length})</h3>
        </div>
        <div className="card-body">
          <div className="findings-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Finding</th>
                  <th>Severity</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {osintFindings.map(finding => (
                  <tr key={finding.id}>
                    <td>
                      <span className={`scan-type-badge ${finding.type}`}>
                        {finding.type}
                      </span>
                    </td>
                    <td className="font-mono text-sm">{finding.value}</td>
                    <td>
                      <span className={`severity-badge ${finding.severity}`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td>
                      {finding.verified ? (
                        <span style={{color: 'var(--color-success)'}}>✓ Verified</span>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-4">
                        <button className="btn btn-sm btn-secondary">Copy</button>
                        <button className="btn btn-sm btn-secondary">Open</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNewScanModal && (
        <NewScanModal 
          onClose={() => setShowNewScanModal(false)}
          onStart={handleStartScan}
          axiomFleets={axiomFleets}
          vpnNodes={vpnNodes}
        />
      )}
    </div>
  );
}

// Collections Page
function CollectionsPage() {
  const { collectionJobs, axiomFleets } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>Data Collections</h2>
          <p className="text-muted">Distributed data collection and web scraping</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateJobModal(true)}
        >
          📥 Create Job
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="card-title">Collection Jobs</h3>
            <div className="flex gap-8">
              <span className="status-badge running">Running: {collectionJobs.filter(j => j.status === 'running').length}</span>
              <span className="status-badge" style={{background: 'var(--color-bg-2)', color: 'var(--color-warning)'}}>Pending: {collectionJobs.filter(j => j.status === 'pending').length}</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-16">
            {collectionJobs.map(job => (
              <div key={job.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-16">
                    <div>
                      <h4>{job.jobName}</h4>
                      <p className="text-muted text-sm">
                        Type: {job.jobType} • Fleet: {job.axiomFleetId}
                      </p>
                    </div>
                    <span className={`status-badge ${job.status}`}>{job.status}</span>
                  </div>
                  
                  <div className="mb-12">
                    <div className="flex justify-between text-sm mb-4">
                      <span>Progress</span>
                      <span>
                        {job.completedTargets?.toLocaleString() || 0} / {job.totalTargets?.toLocaleString() || 0} 
                        ({job.progress}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-12 text-xs text-muted">
                      {job.startedAt && (
                        <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                      )}
                      {job.failedTargets > 0 && (
                        <span style={{color: 'var(--color-error)'}}>Failed: {job.failedTargets}</span>
                      )}
                    </div>
                    <div className="flex gap-8">
                      <button className="btn btn-sm btn-secondary">View Results</button>
                      <button className="btn btn-sm btn-secondary">Export CSV</button>
                      {job.status === 'running' && (
                        <button className="btn btn-sm btn-danger">Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateJobModal && (
        <CreateCollectionJobModal 
          onClose={() => setShowCreateJobModal(false)}
          axiomFleets={axiomFleets}
        />
      )}
    </div>
  );
}

// Axiom Orchestration Page
function AxiomPage() {
  const { axiomFleets, axiomInstances, vpnNodes } = useContext(AppContext);
  const { showToast } = useContext(ToastContext);
  const [showDeployFleetModal, setShowDeployFleetModal] = useState(false);

  const totalInstances = axiomFleets.reduce((sum, fleet) => sum + fleet.instanceCount, 0);
  const totalCostPerHour = axiomFleets.reduce((sum, fleet) => sum + fleet.costPerHour, 0);
  const estimatedMonthlyCost = totalCostPerHour * 24 * 30;

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <h2>Axiom Multi-Cloud Orchestration</h2>
          <p className="text-muted">Deploy and manage distributed security tools</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowDeployFleetModal(true)}
        >
          🚀 Deploy Fleet
        </button>
      </div>

      <div className="metrics-grid mb-24">
        <div className="metric-card">
          <div className="metric-value">{axiomFleets.length}</div>
          <div className="metric-label">Active Fleets</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{totalInstances}</div>
          <div className="metric-label">Total Instances</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${totalCostPerHour.toFixed(2)}</div>
          <div className="metric-label">Cost per Hour</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${estimatedMonthlyCost.toFixed(0)}</div>
          <div className="metric-label">Est. Monthly Cost</div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header">
          <h3 className="card-title">Fleet Overview</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fleet Name</th>
                <th>Provider</th>
                <th>Instances</th>
                <th>Regions</th>
                <th>Status</th>
                <th>VPN</th>
                <th>Cost/hr</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {axiomFleets.map(fleet => (
                <tr key={fleet.id}>
                  <td className="font-medium">{fleet.name}</td>
                  <td>
                    <span className={`status-badge ${fleet.provider.toLowerCase()}`}>
                      {fleet.provider}
                    </span>
                  </td>
                  <td>{fleet.instanceCount}</td>
                  <td>{fleet.regions.slice(0, 2).join(', ')}{fleet.regions.length > 2 && '...'}</td>
                  <td>
                    <span className={`status-badge ${fleet.status}`}>{fleet.status}</span>
                  </td>
                  <td>
                    {fleet.vpnEnabled ? (
                      <span style={{color: 'var(--color-vpn-green)'}}>✓ {fleet.vpnNodeId}</span>
                    ) : (
                      <span className="text-muted">Disabled</span>
                    )}
                  </td>
                  <td>${fleet.costPerHour}</td>
                  <td>
                    <div className="flex gap-4">
                      <button className="btn btn-sm btn-secondary">SSH</button>
                      <button className="btn btn-sm btn-danger">Terminate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Instance Details</h3>
        </div>
        <div className="card-body">
          <div className="atlas-grid">
            {axiomInstances.map(instance => (
              <div key={instance.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h4 className="font-mono text-sm">{instance.instanceId}</h4>
                      <p className="text-muted text-xs">{instance.region} • {instance.provider}</p>
                    </div>
                    <span className={`status-badge ${instance.status}`}>{instance.status}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-12 text-sm">
                    <div>
                      <span className="text-muted">CPU:</span>
                      <span className="ml-4">{instance.cpuUsage?.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted">Memory:</span>
                      <span className="ml-4">{instance.memoryUsage?.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted">Uptime:</span>
                      <span className="ml-4">{Math.floor(instance.uptime / 3600)}h</span>
                    </div>
                    <div>
                      <span className="text-muted">IP:</span>
                      <span className="ml-4 font-mono">{instance.publicIp}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="btn btn-sm btn-secondary">SSH</button>
                    <button className="btn btn-sm btn-secondary">Logs</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeployFleetModal && (
        <DeployFleetModal 
          onClose={() => setShowDeployFleetModal(false)}
          vpnNodes={vpnNodes}
        />
      )}
    </div>
  );
}

// Main Dashboard Layout
function DashboardLayout() {
  const { currentPage } = useContext(AppContext);

  const renderPage = () => {
    const pageConfig = {
      dashboard: { component: Dashboard, title: '🎯 Atlas Dashboard' },
      vpn: { component: VpnDashboard, title: '🔒 VPN Infrastructure' },
      axiom: { component: AxiomPage, title: '☁️ Axiom Orchestration' },
      ars0n: { component: Ars0nPage, title: '🔍 Ars0n OSINT Framework' },
      collections: { component: CollectionsPage, title: '📊 Data Collections' },
      analytics: { component: CostTracker, title: '💰 Analytics & Cost Tracking' },
      settings: { component: Settings, title: '⚙️ Settings' }
    };

    const config = pageConfig[currentPage] || pageConfig.dashboard;
    const Component = config.component;
    
    return (
      <>
        <Header title={config.title} />
        <div className="main-body">
          <Component />
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="login-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardLayout /> : <LoginPage />;
}

// Root App with Providers
function RootApp() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(RootApp));
