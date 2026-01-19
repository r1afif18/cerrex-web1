'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    GitBranch, AlertCircle, Loader2, Save, ArrowRight
} from 'lucide-react';

interface Scenario {
    id: string;
    name: string;
    ufMultiplier: number;
    deferralYears: number;
    totalCost: number;
    totalNPV: number;
    isBaseline: boolean;
}

interface Step9PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step9Page({ params }: Step9PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [baselineCost, setBaselineCost] = useState(0);

    useEffect(() => {
        loadData();
    }, [projectId]);

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

            // Load Baseline (Mock fetch from calculations)
            const { data: calc } = await supabase
                .from('calculation_results')
                .select('total_cost')
                .eq('project_id', projectId);

            // Calculate sum of total_cost
            const baseline = calc ? calc.reduce((sum: number, item: any) => sum + item.total_cost, 0) : 6250000;
            setBaselineCost(baseline);

            // Load saved scenarios
            const { data: savedScenarios } = await supabase
                .from('sensitivity_results')
                .select('*')
                .eq('project_id', projectId);

            if (savedScenarios && savedScenarios.length > 0) {
                setScenarios(savedScenarios.map((s: any) => ({
                    id: s.id,
                    name: s.scenario_name,
                    ufMultiplier: s.uf_multiplier,
                    deferralYears: s.deferral_years,
                    totalCost: s.total_cost,
                    totalNPV: s.npv,
                    isBaseline: s.scenario_name === 'Baseline'
                })));
            } else {
                // Default Scenarios
                const defaults = [
                    { id: 'baseline', name: 'Baseline', ufMultiplier: 1.0, deferralYears: 0, totalCost: baseline, totalNPV: baseline * 0.85, isBaseline: true },
                    { id: 'optimistic', name: 'Optimistic (High Productivity)', ufMultiplier: 0.8, deferralYears: 0, totalCost: baseline * 0.8, totalNPV: baseline * 0.85 * 0.8, isBaseline: false },
                    { id: 'pessimistic', name: 'Pessimistic (Low Productivity)', ufMultiplier: 1.5, deferralYears: 0, totalCost: baseline * 1.5, totalNPV: baseline * 0.85 * 1.5, isBaseline: false },
                    { id: 'deferred', name: 'deferral Strategy (+10 Years)', ufMultiplier: 1.0, deferralYears: 10, totalCost: baseline * 1.2, totalNPV: baseline * 0.6, isBaseline: false }, // Higher cost due to maintenance, lower NPV
                ];
                setScenarios(defaults);
            }

        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function formatCurrency(val: number) {
        return new Intl.NumberFormat('en-EU', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(val);
    }

    async function handleSave() {
        setIsSaving(true);
        setError(null);
        try {
            // Delete old scenarios
            await supabase.from('sensitivity_results').delete().eq('project_id', projectId);

            // Insert new
            await supabase.from('sensitivity_results').insert(
                scenarios.map(s => ({
                    project_id: projectId,
                    scenario_name: s.name,
                    uf_multiplier: s.ufMultiplier,
                    deferral_years: s.deferralYears,
                    total_cost: s.totalCost,
                    npv: s.totalNPV
                }))
            );

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
            console.error(err);
            setError('Failed to save scenarios');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleFinish() {
        await handleSave();

        await supabase
            .from('wizard_sessions')
            .upsert({
                project_id: projectId,
                current_step: 9,
                step_9_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        // In real app, redirect to project dashboard
        router.push(`/dashboard/projects`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-8`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Analyzing scenarios...</p>
            </div>
        );
    }

    const bestScenario = scenarios.reduce((prev, current) => (prev.totalNPV < current.totalNPV) ? prev : current);

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={9}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <GitBranch className="text-violet-600" />
                        Sensitivity Analysis
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Evaluate how changes in key parameters (productivity, project timing) impact total costs.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Best Scenario Highlight */}
                <div className="glass-panel p-6 rounded-2xl mb-8 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <div className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">Recommended Strategy (Lowest NPV)</div>
                            <div className="text-3xl font-black">{bestScenario.name}</div>
                            <div className="mt-2 text-white/90 text-sm max-w-lg">
                                This scenario offers the most cost-effective approach considering the time value of money, with a total NPV of <strong>{formatCurrency(bestScenario.totalNPV)}</strong>.
                            </div>
                        </div>
                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm min-w-[200px] text-center">
                            <div className="text-xs text-white/80 uppercase font-bold">NPV Savings vs Baseline</div>
                            <div className="text-2xl font-black mt-1">
                                {bestScenario.isBaseline
                                    ? '-'
                                    : formatCurrency(Math.abs(bestScenario.totalNPV - baselineCost * 0.85))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scenarios Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {scenarios.map(scenario => {
                        const isBest = scenario.id === bestScenario.id;
                        return (
                            <div
                                key={scenario.id}
                                className={`glass-panel rounded-xl p-6 transition-all ${isBest ? 'ring-2 ring-violet-500 bg-violet-50/30' : 'hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-slate-800 text-lg">{scenario.name}</h3>
                                    {scenario.isBaseline && <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded uppercase">Baseline</span>}
                                    {isBest && !scenario.isBaseline && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase">Best Value</span>}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Total Nominal Cost</span>
                                        <span className="font-semibold text-slate-700">{formatCurrency(scenario.totalCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Net Present Value (NPV)</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(scenario.totalNPV)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="block text-slate-400 uppercase font-bold">Productivity</span>
                                        <span className="font-mono text-slate-600">x{scenario.ufMultiplier}</span>
                                    </div>
                                    <div>
                                        <span className="block text-slate-400 uppercase font-bold">Deferral</span>
                                        <span className="font-mono text-slate-600">{scenario.deferralYears} years</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-between py-6">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Back
                    </button>

                    <button
                        onClick={handleFinish}
                        disabled={isSaving}
                        className="px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save & Finish Project
                    </button>
                </div>
            </div>
        </div>
    );
}
