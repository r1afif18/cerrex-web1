'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ISDCTree } from '@/app/components/wizard';
import { ALL_ISDC_ITEMS } from '@/lib/wizard/isdc-data';
import {
    ListTree, AlertCircle, CheckCircle2, Info, Loader2
} from 'lucide-react';

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

    // State maps ISDC code -> Selection State
    const [selections, setSelections] = useState<Map<string, {
        isActive: boolean;
        contingency: number;
        description?: string;
    }>>(new Map());

    // Initialization
    useEffect(() => {
        loadData();
    }, [projectId]);

    async function loadData() {
        setIsLoading(true);
        try {
            // 1. Load Session Progress
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

            // 2. Load Existing ISDC Selections
            const { data: existingSelections } = await supabase
                .from('project_isdc_selection')
                .select('*')
                .eq('project_id', projectId);

            const initialMap = new Map();

            // Initialize all items as unselected first
            ALL_ISDC_ITEMS.forEach(item => {
                initialMap.set(item.code, {
                    isActive: false,
                    contingency: item.contingencyDefault
                });
            });

            // Apply saved selections
            if (existingSelections) {
                existingSelections.forEach((sel: any) => {
                    initialMap.set(sel.isdc_code, {
                        isActive: true, // Only saved items are active
                        contingency: sel.contingency_percent,
                        description: sel.user_description
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

    // Handlers
    const handleSelectionChange = (code: string, isSelected: boolean, contingency?: number) => {
        setSelections(prev => {
            const next = new Map(prev);
            const current = next.get(code) || { isActive: false, contingency: 15 };

            next.set(code, {
                ...current,
                isActive: isSelected,
                contingency: contingency !== undefined ? contingency : current.contingency
            });

            // Logic: If selecting a child, ensure parents are visually handled by the Tree component,
            // but here we just store raw state. The Tree component usually handles cascading visual logic.
            // However, for pure data consistency:
            // If we deselect a parent, we might want to deselect children? 
            // For now, let's keep it simple: individual selection toggles.

            return next;
        });
    };

    const handleBulkSelect = (codes: string[], isSelected: boolean) => {
        setSelections(prev => {
            const next = new Map(prev);
            codes.forEach(code => {
                const current = next.get(code) || { isActive: false, contingency: 15 };
                next.set(code, { ...current, isActive: isSelected });
            });
            return next;
        });
    };

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // 1. Prepare data for upsert
            // We only strictly need to save *active* selections to the DB
            // But clearing old ones first is safer to handle deselections

            const activeSelections = Array.from(selections.entries())
                .filter(([_, val]) => val.isActive)
                .map(([code, val]) => ({
                    project_id: projectId,
                    isdc_code: code,
                    contingency_percent: val.contingency,
                    user_description: val.description,
                    is_active: true
                }));

            if (activeSelections.length === 0) {
                throw new Error('Please select at least one ISDC item');
            }

            // Transaction-like approach: Delete all for project, then insert new
            await supabase.from('project_isdc_selection').delete().eq('project_id', projectId);

            const { error: insertError } = await supabase
                .from('project_isdc_selection')
                .insert(activeSelections);

            if (insertError) throw insertError;

            // 2. Update Session
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

        // Mark step 1 as complete
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
        <div className="fade-enter scale-95 origin-top transition-transform duration-500 ease-out animate-in fill-mode-forwards">
            <div className="max-w-5xl mx-auto">
                {/* Progress */}
                <WizardProgress
                    currentStep={1}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                {/* Header */}
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

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Selection Summary */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`
            px-4 py-2 rounded-xl flex items-center gap-2
            ${activeCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}
          `}>
                            {activeCount > 0 && <CheckCircle2 size={16} />}
                            <span className="text-sm font-semibold">
                                {activeCount} items selected
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                // Select all L1 items
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
                                // Deselect all
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

                {/* Navigation */}
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
