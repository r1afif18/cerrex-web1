'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { DD_CATEGORIES, DDCategory } from '@/lib/wizard/dd-categories';
import {
    Calculator, AlertCircle, Loader2, RotateCcw,
    Search, SlidersHorizontal
} from 'lucide-react';

interface CategoryUF {
    code: string;
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

    const [unitFactors, setUnitFactors] = useState<Map<string, CategoryUF>>(new Map());
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'mass' | 'area'>('mass');

    useEffect(() => {
        initializeDefaults();
        loadData();
    }, [projectId]);

    function initializeDefaults() {
        const defaults = new Map<string, CategoryUF>();
        DD_CATEGORIES.forEach(cat => {
            defaults.set(cat.code, {
                code: cat.code,
                manpowerUF: cat.defaultManpowerUF,
                investmentUF: cat.defaultInvestmentUF,
                expensesUF: cat.defaultExpensesUF
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

            // Load custom UF if saved (omitted for brevity, using defaults for now)

        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function updateUF(code: string, field: 'manpowerUF' | 'investmentUF' | 'expensesUF', value: number) {
        setUnitFactors(prev => {
            const updated = new Map(prev);
            const current = updated.get(code)!;
            updated.set(code, { ...current, [field]: value });
            return updated;
        });
    }

    function resetToDefaults() {
        if (confirm('Reset all Unit Factors to default CERREX values?')) {
            initializeDefaults();
        }
    }

    const filteredCategories = DD_CATEGORIES.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'mass' ? cat.unit === 't' : cat.unit === 'm²';
        return matchesSearch && matchesTab;
    });

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // In a real app, save to a `project_unit_factors` table
            // For now we just update session timestamp
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
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={4}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Calculator className="text-emerald-500" />
                        Unit Factors
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Review and customize the Unit Factors (UF) used to calculate costs for each D&D category.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('mass')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'mass' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Mass Based (t)
                        </button>
                        <button
                            onClick={() => setActiveTab('area')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Area Based (m²)
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search categories..."
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-400 outline-none w-64"
                            />
                        </div>

                        <button
                            onClick={resetToDefaults}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Reset to Defaults"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* UF Grid */}
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase">
                        <div className="col-span-1">Code</div>
                        <div className="col-span-5">Category Name</div>
                        <div className="col-span-2 text-center">Manpower (hr/unit)</div>
                        <div className="col-span-2 text-center">Inv. (€/unit)</div>
                        <div className="col-span-2 text-center">Exp. (€/unit)</div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                        {filteredCategories.map(cat => {
                            const current = unitFactors.get(cat.code) || {
                                manpowerUF: cat.defaultManpowerUF,
                                investmentUF: cat.defaultInvestmentUF,
                                expensesUF: cat.defaultExpensesUF
                            };

                            const isModified =
                                current.manpowerUF !== cat.defaultManpowerUF ||
                                current.investmentUF !== cat.defaultInvestmentUF ||
                                current.expensesUF !== cat.defaultExpensesUF;

                            return (
                                <div
                                    key={cat.code}
                                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-blue-50/10 transition-colors ${isModified ? 'bg-amber-50/30' : ''}`}
                                >
                                    <div className="col-span-1 font-mono text-xs font-bold text-slate-500">{cat.code}</div>
                                    <div className="col-span-5 text-sm font-medium text-slate-800 truncate" title={cat.name}>{cat.name}</div>

                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={current.manpowerUF}
                                            onChange={(e) => updateUF(cat.code, 'manpowerUF', parseFloat(e.target.value))}
                                            className={`w-full text-center py-1 rounded border text-sm font-mono focus:border-blue-500 outline-none ${current.manpowerUF !== cat.defaultManpowerUF ? 'border-amber-400 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 text-slate-600'}`}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={current.investmentUF}
                                            onChange={(e) => updateUF(cat.code, 'investmentUF', parseFloat(e.target.value))}
                                            className={`w-full text-center py-1 rounded border text-sm font-mono focus:border-blue-500 outline-none ${current.investmentUF !== cat.defaultInvestmentUF ? 'border-amber-400 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 text-slate-600'}`}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={current.expensesUF}
                                            onChange={(e) => updateUF(cat.code, 'expensesUF', parseFloat(e.target.value))}
                                            className={`w-full text-center py-1 rounded border text-sm font-mono focus:border-blue-500 outline-none ${current.expensesUF !== cat.defaultExpensesUF ? 'border-amber-400 bg-amber-50 text-amber-700 font-bold' : 'border-slate-200 text-slate-600'}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
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
        </div>
    );
}
