'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { PROFESSIONS } from '@/lib/wizard/constants';
import {
    Clock, AlertCircle, Loader2, Plus, Trash2, Users
} from 'lucide-react';

interface Phase {
    id: string;
    name: string;
    durationMonths: number;
    staff: { [professionCode: string]: number };
}

interface Step5PageProps {
    params: Promise<{ projectId: string }>;
}

const DEFAULT_PHASES: Omit<Phase, 'id'>[] = [
    { name: 'Pre-decommissioning', durationMonths: 24, staff: { LBR: 2, TCN: 3, ENG: 2, MNG: 1 } },
    { name: 'Dismantling', durationMonths: 36, staff: { LBR: 10, SKW: 8, TCN: 5, ENG: 3, MNG: 2 } },
    { name: 'Site Restoration', durationMonths: 12, staff: { LBR: 5, SKW: 3, TCN: 2, ENG: 1, MNG: 1 } },
];

export default function Step5Page({ params }: Step5PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [phases, setPhases] = useState<Phase[]>([]);
    const [labourRate, setLabourRate] = useState(50); // EUR/hour

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

            // Load phases
            const { data: phasesData } = await supabase
                .from('project_phases')
                .select('*')
                .eq('project_id', projectId)
                .order('phase_number');

            if (phasesData && phasesData.length > 0) {
                // Load staff for each phase
                const loadedPhases: Phase[] = [];
                for (const phase of phasesData) {
                    const { data: staffData } = await supabase
                        .from('phase_staff_allocation')
                        .select('*')
                        .eq('phase_id', phase.id);

                    const staff: { [key: string]: number } = {};
                    staffData?.forEach((s: { profession_code: string; staff_count: number }) => {
                        staff[s.profession_code] = s.staff_count;
                    });

                    loadedPhases.push({
                        id: phase.id,
                        name: phase.name,
                        durationMonths: phase.duration_months,
                        staff,
                    });
                }
                setPhases(loadedPhases);
            } else {
                // Initialize with defaults
                setPhases(DEFAULT_PHASES.map(p => ({
                    ...p,
                    id: crypto.randomUUID(),
                })));
            }

            // Load project labour rate
            const { data: project } = await supabase
                .from('projects')
                .select('reference_labour_rate')
                .eq('id', projectId)
                .single();

            if (project?.reference_labour_rate) {
                setLabourRate(project.reference_labour_rate);
            }
        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function addPhase() {
        setPhases(prev => [...prev, {
            id: crypto.randomUUID(),
            name: `Phase ${prev.length + 1}`,
            durationMonths: 12,
            staff: {},
        }]);
    }

    function removePhase(id: string) {
        setPhases(prev => prev.filter(p => p.id !== id));
    }

    function updatePhase(id: string, updates: Partial<Phase>) {
        setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }

    function updateStaff(phaseId: string, profCode: string, count: number) {
        setPhases(prev => prev.map(p => {
            if (p.id !== phaseId) return p;
            return {
                ...p,
                staff: { ...p.staff, [profCode]: Math.max(0, count) }
            };
        }));
    }

    // Calculate totals
    const totalDuration = phases.reduce((sum, p) => sum + p.durationMonths, 0);
    const totalStaff = phases.reduce((sum, p) => {
        return sum + Object.values(p.staff).reduce((s, c) => s + c, 0);
    }, 0);

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // Delete existing phases
            await supabase.from('project_phases').delete().eq('project_id', projectId);

            // Insert new phases
            for (let i = 0; i < phases.length; i++) {
                const phase = phases[i];
                const { data: insertedPhase, error: phaseError } = await supabase
                    .from('project_phases')
                    .insert({
                        project_id: projectId,
                        phase_number: i + 1,
                        name: phase.name,
                        duration_months: phase.durationMonths,
                    })
                    .select()
                    .single();

                if (phaseError) throw phaseError;

                // Insert staff allocations
                const staffInserts = Object.entries(phase.staff)
                    .filter(([, count]) => count > 0)
                    .map(([profCode, count]) => ({
                        phase_id: insertedPhase.id,
                        profession_code: profCode,
                        staff_count: count,
                        is_contractor: false,
                    }));

                if (staffInserts.length > 0) {
                    await supabase.from('phase_staff_allocation').insert(staffInserts);
                }
            }

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
            setError('Failed to save period costs');
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
                current_step: 6,
                step_5_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-6`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-4`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading period costs...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <WizardProgress
                currentStep={5}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Clock className="text-amber-500" />
                    Period Costs
                </h1>
                <p className="text-slate-500 mt-2">
                    Define project phases and staff allocation for period-dependent labour costs.
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-slate-900">{phases.length}</div>
                    <div className="text-xs text-slate-500 font-medium">Phases</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-blue-600">{totalDuration} mo</div>
                    <div className="text-xs text-slate-500 font-medium">Total Duration</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-emerald-600">{totalStaff}</div>
                    <div className="text-xs text-slate-500 font-medium">Peak Staff</div>
                </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
                {phases.map((phase, index) => (
                    <div key={phase.id} className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                </span>
                                <input
                                    type="text"
                                    value={phase.name}
                                    onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                                    className="text-lg font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none px-1"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Duration:</span>
                                    <input
                                        type="number"
                                        value={phase.durationMonths}
                                        onChange={(e) => updatePhase(phase.id, { durationMonths: parseInt(e.target.value) || 0 })}
                                        min={1}
                                        max={120}
                                        className="w-16 text-center px-2 py-1 border border-slate-200 rounded text-sm font-semibold focus:border-blue-400 focus:outline-none"
                                    />
                                    <span className="text-sm text-slate-500">months</span>
                                </div>
                                {phases.length > 1 && (
                                    <button
                                        onClick={() => removePhase(phase.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Staff Grid */}
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                                <Users size={16} />
                                Staff Allocation
                            </h4>
                            <div className="grid grid-cols-4 gap-3">
                                {PROFESSIONS.map(prof => (
                                    <div key={prof.code} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                        <span className="text-xs font-medium text-slate-600">{prof.abbrev}</span>
                                        <input
                                            type="number"
                                            value={phase.staff[prof.code] || 0}
                                            onChange={(e) => updateStaff(phase.id, prof.code, parseInt(e.target.value) || 0)}
                                            min={0}
                                            className="w-12 text-center px-1 py-0.5 border border-slate-200 rounded text-sm focus:border-blue-400 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addPhase}
                    className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                >
                    <Plus size={20} />
                    Add Phase
                </button>
            </div>

            <WizardNavigation
                currentStep={5}
                onBack={handleBack}
                onNext={handleNext}
                onSaveDraft={handleSave}
                isLoading={false}
                isSaving={isSaving}
                canProceed={phases.length > 0}
                showSaveSuccess={showSaveSuccess}
            />
        </div>
    );
}
