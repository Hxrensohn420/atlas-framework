// Axiom API Integration for Atlas Framework
console.log('🔧 Loading Axiom API integration...');

window.axiomAPI = {
  baseURL: '/api/axiom',
  
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseURL}/health`);
      const data = await res.json();
      console.log('💚 Axiom Health:', data);
      return data;
    } catch (err) {
      console.error('❌ Health check failed:', err);
      return { success: false, error: err.message };
    }
  },
  
  async loadInstances() {
    try {
      const res = await fetch(`${this.baseURL}/instances`);
      const data = await res.json();
      
      if (!data.success) {
        console.error('❌ Failed to load instances:', data.error);
        return { success: false, error: data.error };
      }
      
      console.log('📦 Raw Axiom output:', data.output);
      
      // Parse axiom-ls table output
      const lines = data.output.split('\n').filter(l => l.trim());
      const instances = [];
      
      for (const line of lines) {
        // Skip headers and summary lines
        if (line.includes('Instance') || line.includes('Listing')) continue;
        if (line.includes('Total') || line.startsWith('_')) continue;
        if (line === 'N/A') continue;
        
        // Remove ANSI color codes
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        
        // Split by whitespace
        const parts = cleanLine.trim().split(/\s+/);
        
        if (parts.length >= 6 && !parts[0].includes('[')) {
          const instance = {
            id: parts[0],
            name: parts[0],
            publicIp: parts[1],
            privateIp: parts[2],
            region: parts[3],
            instanceType: parts[4],
            status: parts[5],
            costPerMonth: parseFloat(parts[6]) || 0,
            provider: 'AWS'
          };
          
          instances.push(instance);
          console.log('✅ Parsed instance:', instance);
        }
      }
      
      console.log(`🎯 Total instances parsed: ${instances.length}`);
      
      // Update global atlasData if it exists
      if (window.atlasData) {
        window.atlasData.axiomInstances = instances;
        console.log('💾 Updated atlasData.axiomInstances');
      }
      
      return { success: true, instances, raw: data.output };
    } catch (err) {
      console.error('❌ Failed to load instances:', err);
      return { success: false, error: err.message };
    }
  },
  
  async refresh() {
    console.log('🔄 Refreshing Axiom data...');
    const health = await this.checkHealth();
    const instances = await this.loadInstances();
    
    return { health, instances };
  }
};

// Auto-load on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auto-loading Axiom data...');
    window.axiomAPI.loadInstances();
  });
} else {
  console.log('🚀 Auto-loading Axiom data...');
  window.axiomAPI.loadInstances();
}

console.log('✅ Axiom API ready!');
console.log('💡 Try: await axiomAPI.loadInstances()');
console.log('💡 Try: await axiomAPI.checkHealth()');
console.log('💡 Try: await axiomAPI.refresh()');
