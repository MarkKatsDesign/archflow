import type { Node, Edge } from 'reactflow';
import type { Service } from './service';
import type { BoundaryZone } from './infrastructure';

// Service node data (existing)
export interface ServiceNodeData {
  service: Service;
  label: string;
}

// Group node data (new for Phase 9)
export interface GroupNodeData {
  zone: BoundaryZone;
  label: string;
}

// Service node - can have a parent group
export type ServiceNode = Node<ServiceNodeData> & {
  parentNode?: string;
  extent?: 'parent';
  expandParent?: boolean;
};

// Group node - resizable container for services
export type GroupNode = Node<GroupNodeData> & {
  type: 'group';
  style?: {
    width?: number;
    height?: number;
  };
};

// Union type for all node types
export type ArchNode = ServiceNode | GroupNode;

// Type guard for service nodes
export function isServiceNode(node: ArchNode): node is ServiceNode {
  return node.type !== 'group';
}

// Type guard for group nodes
export function isGroupNode(node: ArchNode): node is GroupNode {
  return node.type === 'group';
}

export type ServiceEdge = Edge;
