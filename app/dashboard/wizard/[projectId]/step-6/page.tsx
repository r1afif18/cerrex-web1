'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ISDC_L1 } from '@/lib/wizard/isdc-data';
import {
    ShieldAlert, AlertCircle, Loader2
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

    const [contingencies, setContingencies] = useState<Map<string, number>>(new Map());
    const [globalValue, setGlobalValue] = useState(25);

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

            // Load saved contingencies (from ISDC selection actually)
            const { data: savedSelections } = await supabase
                .from('project_isdc_selection')
                .select('isdc_code, contingency_percent')
                .eq('project_id', projectId);

            if (savedSelections) {
                setContingencies(prev => {
                    const updated = new Map(prev);
                    savedSelections.forEach((sel: any) => {
                        if (sel.isdc_code.length === 2) { // Only L1 for this simple view
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
            updated.set(code, value);
            return updated;
        });
    }

    function applyGlobal() {
        setContingencies(prev => {
            const updated = new Map(prev);
            updated.forEach((_, key) => {
                updated.set(key, globalValue);
            });
            return updated;
        });
    }

    // Calculate weighted max/avg
    const avgContingency = Array.from(contingencies.values()).reduce((a, b) => a + b, 0) / (contingencies.size || 1);

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // Update contingencies in isdc_selection table
            // This is a simplified approach; ideally we do a bulk upsert
            const updates = Array.from(contingencies.entries()).map(([code, val]) => ({
                project_id: projectId,
                isdc_code: code,
                contingency_percent: val,
                is_active: true // Ensure it stays active
            }));

            const { error: upsertError } = await supabase
                .from('project_isdc_selection')
                .upsert(updates, { onConflict: 'project_id,isdc_code' });

            if (upsertError) throw upsertError;

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
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={6}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-amber-500" />
                        Contingency
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Set contingency allowances for each main cost category (ISDC Level 1) to account for uncertainty.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Global Setting */}
                <div className="glass-panel p-6 rounded-2xl mb-6 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-bold text-slate-700">Apply Global Contingency</label>
                            <p className="text-xs text-slate-500">Set same percentage for all items</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={globalValue}
                                onChange={(e) => setGlobalValue(parseInt(e.target.value))}
                                className="w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="font-bold text-slate-700 w-12 text-right">{globalValue}%</span>
                            <button
                                onClick={applyGlobal}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                Apply All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contingency List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">ISDC Principal Activities</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-white border rounded text-slate-500">
                            Avg: {avgContingency.toFixed(1)}%
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {ISDC_L1.map(item => {
                            const val = contingencies.get(item.code) || 0;
                            const isHigh = val > 30;

                            return (
                                <div key={item.code} className="px-6 py-4 hover:bg-slate-50 transition-colors grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-1">
                                        <span className="font-mono text-sm font-bold text-slate-500">{item.code}</span>
                                    </div>
                                    <div className="col-span-5">
                                        <span className="text-sm font-medium text-slate-800">{item.name}</span>
                                    </div>
                                    <div className="col-span-5 px-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            step="1"
                                            value={val}
                                            onChange={(e) => updateContingency(item.code, parseInt(e.target.value))}
                                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isHigh ? 'accent-amber-500 bg-amber-100' : 'accent-blue-500 bg-slate-200'}`}
                                        />
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <span className={`font-bold text-sm ${isHigh ? 'text-amber-600' : 'text-slate-700'}`}>
                                            {val}%
                                        </span>
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
        </div>
    );
}
