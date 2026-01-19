'use client';

import { Check, Lock, Circle } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/wizard/constants';

interface WizardProgressProps {
    currentStep: number;
    completedSteps: boolean[];
    onStepClick?: (step: number) => void;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
    return (
        <div className="glass-panel rounded-2xl p-6 mb-8">
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
                {WIZARD_STEPS.map((step, index) => {
                    const isCompleted = completedSteps[index];
                    const isCurrent = currentStep === index;
                    const isLocked = index > 0 && !completedSteps[index - 1] && !isCurrent;
                    const canNavigate = !isLocked && (isCompleted || isCurrent || index === 0);

                    return (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            {/* Step Circle & Label */}
                            <button
                                onClick={() => canNavigate && onStepClick?.(index)}
                                disabled={isLocked}
                                className={`
                  flex flex-col items-center group transition-all duration-300
                  ${isLocked ? 'opacity-40 cursor-not-allowed' : canNavigate ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                `}
                                title={step.description}
                            >
                                {/* Circle */}
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                  ${isCompleted && !isCurrent
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : ''
                                    }
                  ${isCurrent
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20 scale-110'
                                        : ''
                                    }
                  ${!isCompleted && !isCurrent
                                        ? 'bg-slate-100 border-2 border-slate-200 text-slate-400'
                                        : ''
                                    }
                `}>
                                    {isCompleted && !isCurrent ? (
                                        <Check size={18} strokeWidth={3} />
                                    ) : isLocked ? (
                                        <Lock size={14} />
                                    ) : (
                                        <span className="text-sm font-bold">{index}</span>
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`
                  text-[9px] font-bold uppercase tracking-wider text-center max-w-[70px] leading-tight
                  ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}
                `}>
                                    {step.name}
                                </span>
                            </button>

                            {/* Connector Line */}
                            {index < WIZARD_STEPS.length - 1 && (
                                <div className="flex-1 mx-1 flex items-center justify-center px-1">
                                    <div className={`
                    w-full h-1 rounded-full transition-all duration-500
                    ${completedSteps[index] ? 'bg-emerald-400' : 'bg-slate-200'}
                  `} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current Step Description */}
            <div className="mt-6 pt-4 border-t border-slate-200/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <span className="text-sm font-bold">{currentStep}</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">{WIZARD_STEPS[currentStep]?.name}</h3>
                        <p className="text-xs text-slate-500">{WIZARD_STEPS[currentStep]?.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact version for mobile
export function WizardProgressCompact({ currentStep, completedSteps }: WizardProgressProps) {
    const completedCount = completedSteps.filter(Boolean).length;
    const progress = (completedCount / WIZARD_STEPS.length) * 100;

    return (
        <div className="glass-panel rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Step {currentStep + 1} of {WIZARD_STEPS.length}
                </span>
                <span className="text-xs font-semibold text-blue-600">
                    {completedCount} completed
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-3">
                <h3 className="font-semibold text-slate-900 text-sm">{WIZARD_STEPS[currentStep]?.name}</h3>
            </div>
        </div>
    );
}
