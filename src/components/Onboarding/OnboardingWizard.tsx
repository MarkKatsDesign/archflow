import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { ProjectTypeStep } from './steps/ProjectTypeStep';
import { ScaleStep } from './steps/ScaleStep';
import { BudgetStep } from './steps/BudgetStep';
import { ExistingSystemsStep } from './steps/ExistingSystemsStep';
import { PrioritiesStep } from './steps/PrioritiesStep';
import { TemplatePreviewStep } from './steps/TemplatePreviewStep';

// Progress bar component
function ProgressBar({ currentStep }: { currentStep: number }) {
  const totalSteps = 6;

  return (
    <div className="flex gap-2 mb-4">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div
            key={index}
            className={`flex-1 h-2 rounded-full transition-all ${
              isCompleted ? 'bg-blue-500' : isCurrent ? 'bg-blue-300' : 'bg-gray-200'
            }`}
          />
        );
      })}
    </div>
  );
}

// Skip confirmation dialog
function SkipConfirmation({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60">
      <div className="bg-white rounded-xl shadow-2xl max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Skip Onboarding?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to skip? We can help you find the best architecture template
              based on your needs.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Continue Wizard
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Skip and Start from Scratch
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const { isWizardOpen, currentStep, closeWizard, nextStep, prevStep } = useOnboardingStore();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isWizardOpen) return;

      if (e.key === 'Escape') {
        if (currentStep > 1) {
          setShowSkipConfirm(true);
        } else {
          closeWizard();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWizardOpen, currentStep, closeWizard]);

  const handleSkip = () => {
    if (currentStep === 1) {
      // Allow skipping from first step without confirmation
      closeWizard();
    } else {
      setShowSkipConfirm(true);
    }
  };

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    closeWizard();
  };

  const cancelSkip = () => {
    setShowSkipConfirm(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProjectTypeStep />;
      case 2:
        return <ScaleStep />;
      case 3:
        return <BudgetStep />;
      case 4:
        return <ExistingSystemsStep />;
      case 5:
        return <PrioritiesStep />;
      case 6:
        return <TemplatePreviewStep />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'What type of project are you building?';
      case 2:
        return 'What scale do you expect?';
      case 3:
        return 'What\'s your budget range?';
      case 4:
        return 'Do you have existing infrastructure?';
      case 5:
        return 'What are your priorities?';
      case 6:
        return 'Choose your architecture template';
      default:
        return '';
    }
  };

  return (
    <>
      <Dialog.Root open={isWizardOpen} onOpenChange={closeWizard}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-linear-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-3">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Let's Design Your Architecture
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </Dialog.Close>
              </div>
              <ProgressBar currentStep={currentStep} />
              <p className="text-sm text-gray-600 mt-2">{getStepTitle()}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">{renderStep()}</div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex gap-3">
                {currentStep < 6 && (
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Skip
                  </button>
                )}
                {currentStep < 6 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {showSkipConfirm && <SkipConfirmation onConfirm={confirmSkip} onCancel={cancelSkip} />}
    </>
  );
}

// Add missing import
import { useState } from 'react';
