import { useMemo } from 'react';
import { useArchitectureStore } from '../store/useArchitectureStore';
import { isServiceNode } from '../types/architecture';
import type { Service } from '../types/service';
import { services as allServiceDefinitions } from '../data/services';

export interface CompatibilityStatus {
  isCompatible: boolean;
  isRecommended: boolean;
  isIncompatible: boolean;
  reason?: string;
}

// Full-stack platforms that have backend capabilities (serverless functions, edge workers, etc.)
const FULL_STACK_PLATFORMS = new Set([
  'vercel',
  'netlify',
  'cloudflare-pages',
]);

// Create a lookup map for current service definitions
const serviceDefinitionMap = new Map(
  allServiceDefinitions.map((s) => [s.id, s])
);

export function useCompatibility() {
  const { nodes } = useArchitectureStore();

  // Get all services currently on the canvas (filter out group nodes)
  const canvasServices = useMemo(() => {
    return nodes.filter(isServiceNode).map((node) => node.data.service);
  }, [nodes]);

  const canvasServiceIds = useMemo(() => {
    return new Set(canvasServices.map((s) => s.id));
  }, [canvasServices]);

  // Check compatibility for a given service
  const checkCompatibility = (service: Service): CompatibilityStatus => {
    if (canvasServices.length === 0) {
      return {
        isCompatible: true,
        isRecommended: false,
        isIncompatible: false,
      };
    }

    let isIncompatible = false;
    let isRecommended = false;
    let reason: string | undefined;

    // Check for incompatibilities
    for (const canvasService of canvasServices) {
      // Check if canvas service marks this as incompatible
      if (canvasService.incompatibleWith?.includes(service.id)) {
        isIncompatible = true;
        reason = `Incompatible with ${canvasService.name}`;
        break;
      }

      // Check if this service marks canvas service as incompatible
      if (service.incompatibleWith?.includes(canvasService.id)) {
        isIncompatible = true;
        reason = `Incompatible with ${canvasService.name}`;
        break;
      }
    }

    // Check for recommendations (if compatible)
    if (!isIncompatible) {
      for (const canvasService of canvasServices) {
        // Check if canvas service recommends this
        if (canvasService.compatibleWith?.includes(service.id)) {
          isRecommended = true;
          reason = `Works well with ${canvasService.name}`;
          break;
        }

        // Check if this service recommends canvas service
        if (service.compatibleWith?.includes(canvasService.id)) {
          isRecommended = true;
          reason = `Works well with ${canvasService.name}`;
          break;
        }
      }
    }

    return {
      isCompatible: !isIncompatible,
      isRecommended,
      isIncompatible,
      reason,
    };
  };

  // Get recommended services based on canvas state
  const getRecommendations = (allServices: Service[]): Service[] => {
    if (canvasServices.length === 0) return [];

    const recommendations = new Set<string>();

    canvasServices.forEach((canvasService) => {
      // Add all compatible services as recommendations
      canvasService.compatibleWith?.forEach((serviceId: string) => {
        // Only recommend if not already on canvas
        if (!canvasServiceIds.has(serviceId)) {
          recommendations.add(serviceId);
        }
      });
    });

    return allServices.filter((s) => recommendations.has(s.id));
  };

  // Detect missing requirements and anti-patterns
  const getWarnings = (): string[] => {
    const warnings: string[] = [];

    // Check if we have a full-stack platform (counts as having backend)
    const hasFullStackPlatform = canvasServices.some((s) =>
      FULL_STACK_PLATFORMS.has(s.id)
    );

    canvasServices.forEach((service) => {
      // Look up the CURRENT service definition to get up-to-date requiresOneOf values
      // This ensures imported JSON files with stale requirements still validate correctly
      const currentDefinition = serviceDefinitionMap.get(service.id);
      const requiresOneOf = currentDefinition?.requiresOneOf ?? service.requiresOneOf;

      // Check if service requires at least one of certain services
      if (requiresOneOf && requiresOneOf.length > 0) {
        const hasRequired = requiresOneOf.some((reqId: string) =>
          canvasServiceIds.has(reqId)
        );

        // Also check if we have a full-stack platform that can satisfy backend requirements
        const requiresBackend = requiresOneOf.some((reqId: string) => {
          const reqService = canvasServices.find((s) => s.id === reqId);
          return reqService?.category === 'Backend';
        });

        const canBeMetByFullStack = requiresBackend && hasFullStackPlatform;

        if (!hasRequired && !canBeMetByFullStack) {
          warnings.push(
            `${service.name} requires at least one of: ${requiresOneOf.join(', ')}`
          );
        }
      }
    });

    // Anti-pattern: Database without backend
    const hasDatabaseCategory = canvasServices.some(
      (s) => s.category === 'Database'
    );
    const hasBackendCategory = canvasServices.some(
      (s) => s.category === 'Backend'
    );

    // Only warn if no backend AND no full-stack platform
    if (hasDatabaseCategory && !hasBackendCategory && !hasFullStackPlatform) {
      warnings.push(
        'Consider adding a Backend service or full-stack platform (Vercel, Netlify) to access your database securely'
      );
    }

    // Anti-pattern: Backend without database or storage (for non-trivial apps)
    // Only warn if we have explicit Backend category (not full-stack platforms)
    // Storage services (like S3) can serve as persistent storage for ML/data pipelines
    const hasStorageCategory = canvasServices.some(
      (s) => s.category === 'Storage'
    );
    if (hasBackendCategory && !hasDatabaseCategory && !hasStorageCategory && canvasServices.length > 2) {
      warnings.push(
        'Most applications need a Database for persistent storage'
      );
    }

    return warnings;
  };

  return {
    checkCompatibility,
    getRecommendations,
    getWarnings,
    canvasServices,
  };
}
