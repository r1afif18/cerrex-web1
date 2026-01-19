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
    const progress = Math.round((completedCount / WIZARD_STEPS.length) * 100);

    return (
        <div className="w-full max-w-5xl mx-auto mb-8">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
                {/* Top Gradient Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20" />

                {/* Header: Progress Info */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Step {currentStep + 1} of {WIZARD_STEPS.length}
                        </span>
                        <h2 className="text-xl font-black text-slate-800 leading-tight">
                            {WIZARD_STEPS[currentStep]?.name || 'Wizard'}
                        </h2>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-blue-600 leading-none">{progress}%</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complete</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between">
                    {WIZARD_STEPS.map((step, index) => {
                        const isCompleted = completedSteps[index];
                        const isActive = currentStep === index;
                        const canNavigate = isCompleted || isActive || index === 0 || completedSteps[index - 1];

                        // Circle styling
                        let circleStyle = '';
                        if (isActive) {
                            circleStyle = 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110';
                        } else if (isCompleted) {
                            circleStyle = 'bg-emerald-500 border-emerald-500 text-white';
                        } else {
                            circleStyle = 'bg-white border-slate-200 text-slate-400';
                        }

                        // Label styling
                        let labelStyle = '';
                        if (isActive) {
                            labelStyle = 'text-blue-600 font-bold';
                        } else if (isCompleted) {
                            labelStyle = 'text-emerald-600';
                        } else {
                            labelStyle = 'text-slate-400';
                        }

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <button
                                    onClick={() => canNavigate && onStepClick(index)}
                                    disabled={!canNavigate}
                                    className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold 
                    border-2 transition-all duration-300 z-10
                    ${circleStyle}
                    ${canNavigate ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
                  `}
                                    type="button"
                                    aria-label={`Go to step ${index + 1}: ${step.name}`}
                                >
                                    {isCompleted && !isActive ? (
                                        <Check size={16} strokeWidth={3} />
                                    ) : (
                                        <span>{index}</span>
                                    )}
                                </button>
                                <span className={`hidden md:block text-[10px] uppercase tracking-wider mt-2 transition-colors ${labelStyle}`}>
                                    {step.name.length > 8 ? step.name.substring(0, 7) + '.' : step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
