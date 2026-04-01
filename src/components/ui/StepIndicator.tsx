'use client';

const steps = ['Badstu & dato', 'Tid & type', 'Betal'];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between mb-6 sm:mb-8 px-2">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30'
                    : isCompleted
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step}
              </div>
              <span className={`text-xs sm:text-sm text-center leading-tight ${isActive ? 'font-semibold text-[var(--color-brand)]' : 'text-stone-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 sm:mx-4 rounded-full mt-[-18px] ${isCompleted ? 'bg-[var(--color-brand)]' : 'bg-stone-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
