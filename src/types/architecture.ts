import type { Node, Edge } from 'reactflow';
import type { Service } from './service';

export interface ServiceNodeData {
  service: Service;
  label: string;
}

export type ServiceNode = Node<ServiceNodeData>;

export type ServiceEdge = Edge;
