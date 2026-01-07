import { useOnboardingStore } from '../../../store/useOnboardingStore';
import type { BudgetRange } from '../../../types/onboarding';
import { BUDGET_LABELS } from '../../../types/onboarding';

const budgetOptions: BudgetRange[] = [
  'free-tier',
  'minimal',
  'moderate',
  'flexible',
  'enterprise',
  'unsure',
];

export function BudgetStep() {
  const { answers, setBudgetRange } = useOnboardingStore();

  const handleSelect = (budget: BudgetRange) => {
    setBudgetRange(budget);
  };

  const getDollarSymbols = (budget: BudgetRange) => {
    switch (budget) {
      case 'free-tier':
        return '✓';
      case 'minimal':
        return '$';
      case 'moderate':
        return '$$';
      case 'flexible':
        return '$$$';
      case 'enterprise':
        return '$$$$';
      case 'unsure':
        return '?';
      default:
        return '$';
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-center">
        Let us know your monthly infrastructure budget so we can recommend cost-appropriate services.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {budgetOptions.map((budget) => (
          <button
            key={budget}
            onClick={() => handleSelect(budget)}
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg text-center ${
              answers.budgetRange === budget
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div
              className={`text-3xl font-bold mb-2 ${
                answers.budgetRange === budget ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {getDollarSymbols(budget)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {BUDGET_LABELS[budget].label}
            </h3>
            <p className="text-sm text-gray-600">{BUDGET_LABELS[budget].description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
