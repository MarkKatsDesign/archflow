import type { BoundaryZone } from '../types/infrastructure';

// Color palette for infrastructure zones
export const infrastructureColors = {
  vpc: '#6366f1', // Indigo
  publicSubnet: '#22c55e', // Green
  privateSubnet: '#3b82f6', // Blue
  availabilityZone: '#f59e0b', // Amber
  networkZone: '#8b5cf6', // Purple
  publicZone: '#10b981', // Emerald
  privateZone: '#0ea5e9', // Sky
  dmz: '#ef4444', // Red
  securityGroup: '#f97316', // Orange
  natGateway: '#14b8a6', // Teal
};

export const boundaryZones: BoundaryZone[] = [
  // AWS-specific zones
  {
    id: 'vpc',
    name: 'Virtual Private Cloud',
    shortName: 'VPC',
    type: 'vpc',
    provider: 'AWS',
    description: 'Isolated virtual network for AWS resources with full control over IP addressing, subnets, and routing',
    color: infrastructureColors.vpc,
    borderStyle: 'solid',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  {
    id: 'public-subnet',
    name: 'Public Subnet',
    shortName: 'Public Subnet',
    type: 'public-subnet',
    provider: 'AWS',
    description: 'Subnet with route to Internet Gateway for public-facing resources',
    color: infrastructureColors.publicSubnet,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  {
    id: 'private-subnet',
    name: 'Private Subnet',
    shortName: 'Private Subnet',
    type: 'private-subnet',
    provider: 'AWS',
    description: 'Subnet without direct internet access for internal resources',
    color: infrastructureColors.privateSubnet,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  {
    id: 'availability-zone',
    name: 'Availability Zone',
    shortName: 'AZ',
    type: 'availability-zone',
    provider: 'AWS',
    description: 'Isolated location within an AWS Region for high availability',
    color: infrastructureColors.availabilityZone,
    borderStyle: 'dotted',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  {
    id: 'security-group',
    name: 'Security Group',
    shortName: 'Security Group',
    type: 'security-group',
    provider: 'AWS',
    description: 'Virtual firewall controlling inbound and outbound traffic',
    color: infrastructureColors.securityGroup,
    borderStyle: 'dotted',
    backgroundColor: 'rgba(249, 115, 22, 0.06)',
  },
  {
    id: 'nat-gateway',
    name: 'NAT Gateway',
    shortName: 'NAT Gateway',
    type: 'nat-gateway',
    provider: 'AWS',
    description: 'Network address translation for private subnet internet access',
    color: infrastructureColors.natGateway,
    borderStyle: 'solid',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    costModel: {
      type: 'usage',
      baseCost: 32, // ~$0.045/hr * 720 hrs
      freeTierAvailable: false,
      estimatedMonthlyCost: { min: 32, max: 100 },
      lastUpdated: '2026-01',
      pricingUrl: 'https://aws.amazon.com/vpc/pricing/',
      confidence: 'high',
      assumptions: 'Base hourly cost (~$32/mo) plus data processing charges (~$0.045/GB)',
    },
  },
  // Generic/Cloud-agnostic zones
  {
    id: 'network-zone',
    name: 'Network Zone',
    shortName: 'Network Zone',
    type: 'network-zone',
    provider: 'Generic',
    description: 'Generic network boundary for organizing services',
    color: infrastructureColors.networkZone,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
  },
  {
    id: 'public-zone',
    name: 'Public Zone',
    shortName: 'Public Zone',
    type: 'public-zone',
    provider: 'Generic',
    description: 'Internet-facing network zone for public services',
    color: infrastructureColors.publicZone,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  {
    id: 'private-zone',
    name: 'Private Zone',
    shortName: 'Private Zone',
    type: 'private-zone',
    provider: 'Generic',
    description: 'Internal network zone for private services',
    color: infrastructureColors.privateZone,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  {
    id: 'dmz',
    name: 'DMZ',
    shortName: 'DMZ',
    type: 'dmz',
    provider: 'Generic',
    description: 'Demilitarized zone between public internet and private network',
    color: infrastructureColors.dmz,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
];
