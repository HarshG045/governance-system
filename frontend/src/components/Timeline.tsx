interface TimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  remarks?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="relative pb-8">
            {!isLast && (
              <div
                className="absolute left-4 top-8 w-0.5 h-full -ml-px"
                style={{
                  backgroundColor: step.status === 'completed' ? 'var(--primary-blue)' : 'var(--border-color)'
                }}
              />
            )}

            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step.status === 'completed' ? 'bg-[var(--primary-blue)] text-white' : ''}
                  ${step.status === 'current' ? 'bg-[var(--mid-blue)] text-white ring-4 ring-[var(--light-blue-tint)]' : ''}
                  ${step.status === 'pending' ? 'bg-[var(--section-bg)] text-[var(--text-muted)] border-2 border-[var(--border-color)]' : ''}
                `}
              >
                {step.status === 'completed' ? '✓' : idx + 1}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${step.status === 'pending' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {step.label}
                  </span>
                  {step.date && (
                    <span className="text-xs text-[var(--text-hint)]">{step.date}</span>
                  )}
                </div>
                {step.remarks && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{step.remarks}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
