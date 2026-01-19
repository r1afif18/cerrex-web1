'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { Building2, Settings2, Coins, AlertCircle, Loader2 } from 'lucide-react';
import { FACILITY_TYPES, DECOMMISSIONING_STRATEGIES, DEFAULT_CURRENCIES } from '@/lib/wizard/constants';

interface Step0PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step0Page({ params }: Step0PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState({
        name: '',
        description: '',
        facilityType: '',
        strategy: 'IMM',
        currency: 'EUR',
        labourRate: 50,
        referenceYear: 2026,
    });

    // Validation
    const canProceed =
        form.name.length >= 3 &&
        form.facilityType !== '' &&
        form.strategy !== '';

    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        loadProjectData();
    }, [projectId]);

    async function loadProjectData() {
        setIsLoading(true);
        try {
            // Load session + project data
            const { data: session } = await supabase
                .from('wizard_sessions')
                .select(`
          *,
          project:projects(*)
        `)
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

                if (session.project) {
                    setForm({
                        name: session.project.name || '',
                        description: session.project.description || '',
                        facilityType: session.project.facility_type || '',
                        strategy: session.project.decommissioning_strategy || 'IMM',
                        currency: session.project.reference_currency || 'EUR',
                        labourRate: session.project.reference_labour_rate || 50,
                        referenceYear: session.project.reference_year || 2026,
                    });
                }
            }
        } catch (err) {
            console.error('Error loading project:', err);
            setError('Failed to load project data');
        } finally {
            setIsLoading(false);
        }
    }

    const updateForm = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    async function handleSaveDraft() {
        setIsSaving(true);
        try {
            await saveProjectData();
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        } catch (err) {
            console.error('Error saving draft:', err);
            setError('Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        if (!canProceed) {
            setFormError('Please fill in all required fields');
            return;
        }

        setIsSaving(true);
        try {
            await saveProjectData();

            // Update session progress
            await supabase
                .from('wizard_sessions')
                .update({
                    step_0_completed: true,
                    current_step: 1,
                    updated_at: new Date().toISOString()
                })
                .eq('project_id', projectId);

            router.push(`/dashboard/wizard/${projectId}/step-1`);
        } catch (err) {
            console.error('Error saving:', err);
            setError('Failed to save progress');
        } finally {
            setIsSaving(false);
        }
    }

    async function saveProjectData() {
        const { error } = await supabase
            .from('projects')
            .update({
                name: form.name,
                description: form.description,
                facility_type: form.facilityType,
                decommissioning_strategy: form.strategy,
                reference_currency: form.currency,
                reference_labour_rate: form.labourRate,
                reference_year: form.referenceYear,
                updated_at: new Date().toISOString(),
            })
            .eq('id', projectId);

        if (error) throw error;
    }

    function handleStepClick(step: number) {
        if (completedSteps[step] || step < 1) { // Allow nav if completed or creating
            router.push(`/dashboard/wizard/${projectId}/step-${step}`);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading project context...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={0}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-8">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Project Context</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Define the basic parameters for your decommissioning cost estimation.
                    </p>
                </div>

                {formError && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{formError}</span>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Basic Info */}
                    <section className="glass-panel glass-panel-dark rounded-2xl p-8 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <Building2 className="text-blue-500" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Project Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => updateForm('name', e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="e.g. TRIGA 2000 Decommissioning"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Facility Type <span className="text-red-500">*</span></label>
                                <select
                                    value={form.facilityType}
                                    onChange={(e) => updateForm('facilityType', e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                                >
                                    <option value="" disabled>Select Type</option>
                                    {FACILITY_TYPES.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => updateForm('description', e.target.value)}
                                    className="glass-input w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[100px]"
                                    placeholder="Brief description of the facility and project scope..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Strategy & Economics */}
                    <section className="glass-panel glass-panel-dark rounded-2xl p-8 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings2 className="text-emerald-500" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Strategy & Economics</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Decommissioning Strategy <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 gap-3">
                                    {DECOMMISSIONING_STRATEGIES.map(strat => (
                                        <label
                                            key={strat.id}
                                            className={`
                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                        ${form.strategy === strat.id
                                                    ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-blue-300'
                                                }
                      `}
                                        >
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value={strat.id}
                                                checked={form.strategy === strat.id}
                                                onChange={(e) => updateForm('strategy', e.target.value)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <div>
                                                <div className="font-semibold text-slate-800">{strat.name}</div>
                                                <div className="text-xs text-slate-500">{strat.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Reference Currency</label>
                                    <div className="relative">
                                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            value={form.currency}
                                            onChange={(e) => updateForm('currency', e.target.value)}
                                            className="glass-input w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                                        >
                                            {DEFAULT_CURRENCIES.map(curr => (
                                                <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Reference Labour Cost (Rate/Hour)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                                            {DEFAULT_CURRENCIES.find(c => c.code === form.currency)?.symbol}
                                        </span>
                                        <input
                                            type="number"
                                            value={form.labourRate}
                                            onChange={(e) => updateForm('labourRate', parseFloat(e.target.value))}
                                            className="glass-input w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            min="0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                                            / hr
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-1">Average hourly rate for decommissioning staff</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Reference Year</label>
                                    <input
                                        type="number"
                                        value={form.referenceYear}
                                        onChange={(e) => updateForm('referenceYear', parseInt(e.target.value))}
                                        className="glass-input w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        min="2000"
                                        max="2100"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <WizardNavigation
                    currentStep={0}
                    onBack={() => router.push('/dashboard/wizard')}
                    onNext={handleNext}
                    onSaveDraft={handleSaveDraft}
                    isLoading={isSaving}
                    isSaving={isSaving}
                    canProceed={!!canProceed}
                    showSaveSuccess={showSaveSuccess}
                />
            </div>
        </div>
    );
}
