'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ListTree, AlertCircle } from 'lucide-react';

interface Step1PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step1Page({ params }: Step1PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();

    // Placeholder completed steps - will be loaded from DB
    const completedSteps = [true, false, false, false, false, false, false, false, false, false];

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-0`);
    }

    function handleNext() {
        router.push(`/dashboard/wizard/${projectId}/step-2`);
    }

    function handleSaveDraft() {
        // TODO: Implement save
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    return (
        <div className="fade-enter">
            {/* Progress Indicator */}
            <WizardProgress
                currentStep={1}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            {/* Step Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">ISDC Scope Selection</h1>
                <p className="text-slate-500 mt-2">Select which ISDC items are relevant for this decommissioning project.</p>
            </div>

            {/* Placeholder Content */}
            <div className="glass-panel rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                    <ListTree size={32} className="text-blue-500" />
                </div>

                <h2 className="text-xl font-bold text-slate-800 mb-2">Coming Soon</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    This step will allow you to select from 336 ISDC items organized in a hierarchical tree view
                    with Level 1, Level 2, and Level 3 activities.
                </p>

                {/* Info Box */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl inline-flex items-start gap-3 text-left max-w-lg mx-auto">
                    <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                        <strong>Phase 2 Feature</strong>
                        <p className="mt-1">ISDC Scope Selection will be implemented in Phase 2 (Week 3-4) of the wizard development.</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <WizardNavigation
                currentStep={1}
                onBack={handleBack}
                onNext={handleNext}
                onSaveDraft={handleSaveDraft}
                canProceed={false}
            />
        </div>
    );
}
