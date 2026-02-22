import React from 'react';

interface WizardStepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = React.memo(({ steps, currentStep }) => (
  <div className="flex items-center gap-2 mb-6">
    {steps.map((label, index) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
            index <= currentStep ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {index + 1}
        </div>
        <span className={`text-sm ${index <= currentStep ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-400'}`}>
          {label}
        </span>
        {index < steps.length - 1 && <div className="w-8 h-px bg-neutral-300" />}
      </div>
    ))}
  </div>
));

WizardStepIndicator.displayName = 'WizardStepIndicator';
