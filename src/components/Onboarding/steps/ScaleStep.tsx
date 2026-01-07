import { Rocket, TrendingUp, Building2, HelpCircle } from 'lucide-react';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import type { Scale } from '../../../types/onboarding';
import { SCALE_LABELS } from '../../../types/onboarding';

interface ScaleOption {
  scale: Scale;
  icon: typeof Rocket;
}

const scaleOptions: ScaleOption[] = [
  { scale: 'startup-mvp', icon: Rocket },
  { scale: 'growth', icon: TrendingUp },
  { scale: 'enterprise', icon: Building2 },
  { scale: 'unsure', icon: HelpCircle },
];

export function ScaleStep() {
  const { answers, setScale } = useOnboardingStore();

  const handleSelect = (scale: Scale) => {
    setScale(scale);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-center">
        This helps us recommend services that can handle your expected traffic and workload.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {scaleOptions.map(({ scale, icon: Icon }) => (
          <button
            key={scale}
            onClick={() => handleSelect(scale)}
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg text-center ${
              answers.scale === scale
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <Icon
              className={`w-10 h-10 mx-auto mb-3 ${
                answers.scale === scale ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900 mb-1">
              {SCALE_LABELS[scale].label}
            </h3>
            <p className="text-sm text-gray-600">{SCALE_LABELS[scale].description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
