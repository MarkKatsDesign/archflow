import { useMemo } from 'react';
import { useArchitectureStore } from '../store/useArchitectureStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { isServiceNode } from '../types/architecture';
import type { Service, Category } from '../types/service';
import type { Scale, BudgetRange } from '../types/onboarding';

export interface ServiceCost {
  service: Service;
  scaledMin: number;
  scaledMax: number;
  baseCost: number;
  isFreeTier: boolean;
}

export interface CategoryCost {
  category: Category;
  services: ServiceCost[];
  totalMin: number;
  totalMax: number;
}

export interface CostEstimate {
  totalMin: number;
  totalMax: number;
  scale: Scale;
  categoryBreakdowns: CategoryCost[];
  servicesWithCosts: number;
  servicesWithoutCosts: number;
  hasExceededBudget: boolean;
  budgetStatus: 'ok' | 'warning' | 'exceeded';
  budgetRange?: BudgetRange;
}

// Budget thresholds in USD/month
const BUDGET_THRESHOLDS: Record<BudgetRange, number> = {
  'free-tier': 0,
  'minimal': 50,
  'moderate': 500,
  'flexible': 5000,
  'enterprise': Infinity,
  'unsure': Infinity,
};

/**
 * Calculates scaled cost based on scale tier and service scaling factor
 * Formula: baseCost * (scalingFactor ^ scaleExponent)
 */
function calculateScaledCost(
  baseCost: number,
  scalingFactor: number,
  scale: Scale
): number {
  if (scale === 'startup-mvp' || scale === 'unsure') {
    return baseCost;
  }

  if (scale === 'growth') {
    return baseCost * scalingFactor;
  }

  if (scale === 'enterprise') {
    return baseCost * scalingFactor * scalingFactor;
  }

  return baseCost;
}

export function useCostCalculator(): CostEstimate {
  const { nodes } = useArchitectureStore();
  const { answers } = useOnboardingStore();

  // Default to startup-mvp if not set
  const scale: Scale = answers.scale || 'startup-mvp';
  const budgetRange = answers.budgetRange;

  return useMemo(() => {
    // Get all services from canvas (filter out group nodes)
    const canvasServices = nodes.filter(isServiceNode).map((node) => node.data.service);

    // Separate services with and without cost data
    const servicesWithCosts = canvasServices.filter((s) => s.costModel);
    const servicesWithoutCosts = canvasServices.filter((s) => !s.costModel);

    // Calculate costs for each service
    const serviceCosts: ServiceCost[] = servicesWithCosts.map((service) => {
      const costModel = service.costModel!;
      const scalingFactor = costModel.scalingFactor || 1;

      // If service has estimatedMonthlyCost, use that with scaling
      if (costModel.estimatedMonthlyCost) {
        const scaledMin = calculateScaledCost(
          costModel.estimatedMonthlyCost.min,
          scalingFactor,
          scale
        );
        const scaledMax = calculateScaledCost(
          costModel.estimatedMonthlyCost.max,
          scalingFactor,
          scale
        );

        return {
          service,
          scaledMin,
          scaledMax,
          baseCost: costModel.baseCost || 0,
          isFreeTier: costModel.freeTierAvailable && scaledMin === 0,
        };
      }

      // Fallback to baseCost if no estimatedMonthlyCost
      if (costModel.baseCost !== undefined) {
        const scaledCost = calculateScaledCost(
          costModel.baseCost,
          scalingFactor,
          scale
        );

        return {
          service,
          scaledMin: scaledCost,
          scaledMax: scaledCost,
          baseCost: costModel.baseCost,
          isFreeTier: costModel.freeTierAvailable && scaledCost === 0,
        };
      }

      // Last resort: return zeros
      return {
        service,
        scaledMin: 0,
        scaledMax: 0,
        baseCost: 0,
        isFreeTier: costModel.freeTierAvailable,
      };
    });

    // Group by category
    const categoryMap = new Map<Category, ServiceCost[]>();

    serviceCosts.forEach((sc) => {
      const category = sc.service.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(sc);
    });

    // Calculate category totals
    const categoryBreakdowns: CategoryCost[] = Array.from(categoryMap.entries()).map(
      ([category, services]) => {
        const totalMin = services.reduce((sum, sc) => sum + sc.scaledMin, 0);
        const totalMax = services.reduce((sum, sc) => sum + sc.scaledMax, 0);

        return {
          category,
          services,
          totalMin,
          totalMax,
        };
      }
    );

    // Sort categories by total cost (descending)
    categoryBreakdowns.sort((a, b) => b.totalMax - a.totalMax);

    // Calculate total costs
    const totalMin = categoryBreakdowns.reduce((sum, cb) => sum + cb.totalMin, 0);
    const totalMax = categoryBreakdowns.reduce((sum, cb) => sum + cb.totalMax, 0);

    // Determine budget status
    let budgetStatus: 'ok' | 'warning' | 'exceeded' = 'ok';
    let hasExceededBudget = false;

    if (budgetRange && budgetRange !== 'unsure') {
      const threshold = BUDGET_THRESHOLDS[budgetRange];

      if (totalMax > threshold) {
        budgetStatus = 'exceeded';
        hasExceededBudget = true;
      } else if (totalMax >= threshold * 0.8) {
        budgetStatus = 'warning';
      }
    }

    return {
      totalMin,
      totalMax,
      scale,
      categoryBreakdowns,
      servicesWithCosts: servicesWithCosts.length,
      servicesWithoutCosts: servicesWithoutCosts.length,
      hasExceededBudget,
      budgetStatus,
      budgetRange,
    };
  }, [nodes, scale, budgetRange]);
}
