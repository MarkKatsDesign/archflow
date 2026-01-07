import { Store, ShoppingCart, Database, Smartphone, Brain, FileText, Zap, Box } from 'lucide-react';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import type { ProjectType } from '../../../types/onboarding';
import { PROJECT_TYPE_LABELS } from '../../../types/onboarding';

interface ProjectTypeOption {
  type: ProjectType;
  icon: typeof Store;
  description: string;
}

const projectOptions: ProjectTypeOption[] = [
  {
    type: 'saas',
    icon: Store,
    description: 'Web application with recurring subscription model',
  },
  {
    type: 'ecommerce',
    icon: ShoppingCart,
    description: 'Online store with product catalog and payments',
  },
  {
    type: 'data-pipeline',
    icon: Database,
    description: 'ETL, analytics, and data processing workflows',
  },
  {
    type: 'mobile-backend',
    icon: Smartphone,
    description: 'API and services for mobile applications',
  },
  {
    type: 'ai-ml',
    icon: Brain,
    description: 'Machine learning models and AI services',
  },
  {
    type: 'content-site',
    icon: FileText,
    description: 'Marketing site, blog, or content platform',
  },
  {
    type: 'real-time-app',
    icon: Zap,
    description: 'Chat, collaboration, or live-streaming app',
  },
  {
    type: 'microservices',
    icon: Box,
    description: 'Distributed services architecture',
  },
];

export function ProjectTypeStep() {
  const { answers, setProjectType } = useOnboardingStore();

  const handleSelect = (type: ProjectType) => {
    setProjectType(type);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-center">
        Choose the option that best describes your project. This helps us recommend the right services.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {projectOptions.map(({ type, icon: Icon, description }) => (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg text-left ${
              answers.projectType === type
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <Icon
              className={`w-8 h-8 mb-3 ${
                answers.projectType === type ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900 mb-2">
              {PROJECT_TYPE_LABELS[type]}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
