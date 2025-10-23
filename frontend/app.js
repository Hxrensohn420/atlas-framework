// Atlas Framework - Axiom Fleet Management Dashboard

class AtlasFramework {
    constructor() {
        this.currentPage = 'dashboard';
        this.websocket = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.controllers = [];
        this.instances = [];
        this.scans = [];
        this.files = [];
        
        // Mock data based on provided JSON
        this.mockData = {
            gcp_regions: [
                { id: 'europe-west1', name: 'Belgium', lat: 50.85, lon: 4.35 },
                { id: 'europe-west2', name: 'London', lat: 51.51, lon: -0.13 },
                { id: 'europe-west3', name: 'Frankfurt', lat: 50.11, lon: 8.68 },
                { id: 'europe-west4', name: 'Netherlands', lat: 52.37, lon: 4.89 },
                { id: 'europe-north1', name: 'Finland', lat: 60.17, lon: 24.94 },
                { id: 'us-central1', name: 'Iowa, USA', lat: 41.26, lon: -95.86 },
                { id: 'us-east1', name: 'South Carolina, USA', lat: 33.84, lon: -81.16 },
                { id: 'us-east4', name: 'Virginia, USA', lat: 37.43, lon: -78.66 },
                { id: 'us-west1', name: 'Oregon, USA', lat: 45.52, lon: -122.68 },
                { id: 'asia-southeast1', name: 'Singapore', lat: 1.35, lon: 103.82 }
            ],
            instance_types: [
                { id: 'e2-micro', name: 'e2-micro (0.25 vCPU, 1GB)', vcpu: 0.25, ram: 1, cost_hourly: 0.0084, cost_monthly: 6.13 },
                { id: 'e2-small', name: 'e2-small (0.5 vCPU, 2GB)', vcpu: 0.5, ram: 2, cost_hourly: 0.0168, cost_monthly: 12.26 },
                { id: 'e2-medium', name: 'e2-medium (1 vCPU, 4GB)', vcpu: 1, ram: 4, cost_hourly: 0.0335, cost_monthly: 24.45 },
                { id: 'e2-standard-2', name: 'e2-standard-2 (2 vCPU, 8GB)', vcpu: 2, ram: 8, cost_hourly: 0.067, cost_monthly: 48.91 },
                { id: 'e2-standard-4', name: 'e2-standard-4 (4 vCPU, 16GB)', vcpu: 4, ram: 16, cost_hourly: 0.134, cost_monthly: 97.82 }
            ],
            scan_modules: [
                { id: 'nuclei', name: 'Nuclei', description: 'Fast and customizable vulnerability scanner', default_args: '-t cves/' },
                { id: 'httpx', name: 'HTTPx', description: 'HTTP toolkit with various probe capabilities', default_args: '-silent' },
                { id: 'nmap', name: 'Nmap', description: 'Network exploration and security auditing', default_args: '-sV -T4' },
                { id: 'masscan', name: 'Masscan', description: 'TCP port scanner, spews SYN packets', default_args: '--rate=10000' },
                { id: 'subfinder', name: 'Subfinder', description: 'Subdomain discovery tool', default_args: '-silent' }
            ],
            controllers: [
                {
                    id: 1,
                    name: 'axiom-gcp-primary',
                    host: '34.88.216.157',
                    ssh_user: 'ubuntu',
                    region: 'europe-west1',
                    provider: 'GCP',
                    status: 'active',
                    is_active: true,
                    last_seen: '2025-10-23T07:20:00Z'
                }
            ],
            instances: [
                {
                    name: 'axiom-scanner-01',
                    external_ip: '34.88.215.100',
                    internal_ip: '10.132.0.10',
                    region: 'europe-west1',
                    type: 'e2-medium',
                    status: 'running',
                    uptime: '2h 15m',
                    provider: 'GCP'
                },
                {
                    name: 'axiom-scanner-02',
                    external_ip: '34.88.215.101',
                    internal_ip: '10.132.0.11',
                    region: 'europe-west1',
                    type: 'e2-medium',
                    status: 'running',
                    uptime: '2h 15m',
                    provider: 'GCP'
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateTime();
        this.loadInitialData();
        this.showPage('dashboard');
        
        // Update time every second
        setInterval(() => this.updateTime(), 1000);
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
        
        // Quick actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch(action) {
                    case 'deploy':
                        this.showPage('deploy');
                        break;
                    case 'scan':
                        this.showPage('scans');
                        break;
                    case 'terminal':
                        this.showPage('terminal');
                        break;
                }
            });
        });
        
        // Deploy form
        document.getElementById('deployForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDeploy();
        });
        
        // Scan form
        document.getElementById('scanForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStartScan();
        });
        
        // Upload form
        document.getElementById('uploadForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFileUpload();
        });
        
        // Instance count slider
        document.getElementById('instanceCount')?.addEventListener('input', (e) => {
            document.getElementById('instanceCountValue').textContent = e.target.value;
            this.updateCostEstimate();
        });
        
        // Instance type change
        document.getElementById('instanceType')?.addEventListener('change', () => {
            this.updateCostEstimate();
        });
        
        // Terminal input
        document.getElementById('terminalInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleTerminalCommand();
            } else if (e.key === 'ArrowUp') {
                this.navigateCommandHistory(-1);
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                this.navigateCommandHistory(1);
                e.preventDefault();
            }
        });
        
        // Terminal quick commands
        document.querySelectorAll('[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.dataset.command;
                document.getElementById('terminalInput').value = command;
                this.handleTerminalCommand();
            });
        });
        
        // Controller selection
        document.getElementById('controllerSelect')?.addEventListener('change', (e) => {
            this.connectToController(e.target.value);
        });
        
        // Drag and drop file upload
        const dragDropZone = document.getElementById('dragDropZone');
        if (dragDropZone) {
            dragDropZone.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });
            
            dragDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dragDropZone.classList.add('dragover');
            });
            
            dragDropZone.addEventListener('dragleave', () => {
                dragDropZone.classList.remove('dragover');
            });
            
            dragDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dragDropZone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                this.handleFileSelection(files);
            });
        }
        
        // File input change
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });
        
        // Modal close
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.hideModal();
        });
        
        document.getElementById('modalCancel')?.addEventListener('click', () => {
            this.hideModal();
        });
        
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.hideModal();
            }
        });
    }
    
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }
    
    loadInitialData() {
        // Load mock data
        this.controllers = [...this.mockData.controllers];
        this.instances = [...this.mockData.instances];
        
        // Populate dropdowns
        this.populateRegionSelect();
        this.populateInstanceTypeSelect();
        this.populateScanModuleSelect();
        this.populateControllerSelect();
        
        // Update dashboard metrics
        this.updateDashboardMetrics();
        this.updateCostEstimate();
        
        // Create cost chart
        this.createCostChart();
        
        // Load page data
        this.loadControllersData();
        this.loadInstancesData();
        this.loadScansData();
    }
    
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show selected page
        document.getElementById(pageName + 'Page')?.classList.remove('hidden');
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');
        
        // Update header
        this.currentPage = pageName;
        this.updatePageHeader(pageName);
        
        // Load page-specific data
        switch(pageName) {
            case 'controllers':
                this.loadControllersData();
                break;
            case 'instances':
                this.loadInstancesData();
                break;
            case 'scans':
                this.loadScansData();
                break;
            case 'terminal':
                this.initTerminal();
                break;
            case 'files':
                this.loadFilesData();
                break;
        }
    }
    
    updatePageHeader(pageName) {
        const titles = {
            dashboard: 'Dashboard',
            controllers: 'Controller Management',
            deploy: 'Deploy Fleet',
            instances: 'Running Instances',
            scans: 'Scan Management',
            terminal: 'Interactive Terminal',
            files: 'File Management'
        };
        
        document.getElementById('pageTitle').textContent = titles[pageName] || 'Atlas Framework';
        document.getElementById('breadcrumb').textContent = `Atlas Framework > ${titles[pageName]}`;
    }
    
    updateDashboardMetrics() {
        document.getElementById('activeControllers').textContent = this.controllers.filter(c => c.status === 'active').length;
        document.getElementById('runningInstances').textContent = this.instances.filter(i => i.status === 'running').length;
        document.getElementById('activeScans').textContent = this.scans.filter(s => s.status === 'running').length;
        
        // Calculate estimated monthly cost
        let totalCost = 0;
        this.instances.forEach(instance => {
            const instanceType = this.mockData.instance_types.find(t => t.id === instance.type);
            if (instanceType) {
                totalCost += instanceType.cost_monthly;
            }
        });
        document.getElementById('estimatedCost').textContent = `$${totalCost.toFixed(2)}`;
    }
    
    populateRegionSelect() {
        const select = document.getElementById('region');
        if (select) {
            select.innerHTML = '';
            this.mockData.gcp_regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                option.textContent = region.name;
                select.appendChild(option);
            });
        }
    }
    
    populateInstanceTypeSelect() {
        const select = document.getElementById('instanceType');
        if (select) {
            select.innerHTML = '';
            this.mockData.instance_types.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                select.appendChild(option);
            });
        }
    }
    
    populateScanModuleSelect() {
        const select = document.getElementById('scanModule');
        if (select) {
            select.innerHTML = '';
            this.mockData.scan_modules.forEach(module => {
                const option = document.createElement('option');
                option.value = module.id;
                option.textContent = `${module.name} - ${module.description}`;
                select.appendChild(option);
            });
        }
        
        // Update args when module changes
        select?.addEventListener('change', (e) => {
            const module = this.mockData.scan_modules.find(m => m.id === e.target.value);
            if (module) {
                document.getElementById('scanArgs').value = module.default_args;
            }
        });
    }
    
    populateControllerSelect() {
        const select = document.getElementById('controllerSelect');
        if (select) {
            select.innerHTML = '<option value="">Select Controller</option>';
            this.controllers.forEach(controller => {
                const option = document.createElement('option');
                option.value = controller.id;
                option.textContent = `${controller.name} (${controller.host})`;
                select.appendChild(option);
            });
        }
    }
    
    updateCostEstimate() {
        const instanceTypeSelect = document.getElementById('instanceType');
        const instanceCountSlider = document.getElementById('instanceCount');
        const costDisplay = document.getElementById('estimatedMonthlyCost');
        
        if (instanceTypeSelect && instanceCountSlider && costDisplay) {
            const selectedType = this.mockData.instance_types.find(t => t.id === instanceTypeSelect.value);
            if (selectedType) {
                const count = parseInt(instanceCountSlider.value);
                const totalCost = selectedType.cost_monthly * count;
                costDisplay.textContent = `$${totalCost.toFixed(2)}`;
            }
        }
    }
    
    createCostChart() {
        const ctx = document.getElementById('costChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Compute', 'Storage', 'Network'],
                    datasets: [{
                        data: [75, 15, 10],
                        backgroundColor: ['#32a1b1', '#1d7480', '#4a4a4a']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    }
                }
            });
        }
    }
    
    loadControllersData() {
        const tbody = document.getElementById('controllersTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            
            this.controllers.forEach(controller => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${controller.name}</td>
                    <td>${controller.host}</td>
                    <td>${controller.region}</td>
                    <td>${controller.provider}</td>
                    <td><span class="status-badge ${controller.status}">${controller.status}</span></td>
                    <td>${this.formatDateTime(controller.last_seen)}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="atlas.healthCheck(${controller.id})">Health Check</button>
                        <button class="btn btn-sm btn-primary" onclick="atlas.connectSSH(${controller.id})">SSH Connect</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    loadInstancesData() {
        const tbody = document.getElementById('instancesTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            
            this.instances.forEach(instance => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" value="${instance.name}"></td>
                    <td>${instance.name}</td>
                    <td>${instance.external_ip}</td>
                    <td>${instance.internal_ip}</td>
                    <td>${instance.region}</td>
                    <td>${instance.type}</td>
                    <td><span class="status-badge ${instance.status}">${instance.status}</span></td>
                    <td>${instance.uptime}</td>
                    <td>
                        <div class="dropdown-menu">
                            <button class="btn btn-sm btn-secondary dropdown-btn">Actions ⏷</button>
                            <div class="dropdown-content">
                                <button class="dropdown-item" onclick="atlas.sshToInstance('${instance.name}')">SSH Connect</button>
                                <button class="dropdown-item" onclick="atlas.executeCommand('${instance.name}')">Execute Command</button>
                                <button class="dropdown-item" onclick="atlas.rebootInstance('${instance.name}')">Reboot</button>
                                <button class="dropdown-item" onclick="atlas.terminateInstance('${instance.name}')">Terminate</button>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Setup dropdown menus
            document.querySelectorAll('.dropdown-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdown = btn.nextElementSibling;
                    dropdown.classList.toggle('show');
                });
            });
            
            // Close dropdowns when clicking elsewhere
            document.addEventListener('click', () => {
                document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            });
        }
    }
    
    loadScansData() {
        const activeList = document.getElementById('activeScansList');
        const completedList = document.getElementById('completedScansList');
        
        if (activeList) {
            activeList.innerHTML = this.scans.filter(s => s.status === 'running').length === 0 ? 
                '<p style="color: #a0a0a0; text-align: center; padding: 20px;">No active scans</p>' :
                this.scans.filter(s => s.status === 'running').map(scan => this.createScanItem(scan)).join('');
        }
        
        if (completedList) {
            completedList.innerHTML = this.scans.filter(s => s.status === 'completed').length === 0 ? 
                '<p style="color: #a0a0a0; text-align: center; padding: 20px;">No completed scans</p>' :
                this.scans.filter(s => s.status === 'completed').map(scan => this.createScanItem(scan)).join('');
        }
    }
    
    createScanItem(scan) {
        const progressBar = scan.status === 'running' ? 
            `<div class="scan-progress">
                <div class="scan-progress-fill" style="width: ${scan.progress || 0}%"></div>
            </div>` : '';
        
        return `
            <div class="scan-item">
                <div class="scan-info">
                    <div class="scan-name">${scan.name}</div>
                    <div class="scan-details">${scan.module} • ${scan.instances} instances • ${this.formatDateTime(scan.started)}</div>
                    ${progressBar}
                </div>
                <div class="scan-actions">
                    ${scan.status === 'running' ? 
                        '<button class="btn btn-sm btn-danger" onclick="atlas.stopScan(' + scan.id + ')">Stop</button>' :
                        '<button class="btn btn-sm btn-secondary" onclick="atlas.downloadResults(' + scan.id + ')">Download</button>'
                    }
                </div>
            </div>
        `;
    }
    
    loadFilesData() {
        const tbody = document.getElementById('filesTableBody');
        if (tbody) {
            tbody.innerHTML = this.files.length === 0 ? 
                '<tr><td colspan="6" style="text-align: center; color: #a0a0a0; padding: 20px;">No files uploaded</td></tr>' :
                this.files.map(file => `
                    <tr>
                        <td>${file.name}</td>
                        <td>${this.formatFileSize(file.size)}</td>
                        <td><span class="status-badge ${file.type}">${file.type}</span></td>
                        <td>${this.formatDateTime(file.uploaded)}</td>
                        <td>${file.fleet}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="atlas.downloadFile(${file.id})">Download</button>
                            <button class="btn btn-sm btn-danger" onclick="atlas.deleteFile(${file.id})">Delete</button>
                        </td>
                    </tr>
                `).join('');
        }
    }
    
    initTerminal() {
        if (this.websocket) {
            this.websocket.close();
        }
        
        this.updateTerminalStatus('Disconnected', false);
    }
    
    connectToController(controllerId) {
        if (!controllerId) return;
        
        const controller = this.controllers.find(c => c.id == controllerId);
        if (!controller) return;
        
        this.updateTerminalStatus('Connecting...', false);
        
        // Simulate SSH connection
        setTimeout(() => {
            this.updateTerminalStatus('Connected', true);
            this.addTerminalOutput(`\nConnected to ${controller.name} (${controller.host})\n`);
            this.addTerminalOutput(`ubuntu@axiom-controller:~$ `);
            
            // Update terminal prompt
            document.getElementById('terminalPrompt').textContent = `ubuntu@${controller.name}:~$`;
        }, 1500);
    }
    
    updateTerminalStatus(status, connected) {
        const statusElement = document.getElementById('terminalStatus');
        const statusDot = document.getElementById('terminalStatusDot');
        
        if (statusElement) statusElement.textContent = status;
        if (statusDot) {
            statusDot.className = 'status-dot';
            if (connected) statusDot.classList.add('active');
        }
    }
    
    addTerminalOutput(text) {
        const output = document.getElementById('terminalOutput');
        if (output) {
            output.innerHTML += text;
            output.scrollTop = output.scrollHeight;
        }
    }
    
    handleTerminalCommand() {
        const input = document.getElementById('terminalInput');
        const command = input.value.trim();
        
        if (!command) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.historyIndex = -1;
        
        // Display command
        this.addTerminalOutput(command + '\n');
        
        // Clear input
        input.value = '';
        
        // Simulate command execution
        this.executeTerminalCommand(command);
    }
    
    executeTerminalCommand(command) {
        this.addTerminalOutput('Executing command...\n');
        
        // Simulate different command responses
        setTimeout(() => {
            if (command.includes('axiom-ls')) {
                this.addTerminalOutput('axiom-scanner-01 • running • 34.88.215.100\n');
                this.addTerminalOutput('axiom-scanner-02 • running • 34.88.215.101\n');
            } else if (command.includes('axiom-select')) {
                this.addTerminalOutput('Selected 2 instances\n');
            } else if (command.includes('axiom-fleet')) {
                this.addTerminalOutput('Deploying new fleet...\n');
                setTimeout(() => {
                    this.addTerminalOutput('Fleet deployed successfully\n');
                    this.addTerminalOutput('ubuntu@axiom-controller:~$ ');
                }, 2000);
                return;
            } else if (command.includes('axiom-scan')) {
                this.addTerminalOutput('Starting scan across fleet...\n');
                setTimeout(() => {
                    this.addTerminalOutput('Scan initiated on 2 instances\n');
                    this.addTerminalOutput('ubuntu@axiom-controller:~$ ');
                }, 1500);
                return;
            } else {
                this.addTerminalOutput(`Command executed: ${command}\n`);
            }
            
            this.addTerminalOutput('ubuntu@axiom-controller:~$ ');
        }, Math.random() * 1000 + 500);
    }
    
    navigateCommandHistory(direction) {
        const input = document.getElementById('terminalInput');
        
        if (direction === -1 && this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
        } else if (direction === 1 && this.historyIndex > 0) {
            this.historyIndex--;
            input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
        } else if (direction === 1 && this.historyIndex === 0) {
            this.historyIndex = -1;
            input.value = '';
        }
    }
    
    handleDeploy() {
        const form = document.getElementById('deployForm');
        const formData = new FormData(form);
        const deployBtn = document.getElementById('deployBtn');
        
        // Show progress
        this.showDeploymentProgress();
        deployBtn.disabled = true;
        
        // Simulate deployment
        this.simulateDeployment();
    }
    
    showDeploymentProgress() {
        document.getElementById('deploymentProgress').classList.remove('hidden');
    }
    
    simulateDeployment() {
        const progressFill = document.getElementById('progressFill');
        const progressDetails = document.getElementById('progressDetails');
        const progressPercentage = document.querySelector('.progress-percentage');
        
        const steps = [
            { progress: 10, text: 'Initializing deployment...' },
            { progress: 25, text: 'Creating instances...' },
            { progress: 50, text: 'Configuring network...' },
            { progress: 75, text: 'Installing axiom tools...' },
            { progress: 90, text: 'Finalizing setup...' },
            { progress: 100, text: 'Deployment completed successfully!' }
        ];
        
        let stepIndex = 0;
        
        const updateProgress = () => {
            if (stepIndex < steps.length) {
                const step = steps[stepIndex];
                progressFill.style.width = `${step.progress}%`;
                progressPercentage.textContent = `${step.progress}%`;
                progressDetails.textContent = step.text;
                
                stepIndex++;
                setTimeout(updateProgress, 1000 + Math.random() * 1000);
            } else {
                // Deployment complete
                setTimeout(() => {
                    document.getElementById('deploymentProgress').classList.add('hidden');
                    document.getElementById('deployBtn').disabled = false;
                    
                    // Add new instances to the list (simulation)
                    const fleetName = document.getElementById('fleetName').value || 'new-fleet';
                    const count = parseInt(document.getElementById('instanceCount').value);
                    
                    for (let i = 0; i < count; i++) {
                        const newInstance = {
                            name: `${fleetName}-${String(i + 1).padStart(2, '0')}`,
                            external_ip: `34.88.215.${120 + i}`,
                            internal_ip: `10.132.0.${20 + i}`,
                            region: document.getElementById('region').value,
                            type: document.getElementById('instanceType').value,
                            status: 'running',
                            uptime: '0m',
                            provider: 'GCP'
                        };
                        this.instances.push(newInstance);
                    }
                    
                    this.updateDashboardMetrics();
                    this.showToast('Fleet deployed successfully!', 'success');
                    
                    // Clear form
                    document.getElementById('deployForm').reset();
                    document.getElementById('instanceCountValue').textContent = '3';
                    this.updateCostEstimate();
                    
                }, 1000);
            }
        };
        
        updateProgress();
    }
    
    handleStartScan() {
        const scanName = document.getElementById('scanName').value;
        const scanModule = document.getElementById('scanModule').value;
        const scanTargets = document.getElementById('scanTargets').value;
        const scanArgs = document.getElementById('scanArgs').value;
        
        const newScan = {
            id: Date.now(),
            name: scanName,
            module: scanModule,
            status: 'running',
            progress: 0,
            instances: this.instances.length,
            started: new Date().toISOString(),
            targets: scanTargets,
            args: scanArgs
        };
        
        this.scans.push(newScan);
        this.loadScansData();
        this.updateDashboardMetrics();
        this.showToast('Scan started successfully!', 'success');
        
        // Simulate scan progress
        this.simulateScanProgress(newScan.id);
        
        // Clear form
        document.getElementById('scanForm').reset();
    }
    
    simulateScanProgress(scanId) {
        const scan = this.scans.find(s => s.id === scanId);
        if (!scan) return;
        
        const updateProgress = () => {
            scan.progress += Math.random() * 15 + 5;
            
            if (scan.progress >= 100) {
                scan.progress = 100;
                scan.status = 'completed';
                this.updateDashboardMetrics();
                this.showToast(`Scan "${scan.name}" completed!`, 'success');
            } else {
                setTimeout(updateProgress, 2000 + Math.random() * 3000);
            }
            
            this.loadScansData();
        };
        
        setTimeout(updateProgress, 1000);
    }
    
    handleFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const fileType = document.getElementById('fileType').value;
        const targetFleet = document.getElementById('targetFleet').value;
        const distributeFile = document.getElementById('distributeFile').checked;
        
        if (fileInput.files.length === 0) {
            this.showToast('Please select files to upload', 'error');
            return;
        }
        
        Array.from(fileInput.files).forEach(file => {
            const uploadedFile = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: fileType,
                uploaded: new Date().toISOString(),
                fleet: targetFleet,
                distributed: distributeFile
            };
            
            this.files.push(uploadedFile);
        });
        
        this.loadFilesData();
        this.showToast(`${fileInput.files.length} file(s) uploaded successfully!`, 'success');
        
        // Clear form
        document.getElementById('uploadForm').reset();
    }
    
    handleFileSelection(files) {
        const fileInput = document.getElementById('fileInput');
        const dataTransfer = new DataTransfer();
        
        files.forEach(file => {
            dataTransfer.items.add(file);
        });
        
        fileInput.files = dataTransfer.files;
        
        // Update UI to show selected files
        const dragDropZone = document.getElementById('dragDropZone');
        const uploadText = dragDropZone.querySelector('.upload-text');
        uploadText.textContent = `${files.length} file(s) selected`;
    }
    
    // API Methods (these would make real API calls in production)
    healthCheck(controllerId) {
        const controller = this.controllers.find(c => c.id === controllerId);
        if (!controller) return;
        
        this.showToast('Checking controller health...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            controller.last_seen = new Date().toISOString();
            this.loadControllersData();
            this.showToast(`Controller ${controller.name} is healthy`, 'success');
        }, 1000);
    }
    
    connectSSH(controllerId) {
        this.showPage('terminal');
        setTimeout(() => {
            document.getElementById('controllerSelect').value = controllerId;
            this.connectToController(controllerId);
        }, 100);
    }
    
    sshToInstance(instanceName) {
        this.showToast(`Connecting to ${instanceName}...`, 'info');
        // In a real implementation, this would open SSH connection
    }
    
    executeCommand(instanceName) {
        const command = prompt('Enter command to execute:');
        if (command) {
            this.showToast(`Executing "${command}" on ${instanceName}...`, 'info');
        }
    }
    
    rebootInstance(instanceName) {
        this.showConfirmModal(
            'Reboot Instance',
            `Are you sure you want to reboot ${instanceName}?`,
            () => {
                this.showToast(`Rebooting ${instanceName}...`, 'info');
                // Update instance status
                const instance = this.instances.find(i => i.name === instanceName);
                if (instance) {
                    instance.status = 'starting';
                    instance.uptime = '0m';
                    this.loadInstancesData();
                    
                    // Simulate reboot completion
                    setTimeout(() => {
                        instance.status = 'running';
                        this.loadInstancesData();
                        this.showToast(`${instanceName} rebooted successfully`, 'success');
                    }, 5000);
                }
            }
        );
    }
    
    terminateInstance(instanceName) {
        this.showConfirmModal(
            'Terminate Instance',
            `Are you sure you want to terminate ${instanceName}? This action cannot be undone.`,
            () => {
                // Remove instance
                this.instances = this.instances.filter(i => i.name !== instanceName);
                this.loadInstancesData();
                this.updateDashboardMetrics();
                this.showToast(`${instanceName} terminated`, 'success');
            },
            'danger'
        );
    }
    
    stopScan(scanId) {
        const scan = this.scans.find(s => s.id === scanId);
        if (scan) {
            scan.status = 'stopped';
            this.loadScansData();
            this.updateDashboardMetrics();
            this.showToast(`Scan "${scan.name}" stopped`, 'info');
        }
    }
    
    downloadResults(scanId) {
        const scan = this.scans.find(s => s.id === scanId);
        if (scan) {
            this.showToast(`Downloading results for "${scan.name}"...`, 'info');
            // In a real implementation, this would trigger file download
        }
    }
    
    downloadFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            this.showToast(`Downloading ${file.name}...`, 'info');
        }
    }
    
    deleteFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            this.showConfirmModal(
                'Delete File',
                `Are you sure you want to delete ${file.name}?`,
                () => {
                    this.files = this.files.filter(f => f.id !== fileId);
                    this.loadFilesData();
                    this.showToast(`${file.name} deleted`, 'success');
                }
            );
        }
    }
    
    // Utility Methods
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    showConfirmModal(title, message, onConfirm, type = 'primary') {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        
        const confirmBtn = document.getElementById('modalConfirm');
        confirmBtn.className = `btn btn-${type === 'danger' ? 'danger' : 'primary'}`;
        
        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Add new listener
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideModal();
        });
        
        document.getElementById('modalOverlay').classList.remove('hidden');
    }
    
    hideModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
    }
    
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize the application
let atlas;
document.addEventListener('DOMContentLoaded', () => {
    atlas = new AtlasFramework();
    
    // Make atlas globally available for onclick handlers
    window.atlas = atlas;
});