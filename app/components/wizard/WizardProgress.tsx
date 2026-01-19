'use client';

import { Check } from 'lucide-react';

interface WizardProgressProps {
    currentStep: number;
    completedSteps: boolean[];
    onStepClick: (step: number) => void;
}

const STEPS = [
    { id: 0, label: 'Context', short: 'Ctx' },
    { id: 1, label: 'Scope', short: 'Scp' },
    { id: 2, label: 'Inventory', short: 'Inv' },
    { id: 3, label: 'Waste', short: 'Wst' },
    { id: 4, label: 'Factors', short: 'UF' },
    { id: 5, label: 'Period', short: 'Per' },
    { id: 6, label: 'Contingency', short: 'Cnt' },
    { id: 7, label: 'Results', short: 'Res' },
    { id: 8, label: 'Cashflow', short: 'CF' },
    { id: 9, label: 'Sensitivity', short: 'Sen' },
];

export function WizardProgress({ currentStep, completedSteps, onStepClick }: WizardProgressProps) {
    const completedCount = completedSteps.filter(Boolean).length;
    const progress = Math.round((completedCount / STEPS.length) * 100);

    return (
        <div className="w-full mb-8">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Step {currentStep + 1} of {STEPS.length}
                    </span>
                    <h2 className="text-lg font-black text-slate-800 leading-tight">
                        {STEPS[currentStep]?.label || 'Wizard'}
                    </h2>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-blue-600 leading-none">{progress}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complete</div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="relative">
                {/* Background Line */}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-200 rounded-full" />

                {/* Active Progress Line */}
                <div
                    className="absolute top-4 left-0 h-0.5 bg-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />

                {/* Step Indicators */}
                <div className="relative flex justify-between">
                    {STEPS.map((step) => {
                        const isCompleted = completedSteps[step.id];
                        const isActive = currentStep === step.id;
                        const canClick = isCompleted || isActive || step.id === 0 || completedSteps[step.id - 1];

                        // Build class string manually (no cn utility needed)
                        let circleClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 z-10 ';

                        if (isActive) {
                            circleClasses += 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30';
                        } else if (isCompleted) {
                            circleClasses += 'bg-emerald-500 border-emerald-500 text-white';
                        } else {
                            circleClasses += 'bg-white border-slate-200 text-slate-400';
                        }

                        if (canClick) {
                            circleClasses += ' cursor-pointer hover:scale-105';
                        } else {
                            circleClasses += ' cursor-not-allowed opacity-50';
                        }

                        let labelClasses = 'hidden sm:block text-[10px] font-bold uppercase tracking-wider mt-2 transition-colors ';
                        if (isActive) {
                            labelClasses += 'text-blue-600';
                        } else if (isCompleted) {
                            labelClasses += 'text-emerald-600';
                        } else {
                            labelClasses += 'text-slate-300';
                        }

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <button
                                    onClick={() => canClick && onStepClick(step.id)}
                                    disabled={!canClick}
                                    className={circleClasses}
                                    type="button"
                                    aria-label={`Go to step ${step.id + 1}: ${step.label}`}
                                >
                                    {isCompleted && !isActive ? (
                                        <Check size={14} strokeWidth={3} />
                                    ) : (
                                        <span>{step.id}</span>
                                    )}
                                </button>
                                <span className={labelClasses}>{step.short}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
