'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ALL_ISDC_ITEMS, ISDC_L1, getItemByCode } from '@/lib/wizard/isdc-data';
import {
    Shield, AlertCircle, Loader2, Info, Percent
} from 'lucide-react';

interface Step6PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step6Page({ params }: Step6PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    // Contingency percentages per ISDC L1
    const [contingencies, setContingencies] = useState<Map<string, number>>(new Map());
    const [globalContingency, setGlobalContingency] = useState(15);

    useEffect(() => {
        initializeDefaults();
        loadData();
    }, [projectId]);

    function initializeDefaults() {
        const defaults = new Map<string, number>();
        ISDC_L1.forEach(item => {
            defaults.set(item.code, item.contingencyDefault);
        });
        setContingencies(defaults);
    }

    async function loadData() {
        setIsLoading(true);
        try {
            const { data: session } = await supabase
                .from('wizard_sessions')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (session) {
                setCompletedSteps([
                    session.step_0_completed || false,
                    session.step_1_completed || false,
                    session.step_2_completed || false,
                    session.step_3_completed || false,
                    session.step_4_completed || false,
                    session.step_5_completed || false,
                    session.step_6_completed || false,
                    session.step_7_completed || false,
                    session.step_8_completed || false,
                    session.step_9_completed || false,
                ]);
            }

            // Load custom contingencies from ISDC selection
            const { data: selections } = await supabase
                .from('project_isdc_selection')
                .select('isdc_code, contingency_percent')
                .eq('project_id', projectId);

            if (selections) {
                setContingencies(prev => {
                    const updated = new Map(prev);
                    selections.forEach((sel: { isdc_code: string; contingency_percent: number }) => {
                        // Only update L1 items
                        if (sel.isdc_code.length === 2) {
                            updated.set(sel.isdc_code, sel.contingency_percent);
                        }
                    });
                    return updated;
                });
            }
        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function updateContingency(code: string, value: number) {
        setContingencies(prev => {
            const updated = new Map(prev);
            updated.set(code, Math.max(0, Math.min(100, value)));
            return updated;
        });
    }

    function applyGlobalContingency() {
        const updated = new Map<string, number>();
        ISDC_L1.forEach(item => {
            updated.set(item.code, globalContingency);
        });
        setContingencies(updated);
    }

    // Calculate weighted average
    const avgContingency = ISDC_L1.reduce((sum, item) => {
        return sum + (contingencies.get(item.code) || item.contingencyDefault);
    }, 0) / ISDC_L1.length;

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // Update contingencies in project_isdc_selection
            for (const [code, percent] of contingencies) {
                await supabase
                    .from('project_isdc_selection')
                    .update({ contingency_percent: percent })
                    .eq('project_id', projectId)
                    .eq('isdc_code', code);
            }

            await supabase
                .from('wizard_sessions')
                .upsert({
                    project_id: projectId,
                    last_saved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' });

            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        } catch (err) {
            console.error('Error saving:', err);
            setError('Failed to save contingency settings');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        await handleSave();

        await supabase
            .from('wizard_sessions')
            .upsert({
                project_id: projectId,
                current_step: 7,
                step_6_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-7`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-5`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading contingency settings...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <WizardProgress
                currentStep={6}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Shield className="text-rose-500" />
                    Contingency
                </h1>
                <p className="text-slate-500 mt-2">
                    Set contingency percentages for each ISDC principal activity to account for uncertainties.
                </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium">Contingency Formula</p>
                    <p className="mt-1 text-blue-700 font-mono text-xs">
                        Contingency = (Labour + Investment + Expenses) × Contingency_%
                    </p>
                    <p className="mt-1 text-blue-600 text-xs">
                        Higher contingency for activities with greater uncertainty (e.g., dismantling reactor components).
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Global Apply */}
            <div className="glass-panel rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Percent size={20} className="text-slate-400" />
                        <span className="font-medium text-slate-700">Apply Global Contingency</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            value={globalContingency}
                            onChange={(e) => setGlobalContingency(parseFloat(e.target.value) || 0)}
                            min={0}
                            max={100}
                            className="w-20 text-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 focus:outline-none"
                        />
                        <span className="text-slate-400">%</span>
                        <button
                            onClick={applyGlobalContingency}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Apply to All
                        </button>
                    </div>
                </div>
            </div>

            {/* Per-item contingencies */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Contingency by ISDC L1</h3>
                    <span className="text-sm text-slate-500">
                        Average: <strong className="text-slate-800">{avgContingency.toFixed(1)}%</strong>
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {ISDC_L1.map(item => {
                        const value = contingencies.get(item.code) || item.contingencyDefault;
                        const isModified = value !== item.contingencyDefault;

                        return (
                            <div
                                key={item.code}
                                className={`flex items-center justify-between px-4 py-4 hover:bg-slate-50 ${isModified ? 'bg-amber-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-sm font-bold">
                                        {item.code}
                                    </span>
                                    <div>
                                        <span className="font-medium text-slate-800">{item.name}</span>
                                        {item.isInventoryDependent && (
                                            <span className="ml-2 text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase">INV</span>
                                        )}
                                        {item.isWasteManagement && (
                                            <span className="ml-2 text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">WM</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min={0}
                                        max={50}
                                        step={1}
                                        value={value}
                                        onChange={(e) => updateContingency(item.code, parseFloat(e.target.value))}
                                        className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => updateContingency(item.code, parseFloat(e.target.value) || 0)}
                                        min={0}
                                        max={100}
                                        className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold focus:border-rose-400 focus:outline-none"
                                    />
                                    <span className="text-slate-400">%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <WizardNavigation
                currentStep={6}
                onBack={handleBack}
                onNext={handleNext}
                onSaveDraft={handleSave}
                isLoading={false}
                isSaving={isSaving}
                canProceed={true}
                showSaveSuccess={showSaveSuccess}
            />
        </div>
    );
}
