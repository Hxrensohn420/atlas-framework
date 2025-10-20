// Mock VPN Nodes for quick development
const mockVPNNodes = [
  {
    id: 1,
    provider: 'DigitalOcean',
    region: 'nyc3',
    instance_type: 's-1vcpu-1gb',
    public_ip: '167.99.123.45',
    status: 'active',
    location: 'New York, US',
    coordinates: [40.7128, -74.0060],
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    provider: 'DigitalOcean',
    region: 'lon1',
    instance_type: 's-1vcpu-1gb',
    public_ip: '178.62.45.123',
    status: 'active',
    location: 'London, UK',
    coordinates: [51.5074, -0.1278],
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    provider: 'AWS',
    region: 'ap-northeast-1',
    instance_type: 't3.micro',
    public_ip: '54.199.23.67',
    status: 'inactive',
    location: 'Tokyo, JP',
    coordinates: [35.6762, 139.6503],
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    provider: 'DigitalOcean',
    region: 'sfo3',
    instance_type: 's-1vcpu-1gb',
    public_ip: '159.89.12.34',
    status: 'active',
    location: 'San Francisco, US',
    coordinates: [37.7749, -122.4194],
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    provider: 'AWS',
    region: 'eu-west-1',
    instance_type: 't3.micro',
    public_ip: '34.242.89.12',
    status: 'active',
    location: 'Frankfurt, DE',
    coordinates: [50.1109, 8.6821],
    created_at: new Date().toISOString()
  }
];

module.exports = { mockVPNNodes };
