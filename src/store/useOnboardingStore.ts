import { create } from 'zustand';
import type {
  OnboardingAnswers,
  WizardStep,
  ProjectType,
  Scale,
  BudgetRange,
  ExistingSystem,
  Priority,
} from '../types/onboarding';

interface OnboardingStore {
  // Wizard state
  isWizardOpen: boolean;
  currentStep: WizardStep;

  // User answers
  answers: OnboardingAnswers;

  // Wizard controls
  openWizard: () => void;
  closeWizard: () => void;
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Answer setters
  setProjectType: (type: ProjectType) => void;
  setScale: (scale: Scale) => void;
  setBudgetRange: (budget: BudgetRange) => void;
  setExistingSystems: (systems: ExistingSystem[]) => void;
  setPriorities: (priorities: Priority[]) => void;

  // Workflow
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Template selection
  selectedTemplateId: string | null;
  setSelectedTemplate: (templateId: string | null) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  isWizardOpen: false,
  currentStep: 1,
  selectedTemplateId: null,

  answers: {
    existingSystems: [],
    priorities: [],
    completed: false,
  },

  // Wizard controls
  openWizard: () => set({ isWizardOpen: true, currentStep: 1 }),

  closeWizard: () => set({ isWizardOpen: false }),

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 6) {
      set({ currentStep: (currentStep + 1) as WizardStep });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as WizardStep });
    }
  },

  // Answer setters
  setProjectType: (projectType) =>
    set({ answers: { ...get().answers, projectType } }),

  setScale: (scale) => set({ answers: { ...get().answers, scale } }),

  setBudgetRange: (budgetRange) =>
    set({ answers: { ...get().answers, budgetRange } }),

  setExistingSystems: (existingSystems) =>
    set({ answers: { ...get().answers, existingSystems } }),

  setPriorities: (priorities) =>
    set({ answers: { ...get().answers, priorities } }),

  // Workflow
  completeOnboarding: () => {
    const answers = {
      ...get().answers,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    set({
      answers,
      isWizardOpen: false,
    });

    // Store in localStorage
    localStorage.setItem('archflow_has_completed_onboarding', 'true');
    localStorage.setItem('archflow_onboarding_answers', JSON.stringify(answers));
  },

  resetOnboarding: () => {
    set({
      currentStep: 1,
      answers: {
        existingSystems: [],
        priorities: [],
        completed: false,
      },
      selectedTemplateId: null,
    });

    // Clear localStorage
    localStorage.removeItem('archflow_has_completed_onboarding');
    localStorage.removeItem('archflow_onboarding_answers');
  },

  // Template selection
  setSelectedTemplate: (templateId) => set({ selectedTemplateId: templateId }),
}));
