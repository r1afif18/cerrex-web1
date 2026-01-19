'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WizardProgress } from '@/app/components/wizard/WizardProgress';
import { WizardNavigation } from '@/app/components/wizard/WizardNavigation';
import { DD_CATEGORIES, WDF_OPTIONS, DDCategory } from '@/lib/wizard/dd-categories';
import {
    Boxes, Plus, Trash2, Edit2, Save, X,
    AlertCircle, Loader2, Building, Layers
} from 'lucide-react';

interface InventoryItem {
    id: string;
    itemId: string;
    description: string;
    buildingCode: string;
    floorCode: string;
    ddCategoryCode: string;
    quantity: number;
    unit: string;
    wdf: number;
    isContractor: boolean;
}

interface Step2PageProps {
    params: Promise<{ projectId: string }>;
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

    // Inventory state
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // New item form
    const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
        itemId: '',
        description: '',
        buildingCode: 'MAIN',
        floorCode: 'F0',
        ddCategoryCode: 'INV2',
        quantity: 1,
        unit: 't',
        wdf: 1.0,
        isContractor: false,
    });

    useEffect(() => {
        loadData();
    }, [projectId]);

    async function loadData() {
        setIsLoading(true);
        try {
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

            // Load inventory items
            const { data: inventoryData } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('project_id', projectId)
                .order('item_id');

            if (inventoryData) {
                setItems(inventoryData.map((item: {
                    id: string;
                    item_id: string;
                    description: string;
                    building_code: string;
                    floor_code: string;
                    dd_category: string;
                    quantity: number;
                    unit: string;
                    work_difficulty_factor: number;
                    is_contractor: boolean;
                }) => ({
                    id: item.id,
                    itemId: item.item_id || '',
                    description: item.description || '',
                    buildingCode: item.building_code || 'MAIN',
                    floorCode: item.floor_code || 'F0',
                    ddCategoryCode: item.dd_category || 'INV2',
                    quantity: item.quantity || 0,
                    unit: item.unit || 't',
                    wdf: item.work_difficulty_factor || 1.0,
                    isContractor: item.is_contractor || false,
                })));
            }
        } catch (err) {
            console.error('Error loading:', err);
            setError('Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    }

    function handleAddItem() {
        if (!newItem.description || newItem.quantity <= 0) return;

        const id = crypto.randomUUID();
        const category = DD_CATEGORIES.find(c => c.code === newItem.ddCategoryCode);

        setItems(prev => [...prev, {
            ...newItem,
            id,
            itemId: `ITM-${(prev.length + 1).toString().padStart(3, '0')}`,
            unit: category?.unit || 't',
        }]);

        setNewItem({
            itemId: '',
            description: '',
            buildingCode: 'MAIN',
            floorCode: 'F0',
            ddCategoryCode: 'INV2',
            quantity: 1,
            unit: 't',
            wdf: 1.0,
            isContractor: false,
        });
        setShowAddForm(false);
    }

    function handleDeleteItem(id: string) {
        setItems(prev => prev.filter(item => item.id !== id));
    }

    function handleUpdateItem(id: string, updates: Partial<InventoryItem>) {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            // Delete existing items
            await supabase
                .from('inventory_items')
                .delete()
                .eq('project_id', projectId);

            // Insert new items
            if (items.length > 0) {
                const { error: insertError } = await supabase
                    .from('inventory_items')
                    .insert(items.map(item => ({
                        project_id: projectId,
                        item_id: item.itemId,
                        description: item.description,
                        building_code: item.buildingCode,
                        floor_code: item.floorCode,
                        dd_category: item.ddCategoryCode,
                        quantity: item.quantity,
                        unit: item.unit,
                        work_difficulty_factor: item.wdf,
                        is_contractor: item.isContractor,
                    })));

                if (insertError) throw insertError;
            }

            // Update session
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

    // Calculate totals
    const totalMass = items.reduce((sum, item) => {
        if (item.unit === 't') return sum + item.quantity;
        return sum;
    }, 0);

    const totalArea = items.reduce((sum, item) => {
        if (item.unit === 'm²') return sum + item.quantity;
        return sum;
    }, 0);

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
            <WizardProgress
                currentStep={2}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
            />

            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Boxes className="text-blue-500" />
                    Inventory Builder
                </h1>
                <p className="text-slate-500 mt-2">
                    Define facility structures, equipment, and materials with quantities and work difficulty factors.
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-slate-900">{items.length}</div>
                    <div className="text-xs text-slate-500 font-medium">Items</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-blue-600">{totalMass.toFixed(1)} t</div>
                    <div className="text-xs text-slate-500 font-medium">Total Mass</div>
                </div>
                <div className="glass-panel rounded-xl p-4">
                    <div className="text-2xl font-black text-emerald-600">{totalArea.toFixed(0)} m²</div>
                    <div className="text-xs text-slate-500 font-medium">Total Area</div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Layers size={18} />
                        Inventory Items
                    </h3>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={16} />
                        Add Item
                    </button>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200">
                        <div className="grid grid-cols-6 gap-3">
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="e.g., Primary coolant pump"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">D&D Category</label>
                                <select
                                    value={newItem.ddCategoryCode}
                                    onChange={(e) => {
                                        const cat = DD_CATEGORIES.find(c => c.code === e.target.value);
                                        setNewItem(prev => ({
                                            ...prev,
                                            ddCategoryCode: e.target.value,
                                            unit: cat?.unit || 't'
                                        }));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none"
                                >
                                    {DD_CATEGORIES.filter(c => c.defaultManpowerUF > 0).map(cat => (
                                        <option key={cat.code} value={cat.code}>
                                            {cat.code}: {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                    min={0}
                                    step={0.1}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">WDF</label>
                                <select
                                    value={newItem.wdf}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, wdf: parseFloat(e.target.value) }))}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none"
                                >
                                    {WDF_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleAddItem}
                                    disabled={!newItem.description || newItem.quantity <= 0}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={14} />
                                    Add
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table Body */}
                <div className="max-h-[400px] overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Boxes size={40} className="mx-auto mb-3 opacity-50" />
                            <p>No inventory items yet</p>
                            <p className="text-sm mt-1">Click "Add Item" to start building your inventory</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-2">ID</th>
                                    <th className="px-4 py-2">Description</th>
                                    <th className="px-4 py-2">Category</th>
                                    <th className="px-4 py-2 text-right">Quantity</th>
                                    <th className="px-4 py-2 text-center">WDF</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const category = DD_CATEGORIES.find(c => c.code === item.ddCategoryCode);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.itemId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{item.description}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">{item.ddCategoryCode}</span>
                                                    <span className="text-slate-500 text-xs truncate max-w-[120px]">{category?.name}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                {item.quantity.toLocaleString()} {item.unit}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.wdf > 1.5 ? 'bg-red-100 text-red-700' :
                                                        item.wdf > 1.0 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {item.wdf}×
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
            </div>

            <WizardNavigation
                currentStep={2}
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
