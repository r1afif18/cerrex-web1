'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import {
    Recycle, AlertCircle, Loader2, Info, Sliders
} from 'lucide-react';

interface WastePartition {
    ilwPercent: number;
    llwPercent: number;
    vllwPercent: number;
    ewPercent: number;
    nonRadPercent: number;
}

interface Step3PageProps {
    params: Promise<{ projectId: string }>;
}

const WASTE_TYPES = [
    { key: 'ilwPercent', code: 'ILW', name: 'Intermediate Level Waste', color: 'bg-red-500', description: 'High activity, requires shielding' },
    { key: 'llwPercent', code: 'LLW', name: 'Low Level Waste', color: 'bg-orange-500', description: 'Low activity, limited shielding' },
    { key: 'vllwPercent', code: 'VLLW', name: 'Very Low Level Waste', color: 'bg-yellow-500', description: 'Very low activity' },
    { key: 'ewPercent', code: 'EW', name: 'Exempt Waste', color: 'bg-emerald-500', description: 'Below clearance levels' },
    { key: 'nonRadPercent', code: 'NON_RAD', name: 'Non-radioactive', color: 'bg-slate-400', description: 'Conventional waste' },
];

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
        vllwPercent: 30,
        ewPercent: 20,
        nonRadPercent: 30,
    });

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

            const { data: wasteData } = await supabase
                .from('waste_partitions')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (wasteData) {
                setPartition({
                    ilwPercent: wasteData.ilw_percent || 5,
                    llwPercent: wasteData.llw_percent || 15,
                    vllwPercent: wasteData.vllw_percent || 30,
                    ewPercent: wasteData.ew_percent || 20,
                    nonRadPercent: wasteData.non_rad_percent || 30,
                });
            }
        } catch (err) {
            console.error('Error loading:', err);
        } finally {
            setIsLoading(false);
        }
    }

    function updatePartition(key: keyof WastePartition, value: number) {
        setPartition(prev => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
    }

    const total = partition.ilwPercent + partition.llwPercent + partition.vllwPercent +
        partition.ewPercent + partition.nonRadPercent;
    const isValid = Math.abs(total - 100) < 0.01;

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            await supabase
                .from('waste_partitions')
                .upsert({
                    project_id: projectId,
                    mode: 'MANUAL',
                    ilw_percent: partition.ilwPercent,
                    llw_percent: partition.llwPercent,
                    vllw_percent: partition.vllwPercent,
                    ew_percent: partition.ewPercent,
                    non_rad_percent: partition.nonRadPercent,
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
            setError('Failed to save waste partition');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleNext() {
        if (!isValid) {
            setError('Percentages must sum to 100%');
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
            <WizardProgress
                currentStep={3}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Recycle className="text-emerald-500" />
                    Waste Mapping
                </h1>
                <p className="text-slate-500 mt-2">
                    Define how inventory materials are distributed across waste categories for disposal cost calculation.
                </p>
            </div>

            {/* Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium">Waste Classification</p>
                    <p className="mt-1 text-blue-700">
                        Define the percentage distribution of decommissioning waste by category.
                        This affects waste management costs (ISDC 05.xxxx) in the calculation.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="glass-panel rounded-2xl p-6">
                {/* Visual Bar */}
                <div className="mb-8">
                    <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
                        {WASTE_TYPES.map((type) => {
                            const value = partition[type.key as keyof WastePartition];
                            return (
                                <div
                                    key={type.key}
                                    className={`${type.color} transition-all duration-300`}
                                    style={{ width: `${value}%` }}
                                    title={`${type.name}: ${value}%`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>0%</span>
                        <span className={`font-semibold ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                            Total: {total.toFixed(1)}%
                        </span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Sliders */}
                <div className="space-y-6">
                    {WASTE_TYPES.map((type) => {
                        const value = partition[type.key as keyof WastePartition];
                        return (
                            <div key={type.key} className="flex items-center gap-6">
                                <div className="w-40 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded ${type.color}`} />
                                        <span className="font-semibold text-slate-800">{type.code}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{type.name}</p>
                                </div>

                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={1}
                                        value={value}
                                        onChange={(e) => updatePartition(type.key as keyof WastePartition, parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                <div className="w-24 flex-shrink-0">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updatePartition(type.key as keyof WastePartition, parseFloat(e.target.value) || 0)}
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-semibold focus:border-blue-400 focus:outline-none"
                                        />
                                        <span className="text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Presets */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Sliders size={16} />
                        Quick Presets
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPartition({ ilwPercent: 5, llwPercent: 15, vllwPercent: 30, ewPercent: 20, nonRadPercent: 30 })}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Research Reactor
                        </button>
                        <button
                            onClick={() => setPartition({ ilwPercent: 10, llwPercent: 20, vllwPercent: 25, ewPercent: 15, nonRadPercent: 30 })}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Power Reactor
                        </button>
                        <button
                            onClick={() => setPartition({ ilwPercent: 2, llwPercent: 8, vllwPercent: 20, ewPercent: 30, nonRadPercent: 40 })}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Low Activity Facility
                        </button>
                    </div>
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
    );
}
