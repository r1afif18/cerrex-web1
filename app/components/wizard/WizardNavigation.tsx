'use client';

import { ChevronLeft, ChevronRight, Save, Loader2, Check } from 'lucide-react';
import { WIZARD_STEPS } from '@/lib/wizard/constants';

interface WizardNavigationProps {
    currentStep: number;
    onBack: () => void;
    onNext: () => void;
    onSaveDraft: () => void;
    isLoading?: boolean;
    isSaving?: boolean;
    canProceed?: boolean;
    showSaveSuccess?: boolean;
}

export function WizardNavigation({
    currentStep,
    onBack,
    onNext,
    onSaveDraft,
    isLoading = false,
    isSaving = false,
    canProceed = true,
    showSaveSuccess = false,
}: WizardNavigationProps) {
    const totalSteps = WIZARD_STEPS.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    const isResultsStep = currentStep === 7; // Step 7 is Results

    return (
        <div className="glass-panel rounded-2xl p-4 mt-8">
            <div className="flex items-center justify-between">
                {/* Cancel / Back Button */}
                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            hover:bg-slate-100 active:scale-95
            ${isFirstStep
                            ? 'text-slate-400 hover:text-slate-600'
                            : 'text-slate-600 hover:text-slate-800'
                        }
          `}
                >
                    <ChevronLeft size={18} />
                    <span className="hidden sm:inline">{isFirstStep ? 'Exit' : 'Back'}</span>
                </button>

                {/* Step Counter */}
                <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Step {currentStep + 1} / {totalSteps}
                    </div>

                    {/* Save Draft Button */}
                    <button
                        onClick={onSaveDraft}
                        disabled={isLoading || isSaving}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${showSaveSuccess
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }
            `}
                    >
                        {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : showSaveSuccess ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        <span className="hidden sm:inline">
                            {isSaving ? 'Saving...' : showSaveSuccess ? 'Saved!' : 'Save Draft'}
                        </span>
                    </button>
                </div>

                {/* Next / Finish Button */}
                <button
                    onClick={onNext}
                    disabled={isLoading || !canProceed}
                    className={`
            flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95
            ${canProceed
                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }
          `}
                >
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <>
                            <span>
                                {isLastStep
                                    ? 'Finish'
                                    : isResultsStep
                                        ? 'Continue to Cashflow'
                                        : 'Next'
                                }
                            </span>
                            <ChevronRight size={18} />
                        </>
                    )}
                </button>
            </div>

            {/* Validation Message */}
            {!canProceed && (
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <p className="text-xs text-amber-600 text-center">
                        Please complete all required fields before proceeding
                    </p>
                </div>
            )}
        </div>
    );
}

// Sticky version for longer forms
export function WizardNavigationSticky({
    currentStep,
    onBack,
    onNext,
    onSaveDraft,
    isLoading = false,
    isSaving = false,
    canProceed = true,
}: WizardNavigationProps) {
    const totalSteps = WIZARD_STEPS.length;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 shadow-2xl shadow-slate-900/10 z-50">
            <div className="max-w-5xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        <ChevronLeft size={18} />
                        {isFirstStep ? 'Exit' : 'Back'}
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onSaveDraft}
                            disabled={isLoading || isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save
                        </button>

                        <button
                            onClick={onNext}
                            disabled={isLoading || !canProceed}
                            className={`
                flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${canProceed
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }
              `}
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    {isLastStep ? 'Finish' : 'Next'}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
