'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { DD_CATEGORIES } from '@/lib/wizard/dd-categories';
import {
    Package, AlertCircle, Loader2, PlusCircle, Trash2,
    FileSpreadsheet
} from 'lucide-react';

interface Step2PageProps {
    params: Promise<{ projectId: string }>;
}

interface InventoryItem {
    id: string;
    description: string;
    ddCategory: string;
    quantity: number;
    wdf: number;
    contractor: boolean;
}

export default function Step2Page({ params }: Step2PageProps) {
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;
    const router = useRouter();
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(10).fill(false));
    const [error, setError] = useState<string | null>(null);

    const [items, setItems] = useState<InventoryItem[]>([]);

    const initialNewItemState = {
        description: '',
        ddCategory: '',
        quantity: 0,
        wdf: 1.0,
        contractor: false,
    };
    const [newItem, setNewItem] = useState(initialNewItemState);

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

            // Load inventory items
            const { data: inventoryData } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (inventoryData) {
                setItems(inventoryData.map((item: any) => ({
                    id: item.id,
                    description: item.description,
                    ddCategory: item.dd_category,
                    quantity: item.quantity,
                    wdf: item.work_difficulty_factor,
                    contractor: item.is_contractor
                })));
            }

        } catch (err) {
            console.error('Error loading:', err);
            setError('Failed to load inventory data');
        } finally {
            setIsLoading(false);
        }
    }

    function handleAddItem() {
        if (!newItem.description || !newItem.ddCategory || newItem.quantity <= 0) return;

        setItems(prev => [...prev, { ...newItem, id: crypto.randomUUID() }]);
        setNewItem({ ...initialNewItemState });
    }

    function handleDeleteItem(id: string) {
        setItems(prev => prev.filter(item => item.id !== id));
    }

    // Calculate totals
    const totalMass = items.reduce((sum, item) => {
        const cat = DD_CATEGORIES.find(c => c.code === item.ddCategory);
        return cat?.unit === 't' ? sum + item.quantity : sum;
    }, 0);

    const totalArea = items.reduce((sum, item) => {
        const cat = DD_CATEGORIES.find(c => c.code === item.ddCategory);
        return cat?.unit === 'm²' ? sum + item.quantity : sum;
    }, 0);

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // 1. Delete existing items (simple replace strategy for now)
            await supabase.from('inventory_items').delete().eq('project_id', projectId);

            // 2. Insert current items
            if (items.length > 0) {
                const { error: insertError } = await supabase.from('inventory_items').insert(
                    items.map(item => ({
                        project_id: projectId,
                        description: item.description,
                        dd_category: item.ddCategory,
                        quantity: item.quantity,
                        work_difficulty_factor: item.wdf,
                        is_contractor: item.contractor
                    }))
                );
                if (insertError) throw insertError;
            }

            // 3. Update session
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
            setError('Failed to save inventory');
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
                current_step: 3,
                step_2_completed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'project_id' });

        router.push(`/dashboard/wizard/${projectId}/step-3`);
    }

    function handleBack() {
        router.push(`/dashboard/wizard/${projectId}/step-1`);
    }

    function handleStepClick(step: number) {
        router.push(`/dashboard/wizard/${projectId}/step-${step}`);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Loading inventory...</p>
            </div>
        );
    }

    return (
        <div className="fade-enter">
            <div className="max-w-5xl mx-auto">
                <WizardProgress
                    currentStep={2}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                />

                <div className="mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="text-amber-500" />
                        Inventory Builder
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Define the physical inventory of the facility (structures, systems, and components)
                        and assign D&D categories.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="glass-panel rounded-xl p-4">
                        <div className="text-2xl font-black text-slate-900">{items.length}</div>
                        <div className="text-xs text-slate-500 font-medium">Items</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4">
                        <div className="text-2xl font-black text-blue-600">{totalMass.toFixed(1)}t</div>
                        <div className="text-xs text-slate-500 font-medium">Total Mass</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4">
                        <div className="text-2xl font-black text-emerald-600">{totalArea.toFixed(1)}m²</div>
                        <div className="text-xs text-slate-500 font-medium">Total Area</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 bg-blue-50 border-blue-100">
                        <div className="flex items-center justify-between h-full">
                            <span className="text-sm font-semibold text-blue-700">csv import coming soon</span>
                            <FileSpreadsheet className="text-blue-400" size={20} />
                        </div>
                    </div>
                </div>

                {/* Add New Item Form */}
                <div className="glass-panel rounded-2xl p-6 mb-6 border-2 border-dashed border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PlusCircle size={20} className="text-blue-500" />
                        Add Inventory Item
                    </h3>

                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                            <input
                                type="text"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="Item name / description"
                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="col-span-4">
                            <label className="text-xs font-semibold text-slate-500 uppercase">D&D Category</label>
                            <select
                                value={newItem.ddCategory}
                                onChange={(e) => setNewItem({ ...newItem, ddCategory: e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none appearance-none"
                            >
                                <option value="">Select Category...</option>
                                {DD_CATEGORIES.map(cat => (
                                    <option key={cat.code} value={cat.code}>
                                        {cat.code} - {cat.name} ({cat.unit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Quantity</label>
                            <input
                                type="number"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                                placeholder="0.00"
                                min="0"
                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2 flex items-end">
                            <button
                                onClick={handleAddItem}
                                disabled={!newItem.description || !newItem.ddCategory || newItem.quantity <= 0}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Add Item
                            </button>
                        </div>
                    </div>

                    {/* Advanced Row: WDF, Contractor */}
                    <div className="grid grid-cols-12 gap-4 mt-4">
                        <div className="col-span-4">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Work Difficulty (WDF)</label>
                            <input
                                type="number"
                                value={newItem.wdf}
                                onChange={(e) => setNewItem({ ...newItem, wdf: parseFloat(e.target.value) })}
                                step="0.1"
                                min="0.1"
                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="col-span-4 flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newItem.contractor}
                                    onChange={(e) => setNewItem({ ...newItem, contractor: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Contractor Work</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Inventory List */}
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-700">Inventory Items</h3>
                        <span className="text-xs text-slate-500 italic">Sorted by added time</span>
                    </div>

                    {items.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            No items added yet. Use the form above to add inventory.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Description</th>
                                    <th className="px-6 py-3 font-semibold">Category</th>
                                    <th className="px-6 py-3 font-semibold text-right">Qty</th>
                                    <th className="px-6 py-3 font-semibold text-right">WDF</th>
                                    <th className="px-6 py-3 font-semibold text-center">Ctr</th>
                                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map(item => {
                                    const cat = DD_CATEGORIES.find(c => c.code === item.ddCategory);
                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-800">{item.description}</td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono">
                                                    {item.ddCategory}
                                                </span>
                                                <span className="ml-2 text-xs text-slate-500 hidden sm:inline">{cat?.name}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono">
                                                {item.quantity} <span className="text-slate-400 text-xs">{cat?.unit}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-600">{item.wdf}</td>
                                            <td className="px-6 py-3 text-center">
                                                {item.contractor ? (
                                                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Contractor"></span>
                                                ) : (
                                                    <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" title="Internal"></span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <WizardNavigation
                    currentStep={2}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSaveDraft={handleSave}
                    isLoading={false}
                    isSaving={isSaving}
                    canProceed={items.length > 0}
                    showSaveSuccess={showSaveSuccess}
                />
            </div>
        </div>
    );
}
