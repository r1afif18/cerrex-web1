'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FACILITY_TYPES, DECOM_STRATEGIES, DEFAULT_PROJECT_CONTEXT, DEFAULT_CURRENCIES } from '@/lib/wizard/constants';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    Building2,
    Calendar,
    DollarSign,
    Clock,
    Settings2,
    MapPin,
    FileText,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface ProjectContextForm {
    name: string;
    description: string;
    facilityType: string;
    facilityName: string;
    facilityLocation: string;
    referenceCurrency: string;
    nationalCurrency: string;
    exchangeRate: number;
    referenceYear: number;
    decomStartDate: string;
    strategy: string;
    deferralYears: number;
    workingHoursPerMonth: number;
    overheadRate: number;
    ownerOrganization: string;
    notes: string;
}

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

    const [form, setForm] = useState<ProjectContextForm>({
        name: '',
        description: '',
        facilityType: DEFAULT_PROJECT_CONTEXT.facilityType,
        facilityName: '',
        facilityLocation: '',
        referenceCurrency: DEFAULT_PROJECT_CONTEXT.referenceCurrency,
        nationalCurrency: DEFAULT_PROJECT_CONTEXT.nationalCurrency,
        exchangeRate: DEFAULT_PROJECT_CONTEXT.exchangeRate,
        referenceYear: DEFAULT_PROJECT_CONTEXT.referenceYear,
        decomStartDate: '',
        strategy: DEFAULT_PROJECT_CONTEXT.strategy,
        deferralYears: DEFAULT_PROJECT_CONTEXT.deferralYears,
        workingHoursPerMonth: DEFAULT_PROJECT_CONTEXT.workingHoursPerMonth,
        overheadRate: DEFAULT_PROJECT_CONTEXT.overheadRate,
        ownerOrganization: '',
        notes: '',
    });

    // Load existing data
    useEffect(() => {
        loadProjectData();
    }, [projectId]);

    async function loadProjectData() {
        setIsLoading(true);
        setError(null);

        try {
            // Load project basic info
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;

            if (project) {
                setForm(prev => ({
                    ...prev,
                    name: project.name || '',
                    description: project.description || '',
                    referenceCurrency: project.reference_currency || 'EUR',
                    nationalCurrency: project.national_currency || 'IDR',
                    referenceYear: project.reference_year || 2026,
                }));
            }

            // Load extended context
            const { data: context } = await supabase
                .from('project_context')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (context) {
                setForm(prev => ({
                    ...prev,
                    facilityType: context.facility_type || 'RESEARCH',
                    facilityName: context.facility_name || '',
                    facilityLocation: context.facility_location || '',
                    decomStartDate: context.decom_start_date || '',
                    strategy: context.strategy || 'IMMEDIATE',
                    deferralYears: context.deferral_years || 0,
                    workingHoursPerMonth: context.working_hours_per_month || 160,
                    overheadRate: context.overhead_rate || 15,
                    ownerOrganization: context.owner_organization || '',
                    notes: context.notes || '',
                }));
            }

            // Load wizard session
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
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load project data');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // Update project basic info
            const { error: projectError } = await supabase
                .from('projects')
                .update({
                    name: form.name,
                    description: form.description,
                    reference_currency: form.referenceCurrency,
                    national_currency: form.nationalCurrency,
                    reference_year: form.referenceYear,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId);

            if (projectError) throw projectError;

            // Upsert project context
            const { error: contextError } = await supabase
                .from('project_context')
                .upsert({
                    project_id: projectId,
                    facility_type: form.facilityType,
                    facility_name: form.facilityName,
                    facility_location: form.facilityLocation,
                    decom_start_date: form.decomStartDate || null,
                    strategy: form.strategy,
                    deferral_years: form.deferralYears,
                    working_hours_per_month: form.workingHoursPerMonth,
                    overhead_rate: form.overheadRate,
                    owner_organization: form.ownerOrganization,
                    notes: form.notes,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' });

            if (contextError) throw contextError;

            // Update wizard session
            await supabase
                .from('wizard_sessions')
                .upsert({
                    project_id: projectId,
                    last_saved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'project_id' });

            // Show success
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);

        } catch (err) {
            console.error('Error saving:', err);
            setError('Failed to save project data');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        await handleSave();

        // Mark step as complete and update current step
        await supabase
            .from('wizard_sessions')
            .upsert({
                project_id: projectId,
                current_step: 1,
                step_0_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        // Navigate to Step 1
        router.push(`/dashboard/wizard/${projectId}/step-1`);
    }

    function handleBack() {
        router.push('/dashboard');
    }

    function handleStepClick(step: number) {
        if (step === 0) return;
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    // Validation
    const canProceed = form.name.trim().length >= 3 && Boolean(form.facilityType) && Boolean(form.strategy);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading project data...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            {/* Progress Indicator */}
            <WizardProgress
                currentStep={0}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            {/* Step Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Context</h1>
                <p className="text-slate-500 mt-2">Define the basic parameters for your decommissioning cost estimation.</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Form */}
            <div className="glass-panel rounded-2xl p-8 space-y-8">

                {/* Section: Basic Information */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-blue-500" />
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Project Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., TRIGA Mark II Decommissioning Project"
                                className="glass-input w-full px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400"
                            />
                            {form.name.length > 0 && form.name.length < 3 && (
                                <p className="text-xs text-amber-600 mt-1">Name must be at least 3 characters</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the project scope..."
                                rows={3}
                                className="glass-input w-full px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Section: Facility Type */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                        Facility Type <span className="text-red-500">*</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FACILITY_TYPES.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setForm(prev => ({ ...prev, facilityType: type.value }))}
                                className={`
                  p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${form.facilityType === type.value
                                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }
                `}
                            >
                                <span className={`font-semibold ${form.facilityType === type.value ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {type.label}
                                </span>
                                <p className={`text-xs mt-1 ${form.facilityType === type.value ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {type.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Additional Facility Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                <MapPin size={14} className="inline mr-1" />
                                Facility Name
                            </label>
                            <input
                                type="text"
                                value={form.facilityName}
                                onChange={(e) => setForm(prev => ({ ...prev, facilityName: e.target.value }))}
                                placeholder="e.g., Kartini Research Reactor"
                                className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Facility Location
                            </label>
                            <input
                                type="text"
                                value={form.facilityLocation}
                                onChange={(e) => setForm(prev => ({ ...prev, facilityLocation: e.target.value }))}
                                placeholder="e.g., Yogyakarta, Indonesia"
                                className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* Section: Currency Settings */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <DollarSign size={20} className="text-emerald-500" />
                        Currency Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Reference Currency
                            </label>
                            <select
                                value={form.referenceCurrency}
                                onChange={(e) => setForm(prev => ({ ...prev, referenceCurrency: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                            >
                                {DEFAULT_CURRENCIES.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} - {curr.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                National Currency
                            </label>
                            <select
                                value={form.nationalCurrency}
                                onChange={(e) => setForm(prev => ({ ...prev, nationalCurrency: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                            >
                                {DEFAULT_CURRENCIES.map((curr) => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} - {curr.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Exchange Rate
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={form.exchangeRate}
                                    onChange={(e) => setForm(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 0 }))}
                                    className="glass-input w-full px-4 py-3 rounded-xl pr-20"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                                    {form.nationalCurrency}/{form.referenceCurrency}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Timeline */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-violet-500" />
                        Timeline
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Reference Year
                            </label>
                            <input
                                type="number"
                                value={form.referenceYear}
                                onChange={(e) => setForm(prev => ({ ...prev, referenceYear: parseInt(e.target.value) || 2026 }))}
                                min={2020}
                                max={2050}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                            />
                            <p className="text-xs text-slate-500 mt-1">All costs will be indexed to this year</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Decommissioning Start Date
                            </label>
                            <input
                                type="date"
                                value={form.decomStartDate}
                                onChange={(e) => setForm(prev => ({ ...prev, decomStartDate: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                            />
                        </div>
                    </div>
                </section>

                {/* Section: Strategy */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4">
                        Decommissioning Strategy <span className="text-red-500">*</span>
                    </h2>

                    <div className="space-y-3">
                        {DECOM_STRATEGIES.map((strategy) => (
                            <button
                                key={strategy.value}
                                onClick={() => setForm(prev => ({
                                    ...prev,
                                    strategy: strategy.value,
                                    deferralYears: strategy.value !== 'DEFERRED' ? 0 : prev.deferralYears
                                }))}
                                className={`
                  w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center
                  ${form.strategy === strategy.value
                                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }
                `}
                            >
                                <div className={`
                  w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0
                  ${form.strategy === strategy.value ? 'border-blue-500' : 'border-slate-300'}
                `}>
                                    {form.strategy === strategy.value && (
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <span className={`font-semibold ${form.strategy === strategy.value ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {strategy.label}
                                    </span>
                                    <p className={`text-xs mt-0.5 ${form.strategy === strategy.value ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {strategy.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Deferral Years (conditional) */}
                    {form.strategy === 'DEFERRED' && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <label className="block text-sm font-semibold text-amber-800 mb-2">
                                Deferral Period (years)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={form.deferralYears}
                                    onChange={(e) => setForm(prev => ({ ...prev, deferralYears: parseInt(e.target.value) || 0 }))}
                                    min={0}
                                    max={100}
                                    className="glass-input w-32 px-4 py-2 rounded-xl text-center"
                                />
                                <span className="text-sm text-amber-700">years of safe storage before dismantling</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Section: Operational Parameters */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Settings2 size={20} className="text-slate-500" />
                        Operational Parameters
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <Clock size={14} />
                                Working Hours per Month
                            </label>
                            <input
                                type="number"
                                value={form.workingHoursPerMonth}
                                onChange={(e) => setForm(prev => ({ ...prev, workingHoursPerMonth: parseInt(e.target.value) || 160 }))}
                                min={100}
                                max={200}
                                className="glass-input w-full px-4 py-3 rounded-xl"
                            />
                            <p className="text-xs text-slate-500 mt-1">Typical: 160 hours/month</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Overhead Rate (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={form.overheadRate}
                                    onChange={(e) => setForm(prev => ({ ...prev, overheadRate: parseFloat(e.target.value) || 0 }))}
                                    step="0.5"
                                    min={0}
                                    max={50}
                                    className="glass-input w-full px-4 py-3 rounded-xl pr-10"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Applied to labour costs</p>
                        </div>
                    </div>
                </section>

                {/* Section: Additional Information */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-slate-500" />
                        Additional Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Owner Organization
                            </label>
                            <input
                                type="text"
                                value={form.ownerOrganization}
                                onChange={(e) => setForm(prev => ({ ...prev, ownerOrganization: e.target.value }))}
                                placeholder="e.g., BATAN / National Nuclear Energy Agency"
                                className="glass-input w-full px-4 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Any additional notes or assumptions..."
                                rows={3}
                                className="glass-input w-full px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm resize-none"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Navigation */}
            <WizardNavigation
                currentStep={0}
                onBack={handleBack}
                onNext={handleNext}
                onSaveDraft={handleSave}
                isLoading={false}
                isSaving={isSaving}
                canProceed={canProceed}
                showSaveSuccess={showSaveSuccess}
            />
        </div>
    );
}
