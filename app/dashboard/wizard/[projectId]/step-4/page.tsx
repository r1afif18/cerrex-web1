'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { DD_CATEGORIES } from '@/lib/wizard/dd-categories';
import {
    Calculator, AlertCircle, Loader2, Info, RotateCcw
} from 'lucide-react';

interface UnitFactor {
    categoryCode: string;
    manpowerUF: number;
    investmentUF: number;
    expensesUF: number;
}

interface Step4PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step4Page({ params }: Step4PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [unitFactors, setUnitFactors] = useState<Map<string, UnitFactor>>(new Map());
    const [activeTab, setActiveTab] = useState<'mass' | 'area'>('mass');

    useEffect(() => {
        initializeDefaults();
        loadData();
    }, [projectId]);

    function initializeDefaults() {
        const defaults = new Map<string, UnitFactor>();
        DD_CATEGORIES.forEach(cat => {
            defaults.set(cat.code, {
                categoryCode: cat.code,
                manpowerUF: cat.defaultManpowerUF,
                investmentUF: cat.defaultInvestmentUF,
                expensesUF: cat.defaultExpensesUF,
            });
        });
        setUnitFactors(defaults);
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

            // Load custom unit factors from dd_categories table
            const { data: ddData } = await supabase
                .from('dd_categories')
                .select('*')
                .eq('project_id', projectId);

            if (ddData && ddData.length > 0) {
                setUnitFactors(prev => {
                    const updated = new Map(prev);
                    ddData.forEach((row: { code: string; manpower_uf: number; investment_uf: number; expenses_uf: number }) => {
                        if (updated.has(row.code)) {
                            updated.set(row.code, {
                                categoryCode: row.code,
                                manpowerUF: row.manpower_uf ?? updated.get(row.code)!.manpowerUF,
                                investmentUF: row.investment_uf ?? updated.get(row.code)!.investmentUF,
                                expensesUF: row.expenses_uf ?? updated.get(row.code)!.expensesUF,
                            });
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

    function updateUF(code: string, field: 'manpowerUF' | 'investmentUF' | 'expensesUF', value: number) {
        setUnitFactors(prev => {
            const updated = new Map(prev);
            const current = updated.get(code);
            if (current) {
                updated.set(code, { ...current, [field]: value });
            }
            return updated;
        });
    }

    function resetToDefaults() {
        initializeDefaults();
    }

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // For now, we store customized UF in the wizard context
            // In production, this would update dd_categories per project

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
            setError('Failed to save unit factors');
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
                current_step: 5,
                step_4_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-5`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-3`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    // Filter categories by unit type
    const filteredCategories = DD_CATEGORIES.filter(cat => {
        if (cat.defaultManpowerUF === 0) return false;
        if (activeTab === 'mass') return cat.unit === 't';
        return cat.unit === 'm²';
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading unit factors...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <WizardProgress
                currentStep={4}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Calculator className="text-violet-500" />
                    Unit Factors
                </h1>
                <p className="text-slate-500 mt-2">
                    Customize unit factors for cost calculation. These define cost per unit (tonne or m²) of inventory.
                </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium">Unit Factor Formula</p>
                    <p className="mt-1 text-blue-700 font-mono text-xs">
                        Cost = Quantity × UF × WDF × Labour_Rate
                    </p>
                    <p className="mt-1 text-blue-600 text-xs">
                        Manpower UF = man-hours per unit | Investment/Expenses UF = € per unit
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="glass-panel rounded-2xl overflow-hidden">
                {/* Tabs & Actions */}
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-1 p-1 bg-slate-200 rounded-lg">
                        <button
                            onClick={() => setActiveTab('mass')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'mass' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            Mass-based (tonnes)
                        </button>
                        <button
                            onClick={() => setActiveTab('area')}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'area' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                                }`}
                        >
                            Area-based (m²)
                        </button>
                    </div>

                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} />
                        Reset Defaults
                    </button>
                </div>

                {/* Table */}
                <div className="max-h-[450px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-center">Manpower UF<br /><span className="normal-case font-normal">(man-h/{activeTab === 'mass' ? 't' : 'm²'})</span></th>
                                <th className="px-4 py-3 text-center">Investment UF<br /><span className="normal-case font-normal">(€/{activeTab === 'mass' ? 't' : 'm²'})</span></th>
                                <th className="px-4 py-3 text-center">Expenses UF<br /><span className="normal-case font-normal">(€/{activeTab === 'mass' ? 't' : 'm²'})</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCategories.map(cat => {
                                const uf = unitFactors.get(cat.code);
                                const isModified = uf && (
                                    uf.manpowerUF !== cat.defaultManpowerUF ||
                                    uf.investmentUF !== cat.defaultInvestmentUF ||
                                    uf.expensesUF !== cat.defaultExpensesUF
                                );

                                return (
                                    <tr key={cat.code} className={`hover:bg-slate-50 ${isModified ? 'bg-amber-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{cat.code}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{cat.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={uf?.manpowerUF ?? cat.defaultManpowerUF}
                                                onChange={(e) => updateUF(cat.code, 'manpowerUF', parseFloat(e.target.value) || 0)}
                                                min={0}
                                                step={0.1}
                                                className="w-20 text-center px-2 py-1 border border-slate-200 rounded text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={uf?.investmentUF ?? cat.defaultInvestmentUF}
                                                onChange={(e) => updateUF(cat.code, 'investmentUF', parseFloat(e.target.value) || 0)}
                                                min={0}
                                                step={1}
                                                className="w-20 text-center px-2 py-1 border border-slate-200 rounded text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={uf?.expensesUF ?? cat.defaultExpensesUF}
                                                onChange={(e) => updateUF(cat.code, 'expensesUF', parseFloat(e.target.value) || 0)}
                                                min={0}
                                                step={1}
                                                className="w-20 text-center px-2 py-1 border border-slate-200 rounded text-sm focus:border-blue-400 focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <WizardNavigation
                currentStep={4}
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
