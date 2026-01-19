'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    LineChart, AlertCircle, Loader2, Info, Play, CheckCircle2
} from 'lucide-react';

interface SensitivityScenario {
    id: string;
    name: string;
    ufMultiplier: number;
    deferralYears: number;
    totalCost: number;
    npv: number;
    change: number;
}

interface Step9PageProps {
    params: Promise<{ projectId: string }>;
}

const MULTIPLIER_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const DEFERRAL_OPTIONS = [0, 5, 10, 15, 20, 30];

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

    const [baseCost, setBaseCost] = useState(0);
    const [discountRate, setDiscountRate] = useState(3);
    const [scenarios, setScenarios] = useState<SensitivityScenario[]>([]);
    const [currency, setCurrency] = useState('EUR');
    const [isRunning, setIsRunning] = useState(false);

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

            // Load project settings
            const { data: project } = await supabase
                .from('projects')
                .select('reference_currency')
                .eq('id', projectId)
                .single();

            if (project) {
                setCurrency(project.reference_currency || 'EUR');
            }

            // Load calculation results
            const { data: results } = await supabase
                .from('calculation_results')
                .select('total_cost')
                .eq('project_id', projectId)
                .single();

            if (results) {
                setBaseCost(results.total_cost || 0);
            }

            // Load cashflow settings
            const { data: cashflowSettings } = await supabase
                .from('cashflow_settings')
                .select('discount_rate')
                .eq('project_id', projectId)
                .single();

            if (cashflowSettings) {
                setDiscountRate((cashflowSettings.discount_rate || 0.03) * 100);
            }

            // Load existing sensitivity results
            const { data: existingScenarios } = await supabase
                .from('sensitivity_results')
                .select('*')
                .eq('project_id', projectId);

            if (existingScenarios && existingScenarios.length > 0) {
                setScenarios(existingScenarios.map((s: {
                    id: string;
                    scenario_name: string;
                    factor_multiplier: number;
                    deferral_years: number;
                    total_cost: number;
                    npv: number;
                }) => ({
                    id: s.id,
                    name: s.scenario_name,
                    ufMultiplier: s.factor_multiplier,
                    deferralYears: s.deferral_years,
                    totalCost: s.total_cost,
                    npv: s.npv,
                    change: baseCost > 0 ? ((s.total_cost - baseCost) / baseCost) * 100 : 0,
                })));
            }

        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    async function runAnalysis() {
        setIsRunning(true);

        const newScenarios: SensitivityScenario[] = [];

        // UF Multiplier scenarios
        for (const mult of MULTIPLIER_OPTIONS) {
            const adjustedCost = baseCost * mult;
            const npv = adjustedCost / Math.pow(1 + discountRate / 100, 5); // 5-year NPV approximation

            newScenarios.push({
                id: crypto.randomUUID(),
                name: `UF × ${mult}`,
                ufMultiplier: mult,
                deferralYears: 0,
                totalCost: adjustedCost,
                npv,
                change: ((adjustedCost - baseCost) / baseCost) * 100,
            });
        }

        // Deferral scenarios (cost increases with storage, but NPV decreases)
        for (const years of DEFERRAL_OPTIONS.filter(y => y > 0)) {
            // Storage cost increases 1% per year, but time value of money decreases
            const storageCostFactor = 1 + (years * 0.01);
            const adjustedCost = baseCost * storageCostFactor;
            const npv = adjustedCost / Math.pow(1 + discountRate / 100, years);

            newScenarios.push({
                id: crypto.randomUUID(),
                name: `Defer ${years}yr`,
                ufMultiplier: 1.0,
                deferralYears: years,
                totalCost: adjustedCost,
                npv,
                change: ((adjustedCost - baseCost) / baseCost) * 100,
            });
        }

        setScenarios(newScenarios);
        setIsRunning(false);
    }

    // Find best scenario (lowest NPV)
    const bestScenario = useMemo(() => {
        if (scenarios.length === 0) return null;
        return scenarios.reduce((best, current) =>
            current.npv < best.npv ? current : best
            , scenarios[0]);
    }, [scenarios]);

    function formatCurrency(value: number): string {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(2)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toFixed(0);
    }

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // Delete existing scenarios
            await supabase
                .from('sensitivity_results')
                .delete()
                .eq('project_id', projectId);

            // Insert new scenarios
            if (scenarios.length > 0) {
                await supabase
                    .from('sensitivity_results')
                    .insert(scenarios.map(s => ({
                        project_id: projectId,
                        scenario_name: s.name,
                        factor_multiplier: s.ufMultiplier,
                        deferral_years: s.deferralYears,
                        total_cost: s.totalCost,
                        npv: s.npv,
                        calculated_at: new Date().toISOString(),
                    })));
            }

            await supabase
                .from('wizard_sessions')
                .upsert({
                    project_id: projectId,
                    step_9_completed: true,
                    status: 'completed',
                    last_saved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' });

            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        } catch (err) {
            console.error('Error saving:', err);
            setError('Failed to save sensitivity results');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleFinish() {
        await handleSave();
        // Navigate to summary/dashboard
        router.push(`/dashboard`);
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
                <p className="text-slate-500 text-sm">Loading sensitivity analysis...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <WizardProgress
                currentStep={9}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <LineChart className="text-indigo-500" />
                    Sensitivity Analysis
                </h1>
                <p className="text-slate-500 mt-2">
                    Analyze cost variations under different scenarios to understand project risk exposure.
                </p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium">Sensitivity Factors</p>
                    <p className="mt-1 text-blue-700">
                        <strong>UF Multiplier:</strong> Scales all unit factors (e.g., 1.5× = 50% cost increase).
                        <strong className="ml-2">Deferral:</strong> Delays start, affecting NPV through time value of money.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Controls */}
            <div className="glass-panel rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600">
                        Base Cost: <strong className="text-slate-900">{formatCurrency(baseCost)} {currency}</strong>
                    </div>
                    <div className="text-sm text-slate-600">
                        Discount Rate: <strong className="text-slate-900">{discountRate.toFixed(1)}%</strong>
                    </div>
                </div>

                <button
                    onClick={runAnalysis}
                    disabled={isRunning || baseCost === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isRunning ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Play size={18} />
                    )}
                    Run Analysis
                </button>
            </div>

            {/* Results */}
            {scenarios.length > 0 && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Scenario Results</h3>
                        {bestScenario && (
                            <span className="text-sm text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                Best NPV: {bestScenario.name}
                            </span>
                        )}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {/* UF Scenarios */}
                        <div className="p-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Unit Factor Variations</h4>
                            <div className="grid grid-cols-6 gap-3">
                                {scenarios.filter(s => s.deferralYears === 0).map(scenario => (
                                    <div
                                        key={scenario.id}
                                        className={`p-3 rounded-xl border-2 transition-all ${bestScenario?.id === scenario.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-200 bg-white'
                                            }`}
                                    >
                                        <div className="text-xs font-semibold text-slate-500 mb-1">{scenario.name}</div>
                                        <div className="text-lg font-bold text-slate-900">{formatCurrency(scenario.totalCost)}</div>
                                        <div className={`text-xs font-semibold mt-1 ${scenario.change > 0 ? 'text-red-600' : scenario.change < 0 ? 'text-emerald-600' : 'text-slate-500'
                                            }`}>
                                            {scenario.change > 0 ? '+' : ''}{scenario.change.toFixed(0)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deferral Scenarios */}
                        <div className="p-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Deferral Analysis</h4>
                            <div className="grid grid-cols-5 gap-3">
                                {scenarios.filter(s => s.deferralYears > 0).map(scenario => (
                                    <div
                                        key={scenario.id}
                                        className={`p-3 rounded-xl border-2 transition-all ${bestScenario?.id === scenario.id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-200 bg-white'
                                            }`}
                                    >
                                        <div className="text-xs font-semibold text-slate-500 mb-1">{scenario.name}</div>
                                        <div className="text-sm text-slate-600">Cost: {formatCurrency(scenario.totalCost)}</div>
                                        <div className="text-lg font-bold text-emerald-600">NPV: {formatCurrency(scenario.npv)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {scenarios.length === 0 && (
                <div className="glass-panel rounded-2xl p-12 text-center">
                    <LineChart size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">Click "Run Analysis" to generate sensitivity scenarios</p>
                </div>
            )}

            <WizardNavigation
                currentStep={9}
                onBack={handleBack}
                onNext={handleFinish}
                onSaveDraft={handleSave}
                isLoading={false}
                isSaving={isSaving}
                canProceed={scenarios.length > 0}
                showSaveSuccess={showSaveSuccess}
            />
        </div>
    );
}
