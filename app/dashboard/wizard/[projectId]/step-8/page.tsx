'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    TrendingUp, AlertCircle, Loader2, CalendarRange, Percent
} from 'lucide-react';

interface CashflowYear {
    year: number;
    nominalCost: number;
    inflatedCost: number;
    discountedCost: number;
}

interface Step8PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step8Page({ params }: Step8PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [startYear, setStartYear] = useState(2026);
    const [inflationRate, setInflationRate] = useState(2.0);
    const [discountRate, setDiscountRate] = useState(4.0);
    const [yearlyData, setYearlyData] = useState<CashflowYear[]>([]);
    const [totalNPV, setTotalNPV] = useState(0);

    useEffect(() => {
        loadData();
    }, [projectId]);

    // Recalculate when parameters change
    useEffect(() => {
        if (yearlyData.length > 0 && !isLoading) {
            recalculateCashflow();
        }
    }, [inflationRate, discountRate, startYear]);

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

            // Load settings
            const { data: settings } = await supabase
                .from('cashflow_settings')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (settings) {
                setInflationRate(settings.inflation_rate || 2.0);
                setDiscountRate(settings.discount_rate || 4.0);
                setStartYear(settings.start_year || 2026);
            }

            // In a real app we would load phases and result distribution
            // Here we simulate a 10-year distribution of the previously calculated total
            generateMockDistribution();

        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function generateMockDistribution() {
        const totalSimulated = 5000000; // Mock total
        const duration = 10;
        const baseData: CashflowYear[] = [];

        for (let i = 0; i < duration; i++) {
            // Bell curve-ish distribution
            const weight = Math.exp(-Math.pow(i - 4, 2) / 8);
            const nominal = (totalSimulated * weight) / 2.5; // Aproximation divisor

            baseData.push({
                year: i, // Relative year for now
                nominalCost: nominal,
                inflatedCost: 0,
                discountedCost: 0
            });
        }

        // Initial Calc
        recalculateLocal(baseData, startYear, inflationRate, discountRate);
    }

    function recalculateLocal(data: CashflowYear[], start: number, infl: number, disc: number) {
        const newData = data.map((d, index) => {
            const year = start + index;
            const inflationFactor = Math.pow(1 + infl / 100, index);
            const discountFactor = Math.pow(1 + disc / 100, index);

            const inflated = d.nominalCost * inflationFactor;
            const discounted = inflated / discountFactor;

            return {
                ...d,
                year: year,
                inflatedCost: inflated,
                discountedCost: discounted
            };
        });

        setYearlyData(newData);
        setTotalNPV(newData.reduce((acc, cur) => acc + cur.discountedCost, 0));
    }

    function recalculateCashflow() {
        // Re-run calc on existing nominals
        recalculateLocal(yearlyData, startYear, inflationRate, discountRate);
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
            await supabase.from('cashflow_settings').upsert({
                project_id: projectId,
                inflation_rate: inflationRate,
                discount_rate: discountRate,
                start_year: startYear,
                updated_at: new Date().toISOString()
            }, { onConflict: 'project_id' });

            await supabase
                .from('wizard_sessions')
                .upsert({
                    project_id: projectId,
                    last_saved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' });

        } catch (err) {
            console.error(err);
            setError('Failed to save cashflow settings');
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
                current_step: 9,
                step_8_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-9`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-7`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Projecting cashflows...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={8}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-emerald-600" />
                        Cashflow Projection
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Estimate annual funding requirements considering inflation and discounting (Net Present Value).
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Settings Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="col-span-1 glass-panel rounded-2xl p-6 bg-slate-50/50 space-y-4">
                        <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Economic Parameters</h3>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                <CalendarRange size={14} /> Start Year
                            </label>
                            <input
                                type="number"
                                value={startYear}
                                onChange={(e) => setStartYear(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                <Percent size={14} /> Inflation Rate
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range" min="0" max="10" step="0.1"
                                    value={inflationRate} onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm font-bold w-12 text-right">{inflationRate}%</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                <Percent size={14} /> Discount Rate
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range" min="0" max="10" step="0.1"
                                    value={discountRate} onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                />
                                <span className="text-sm font-bold w-12 text-right">{discountRate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 glass-panel rounded-2xl p-6 flex items-center justify-center bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp size={120} />
                        </div>
                        <div className="text-center z-10">
                            <div className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-widest">Net Present Value (NPV)</div>
                            <div className="text-5xl font-black text-slate-800 tracking-tighter mb-4">
                                {formatCurrency(totalNPV)}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                                Discounted at {discountRate}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cashflow Table */}
                <div className="glass-panel rounded-2xl overflow-hidden mb-8">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800">Annual Expenditure Plan</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3">Year</th>
                                    <th className="px-6 py-3 text-right">Nominal Cost (Today's Value)</th>
                                    <th className="px-6 py-3 text-right">Inflated Cost (Future Value)</th>
                                    <th className="px-6 py-3 text-right font-bold text-slate-800">Discounted Cost (NPV)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {yearlyData.map((row) => (
                                    <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3 font-mono font-medium text-slate-600">{row.year}</td>
                                        <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.nominalCost)}</td>
                                        <td className="px-6 py-3 text-right text-slate-600 italic">{formatCurrency(row.inflatedCost)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-emerald-700 bg-emerald-50/20">{formatCurrency(row.discountedCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <WizardNavigation
                    currentStep={8}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSaveDraft={handleSave}
                    isLoading={false}
                    isSaving={isSaving}
                    canProceed={yearlyData.length > 0}
                    showSaveSuccess={false}
                />
            </div>
        </div>
    );
}
