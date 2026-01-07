import { useMemo } from 'react';
import { templates } from '../data/templates';
import { useOnboardingStore } from '../store/useOnboardingStore';
import type { TemplateMatch } from '../types/template';

export function useTemplateMatching(): TemplateMatch[] {
  const { answers } = useOnboardingStore();

  return useMemo(() => {
    const matches: TemplateMatch[] = templates.map((template) => {
      let score = 0;
      const matchReasons: string[] = [];

      // Project type match (40 points max)
      if (answers.projectType && template.projectTypes.includes(answers.projectType)) {
        score += 40;
        matchReasons.push('Perfect match for your project type');
      }

      // Scale compatibility (20 points max)
      if (answers.scale && template.idealScale.includes(answers.scale)) {
        score += 20;
        matchReasons.push('Scales to your expected traffic');
      } else if (answers.scale === 'unsure') {
        // Give some points if user is unsure
        score += 10;
      }

      // Budget alignment (20 points max)
      if (answers.budgetRange && template.budgetCompatible.includes(answers.budgetRange)) {
        score += 20;
        matchReasons.push('Fits within your budget');
      } else if (answers.budgetRange === 'unsure') {
        score += 10;
      }

      // Provider preference (10 points max)
      if (answers.existingSystems.length > 0 && !answers.existingSystems.includes('none')) {
        // Check if template services match existing systems
        // Simple check: if any existing system is mentioned in template description
        const hasMatchingProvider = answers.existingSystems.some((system) => {
          if (system === 'aws') {
            return template.nodes.some((node) => node.data.service.id.startsWith('aws-'));
          }
          return template.id.toLowerCase().includes(system);
        });

        if (hasMatchingProvider) {
          score += 10;
          matchReasons.push('Integrates with your existing infrastructure');
        }
      } else if (answers.existingSystems.includes('none')) {
        // Starting fresh - give points to simpler templates
        if (template.complexity <= 2) {
          score += 10;
          matchReasons.push('Good starting point for new projects');
        }
      }

      // Priority alignment (10 points max)
      if (answers.priorities.length > 0) {
        const topPriority = answers.priorities[0];

        if (topPriority === 'cost' && template.estimatedMonthlyCost.max <= 50) {
          score += 10;
          matchReasons.push('Cost-effective solution');
        } else if (topPriority === 'simplicity' && template.complexity <= 2) {
          score += 10;
          matchReasons.push('Simple to set up and maintain');
        } else if (topPriority === 'scalability' && template.idealScale.includes('enterprise')) {
          score += 10;
          matchReasons.push('Built to scale');
        } else if (topPriority === 'performance') {
          score += 5; // All templates perform reasonably well
          matchReasons.push('Optimized for performance');
        }
      }

      return {
        template,
        score,
        matchReasons,
      };
    });

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  }, [answers]);
}
