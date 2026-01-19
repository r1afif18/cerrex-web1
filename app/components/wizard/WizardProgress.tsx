'use client';

import { Check, Lock } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/wizard/constants';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
    currentStep: number;
    completedSteps: boolean[];
    onStepClick?: (step: number) => void;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
    return (
        <div className="w-full max-w-6xl mx-auto mb-8">
            <div className="glass-panel glass-panel-dark rounded-2xl p-6 relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20" />

                {/* Steps Container */}
                <div className="flex items-center justify-between px-2 pt-2">
                    {WIZARD_STEPS.map((step, index) => {
                        const isCompleted = completedSteps[index];
                        const isCurrent = currentStep === index;
                        // Lock logic: locked if not current, not completed, and previous not completed
                        const isLocked = index > 0 && !completedSteps[index - 1] && !isCurrent && !isCompleted;
                        const canNavigate = !isLocked && (isCompleted || isCurrent || index === 0);

                        return (
                            <div key={step.id} className="flex-1 flex flex-col items-center relative group last:flex-none last:w-auto">
                                {/* Connector Line (Absolute to allow perfect centering) */}
                                {index < WIZARD_STEPS.length - 1 && (
                                    <div className="absolute top-5 left-[55%] w-[calc(100%-10%)] h-[2px] -z-10">
                                        <div className={cn(
                                            "h-full w-full transition-colors duration-500 rounded-full",
                                            isCompleted ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                                        )} />
                                    </div>
                                )}

                                <button
                                    onClick={() => canNavigate && onStepClick?.(index)}
                                    disabled={isLocked}
                                    className={cn(
                                        "relative flex flex-col items-center gap-3 transition-all duration-300 outline-none",
                                        isLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:-translate-y-1"
                                    )}
                                >
                                    {/* Circle Indicator */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border-[1.5px]",
                                        isCompleted && !isCurrent && "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20",
                                        isCurrent && "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/10 scale-110",
                                        !isCompleted && !isCurrent && "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                                    )}>
                                        {isCompleted && !isCurrent ? (
                                            <Check size={18} strokeWidth={3} />
                                        ) : isLocked ? (
                                            <Lock size={14} className="opacity-70" />
                                        ) : (
                                            <span className="text-sm font-bold font-mono">{index}</span>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="flex flex-col items-center text-center">
                                        <span className={cn(
                                            "text-[10px] uppercase tracking-wider font-bold transition-colors duration-300",
                                            isCurrent ? "text-blue-600 dark:text-blue-400 translate-y-0 opacity-100" :
                                                isCompleted ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-slate-500",
                                            // Hide ineffective labels on small screens or when inactive to reduce clutter
                                            !isCurrent && "hidden md:block" // Always show on MD screens, hide inactive on mobile
                                        )}>
                                            {step.name}
                                        </span>

                                        {/* Active Indicator Dot for current step */}
                                        {isCurrent && (
                                            <span className="w-1 h-1 bg-blue-600 rounded-full mt-1 animate-pulse" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
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
