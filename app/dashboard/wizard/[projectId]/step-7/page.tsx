'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ISDC_L1 } from '@/lib/wizard/isdc-data'; // Ensure this is available
import {
    BarChart4, AlertCircle, Loader2, DollarSign, Download
} from 'lucide-react';

interface CalculationResult {
    isdcCode: string;
    totalCost: number;
    labourCost: number;
    investmentCost: number;
    expensesCost: number;
    contingencyCost: number;
}

interface Step7PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step7Page({ params }: Step7PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [results, setResults] = useState<CalculationResult[]>([]);
    const [grandTotal, setGrandTotal] = useState(0);

    useEffect(() => {
        runCalculation();
    }, [projectId]);

    async function runCalculation() {
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

            // THIS IS A MOCK CALCULATION ENGINE
            // In a real app, this would fetch all inventory, unit factors, labour rates, etc.
            // and perform complex math. Here we simulate results based on mock logic.

            const simulatedResults: CalculationResult[] = ISDC_L1.map(item => {
                const base = Math.random() * 1000000 + 500000;
                return {
                    isdcCode: item.code,
                    totalCost: base * 1.25,
                    labourCost: base * 0.6,
                    investmentCost: base * 0.2,
                    expensesCost: base * 0.1,
                    contingencyCost: base * 0.35 // 25% + extra
                };
            });

            setResults(simulatedResults);
            setGrandTotal(simulatedResults.reduce((sum, r) => sum + r.totalCost, 0));

            // Save results to DB
            await supabase.from('calculation_results').delete().eq('project_id', projectId);
            await supabase.from('calculation_results').insert(
                simulatedResults.map(r => ({
                    project_id: projectId,
                    isdc_code: r.isdcCode,
                    total_cost: r.totalCost,
                    labour_cost: r.labourCost,
                    investment_cost: r.investmentCost,
                    expenses_cost: r.expensesCost,
                    contingency_cost: r.contingencyCost
                }))
            );

        } catch (err) {
            console.error('Error calculating:', err);
            setError('Calculation failed');
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

    async function handleNext() {
        setIsSaving(true);
        // Already saved during calculation

        await supabase
            .from('wizard_sessions')
            .upsert({
                project_id: projectId,
                current_step: 8,
                step_7_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-8`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-6`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Calculating total project cost...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={7}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BarChart4 className="text-blue-600" />
                            Cost Results
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Detailed breakdown of the estimated decommissioning costs.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors">
                        <Download size={18} />
                        Export Report
                    </button>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Hero Card Total */}
                <div className="glass-panel overflow-hidden rounded-2xl p-8 mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-blue-200 font-semibold mb-1 uppercase tracking-wider text-sm">Total Estimated Cost</div>
                            <div className="text-5xl font-black tracking-tighter">
                                {formatCurrency(grandTotal)}
                            </div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <DollarSign size={40} className="text-white opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Breakdown Table */}
                <div className="glass-panel rounded-2xl overflow-hidden mb-8">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800">Cost Breakdown by Principal Activity (ISDC)</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">ISDC Activity</th>
                                <th className="px-6 py-3 text-right">Labour</th>
                                <th className="px-6 py-3 text-right">Investment</th>
                                <th className="px-6 py-3 text-right">Expenses</th>
                                <th className="px-6 py-3 text-right">Contingency</th>
                                <th className="px-6 py-3 text-right font-bold text-slate-700">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {results.map(r => {
                                const item = ISDC_L1.find(i => i.code === r.isdcCode);
                                return (
                                    <tr key={r.isdcCode} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-3 font-medium text-slate-700">
                                            <span className="font-mono text-xs text-slate-400 mr-2">{r.isdcCode}</span>
                                            {item?.name}
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(r.labourCost)}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(r.investmentCost)}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(r.expensesCost)}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(r.contingencyCost)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-800">{formatCurrency(r.totalCost)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200 shadow-inner">
                            <tr>
                                <td className="px-6 py-3">Totals</td>
                                <td className="px-6 py-3 text-right">{formatCurrency(results.reduce((s, r) => s + r.labourCost, 0))}</td>
                                <td className="px-6 py-3 text-right">{formatCurrency(results.reduce((s, r) => s + r.investmentCost, 0))}</td>
                                <td className="px-6 py-3 text-right">{formatCurrency(results.reduce((s, r) => s + r.expensesCost, 0))}</td>
                                <td className="px-6 py-3 text-right">{formatCurrency(results.reduce((s, r) => s + r.contingencyCost, 0))}</td>
                                <td className="px-6 py-3 text-right text-blue-700">{formatCurrency(grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <WizardNavigation
                    currentStep={7}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSaveDraft={() => { }}
                    isLoading={false}
                    isSaving={isSaving}
                    canProceed={true}
                    showSaveSuccess={false}
                />
            </div>
        </div>
    );
}
