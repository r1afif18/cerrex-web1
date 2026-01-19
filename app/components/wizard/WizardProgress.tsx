'use client';

import { Check, Circle } from 'lucide-react';

interface WizardProgressProps {
    currentStep: number;
    completedSteps: boolean[];
    onStepClick: (step: number) => void;
}

const STEPS = [
    { id: 0, label: 'Context', short: 'Ctx' },
    { id: 1, label: 'Scope', short: 'Scope' },
    { id: 2, label: 'Inv', short: 'Inv' },
    { id: 3, label: 'Waste', short: 'Wst' },
    { id: 4, label: 'Factors', short: 'UF' },
    { id: 5, label: 'Period', short: 'Per' },
    { id: 6, label: 'Cont', short: 'Cont' },
    { id: 7, label: 'Res', short: 'Res' },
    { id: 8, label: 'Cash', short: 'CF' },
    { id: 9, label: 'Sens', short: 'Sens' },
];

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
    {
        isCompleted && !isCurrent ? (
            <Check size={18} strokeWidth={3} />
        ) : isLocked ? (
            <Lock size={14} className="opacity-70" />
        ) : (
        <span className="text-sm font-bold font-mono">{index}</span>
    )
    }
                                    </div >

        {/* Label */ }
        < div className = "flex flex-col items-center text-center" >
            <span className={cn(
                "text-[10px] uppercase tracking-wider font-bold transition-colors duration-300",
                isCurrent ? "text-blue-600 dark:text-blue-400 translate-y-0 opacity-100" :
                    isCompleted ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-slate-500",
                // Hide ineffective labels on small screens or when inactive to reduce clutter
                !isCurrent && "hidden md:block" // Always show on MD screens, hide inactive on mobile
            )}>
                {step.name}
            </span>

    {/* Active Indicator Dot for current step */ }
    {
        isCurrent && (
            <span className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse" />
        )
    }
                                    </div >
                                </button >
                            </div >
                        );
})}
                </div >
            </div >
        </div >
    );
}

// Compact version remains for minimal contexts
export function WizardProgressCompact({ currentStep, completedSteps }: WizardProgressProps) {
    const completedCount = completedSteps.filter(Boolean).length;
    const progress = (completedCount / WIZARD_STEPS.length) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto mb-6">
            <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex justify-between text-xs mb-2 font-medium text-slate-500">
                        <span>Step {currentStep + 1} of {WIZARD_STEPS.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {WIZARD_STEPS[currentStep]?.name}
                    </span>
                </div>
            </div>
        </div>
    );
}
