'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { ISDC_L1 } from '@/lib/wizard/isdc-data';
import { DD_CATEGORIES } from '@/lib/wizard/dd-categories';
import {
    BarChart3, AlertCircle, Loader2, TrendingUp,
    DollarSign, Users, Trash2, ChevronDown, ChevronRight
} from 'lucide-react';

interface CostBreakdown {
    code: string;
    name: string;
    labour: number;
    investment: number;
    expenses: number;
    contingency: number;
    total: number;
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
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [labourRate, setLabourRate] = useState(50);
    const [currency, setCurrency] = useState('EUR');

    useEffect(() => {
        loadAndCalculate();
    }, [projectId]);

    async function loadAndCalculate() {
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
                .select('reference_labour_rate, reference_currency')
                .eq('id', projectId)
                .single();

            if (project) {
                setLabourRate(project.reference_labour_rate || 50);
                setCurrency(project.reference_currency || 'EUR');
            }

            // Load inventory
            const { data: inventoryData } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('project_id', projectId);

            // Load ISDC selections with contingencies
            const { data: isdcSelections } = await supabase
                .from('project_isdc_selection')
                .select('*')
                .eq('project_id', projectId);

            // Load waste partitions
            const { data: wasteData } = await supabase
                .from('waste_partitions')
                .select('*')
                .eq('project_id', projectId)
                .single();

            // Calculate costs
            const breakdown = calculateCosts(inventoryData || [], isdcSelections || [], wasteData, project?.reference_labour_rate || 50);
            setCostBreakdown(breakdown);

        } catch (err) {
            console.error('Error loading:', err);
            setError('Failed to calculate costs');
        } finally {
            setIsLoading(false);
        }
    }

    function calculateCosts(
        inventory: { dd_category: string; quantity: number; work_difficulty_factor: number }[],
        isdcSelections: { isdc_code: string; contingency_percent: number; is_active: boolean }[],
        wastePartition: { ilw_percent: number; llw_percent: number; vllw_percent: number } | null,
        labourRate: number
    ): CostBreakdown[] {
        // Build ISDC selection map
        const selectionMap = new Map<string, { contingency: number }>();
        isdcSelections.forEach(sel => {
            selectionMap.set(sel.isdc_code, { contingency: sel.contingency_percent });
        });

        // Calculate D&D costs from inventory
        let totalDDLabour = 0;
        let totalDDInvestment = 0;
        let totalDDExpenses = 0;
        let totalMass = 0;

        inventory.forEach(item => {
            const cat = DD_CATEGORIES.find(c => c.code === item.dd_category);
            if (!cat) return;

            const wdf = item.work_difficulty_factor || 1.0;
            const qty = item.quantity || 0;

            // Labour = quantity × manpower_UF × WDF × labour_rate
            totalDDLabour += qty * cat.defaultManpowerUF * wdf * labourRate;
            // Investment = quantity × investment_UF
            totalDDInvestment += qty * cat.defaultInvestmentUF;
            // Expenses = quantity × expenses_UF
            totalDDExpenses += qty * cat.defaultExpensesUF;

            if (cat.unit === 't') totalMass += qty;
        });

        // Allocate to ISDC L1 categories (simplified allocation)
        const breakdown: CostBreakdown[] = [];

        ISDC_L1.forEach(item => {
            const sel = selectionMap.get(item.code);
            const contingencyPct = sel?.contingency ?? item.contingencyDefault;

            let labour = 0, investment = 0, expenses = 0;

            // Simplified allocation based on ISDC type
            switch (item.code) {
                case '01': // Pre-decommissioning
                    labour = totalDDLabour * 0.08;
                    investment = totalDDInvestment * 0.05;
                    expenses = totalDDExpenses * 0.10;
                    break;
                case '02': // Shutdown
                    labour = totalDDLabour * 0.05;
                    investment = totalDDInvestment * 0.03;
                    expenses = totalDDExpenses * 0.05;
                    break;
                case '03': // Safe enclosure
                    labour = totalDDLabour * 0.02;
                    investment = totalDDInvestment * 0.02;
                    expenses = totalDDExpenses * 0.02;
                    break;
                case '04': // Dismantling
                    labour = totalDDLabour * 0.35;
                    investment = totalDDInvestment * 0.40;
                    expenses = totalDDExpenses * 0.30;
                    break;
                case '05': // Waste management
                    labour = totalDDLabour * 0.20;
                    investment = totalDDInvestment * 0.25;
                    expenses = totalDDExpenses * 0.25;
                    break;
                case '06': // Site infrastructure
                    labour = totalDDLabour * 0.08;
                    investment = totalDDInvestment * 0.05;
                    expenses = totalDDExpenses * 0.08;
                    break;
                case '07': // Demolition
                    labour = totalDDLabour * 0.10;
                    investment = totalDDInvestment * 0.10;
                    expenses = totalDDExpenses * 0.10;
                    break;
                case '08': // Project management
                    labour = totalDDLabour * 0.08;
                    investment = totalDDInvestment * 0.05;
                    expenses = totalDDExpenses * 0.05;
                    break;
                case '09': // R&D
                    labour = totalDDLabour * 0.02;
                    investment = totalDDInvestment * 0.03;
                    expenses = totalDDExpenses * 0.03;
                    break;
                case '10': // Fuel
                    labour = totalDDLabour * 0.01;
                    investment = totalDDInvestment * 0.01;
                    expenses = totalDDExpenses * 0.01;
                    break;
                case '11': // Miscellaneous
                    labour = totalDDLabour * 0.01;
                    investment = totalDDInvestment * 0.01;
                    expenses = totalDDExpenses * 0.01;
                    break;
            }

            const subtotal = labour + investment + expenses;
            const contingency = subtotal * (contingencyPct / 100);
            const total = subtotal + contingency;

            breakdown.push({
                code: item.code,
                name: item.name,
                labour,
                investment,
                expenses,
                contingency,
                total,
            });
        });

        return breakdown;
    }

    // Totals
    const totals = useMemo(() => {
        return costBreakdown.reduce((acc, item) => ({
            labour: acc.labour + item.labour,
            investment: acc.investment + item.investment,
            expenses: acc.expenses + item.expenses,
            contingency: acc.contingency + item.contingency,
            total: acc.total + item.total,
        }), { labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0 });
    }, [costBreakdown]);

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
            // Save calculation results
            await supabase
                .from('calculation_results')
                .upsert({
                    project_id: projectId,
                    calculated_at: new Date().toISOString(),
                    total_labour: totals.labour,
                    total_investment: totals.investment,
                    total_expenses: totals.expenses,
                    total_contingency: totals.contingency,
                    total_cost: totals.total,
                    isdc_l1_breakdown: costBreakdown,
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
            setError('Failed to save results');
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
                <p className="text-slate-500 text-sm">Calculating costs...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <WizardProgress
                currentStep={7}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <BarChart3 className="text-blue-500" />
                    Cost Results
                </h1>
                <p className="text-slate-500 mt-2">
                    Review calculated decommissioning costs organized by ISDC structure.
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="glass-panel rounded-xl p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="text-3xl font-black">{formatCurrency(totals.total)}</div>
                    <div className="text-xs font-medium opacity-80">Total {currency}</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-xl font-bold text-slate-800">{formatCurrency(totals.labour)}</div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Users size={12} /> Labour
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-xl font-bold text-slate-800">{formatCurrency(totals.investment)}</div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <TrendingUp size={12} /> Investment
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-xl font-bold text-slate-800">{formatCurrency(totals.expenses)}</div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <DollarSign size={12} /> Expenses
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-xl font-bold text-rose-600">{formatCurrency(totals.contingency)}</div>
                    <div className="text-xs text-slate-500 font-medium">Contingency</div>
                </div>
            </div>

            {/* ISDC Breakdown Table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Cost Breakdown by ISDC L1</h3>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-4 py-3">ISDC</th>
                            <th className="px-4 py-3 text-right">Labour</th>
                            <th className="px-4 py-3 text-right">Investment</th>
                            <th className="px-4 py-3 text-right">Expenses</th>
                            <th className="px-4 py-3 text-right">Contingency</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {costBreakdown.map(item => {
                            const pct = totals.total > 0 ? (item.total / totals.total) * 100 : 0;
                            return (
                                <tr key={item.code} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                                                {item.code}
                                            </span>
                                            <span className="font-medium text-slate-800 truncate max-w-[200px]">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(item.labour)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(item.investment)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(item.expenses)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-rose-600">{formatCurrency(item.contingency)}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500 w-10">{pct.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Total Row */}
                        <tr className="bg-slate-100 font-semibold">
                            <td className="px-4 py-3 text-slate-900">TOTAL</td>
                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.labour)}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.investment)}</td>
                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.expenses)}</td>
                            <td className="px-4 py-3 text-right font-mono text-rose-600">{formatCurrency(totals.contingency)}</td>
                            <td className="px-4 py-3 text-right text-blue-600 text-lg">{formatCurrency(totals.total)}</td>
                            <td className="px-4 py-3 text-right text-slate-500">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <WizardNavigation
                currentStep={7}
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
