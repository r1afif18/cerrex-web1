// INV Sheet - Facility Inventory Database
// Premium Glassmorphism Design with Optimized Matrix Operations
'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Boxes,
    Plus,
    Edit2,
    Trash2,
    Grid,
    List,
    Database,
    CheckCircle2,
    Activity,
    ArrowRight,
    Search,
    X,
    Zap,
    Info,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    Map
} from 'lucide-react'

interface InventoryItem {
    id: string
    project_id: string
    dd_primary: string
    building_code: string
    floor_code: string
    room_no: string
    is_activated: boolean
    inventory_type: string
    item_no: number
    isdc_l3_code: string
    item_id: string
    description: string
    material_code: string
    rnv_code: string
    mass_t: number
    basic_workforce: number
    wdf_f1: number
    wdf_f2: number
    wdf_f3: number
    wdf_f4: number
    wdf_f5: number
    wdf_f6: number
    wdf_f7: number
    waste_partition_ilw: number
    waste_partition_llw: number
    waste_partition_vllw: number
    waste_partition_ew: number
    waste_partition_nonrad: number
    contingency_rate: number
    created_at: string
}

interface WasteQuantity {
    id: string
    inventory_item_id: string
    waste_category_code: string
    quantity: number
}

interface DDQuantity {
    id: string
    inventory_item_id: string
    dd_category_code: string
    quantity: number
}

// D&D Categories (INV1-INV51)
const DD_CATEGORIES = [
    { code: 'INV1', name: 'Workforce in controlled area', unit: 'man.h' },
    { code: 'INV2', name: 'General technological equipment', unit: 't' },
    { code: 'INV3', name: 'Massive & thick wall equipment', unit: 't' },
    { code: 'INV4', name: 'Auxiliary & thin wall equipment', unit: 't' },
    { code: 'INV5', name: 'Small core components (<50 kg)', unit: 't' },
    { code: 'INV6', name: 'Medium core components (50-200 kg)', unit: 't' },
    { code: 'INV7', name: 'Large reactor components (>200 kg)', unit: 't' },
    { code: 'INV8', name: 'Massive concrete in controlled area', unit: 't' },
    { code: 'INV9', name: 'Graphite elements, thermal columns', unit: 't' },
    { code: 'INV10', name: 'Low density & specific materials', unit: 't' },
    { code: 'INV11', name: 'Other materials in controlled area', unit: 't' },
    { code: 'INV12', name: 'Contam. material out of controlled area', unit: 't' },
    { code: 'INV13', name: 'Reserve', unit: 't' },
    { code: 'INV14', name: 'Removal solid waste & materials', unit: 't' },
    { code: 'INV15', name: 'Removal liquid waste & sludge', unit: 't' },
    { code: 'INV16', name: 'Chemical decontamination of surfaces', unit: 'm2' },
    { code: 'INV17', name: 'Mechanical decontamination of surfaces', unit: 'm2' },
    { code: 'INV18', name: 'Radiological survey of buildings', unit: 'm2' },
    { code: 'INV19', name: 'Radiological survey of the site', unit: 'm2' },
    { code: 'INV20', name: 'Reserve', unit: 't' },
    { code: 'INV21', name: 'Piping, valves, pumps', unit: 't' },
    { code: 'INV22', name: 'Tanks, heat exchangers', unit: 't' },
    { code: 'INV23', name: 'Steel linings', unit: 't' },
    { code: 'INV24', name: 'Ventilation & thin wall equipment', unit: 't' },
    { code: 'INV25', name: 'Handling equipment', unit: 't' },
    { code: 'INV26', name: 'Cables & cable trays', unit: 't' },
    { code: 'INV27', name: 'Switchboards, electrical cabinets', unit: 't' },
    { code: 'INV28', name: 'Embedded elements', unit: 't' },
    { code: 'INV29', name: 'Thermal insulation', unit: 't' },
    { code: 'INV30', name: 'Asbestos & hazardous materials', unit: 't' },
    { code: 'INV31', name: 'Massive lead shielding', unit: 't' },
    { code: 'INV32', name: 'Lead shielding bricks & plates', unit: 't' },
    { code: 'INV33', name: 'Other shielding', unit: 't' },
    { code: 'INV34', name: 'Glove boxes', unit: 't' },
    { code: 'INV35', name: 'Miscellaneous items', unit: 't' },
    { code: 'INV36', name: 'Reserve', unit: 't' },
    { code: 'INV37', name: 'General equipment out of controlled area', unit: 't' },
    { code: 'INV38', name: 'Structural metal construction', unit: 't' },
    { code: 'INV39', name: 'Massive reinforced concrete', unit: 't' },
    { code: 'INV40', name: 'Masonry, plain concrete', unit: 't' },
    { code: 'INV41', name: 'Other material out of controlled area', unit: 't' },
    { code: 'INV42', name: 'Final site remediation', unit: 'm2' },
    { code: 'INV43', name: 'Reserve', unit: 't' },
    { code: 'INV44', name: 'D&D44 user defined', unit: 't' },
    { code: 'INV45', name: 'D&D45 user defined', unit: 't' },
    { code: 'INV46', name: 'D&D46 user defined', unit: 't' },
    { code: 'INV47', name: 'D&D47 user defined', unit: 't' },
    { code: 'INV48', name: 'D&D48 user defined', unit: 't' },
    { code: 'INV49', name: 'D&D49 user defined', unit: 't' },
    { code: 'INV50', name: 'D&D50 user defined areas', unit: 'm2' },
    { code: 'INV51', name: 'D&D51 user defined areas', unit: 'm2' },
]

// Waste Management Categories (WM1-WM11)
const WM_CATEGORIES = [
    { code: 'HLW1', name: 'High Level Waste', isdc1: '05.0200', isdc2: '05.0700' },
    { code: 'ILW1', name: 'Intermediate Level Waste', isdc1: '05.0300', isdc2: '05.0800' },
    { code: 'LLW1', name: 'Low Level Waste', isdc1: '05.0400', isdc2: '05.0900' },
    { code: 'VLLW1', name: 'Very Low Level Waste', isdc1: '05.0500', isdc2: '05.1000' },
    { code: 'VSLW1', name: 'Very Short Lived Waste', isdc1: '-', isdc2: '05.1100' },
    { code: 'EW1', name: 'Exempt Waste', isdc1: '05.0600', isdc2: '05.1200' },
    { code: 'RCC1', name: 'Recyclable concrete', isdc1: '-', isdc2: '05.1301' },
    { code: 'RCM1', name: 'Recyclable metals', isdc1: '-', isdc2: '05.1303' },
    { code: 'HZW1', name: 'Hazardous waste', isdc1: '-', isdc2: '05.1305' },
    { code: 'CNW1', name: 'Conventional waste', isdc1: '-', isdc2: '05.1307' },
    { code: 'NRW1', name: 'Non-radioactive waste', isdc1: '-', isdc2: '05.1300' },
]

function calcTotalWF(item: InventoryItem): number {
    const wdfSum = (item.wdf_f1 || 0) + (item.wdf_f2 || 0) + (item.wdf_f3 || 0) +
        (item.wdf_f4 || 0) + (item.wdf_f5 || 0) + (item.wdf_f6 || 0) + (item.wdf_f7 || 0)
    return (item.basic_workforce || 0) * (100 + wdfSum) / 100
}

type TabType = 'items' | 'dd-matrix' | 'waste-matrix'

// Premium Form Components
const ActionButton = ({ onClick, icon: Icon, color = 'blue', size = 14, disabled = false, label = '' }: any) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest
            ${color === 'red' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-slate-600 bg-slate-100 hover:bg-white hover:shadow-md'}
        `}
    >
        <Icon size={size} />
        {label}
    </button>
)

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`glass-input w-full px-4 py-2.5 text-xs rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 outline-none font-medium border-slate-200/60 ${props.className || ''}`}
    />
)

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select
        {...props}
        className={`glass-input w-full px-4 py-2.5 text-xs rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white font-bold text-slate-700 border-slate-200/60 appearance-none ${props.className || ''}`}
    />
)

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <label className={`block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 ${className}`}>
        {children}
    </label>
)


export default function INVPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [activeTab, setActiveTab] = useState<TabType>('items')
    const [items, setItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [wasteQuantities, setWasteQuantities] = useState<WasteQuantity[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingCell, setEditingCell] = useState<{ itemId: string, code: string, type: 'dd' | 'waste' } | null>(null)
    const [cellValue, setCellValue] = useState('')

    const [searchQuery, setSearchQuery] = useState('')
    const [form, setForm] = useState({
        dd_primary: 'INV2', building_code: '01', floor_code: '', room_no: '',
        is_activated: true, inventory_type: 'INV',
        isdc_l3_code: '04.0501', item_id: '', description: '',
        material_code: '', rnv_code: '', mass_t: 0,
        basic_workforce: 80, wdf_f1: 30, wdf_f2: 15, wdf_f3: 20, wdf_f4: 25, wdf_f5: 10, wdf_f6: 0, wdf_f7: 0,
        waste_partition_ilw: 0, waste_partition_llw: 0, waste_partition_vllw: 0, waste_partition_ew: 0, waste_partition_nonrad: 100,
        contingency_rate: 20
    })

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items
        const q = searchQuery.toLowerCase()
        return items.filter(i =>
            i.item_id.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.building_code?.toLowerCase().includes(q) ||
            i.room_no?.toLowerCase().includes(q)
        )
    }, [items, searchQuery])

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)

        const [itemsRes, qtyRes, wasteRes] = await Promise.all([
            supabase.from('inventory_items').select('*').eq('project_id', currentProject.id).order('item_id'),
            supabase.from('inventory_dd_quantities').select('*'),
            supabase.from('inventory_waste_quantities').select('*'),
        ])

        if (itemsRes.data) {
            setItems(itemsRes.data as InventoryItem[])
            const itemIds = new Set(itemsRes.data.map(i => i.id))
            if (qtyRes.data) {
                setDDQuantities(qtyRes.data.filter(q => itemIds.has(q.inventory_item_id)))
            }
            if (wasteRes.data) {
                setWasteQuantities(wasteRes.data.filter(q => itemIds.has(q.inventory_item_id)))
            }
        }
        setLoading(false)
    }, [currentProject, supabase])

    useEffect(() => { loadData() }, [loadData])

    const getQty = useCallback((itemId: string, code: string): number => {
        return ddQuantities.find(q => q.inventory_item_id === itemId && q.dd_category_code === code)?.quantity || 0
    }, [ddQuantities])

    const getWasteQty = useCallback((itemId: string, code: string): number => {
        return wasteQuantities.find(q => q.inventory_item_id === itemId && q.waste_category_code === code)?.quantity || 0
    }, [wasteQuantities])

    const totals = useMemo(() => {
        const ddTotals: Record<string, number> = {}
        DD_CATEGORIES.forEach(dd => {
            ddTotals[dd.code] = filteredItems.reduce((sum, item) => sum + getQty(item.id, dd.code), 0)
        })
        const wasteTotals: Record<string, number> = {}
        WM_CATEGORIES.forEach(wm => {
            wasteTotals[wm.code] = items.reduce((sum, item) => sum + getWasteQty(item.id, wm.code), 0)
        })
        return {
            count: items.length,
            active: items.filter(i => i.is_activated).length,
            basicWF: items.reduce((s, i) => s + (i.basic_workforce || 0), 0),
            totalWF: items.reduce((s, i) => s + calcTotalWF(i), 0),
            ddTotals,
            wasteTotals
        }
    }, [items, filteredItems, getQty, getWasteQty])

    function resetForm() {
        const nextNo = items.length + 1
        setForm({
            dd_primary: 'INV2', building_code: '01', floor_code: '', room_no: '',
            is_activated: true, inventory_type: 'INV',
            isdc_l3_code: '04.0501', item_id: `R${String(nextNo).padStart(3, '0')}`, description: '',
            material_code: 'METAL', rnv_code: 'V1', mass_t: 0,
            basic_workforce: 80, wdf_f1: 30, wdf_f2: 15, wdf_f3: 20, wdf_f4: 25, wdf_f5: 10, wdf_f6: 0, wdf_f7: 0,
            waste_partition_ilw: 0, waste_partition_llw: 0, waste_partition_vllw: 0, waste_partition_ew: 0, waste_partition_nonrad: 100,
            contingency_rate: 20
        })
    }

    async function handleSave() {
        if (!currentProject || !form.item_id.trim()) return

        const totalPartition = (form.waste_partition_ilw || 0) + (form.waste_partition_llw || 0) +
            (form.waste_partition_vllw || 0) + (form.waste_partition_ew || 0) +
            (form.waste_partition_nonrad || 0)

        if (Math.abs(totalPartition - 100) > 0.01) {
            alert('Waste partition percentages must sum to exactly 100%')
            return
        }

        setSaving(true)
        const data = {
            project_id: currentProject.id,
            dd_primary: form.dd_primary,
            building_code: form.building_code,
            floor_code: form.floor_code,
            room_no: form.room_no,
            is_activated: form.is_activated,
            inventory_type: form.inventory_type,
            item_no: editingId ? items.find(i => i.id === editingId)?.item_no : items.length + 1,
            isdc_l3_code: form.isdc_l3_code,
            item_id: form.item_id.trim(),
            description: form.description,
            material_code: form.material_code,
            rnv_code: form.rnv_code,
            mass_t: form.mass_t || 0,
            basic_workforce: form.basic_workforce || 0,
            wdf_f1: form.wdf_f1 || 0, wdf_f2: form.wdf_f2 || 0, wdf_f3: form.wdf_f3 || 0,
            wdf_f4: form.wdf_f4 || 0, wdf_f5: form.wdf_f5 || 0, wdf_f6: form.wdf_f6 || 0, wdf_f7: form.wdf_f7 || 0,
            waste_partition_ilw: form.waste_partition_ilw || 0,
            waste_partition_llw: form.waste_partition_llw || 0,
            waste_partition_vllw: form.waste_partition_vllw || 0,
            waste_partition_ew: form.waste_partition_ew || 0,
            waste_partition_nonrad: form.waste_partition_nonrad || 0,
            contingency_rate: form.contingency_rate || 20
        }
        if (editingId) {
            await supabase.from('inventory_items').update(data).eq('id', editingId)
        } else {
            await supabase.from('inventory_items').insert(data)
        }
        setShowForm(false); setEditingId(null); setSaving(false)
        await loadData()
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this item? This will also remove any matrix quantities.')) return
        await supabase.from('inventory_dd_quantities').delete().eq('inventory_item_id', id)
        await supabase.from('inventory_waste_quantities').delete().eq('inventory_item_id', id)
        await supabase.from('inventory_items').delete().eq('id', id)
        await loadData()
    }

    function handleEdit(item: InventoryItem) {
        setEditingId(item.id)
        setForm({
            dd_primary: item.dd_primary || 'INV2',
            building_code: item.building_code || '01',
            floor_code: item.floor_code || '',
            room_no: item.room_no || '',
            is_activated: item.is_activated ?? true,
            inventory_type: item.inventory_type || 'INV',
            isdc_l3_code: item.isdc_l3_code || '',
            item_id: item.item_id,
            description: item.description || '',
            material_code: item.material_code || '',
            rnv_code: item.rnv_code || '',
            mass_t: item.mass_t || 0,
            basic_workforce: item.basic_workforce || 0,
            wdf_f1: item.wdf_f1 || 0, wdf_f2: item.wdf_f2 || 0, wdf_f3: item.wdf_f3 || 0,
            wdf_f4: item.wdf_f4 || 0, wdf_f5: item.wdf_f5 || 0, wdf_f6: item.wdf_f6 || 0, wdf_f7: item.wdf_f7 || 0,
            waste_partition_ilw: item.waste_partition_ilw || 0,
            waste_partition_llw: item.waste_partition_llw || 0,
            waste_partition_vllw: item.waste_partition_vllw || 0,
            waste_partition_ew: item.waste_partition_ew || 0,
            waste_partition_nonrad: item.waste_partition_nonrad || 0,
            contingency_rate: item.contingency_rate || 20
        })
        setShowForm(true)
    }

    async function saveCell() {
        if (!editingCell) return
        const { itemId, code, type } = editingCell
        const value = parseFloat(cellValue) || 0
        const table = type === 'dd' ? 'inventory_dd_quantities' : 'inventory_waste_quantities'
        const col = type === 'dd' ? 'dd_category_code' : 'waste_category_code'

        const quantities = type === 'dd' ? ddQuantities : wasteQuantities
        // @ts-ignore
        const existing = quantities.find(q => q.inventory_item_id === itemId && q[col] === code)

        if (existing) {
            if (value === 0) await supabase.from(table).delete().eq('id', existing.id)
            else await supabase.from(table).update({ quantity: value }).eq('id', existing.id)
        } else if (value > 0) {
            await supabase.from(table).insert({ inventory_item_id: itemId, [col]: code, quantity: value })
        }
        setEditingCell(null); setCellValue('')
        await loadData()
    }

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-[2rem] border border-white/40 shadow-xl">
                <Boxes size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500 font-medium">Please select a project to manage facility inventory.</p>
            </div>
        )
    }

    const calcFormTotalWF = () => {
        const wdfSum = (form.wdf_f1 || 0) + (form.wdf_f2 || 0) + (form.wdf_f3 || 0) + (form.wdf_f4 || 0) + (form.wdf_f5 || 0) + (form.wdf_f6 || 0) + (form.wdf_f7 || 0)
        return (form.basic_workforce || 0) * (100 + wdfSum) / 100
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Facility Inventory</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] opacity-70">
                        Components, Materials, and Distribution Matrices (AI-CY)
                    </p>
                </div>

                <button
                    onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
                >
                    <Plus size={16} />
                    Register Component
                </button>
            </div>

            {/* Premium Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-[2rem] border border-white/40 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Database size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Population</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{totals.count}</div>
                </div>
                <div className="glass p-5 rounded-[2rem] border border-emerald-500/10 shadow-sm hover:shadow-md transition-all bg-emerald-50/10">
                    <div className="flex items-center gap-3 mb-2 text-emerald-600">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active Components</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-700 font-mono tracking-tighter">{totals.active}</div>
                </div>
                <div className="glass p-5 rounded-[2rem] border border-white/40 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Activity size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Basic Workforce</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{totals.basicWF.toLocaleString()}</div>
                </div>
                <div className="glass p-5 rounded-[2rem] border border-blue-500/10 shadow-sm hover:shadow-md transition-all bg-blue-50/10">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <Activity size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Performance Volume</span>
                    </div>
                    <div className="text-3xl font-black text-blue-700 font-mono tracking-tighter">{Math.round(totals.totalWF).toLocaleString()}</div>
                </div>
            </div>

            {/* Navigation & Toolbar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="flex gap-2 p-1 glass rounded-2xl w-fit border border-slate-200/40 shadow-inner">
                    {[
                        { id: 'items', label: 'INVENTORY HUB', icon: List },
                        { id: 'dd-matrix', label: 'D&D ALLOCATION', icon: Grid },
                        { id: 'waste-matrix', label: 'WASTE STREAMS', icon: Boxes },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-lg translate-y-[-1px]'
                                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}
                            `}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full xl:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <Input
                        placeholder="Search IDs, buildings, rooms..."
                        value={searchQuery}
                        onChange={(e: any) => setSearchQuery(e.target.value)}
                        className="pl-11 !rounded-2xl border-slate-200/40 shadow-inner bg-white/60"
                    />
                </div>
            </div>

            {/* Entry Form Overlay */}
            {showForm && (
                <div className="p-8 glass-panel rounded-[2.5rem] border border-blue-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative z-50">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                {editingId ? <Edit2 size={24} /> : <Plus size={24} />}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    {editingId ? 'Modify Inventory Record' : 'Register New Component'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record UUID: {editingId || 'New Allocation'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* LEFT: Primary ID & Logic */}
                        <div className="lg:col-span-4 space-y-8 border-r border-slate-200/50 pr-10">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <List size={14} /> Primary Identification
                                </h3>
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Label>Component ID / Tag *</Label>
                                        <Input value={form.item_id} onChange={(e: any) => setForm({ ...form, item_id: e.target.value })} placeholder="e.g. R-101" className="!text-lg font-black uppercase" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Description / Nomenclature</Label>
                                        <Input value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Function or name..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>D&D Category</Label>
                                            <Select value={form.dd_primary} onChange={(e: any) => setForm({ ...form, dd_primary: e.target.value })}>
                                                {DD_CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Inventory Pool</Label>
                                            <Select value={form.inventory_type} onChange={(e: any) => setForm({ ...form, inventory_type: e.target.value })}>
                                                <option value="INV">INV (Active)</option>
                                                <option value="WMS">WMS (Waste)</option>
                                                <option value="SFS">SFS (Fuel)</option>
                                                <option value="LGW">LGW (Legacy)</option>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Map size={14} /> Location / Facility Mapping
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Building</Label>
                                        <Input value={form.building_code} onChange={(e: any) => setForm({ ...form, building_code: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Floor</Label>
                                        <Input value={form.floor_code} onChange={(e: any) => setForm({ ...form, floor_code: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Room</Label>
                                        <Input value={form.room_no} onChange={(e: any) => setForm({ ...form, room_no: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Technical Factors */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Technical Metadata */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Activity size={14} /> Performance Parameters
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Material</Label>
                                            <Input value={form.material_code} onChange={(e: any) => setForm({ ...form, material_code: e.target.value })} className="font-bold uppercase" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>RNV Vector</Label>
                                            <Input value={form.rnv_code} onChange={(e: any) => setForm({ ...form, rnv_code: e.target.value })} className="font-bold uppercase" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Mass [Tons]</Label>
                                            <Input type="number" step="0.001" value={form.mass_t} onChange={(e: any) => setForm({ ...form, mass_t: parseFloat(e.target.value) || 0 })} className="font-mono" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Contingency %</Label>
                                            <Input type="number" value={form.contingency_rate} onChange={(e: any) => setForm({ ...form, contingency_rate: parseFloat(e.target.value) || 0 })} className="font-mono" />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-900/5 rounded-2xl border border-slate-200/50">
                                        <Label>Baseline Workforce (Man-Hours)</Label>
                                        <Input type="number" value={form.basic_workforce} onChange={(e: any) => setForm({ ...form, basic_workforce: parseFloat(e.target.value) || 0 })} className="!text-xl font-black bg-white" />
                                    </div>
                                </div>

                                {/* Workforce Multipliers */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Zap size={14} /> Workforce Difficulty Factors (F1-F7)
                                    </h3>
                                    <div className="grid grid-cols-4 gap-3 bg-white/40 p-5 rounded-[2rem] border border-slate-200/40">
                                        {['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'].map((f, i) => (
                                            <div key={f} className="space-y-1.5">
                                                <Label className="text-center block">F{i + 1}</Label>
                                                <Input
                                                    type="number"
                                                    value={form[`wdf_${f}` as keyof typeof form] as number}
                                                    onChange={(e: any) => setForm({ ...form, [`wdf_${f}`]: parseFloat(e.target.value) || 0 })}
                                                    className="text-center !px-1 font-mono text-zinc-600 font-bold"
                                                />
                                            </div>
                                        ))}
                                        <div className="space-y-1.5">
                                            <Label className="text-center block text-blue-600">STATE</Label>
                                            <Select value={form.is_activated ? '1' : '0'} onChange={(e: any) => setForm({ ...form, is_activated: e.target.value === '1' })} className="!px-1 bg-blue-50/50">
                                                <option value="1">ON</option>
                                                <option value="0">OFF</option>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/20">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Adjusted Performance Volume</span>
                                            <span className="text-3xl font-black font-mono tracking-tighter">{Math.round(calcFormTotalWF()).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[9px] mt-2 opacity-50 uppercase font-bold tracking-widest">Base Hours x (100% + ΣWDF%)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Waste Partition Table */}
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Boxes size={14} /> Statistical Waste Partition (% Probability)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {[
                                        { label: 'ILW', key: 'waste_partition_ilw', c: 'border-rose-200 bg-rose-50/30' },
                                        { label: 'LLW', key: 'waste_partition_llw', c: 'border-amber-200 bg-amber-50/30' },
                                        { label: 'VLLW', key: 'waste_partition_vllw', c: 'border-orange-200 bg-orange-50/30' },
                                        { label: 'EXEMPT', key: 'waste_partition_ew', c: 'border-emerald-200 bg-emerald-50/30' },
                                        { label: 'NON-RAD', key: 'waste_partition_nonrad', c: 'border-slate-200 bg-slate-50/30' },
                                    ].map((p) => (
                                        <div key={p.key} className={`p-3 rounded-2xl border ${p.c}`}>
                                            <Label className="!text-slate-600">{p.label} %</Label>
                                            <Input
                                                type="number"
                                                value={form[p.key as keyof typeof form]}
                                                onChange={(e: any) => setForm({ ...form, [p.key]: parseFloat(e.target.value) || 0 })}
                                                className="!bg-white font-mono font-black"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-10 pt-8 border-t border-slate-200/80">
                        <button onClick={() => setShowForm(false)} className="px-8 py-3 text-xs font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard Changes</button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-12 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:translate-y-[-1px] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? 'PROVISIONING...' : editingId ? 'UPDATE ALLOCATION' : 'COMMIT TO DATABASE'}
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Areas */}
            <div className="glass-panel rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden bg-white/30 backdrop-blur-md">
                {loading ? (
                    <div className="p-40 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Facility Intelligence...</span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'items' && (
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1400px]">
                                    <thead>
                                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                                            <th className="px-6 py-5 w-20 text-center">DD Group</th>
                                            <th className="px-6 py-5 w-40">Facility Map</th>
                                            <th className="px-2 py-5 w-10 text-center">State</th>
                                            <th className="px-4 py-5 w-20 text-center">Ref</th>
                                            <th className="px-4 py-5 w-24 text-center">ISDC</th>
                                            <th className="px-6 py-5 w-24">Item Identifier</th>
                                            <th className="px-6 py-5">Nomenclature / Description</th>
                                            <th className="px-6 py-5 text-right">Mass [t]</th>
                                            <th className="px-6 py-5 text-right font-bold text-blue-600">Total Performance</th>
                                            <th className="px-6 py-5 text-center w-32">Operations</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200/30">
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="p-40 text-center">
                                                    <div className="max-w-xs mx-auto opacity-20 group">
                                                        <LayoutGrid size={64} className="mx-auto mb-6 text-slate-400 group-hover:scale-110 transition-transform duration-700" />
                                                        <p className="text-xs font-black uppercase tracking-[0.2em]">Zero Records Found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map(item => (
                                                <tr key={item.id} className={`group hover:bg-white/50 transition-all ${!item.is_activated ? 'opacity-40 grayscale' : ''}`}>
                                                    <td className="px-6 py-5">
                                                        <span className="font-mono font-black text-[10px] text-zinc-500 bg-slate-100 px-2 py-1 rounded-lg">
                                                            {item.dd_primary}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{item.building_code || '--'} / {item.floor_code || '-'}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">RM: {item.room_no || 'NA'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-5 text-center">
                                                        <div className={`w-2.5 h-2.5 rounded-full mx-auto ring-4 ring-white shadow-sm ${item.is_activated ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-300'}`}></div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center">
                                                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-[9px] font-black text-indigo-500 uppercase tracking-tighter">
                                                            {item.inventory_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-5 text-center font-mono text-[10px] text-slate-400 font-bold">{item.isdc_l3_code || '-'}</td>
                                                    <td className="px-6 py-5">
                                                        <span className="font-mono font-black text-blue-700 text-xs tracking-tight">{item.item_id}</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col max-w-sm">
                                                            <span className="text-[11px] font-bold text-slate-700 truncate" title={item.description}>{item.description}</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.material_code || '--'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-mono text-xs text-slate-500 uppercase tracking-tighter">
                                                        {(item.mass_t || 0).toFixed(3)} t
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-mono font-black text-blue-800 text-sm">
                                                        {Math.round(calcTotalWF(item)).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                            <ActionButton icon={Edit2} onClick={() => handleEdit(item)} label="Edit" />
                                                            <ActionButton icon={Trash2} color="red" onClick={() => handleDelete(item.id)} label="Del" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'dd-matrix' && (
                            <div className="overflow-auto custom-scrollbar h-[70vh]">
                                <table className="text-left border-separate border-spacing-0 min-w-max w-full">
                                    <thead className="sticky top-0 z-30">
                                        <tr className="bg-slate-900 shadow-xl">
                                            <th className="px-6 py-6 sticky left-0 z-40 bg-slate-900 border-r border-slate-800 text-xs font-black text-white uppercase tracking-[0.2em] shadow-2xl">
                                                Component Matrix
                                            </th>
                                            {DD_CATEGORIES.map(dd => (
                                                <th key={dd.code} className="px-4 py-6 text-center border-b border-slate-800 group/head min-w-[100px]" title={dd.name}>
                                                    <div className="text-[10px] font-black text-blue-400 mb-1 group-hover/head:scale-110 transition-transform">{dd.code}</div>
                                                    <div className="text-[8px] font-bold text-slate-500 uppercase leading-tight truncate w-16 mx-auto opacity-50">{dd.name}</div>
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="bg-white/95 backdrop-blur-md z-30">
                                            <th className="px-6 py-4 sticky left-0 z-40 bg-white border-r border-slate-100 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                                                Aggregated Load
                                            </th>
                                            {DD_CATEGORIES.map(dd => (
                                                <td key={dd.code} className="px-4 py-4 text-center border-b border-slate-200">
                                                    <span className={`font-mono text-xs font-black ${totals.ddTotals[dd.code] > 0 ? 'text-slate-900 px-2 py-0.5 bg-slate-100 rounded-lg shadow-inner' : 'text-slate-200 font-normal'}`}>
                                                        {totals.ddTotals[dd.code] > 0 ? totals.ddTotals[dd.code].toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.map(item => (
                                            <tr key={item.id} className="group hover:bg-white transition-colors duration-200">
                                                <td className="px-6 py-4 sticky left-0 z-20 bg-white/95 backdrop-blur-sm border-r border-slate-100 font-mono font-black text-slate-900 text-[11px] group-hover:bg-blue-50/50 transition-colors">
                                                    {item.item_id}
                                                </td>
                                                {DD_CATEGORIES.map(dd => {
                                                    const val = getQty(item.id, dd.code)
                                                    const isEditing = editingCell?.itemId === item.id && editingCell?.code === dd.code && editingCell?.type === 'dd'
                                                    return (
                                                        <td
                                                            key={dd.code}
                                                            className={`px-4 py-4 text-center cursor-pointer transition-all duration-300 group-hover:translate-z-10
                                                                ${val > 0 ? 'bg-blue-500/5' : ''}
                                                                ${isEditing ? 'bg-blue-600/10 ring-2 ring-blue-600 z-10' : ''}
                                                            `}
                                                            onClick={() => {
                                                                setEditingCell({ itemId: item.id, code: dd.code, type: 'dd' })
                                                                setCellValue(val ? val.toString() : '')
                                                            }}
                                                        >
                                                            {isEditing ? (
                                                                <input
                                                                    autoFocus
                                                                    className="w-16 bg-white border-none text-center font-mono font-black text-xs outline-none py-1 rounded shadow-inner"
                                                                    value={cellValue}
                                                                    onChange={e => setCellValue(e.target.value)}
                                                                    onBlur={saveCell}
                                                                    onKeyDown={e => { if (e.key === 'Enter') saveCell() }}
                                                                />
                                                            ) : (
                                                                <span className={`font-mono text-xs ${val > 0 ? 'font-black text-blue-700 animate-in fade-in' : 'text-slate-200 opacity-20'}`}>
                                                                    {val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '·'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'waste-matrix' && (
                            <div className="overflow-auto custom-scrollbar h-[70vh]">
                                <table className="text-left border-separate border-spacing-0 min-w-max w-full">
                                    <thead className="sticky top-0 z-30">
                                        <tr className="bg-slate-900 shadow-xl">
                                            <th className="px-6 py-6 sticky left-0 z-40 bg-slate-900 border-r border-slate-800 text-xs font-black text-white uppercase tracking-[0.2em] shadow-2xl">
                                                Stream Allocation
                                            </th>
                                            {WM_CATEGORIES.map(wm => (
                                                <th key={wm.code} className="px-4 py-6 text-center border-b border-slate-800 group/head min-w-[120px]" title={wm.name}>
                                                    <div className="text-[10px] font-black text-emerald-400 mb-1 group-hover/head:scale-110 transition-transform">{wm.code}</div>
                                                    <div className="text-[8px] font-bold text-slate-500 uppercase leading-tight truncate w-20 mx-auto opacity-50">{wm.name}</div>
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="bg-white/95 backdrop-blur-md z-30">
                                            <th className="px-6 py-4 sticky left-0 z-40 bg-white border-r border-slate-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                                                Global Flux [t]
                                            </th>
                                            {WM_CATEGORIES.map(wm => (
                                                <td key={wm.code} className="px-4 py-4 text-center border-b border-slate-200">
                                                    <span className={`font-mono text-xs font-black ${totals.wasteTotals[wm.code] > 0 ? 'text-slate-900 px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100/30 shadow-inner' : 'text-slate-200 font-normal'}`}>
                                                        {totals.wasteTotals[wm.code] > 0 ? totals.wasteTotals[wm.code].toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 }) : '0.000'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredItems.map(item => (
                                            <tr key={item.id} className="group hover:bg-white transition-colors duration-200">
                                                <td className="px-6 py-4 sticky left-0 z-20 bg-white/95 backdrop-blur-sm border-r border-slate-100 font-mono font-black text-slate-900 text-[11px] group-hover:bg-emerald-50/50 transition-colors">
                                                    {item.item_id}
                                                </td>
                                                {WM_CATEGORIES.map(wm => {
                                                    const val = getWasteQty(item.id, wm.code)
                                                    const isEditing = editingCell?.itemId === item.id && editingCell?.code === wm.code && editingCell?.type === 'waste'
                                                    return (
                                                        <td
                                                            key={wm.code}
                                                            className={`px-4 py-4 text-center cursor-pointer transition-all duration-300 group-hover:translate-z-10
                                                                ${val > 0 ? 'bg-emerald-500/5' : ''}
                                                                ${isEditing ? 'bg-emerald-600/10 ring-2 ring-emerald-600 z-10' : ''}
                                                            `}
                                                            onClick={() => {
                                                                setEditingCell({ itemId: item.id, code: wm.code, type: 'waste' })
                                                                setCellValue(val ? val.toString() : '')
                                                            }}
                                                        >
                                                            {isEditing ? (
                                                                <input
                                                                    autoFocus
                                                                    className="w-16 bg-white border-none text-center font-mono font-black text-xs outline-none py-1 rounded shadow-inner"
                                                                    value={cellValue}
                                                                    onChange={e => setCellValue(e.target.value)}
                                                                    onBlur={saveCell}
                                                                    onKeyDown={e => { if (e.key === 'Enter') saveCell() }}
                                                                />
                                                            ) : (
                                                                <span className={`font-mono text-xs ${val > 0 ? 'font-black text-emerald-700 animate-in slide-in-from-top-1' : 'text-slate-200 opacity-20'}`}>
                                                                    {val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 3 }) : '0.000'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
