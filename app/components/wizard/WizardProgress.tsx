'use client';

import { Check } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/wizard/constants';

interface WizardProgressProps {
    currentStep: number;
    completedSteps: boolean[];
    onStepClick: (step: number) => void;
}

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
    const completedCount = completedSteps.filter(Boolean).length;
    const progressPercent = Math.round((completedCount / WIZARD_STEPS.length) * 100);

    return (
        <div className="w-full mb-8">
            {/* Progress Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-5 shadow-sm">

                {/* Top Row: Step Info & Percentage */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Step {currentStep + 1} of {WIZARD_STEPS.length}
                        </p>
                        <h2 className="text-lg font-bold text-slate-800">
                            {WIZARD_STEPS[currentStep]?.name || 'Wizard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
                        <span className="text-xs text-slate-400 uppercase">Complete</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-between">
                    {WIZARD_STEPS.map((step, index) => {
                        const isCompleted = completedSteps[index];
                        const isActive = currentStep === index;
                        const isPast = index < currentStep;
                        const canClick = isCompleted || isActive || index === 0 || (index > 0 && completedSteps[index - 1]);

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-1.5">
                                {/* Step Circle */}
                                <button
                                    type="button"
                                    onClick={() => canClick && onStepClick(index)}
                                    disabled={!canClick}
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    border-2 transition-all duration-200
                    ${isActive
                                            ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20'
                                            : isCompleted || isPast
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'bg-white border-slate-200 text-slate-400'
                                        }
                    ${canClick && !isActive ? 'hover:scale-105 cursor-pointer' : ''}
                    ${!canClick ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                                >
                                    {(isCompleted || isPast) && !isActive ? (
                                        <Check size={14} strokeWidth={3} />
                                    ) : (
                                        <span>{index}</span>
                                    )}
                                </button>

                                {/* Step Label - Desktop Only */}
                                <span className={`
                  hidden lg:block text-[9px] font-semibold uppercase tracking-wide text-center
                  ${isActive ? 'text-blue-600' : isCompleted || isPast ? 'text-emerald-600' : 'text-slate-300'}
                `}>
                                    {step.name.length > 7 ? step.name.slice(0, 6) + '.' : step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
