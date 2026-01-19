'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    Trash2, AlertCircle, Loader2, Info, PieChart, Recycle
} from 'lucide-react';

interface WastePartition {
    ilwPercent: number;
    llwPercent: number;
    vllwPercent: number;
    ewPercent: number;
    nonRadioactivePercent: number;
}

interface Step3PageProps {
    params: Promise<{ projectId: string }>;
}

export default function Step3Page({ params }: Step3PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [partition, setPartition] = useState<WastePartition>({
        ilwPercent: 5,
        llwPercent: 15,
        vllwPercent: 20,
        ewPercent: 10,
        nonRadioactivePercent: 50,
    });

    const totalPercent = Object.values(partition).reduce((a, b) => a + b, 0);
    const isValid = Math.abs(totalPercent - 100) < 0.1;

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

            // Load waste partitions
            const { data: wasteData } = await supabase
                .from('waste_partitions')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (wasteData) {
                setPartition({
                    ilwPercent: wasteData.ilw_percent || 0,
                    llwPercent: wasteData.llw_percent || 0,
                    vllwPercent: wasteData.vllw_percent || 0,
                    ewPercent: wasteData.ew_percent || 0,
                    nonRadioactivePercent: wasteData.clearance_percent || 0,
                });
            }

        } catch (err) {
            console.error('Error loading:', err);
            // Don't show error if no data found (just use defaults)
        } finally {
            setIsLoading(false);
        }
    }

    function updatePartition(key: keyof WastePartition, value: number) {
        setPartition(prev => ({
            ...prev,
            [key]: Math.max(0, Math.min(100, value))
        }));
    }

    function applyPreset(type: 'Heavy' | 'Light' | 'Clean') {
        if (type === 'Heavy') {
            setPartition({ ilwPercent: 20, llwPercent: 40, vllwPercent: 20, ewPercent: 10, nonRadioactivePercent: 10 });
        } else if (type === 'Light') {
            setPartition({ ilwPercent: 2, llwPercent: 10, vllwPercent: 20, ewPercent: 8, nonRadioactivePercent: 60 });
        } else {
            setPartition({ ilwPercent: 0, llwPercent: 5, vllwPercent: 5, ewPercent: 5, nonRadioactivePercent: 85 });
        }
    }

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            await supabase.from('waste_partitions').upsert({
                project_id: projectId,
                mode: 'MANUAL',
                ilw_percent: partition.ilwPercent,
                llw_percent: partition.llwPercent,
                vllw_percent: partition.vllwPercent,
                ew_percent: partition.ewPercent,
                clearance_percent: partition.nonRadioactivePercent,
                updated_at: new Date().toISOString(),
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
            setError('Failed to save waste mapping');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        if (!isValid) {
            setError('Total percentages must equal 100%');
            return;
        }

        await handleSave();

        await supabase
            .from('wizard_sessions')
            .upsert({
                project_id: projectId,
                current_step: 4,
                step_3_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-4`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-2`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading waste configuration...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={3}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Trash2 className="text-rose-500" />
                        Waste Mapping
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Define the waste partitioning strategy manually or calculate from radiological data.
                    </p>
                </div>

                {!isValid && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                        <AlertCircle size={20} />
                        <span>Total percentage must equal 100%. Current: <strong>{totalPercent.toFixed(1)}%</strong></span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Control Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    {/* Sliders Column */}
                    <div className="col-span-2 glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <PieChart size={20} className="text-blue-500" />
                                Target Distribution
                            </h3>
                            <div className="flex gap-2">
                                {['Heavy', 'Light', 'Clean'].map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => applyPreset(preset as any)}
                                        className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                    >
                                        {preset} Preset
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <WasteSlider
                                label="Intermediate Level Waste (ILW)"
                                color="bg-purple-500"
                                value={partition.ilwPercent}
                                onChange={(v) => updatePartition('ilwPercent', v)}
                            />
                            <WasteSlider
                                label="Low Level Waste (LLW)"
                                color="bg-red-500"
                                value={partition.llwPercent}
                                onChange={(v) => updatePartition('llwPercent', v)}
                            />
                            <WasteSlider
                                label="Very Low Level Waste (VLLW)"
                                color="bg-amber-500"
                                value={partition.vllwPercent}
                                onChange={(v) => updatePartition('vllwPercent', v)}
                            />
                            <WasteSlider
                                label="Exempt Waste (EW)"
                                color="bg-blue-500"
                                value={partition.ewPercent}
                                onChange={(v) => updatePartition('ewPercent', v)}
                            />
                            <WasteSlider
                                label="Non-Radioactive / Clearance"
                                color="bg-emerald-500"
                                value={partition.nonRadioactivePercent}
                                onChange={(v) => updatePartition('nonRadioactivePercent', v)}
                            />
                        </div>
                    </div>

                    {/* Visualizer Column */}
                    <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50">
                        <div className="relative w-48 h-12 rounded-full overflow-hidden flex border-4 border-white shadow-lg mb-6">
                            <div style={{ width: `${partition.ilwPercent}%` }} className="h-full bg-purple-500 transition-all duration-500" />
                            <div style={{ width: `${partition.llwPercent}%` }} className="h-full bg-red-500 transition-all duration-500" />
                            <div style={{ width: `${partition.vllwPercent}%` }} className="h-full bg-amber-500 transition-all duration-500" />
                            <div style={{ width: `${partition.ewPercent}%` }} className="h-full bg-blue-500 transition-all duration-500" />
                            <div style={{ width: `${partition.nonRadioactivePercent}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                        </div>

                        <div className="w-full space-y-3">
                            <LegendItem color="bg-purple-500" label="ILW" value={partition.ilwPercent} />
                            <LegendItem color="bg-red-500" label="LLW" value={partition.llwPercent} />
                            <LegendItem color="bg-amber-500" label="VLLW" value={partition.vllwPercent} />
                            <LegendItem color="bg-blue-500" label="EW" value={partition.ewPercent} />
                            <LegendItem color="bg-emerald-500" label="Clearance" value={partition.nonRadioactivePercent} />
                        </div>

                        <div className={`mt-8 px-4 py-2 rounded-xl text-sm font-bold ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            Total: {totalPercent.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <strong>About Calculation Mode:</strong> Currently set to Manual. In future versions, you can link
                        this to the Radiological Characterization Database to auto-calculate partitions based on nuclide vectors.
                    </div>
                </div>

                <WizardNavigation
                    currentStep={3}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSaveDraft={handleSave}
                    isLoading={false}
                    isSaving={isSaving}
                    canProceed={isValid}
                    showSaveSuccess={showSaveSuccess}
                />
            </div>
        </div>
    );
}

function WasteSlider({ label, color, value, onChange }: { label: string, color: string, value: number, onChange: (v: number) => void }) {
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</span>
                <span className="text-xs font-bold text-slate-900">{value.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-${color.replace('bg-', '')}`}
                />
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center font-mono focus:border-blue-500 outline-none"
                />
            </div>
        </div>
    );
}

function LegendItem({ color, label, value }: { color: string, label: string, value: number }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-slate-600 font-medium">{label}</span>
            </div>
            <span className="font-bold text-slate-800">{value.toFixed(1)}%</span>
        </div>
    );
}
