'use client';

const steps = ['Velg badstu', 'Velg tid', 'Bekreft'];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-px ${isCompleted ? 'bg-[var(--color-brand)]' : 'bg-stone-300'}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive
                    ? 'bg-[var(--color-brand)] text-white'
                    : isCompleted
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'font-medium' : 'text-stone-500'}`}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
