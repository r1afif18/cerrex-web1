'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ISDCTree, ISDCSelection } from '@/app/components/wizard/ISDCTree';
import { ALL_ISDC_ITEMS } from '@/lib/wizard/isdc-data';
import { ListTree, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

interface Step1PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step1Page({ params }: Step1PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    // State maps ISDC code -> Selection State (matching ISDCSelection interface)
    const [selections, setSelections] = useState<Map<string, ISDCSelection>>(new Map());

    useEffect(() => {
        loadData();
    }, [projectId]);

    async function loadData() {
        setIsLoading(true);
        try {
            // Load Session Progress
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

            // Load Existing ISDC Selections
            const { data: existingSelections } = await supabase
                .from('project_isdc_selection')
                .select('*')
                .eq('project_id', projectId);

            const initialMap = new Map<string, ISDCSelection>();

            // Initialize all items as unselected first
            ALL_ISDC_ITEMS.forEach(item => {
                initialMap.set(item.code, {
                    code: item.code,
                    isActive: false,
                    isContractor: false,
                    contingencyPercent: item.contingencyDefault
                });
            });

            // Apply saved selections
            if (existingSelections) {
                existingSelections.forEach((sel: any) => {
                    initialMap.set(sel.isdc_code, {
                        code: sel.isdc_code,
                        isActive: true,
                        isContractor: sel.is_contractor || false,
                        contingencyPercent: sel.contingency_percent || 15,
                    });
                });
            }

            setSelections(initialMap);

        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load project data');
        } finally {
            setIsLoading(false);
        }
    }

    // Handler matching ISDCTree's expected signature
    const handleSelectionChange = (code: string, updates: Partial<ISDCSelection>) => {
        setSelections(prev => {
            const next = new Map(prev);
            const current = next.get(code) || {
                code,
                isActive: false,
                isContractor: false,
                contingencyPercent: 15
            };
            next.set(code, { ...current, ...updates });
            return next;
        });
    };

    const handleBulkSelect = (codes: string[], isActive: boolean) => {
        setSelections(prev => {
            const next = new Map(prev);
            codes.forEach(code => {
                const current = next.get(code) || {
                    code,
                    isActive: false,
                    isContractor: false,
                    contingencyPercent: 15
                };
                next.set(code, { ...current, isActive });
            });
            return next;
        });
    };

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            const activeSelections = Array.from(selections.entries())
                .filter(([_, val]) => val.isActive)
                .map(([code, val]) => ({
                    project_id: projectId,
                    isdc_code: code,
                    contingency_percent: val.contingencyPercent,
                    is_contractor: val.isContractor,
                    is_active: true
                }));

            if (activeSelections.length === 0) {
                throw new Error('Please select at least one ISDC item');
            }

            // Delete old, insert new
            await supabase.from('project_isdc_selection').delete().eq('project_id', projectId);

            const { error: insertError } = await supabase
                .from('project_isdc_selection')
                .insert(activeSelections);

            if (insertError) throw insertError;

            await supabase
                .from('wizard_sessions')
                .upsert({
                    project_id: projectId,
                    last_saved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' });

            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);

        } catch (err: any) {
            console.error('Error saving:', err);
            setError(err.message || 'Failed to save selections');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        const activeCount = Array.from(selections.values()).filter(s => s.isActive).length;
        if (activeCount === 0) {
            setError('Please select at least one ISDC scope item to proceed.');
            return;
        }

        await handleSave();

        await supabase
            .from('wizard_sessions')
            .update({
                step_1_completed: true,
                current_step: 2,
                updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId);

        router.push(`/dashboard/wizard/${projectId}/step-2`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-0`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    const activeCount = Array.from(selections.values()).filter(s => s.isActive).length;
    const canProceed = activeCount > 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading ISDC structure...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={1}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ListTree className="text-blue-500" />
                        ISDC Scope Selection
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Select which ISDC (International Structure for Decommissioning Costing) items
                        are relevant for your project. This defines the scope of cost estimation.
                    </p>
                </div>

                {/* Info Box */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                    <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">About ISDC Structure</p>
                        <p className="mt-1 text-blue-700">
                            The ISDC provides 11 Principal Activities (Level 1), organized into ~70 Activity Groups (Level 2),
                            with detailed activities at Level 3. Items marked <strong>INV</strong> are inventory-dependent
                            (costs scale with quantity), while <strong>WM</strong> items relate to waste management.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Selection Summary */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${activeCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {activeCount > 0 && <CheckCircle2 size={16} />}
                            <span className="text-sm font-semibold">{activeCount} items selected</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const l1Codes = ALL_ISDC_ITEMS.filter(i => i.level === 1).map(i => i.code);
                                handleBulkSelect(l1Codes, true);
                            }}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Select All L1
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                            onClick={() => {
                                const allCodes = ALL_ISDC_ITEMS.map(i => i.code);
                                handleBulkSelect(allCodes, false);
                            }}
                            className="text-xs text-slate-500 hover:text-slate-700"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* ISDC Tree */}
                <div className="glass-panel rounded-2xl p-6">
                    <ISDCTree
                        selections={selections}
                        onSelectionChange={handleSelectionChange}
                        onBulkSelect={handleBulkSelect}
                    />
                </div>

                <WizardNavigation
                    currentStep={1}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSaveDraft={handleSave}
                    isLoading={false}
                    isSaving={isSaving}
                    canProceed={canProceed}
                    showSaveSuccess={showSaveSuccess}
                />
            </div>
        </div>
    );
}
