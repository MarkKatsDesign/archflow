import { DollarSign, Zap, Wrench, TrendingUp } from 'lucide-react';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import type { Priority } from '../../../types/onboarding';
import { PRIORITY_LABELS } from '../../../types/onboarding';

interface PriorityOption {
  priority: Priority;
  icon: typeof DollarSign;
  color: string;
}

const priorityOptions: PriorityOption[] = [
  { priority: 'cost', icon: DollarSign, color: 'green' },
  { priority: 'performance', icon: Zap, color: 'yellow' },
  { priority: 'simplicity', icon: Wrench, color: 'blue' },
  { priority: 'scalability', icon: TrendingUp, color: 'purple' },
];

export function PrioritiesStep() {
  const { answers, setPriorities } = useOnboardingStore();

  const handleRankChange = (priority: Priority, rank: number) => {
    const current = answers.priorities || [];

    // Remove this priority from current rankings
    const withoutCurrent = current.filter((p) => p !== priority);

    // Insert at the specified rank (0-indexed)
    const newPriorities = [...withoutCurrent];
    newPriorities.splice(rank, 0, priority);

    // Ensure we only keep 4 priorities max
    setPriorities(newPriorities.slice(0, 4));
  };

  const getRank = (priority: Priority): number | null => {
    const index = answers.priorities?.indexOf(priority);
    return index !== undefined && index !== -1 ? index + 1 : null;
  };

  const getColorClasses = (color: string, isRanked: boolean) => {
    if (!isRanked) {
      return {
        border: 'border-gray-200',
        bg: 'bg-white',
        icon: 'text-gray-400',
        text: 'text-gray-900',
      };
    }

    const colors = {
      green: {
        border: 'border-green-500',
        bg: 'bg-green-50',
        icon: 'text-green-600',
        text: 'text-gray-900',
      },
      yellow: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        text: 'text-gray-900',
      },
      blue: {
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        text: 'text-gray-900',
      },
      purple: {
        border: 'border-purple-500',
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        text: 'text-gray-900',
      },
    };

    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-center">
        Click on each card to assign a rank (1-4). Higher rank = more important to you.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {priorityOptions.map(({ priority, icon: Icon, color }) => {
          const rank = getRank(priority);
          const isRanked = rank !== null;
          const colorClasses = getColorClasses(color, isRanked);

          return (
            <div key={priority} className="relative">
              <button
                onClick={() => {
                  // If already ranked, remove it; otherwise add to end
                  if (isRanked) {
                    const newPriorities = answers.priorities?.filter((p) => p !== priority) || [];
                    setPriorities(newPriorities);
                  } else {
                    handleRankChange(priority, answers.priorities?.length || 0);
                  }
                }}
                className={`w-full p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  isRanked ? `${colorClasses.border} ${colorClasses.bg} ring-2 ring-${color}-200` : `${colorClasses.border} ${colorClasses.bg} hover:border-gray-300`
                }`}
              >
                {isRanked && (
                  <div className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-${color}-600 text-white flex items-center justify-center font-bold text-sm`}>
                    {rank}
                  </div>
                )}
                <Icon className={`w-10 h-10 mx-auto mb-3 ${colorClasses.icon}`} />
                <h3 className={`font-semibold ${colorClasses.text} mb-1`}>
                  {PRIORITY_LABELS[priority].label}
                </h3>
                <p className="text-sm text-gray-600">{PRIORITY_LABELS[priority].description}</p>
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Click a card to rank it. Click again to unrank. Your top priority will have the most influence on recommendations.
      </p>
    </div>
  );
}
