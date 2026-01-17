// Lists Sheet - Connected to Supabase with full CRUD (Add, Edit, Delete)
// Premium Glassmorphism Design
'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import type { Currency, DDCategory, Profession, WasteCategory, TechSystem } from '@/lib/supabase/types'
import { Search, Plus, Edit2, Trash2, Save, X, ChevronRight, Check, Database, Coins, Layers, Boxes, Cpu, Users, Settings } from 'lucide-react'
import { MaterialsTable, ISDCCodesTable } from './materials_and_isdc_components'

const formatNumber = (value: number, decimals: number = 2) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

type Tab = 'currencies' | 'dd_categories' | 'wm_categories' | 'tech_systems' | 'professions' | 'materials' | 'isdc_codes'

// Premium Form Components
const ActionButton = ({ onClick, icon: Icon, color = 'blue', label = '' }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest
            ${color === 'red' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-slate-600 bg-slate-100 hover:bg-white hover:shadow-md'}
        `}
    >
        <Icon size={14} />
        {label}
    </button>
)

const Input = (props: any) => (
    <input
        {...props}
        className={`glass-input w-full px-4 py-2.5 text-xs rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 outline-none font-medium border-slate-200/60 ${props.className || ''}`}
    />
)

const Select = (props: any) => (
    <select
        {...props}
        className={`glass-input w-full px-4 py-2.5 text-xs rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white font-bold text-slate-700 border-slate-200/60 appearance-none ${props.className || ''}`}
    />
)

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
        {children}
    </label>
)

export default function ListsPage() {
    const { currentProject } = useProject()
    const [activeTab, setActiveTab] = useState<Tab>('currencies')

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-[2rem] border border-white/40 shadow-xl">
                <Database size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500 font-medium">Please select a project to manage master data.</p>
            </div>
        )
    }

    const tabs = [
        { id: 'currencies', label: 'CURRENCIES', icon: Coins },
        { id: 'dd_categories', label: 'D&D CLASSES', icon: Layers },
        { id: 'wm_categories', label: 'WM CLASSES', icon: Boxes },
        { id: 'tech_systems', label: 'TECH SYSTEMS', icon: Cpu },
        { id: 'professions', label: 'PROFESSIONS', icon: Users },
        { id: 'materials', label: 'MATERIALS', icon: Database },
        { id: 'isdc_codes', label: 'ISDC TAXONOMY', icon: Settings },
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Master Data</h1>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] opacity-70">Global Project Configuration & Taxonomy</p>
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 glass rounded-[1.5rem] border border-slate-200/40 shadow-inner w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300
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

            <div className="p-8 glass-panel rounded-[2.5rem] border border-white/40 shadow-2xl bg-white/30 backdrop-blur-md min-h-[600px]">
                {activeTab === 'currencies' && <CurrenciesTable projectId={currentProject.id} />}
                {activeTab === 'dd_categories' && <DDCategoriesTable projectId={currentProject.id} />}
                {activeTab === 'wm_categories' && <WMCategoriesTable projectId={currentProject.id} />}
                {activeTab === 'tech_systems' && <TechSystemsTable projectId={currentProject.id} />}
                {activeTab === 'professions' && <ProfessionsTable projectId={currentProject.id} />}
                {activeTab === 'materials' && <MaterialsTable projectId={currentProject.id} />}
                {activeTab === 'isdc_codes' && <ISDCCodesTable projectId={currentProject.id} />}
            </div>
        </div>
    )
}

// ============================================
// CURRENCIES TABLE
// ============================================
function CurrenciesTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ abbreviation: '', name: '', exchange_rate: '1.0' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase.from('currencies').select('*').eq('project_id', projectId).order('index_no')
        if (data) setCurrencies(data)
        setLoading(false)
    }

    function startEdit(item: Currency) {
        setEditingId(item.id)
        setFormData({ abbreviation: item.abbreviation, name: item.name, exchange_rate: String(item.exchange_rate) })
        setShowForm(true)
    }

    async function handleSave() {
        setSaving(true)
        if (editingId) {
            await supabase.from('currencies').update({
                abbreviation: formData.abbreviation,
                name: formData.name,
                exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
            }).eq('id', editingId)
        } else {
            const nextIndex = currencies.length + 1
            await supabase.from('currencies').insert({
                project_id: projectId,
                index_no: nextIndex,
                abbreviation: formData.abbreviation,
                name: formData.name,
                exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
                total_bdf: 1.0,
                bdf_factors: {},
            })
        }
        await loadData()
        setShowForm(false)
        setEditingId(null)
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Permanently delete this currency?')) return
        await supabase.from('currencies').delete().eq('id', id)
        await loadData()
    }

    if (loading) return <div className="p-40 flex justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-mono shadow-lg shadow-blue-500/20">{currencies.length}</span>
                    Exchange Definitions
                </h2>
                <button
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ abbreviation: '', name: '', exchange_rate: '1.0' }) }}
                >
                    <Plus size={14} /> Add Currency
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-blue-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Edit Currency' : 'New Currency'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <Label>Currency Code</Label>
                            <Input value={formData.abbreviation} onChange={(e: any) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })} placeholder="e.g. USD" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Full Name</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. US Dollar" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Exchange Rate (Fixed)</Label>
                            <Input type="number" step="0.0001" value={formData.exchange_rate} onChange={(e: any) => setFormData({ ...formData, exchange_rate: e.target.value })} className="font-mono text-blue-600 font-black" />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? 'SAVING...' : <><Save size={14} /> COMMIT CURRENCY</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5 w-16 text-center">Idx</th>
                            <th className="px-6 py-5">Code</th>
                            <th className="px-6 py-5">Nomenclature</th>
                            <th className="px-6 py-5">Fixed Rate</th>
                            <th className="px-6 py-5 text-center w-32">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currencies.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-6 py-5 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                <td className="px-6 py-5">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tighter bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{item.abbreviation}</span>
                                </td>
                                <td className="px-6 py-5 font-bold text-slate-700 text-xs">{item.name}</td>
                                <td className="px-6 py-5 font-mono text-xs text-blue-700 font-bold">{formatNumber(item.exchange_rate, 4)}</td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <ActionButton onClick={() => startEdit(item)} icon={Edit2} label="Edit" />
                                        <ActionButton onClick={() => handleDelete(item.id)} icon={Trash2} color="red" label="Del" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================
// D&D CATEGORIES TABLE
// ============================================
function DDCategoriesTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [categories, setCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ code: '', name: '', unit: '[t]', abbreviation: '', category_type: 'general', manpower_uf: '0', investment_uf: '0', expenses_uf: '0' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase.from('dd_categories').select('*').eq('project_id', projectId).order('sort_order')
        if (data) setCategories(data)
        setLoading(false)
    }

    function startEdit(item: DDCategory) {
        setEditingId(item.id)
        setFormData({
            code: item.code,
            name: item.name,
            unit: item.unit,
            abbreviation: item.abbreviation || '',
            category_type: item.category_type || 'general',
            manpower_uf: String(item.manpower_uf),
            investment_uf: String(item.investment_uf),
            expenses_uf: String(item.expenses_uf),
        })
        setShowForm(true)
    }

    async function handleSave() {
        setSaving(true)
        const data = {
            code: formData.code,
            name: formData.name,
            unit: formData.unit,
            abbreviation: formData.abbreviation,
            category_type: formData.category_type,
            manpower_uf: parseFloat(formData.manpower_uf) || 0,
            investment_uf: parseFloat(formData.investment_uf) || 0,
            expenses_uf: parseFloat(formData.expenses_uf) || 0,
        }
        if (editingId) {
            await supabase.from('dd_categories').update(data).eq('id', editingId)
        } else {
            await supabase.from('dd_categories').insert({ project_id: projectId, ...data, sort_order: categories.length + 1 })
        }
        await loadData()
        setShowForm(false)
        setEditingId(null)
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Permanent delete D&D class?')) return
        await supabase.from('dd_categories').delete().eq('id', id)
        await loadData()
    }

    if (loading) return <div className="p-40 flex justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-mono tracking-tighter">{categories.length}</span>
                    D&D Primary Classifications
                </h2>
                <button
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ code: '', name: '', unit: '[t]', abbreviation: '', category_type: 'general', manpower_uf: '0', investment_uf: '0', expenses_uf: '0' }) }}
                >
                    <Plus size={14} /> Add Category
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-emerald-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Modify Allocation class' : 'Register Class'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
                        <div className="space-y-1.5">
                            <Label>Alpha Code</Label>
                            <Input value={formData.code} onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. INV1" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Abbreviated ID</Label>
                            <Input value={formData.abbreviation} onChange={(e: any) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })} placeholder="e.g. WFCA" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Reference Unit</Label>
                            <Select value={formData.unit} onChange={(e: any) => setFormData({ ...formData, unit: e.target.value })}>
                                <option value="[t]">tons [t]</option>
                                <option value="[m2]">sqm [m2]</option>
                                <option value="[man.h]">capacity [man.h]</option>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Archetype</Label>
                            <Select value={formData.category_type} onChange={(e: any) => setFormData({ ...formData, category_type: e.target.value })}>
                                <option value="workforce">Workforce</option>
                                <option value="general">General</option>
                                <option value="additional">Additional</option>
                                <option value="specific">Specific Eq</option>
                                <option value="out_of_ca">Outside CA</option>
                                <option value="user_defined">Defined</option>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end pt-6 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <Label>Formal Name</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="Full descriptive name..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Manpower UF</Label>
                                <Input type="number" value={formData.manpower_uf} onChange={(e: any) => setFormData({ ...formData, manpower_uf: e.target.value })} className="font-mono text-emerald-600 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Invest UF</Label>
                                <Input type="number" value={formData.investment_uf} onChange={(e: any) => setFormData({ ...formData, investment_uf: e.target.value })} className="font-mono text-emerald-600 font-bold" />
                            </div>
                        </div>
                        <div className="flex gap-3 h-fit">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button className="flex-[2] bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? 'SAVING...' : <><Save size={14} /> PERSIST CLASS</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5">Logic</th>
                            <th className="px-6 py-5">Abbr</th>
                            <th className="px-6 py-5">Nomenclature</th>
                            <th className="px-6 py-5">Unit</th>
                            <th className="px-6 py-5">Type</th>
                            <th className="px-6 py-5 text-right">MP UF</th>
                            <th className="px-6 py-5 text-right">INV UF</th>
                            <th className="px-6 py-5 text-center w-32">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.map((item) => (
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-6 py-5"><span className="font-mono font-black text-xs text-slate-900 bg-slate-200/50 px-2 py-1 rounded">{item.code}</span></td>
                                <td className="px-6 py-5 font-mono text-[10px] text-zinc-400 font-black">{item.abbreviation || '--'}</td>
                                <td className="px-6 py-5 text-xs font-bold text-slate-800">{item.name}</td>
                                <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">{item.unit}</td>
                                <td className="px-6 py-5"><span className="bg-white border border-slate-200 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">{item.category_type}</span></td>
                                <td className="px-6 py-5 text-right font-mono text-xs text-emerald-700 font-bold">{formatNumber(item.manpower_uf, 1)}</td>
                                <td className="px-6 py-5 text-right font-mono text-xs text-emerald-700 font-bold">{formatNumber(item.investment_uf, 1)}</td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <ActionButton onClick={() => startEdit(item)} icon={Edit2} label="Edit" />
                                        <ActionButton onClick={() => handleDelete(item.id)} icon={Trash2} color="red" label="Del" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================
// WM CATEGORIES TABLE
// ============================================
function WMCategoriesTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [categories, setCategories] = useState<WasteCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ code: '', name: '', isdc_code_primary: '', manpower_uf: '0', investment_uf: '0', expenses_uf: '0' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase.from('waste_categories').select('*').eq('project_id', projectId)
        if (data) setCategories(data)
        setLoading(false)
    }

    function startEdit(item: WasteCategory) {
        setEditingId(item.id)
        setFormData({
            code: item.code,
            name: item.name,
            isdc_code_primary: item.isdc_code_primary || '',
            manpower_uf: String(item.manpower_uf),
            investment_uf: String(item.investment_uf),
            expenses_uf: String(item.expenses_uf),
        })
        setShowForm(true)
    }

    async function handleSave() {
        setSaving(true)
        const data = {
            code: formData.code,
            name: formData.name,
            isdc_code_primary: formData.isdc_code_primary,
            manpower_uf: parseFloat(formData.manpower_uf) || 0,
            investment_uf: parseFloat(formData.investment_uf) || 0,
            expenses_uf: parseFloat(formData.expenses_uf) || 0,
        }
        if (editingId) {
            await supabase.from('waste_categories').update(data).eq('id', editingId)
        } else {
            await supabase.from('waste_categories').insert({ project_id: projectId, ...data })
        }
        await loadData()
        setShowForm(false)
        setEditingId(null)
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Permanent delete Waste class?')) return
        await supabase.from('waste_categories').delete().eq('id', id)
        await loadData()
    }

    if (loading) return <div className="p-40 flex justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-amber-600 rounded-full animate-spin"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-mono shadow-lg shadow-amber-500/20">{categories.length}</span>
                    Waste Stream Classifications
                </h2>
                <button
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ code: '', name: '', isdc_code_primary: '', manpower_uf: '0', investment_uf: '0', expenses_uf: '0' }) }}
                >
                    <Plus size={14} /> New WM Class
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-amber-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Modify Stream' : 'Register Stream Archetype'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-1.5">
                            <Label>Category Code</Label>
                            <Input value={formData.code} onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. LLW1" className="font-mono font-black border-amber-100" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label>Nomenclature</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="Stream name..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Primary ISDC</Label>
                            <Input value={formData.isdc_code_primary} onChange={(e: any) => setFormData({ ...formData, isdc_code_primary: e.target.value })} placeholder="e.g. 05.0400" className="font-mono" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 items-end">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>MP UF</Label>
                                <Input type="number" value={formData.manpower_uf} onChange={(e: any) => setFormData({ ...formData, manpower_uf: e.target.value })} className="font-mono text-amber-700 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Invest UF</Label>
                                <Input type="number" value={formData.investment_uf} onChange={(e: any) => setFormData({ ...formData, investment_uf: e.target.value })} className="font-mono text-amber-700 font-bold" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Expenses UF</Label>
                            <Input type="number" value={formData.expenses_uf} onChange={(e: any) => setFormData({ ...formData, expenses_uf: e.target.value })} className="font-mono text-amber-700 font-bold" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button className="flex-[2] bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black shadow-xl" onClick={handleSave} disabled={saving}>
                                {saving ? 'SAVING...' : <><Save size={14} /> PERSIST STREAM</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5">Stream ID</th>
                            <th className="px-6 py-5">Classification</th>
                            <th className="px-6 py-5">ISDC Mapping</th>
                            <th className="px-6 py-5 text-right">MP UF</th>
                            <th className="px-6 py-5 text-right">INV UF</th>
                            <th className="px-6 py-5 text-center w-32">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.map((item) => (
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-6 py-5 font-mono font-black text-xs text-amber-700">{item.code}</td>
                                <td className="px-6 py-5 text-xs font-bold text-slate-800">{item.name}</td>
                                <td className="px-6 py-5 font-mono text-[10px] text-slate-400 font-bold tracking-tight">{item.isdc_code_primary || '--'}</td>
                                <td className="px-6 py-5 text-right font-mono text-xs text-amber-800 font-bold">{formatNumber(item.manpower_uf, 1)}</td>
                                <td className="px-6 py-5 text-right font-mono text-xs text-amber-800 font-bold">{formatNumber(item.investment_uf, 1)}</td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <ActionButton onClick={() => startEdit(item)} icon={Edit2} label="Edit" />
                                        <ActionButton onClick={() => handleDelete(item.id)} icon={Trash2} color="red" label="Del" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================
// TECH SYSTEMS TABLE
// ============================================
function TechSystemsTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [systems, setSystems] = useState<TechSystem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ code: '', name: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase.from('tech_systems').select('*').eq('project_id', projectId)
        if (data) setSystems(data)
        setLoading(false)
    }

    function startEdit(item: TechSystem) {
        setEditingId(item.id)
        setFormData({ code: item.code, name: item.name })
        setShowForm(true)
    }

    async function handleSave() {
        setSaving(true)
        if (editingId) {
            await supabase.from('tech_systems').update({ code: formData.code, name: formData.name }).eq('id', editingId)
        } else {
            await supabase.from('tech_systems').insert({ project_id: projectId, code: formData.code, name: formData.name })
        }
        await loadData()
        setShowForm(false)
        setEditingId(null)
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Permanent delete system?')) return
        await supabase.from('tech_systems').delete().eq('id', id)
        await loadData()
    }

    if (loading) return <div className="p-40 flex justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-mono shadow-lg shadow-purple-500/20">{systems.length}</span>
                    Facility Tech Systems
                </h2>
                <button
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ code: '', name: '' }) }}
                >
                    <Plus size={14} /> New Tech System
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-purple-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Modify System' : 'Provision Technology System'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-1.5">
                            <Label>Alpha-Code</Label>
                            <Input value={formData.code} onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. PCC" className="font-mono font-black border-purple-100" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label>Industrial Name</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Primary Coolant Circuit" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? 'PROVISIONING...' : <><Save size={14} /> COMMIT SYSTEM</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5 w-32">System Code</th>
                            <th className="px-6 py-5">Full Nomenclature</th>
                            <th className="px-6 py-5 text-center w-32">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {systems.map((item) => (
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-6 py-5 font-mono font-black text-xs text-purple-700">{item.code}</td>
                                <td className="px-6 py-5 text-xs font-bold text-slate-800 uppercase tracking-tight">{item.name}</td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <ActionButton onClick={() => startEdit(item)} icon={Edit2} label="Edit" />
                                        <ActionButton onClick={() => handleDelete(item.id)} icon={Trash2} color="red" label="Del" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================
// PROFESSIONS TABLE
// ============================================
function ProfessionsTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [professions, setProfessions] = useState<Profession[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', abbreviation: '', hourly_rate_owner: '50', hourly_rate_contractor: '50' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase.from('professions').select('*').eq('project_id', projectId).order('index_no')
        if (data) setProfessions(data)
        setLoading(false)
    }

    function startEdit(item: Profession) {
        setEditingId(item.id)
        setFormData({
            name: item.name,
            abbreviation: item.abbreviation || '',
            hourly_rate_owner: String(item.hourly_rate_owner),
            hourly_rate_contractor: String(item.hourly_rate_contractor),
        })
        setShowForm(true)
    }

    async function handleSave() {
        setSaving(true)
        const data = {
            name: formData.name,
            abbreviation: formData.abbreviation,
            hourly_rate_owner: parseFloat(formData.hourly_rate_owner) || 50,
            hourly_rate_contractor: parseFloat(formData.hourly_rate_contractor) || 50,
        }
        if (editingId) {
            await supabase.from('professions').update(data).eq('id', editingId)
        } else {
            await supabase.from('professions').insert({ project_id: projectId, ...data, index_no: professions.length + 1 })
        }
        await loadData()
        setShowForm(false)
        setEditingId(null)
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Permanent delete human resource role?')) return
        await supabase.from('professions').delete().eq('id', id)
        await loadData()
    }

    if (loading) return <div className="p-40 flex justify-center"><div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-mono shadow-lg shadow-indigo-500/20">{professions.length}</span>
                    Resource Matrix
                </h2>
                <button
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', abbreviation: '', hourly_rate_owner: '50', hourly_rate_contractor: '50' }) }}
                >
                    <Plus size={14} /> Register Profession
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-indigo-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Modify Resource Definition' : 'Register Human Capital'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-8">
                        <div className="md:col-span-2 space-y-1.5">
                            <Label>Full Profession Name</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Senior Tech / HP Scientist" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>ID Tag</Label>
                            <Input value={formData.abbreviation} onChange={(e: any) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })} placeholder="e.g. STS" className="font-black border-indigo-100" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 items-end">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Owner Rate ($/hr)</Label>
                                <Input type="number" value={formData.hourly_rate_owner} onChange={(e: any) => setFormData({ ...formData, hourly_rate_owner: e.target.value })} className="font-mono text-indigo-700 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Contractor Rate ($/hr)</Label>
                                <Input type="number" value={formData.hourly_rate_contractor} onChange={(e: any) => setFormData({ ...formData, hourly_rate_contractor: e.target.value })} className="font-mono text-indigo-700 font-bold" />
                            </div>
                        </div>
                        <div className="hidden md:block"></div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button className="flex-[2] bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? 'REGISTERING...' : <><Save size={14} /> COMMIT RESOURCE</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5 w-16 text-center">Idx</th>
                            <th className="px-6 py-5">Profession Name</th>
                            <th className="px-6 py-5">ID Tag</th>
                            <th className="px-6 py-5 text-right">Owner [H/R]</th>
                            <th className="px-6 py-5 text-right">Contr [H/R]</th>
                            <th className="px-6 py-5 text-center w-32">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {professions.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="px-6 py-5 text-center text-slate-400 font-mono text-[10px] font-bold">{idx + 1}</td>
                                <td className="px-6 py-5"><span className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</span></td>
                                <td className="px-6 py-5 font-mono text-[10px] text-zinc-400 font-black">{item.abbreviation || '--'}</td>
                                <td className="px-6 py-5 text-right font-mono text-xs text-indigo-700 font-bold">${formatNumber(item.hourly_rate_owner, 2)}</td>
                                <td className="px-6 py-5 text-right font-mono text-xs text-indigo-700 font-bold">${formatNumber(item.hourly_rate_contractor, 2)}</td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <ActionButton onClick={() => startEdit(item)} icon={Edit2} label="Edit" />
                                        <ActionButton onClick={() => handleDelete(item.id)} icon={Trash2} color="red" label="Del" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
