import { Cloud, Check } from 'lucide-react';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import type { ExistingSystem } from '../../../types/onboarding';
import { EXISTING_SYSTEM_LABELS } from '../../../types/onboarding';

const existingSystemOptions: ExistingSystem[] = [
  'aws',
  'gcp',
  'azure',
  'vercel',
  'netlify',
  'none',
];

export function ExistingSystemsStep() {
  const { answers, setExistingSystems } = useOnboardingStore();

  const handleToggle = (system: ExistingSystem) => {
    const current = answers.existingSystems || [];

    // If selecting "none", clear all others
    if (system === 'none') {
      setExistingSystems(['none']);
      return;
    }

    // If toggling other option while "none" is selected, remove "none"
    const withoutNone = current.filter((s) => s !== 'none');

    if (current.includes(system)) {
      // Remove this system
      const updated = withoutNone.filter((s) => s !== system);
      setExistingSystems(updated.length > 0 ? updated : ['none']);
    } else {
      // Add this system
      setExistingSystems([...withoutNone, system]);
    }
  };

  const isSelected = (system: ExistingSystem) => {
    return answers.existingSystems?.includes(system) || false;
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-center">
        Select any cloud providers or platforms you're already using. This helps us recommend compatible services.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {existingSystemOptions.map((system) => {
          const selected = isSelected(system);

          return (
            <button
              key={system}
              onClick={() => handleToggle(system)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg relative ${
                selected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {selected && (
                <div className="absolute top-3 right-3">
                  <Check className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <Cloud
                className={`w-8 h-8 mx-auto mb-3 ${
                  selected ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <h3 className="font-semibold text-gray-900 text-center">
                {EXISTING_SYSTEM_LABELS[system]}
              </h3>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Select multiple options or choose "None / Starting Fresh" if you're building from scratch.
      </p>
    </div>
  );
}
