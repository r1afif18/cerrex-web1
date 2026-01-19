'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    TrendingUp, AlertCircle, Loader2, Info, Calendar
} from 'lucide-react';

interface CashflowYear {
    year: number;
    nominal: number;
    inflated: number;
    discounted: number;
    cumulative: number;
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
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [inflationRate, setInflationRate] = useState(2.5);
    const [discountRate, setDiscountRate] = useState(3.0);
    const [totalCost, setTotalCost] = useState(0);
    const [startYear, setStartYear] = useState(2026);
    const [duration, setDuration] = useState(10);
    const [cashflow, setCashflow] = useState<CashflowYear[]>([]);
    const [currency, setCurrency] = useState('EUR');

    useEffect(() => {
        loadData();
    }, [projectId]);

    useEffect(() => {
        if (totalCost > 0) {
            generateCashflow();
        }
    }, [totalCost, inflationRate, discountRate, startYear, duration]);

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
                .select('reference_currency, reference_year')
                .eq('id', projectId)
                .single();

            if (project) {
                setCurrency(project.reference_currency || 'EUR');
                setStartYear(project.reference_year || 2026);
            }

            // Load calculation results
            const { data: results } = await supabase
                .from('calculation_results')
                .select('total_cost')
                .eq('project_id', projectId)
                .single();

            if (results) {
                setTotalCost(results.total_cost || 0);
            }

            // Load existing cashflow settings
            const { data: settings } = await supabase
                .from('cashflow_settings')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (settings) {
                setInflationRate((settings.inflation_rate || 0.025) * 100);
                setDiscountRate((settings.discount_rate || 0.03) * 100);
            }

            // Load phases for duration
            const { data: phases } = await supabase
                .from('project_phases')
                .select('duration_months')
                .eq('project_id', projectId);

            if (phases && phases.length > 0) {
                const totalMonths = phases.reduce((sum: number, p: { duration_months: number }) => sum + (p.duration_months || 0), 0);
                setDuration(Math.ceil(totalMonths / 12) || 10);
            }

        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function generateCashflow() {
        const years: CashflowYear[] = [];
        const annualNominal = totalCost / duration;
        let cumulative = 0;

        for (let i = 0; i < duration; i++) {
            const year = startYear + i;
            const inflationFactor = Math.pow(1 + inflationRate / 100, i);
            const discountFactor = Math.pow(1 + discountRate / 100, i);

            const inflated = annualNominal * inflationFactor;
            const discounted = annualNominal / discountFactor;
            cumulative += annualNominal;

            years.push({
                year,
                nominal: annualNominal,
                inflated,
                discounted,
                cumulative,
            });
        }

        setCashflow(years);
    }

    // NPV calculation
    const npv = useMemo(() => {
        return cashflow.reduce((sum, year, i) => {
            return sum + year.nominal / Math.pow(1 + discountRate / 100, i);
        }, 0);
    }, [cashflow, discountRate]);

    const totalInflated = cashflow.reduce((sum, y) => sum + y.inflated, 0);

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
            await supabase
                .from('cashflow_settings')
                .upsert({
                    project_id: projectId,
                    inflation_rate: inflationRate / 100,
                    discount_rate: discountRate / 100,
                }, { onConflict: 'project_id' });

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
                <p className="text-slate-500 text-sm">Loading cashflow...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <WizardProgress
                currentStep={8}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" />
                    Cashflow Projection
                </h1>
                <p className="text-slate-500 mt-2">
                    Generate year-by-year expenditure forecast with inflation and discounting.
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-slate-900">{formatCurrency(totalCost)}</div>
                    <div className="text-xs text-slate-500 font-medium">Base Cost ({currency})</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-amber-600">{formatCurrency(totalInflated)}</div>
                    <div className="text-xs text-slate-500 font-medium">Inflated Total</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-emerald-600">{formatCurrency(npv)}</div>
                    <div className="text-xs text-slate-500 font-medium">NPV</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-blue-600">{duration} yrs</div>
                    <div className="text-xs text-slate-500 font-medium">Duration</div>
                </div>
            </div>

            {/* Settings */}
            <div className="glass-panel rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Start Year:</span>
                            <input
                                type="number"
                                value={startYear}
                                onChange={(e) => setStartYear(parseInt(e.target.value) || 2026)}
                                min={2020}
                                max={2050}
                                className="w-20 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Duration:</span>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                                min={1}
                                max={50}
                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 focus:outline-none"
                            />
                            <span className="text-sm text-slate-500">years</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Inflation:</span>
                            <input
                                type="number"
                                value={inflationRate}
                                onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                                min={0}
                                max={20}
                                step={0.1}
                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 focus:outline-none"
                            />
                            <span className="text-sm text-slate-500">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Discount:</span>
                            <input
                                type="number"
                                value={discountRate}
                                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                                min={0}
                                max={20}
                                step={0.1}
                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 focus:outline-none"
                            />
                            <span className="text-sm text-slate-500">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cashflow Table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <Calendar size={18} />
                    <h3 className="font-semibold text-slate-800">Annual Cashflow</h3>
                </div>

                <div className="max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Year</th>
                                <th className="px-4 py-3 text-right">Nominal ({currency})</th>
                                <th className="px-4 py-3 text-right">Inflated</th>
                                <th className="px-4 py-3 text-right">Discounted (NPV)</th>
                                <th className="px-4 py-3 text-right">Cumulative</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cashflow.map((year, i) => (
                                <tr key={year.year} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                        {year.year}
                                        {i === 0 && <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Start</span>}
                                        {i === cashflow.length - 1 && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">End</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(year.nominal)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-amber-600">{formatCurrency(year.inflated)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(year.discounted)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(year.cumulative / totalCost) * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-mono text-slate-600">{formatCurrency(year.cumulative)}</span>
                                        </div>
                                    </td>
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
                canProceed={true}
                showSaveSuccess={showSaveSuccess}
            />
        </div>
    );
}
