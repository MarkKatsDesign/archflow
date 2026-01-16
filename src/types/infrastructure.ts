import type { CostModel } from './service';

export type BoundaryZoneType =
  | 'vpc'
  | 'public-subnet'
  | 'private-subnet'
  | 'availability-zone'
  | 'network-zone'
  | 'public-zone'
  | 'private-zone'
  | 'dmz'
  | 'security-group'
  | 'nat-gateway';

export type ZoneProvider = 'AWS' | 'Generic';

export interface BoundaryZone {
  id: string;
  name: string;
  shortName: string;
  type: BoundaryZoneType;
  provider: ZoneProvider;
  description: string;
  color: string;
  borderStyle: 'dashed' | 'solid' | 'dotted';
  backgroundColor: string; // Semi-transparent RGBA
  costModel?: CostModel;
}
