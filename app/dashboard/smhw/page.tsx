// SMHW Sheet - Systems, Materials, Hardware
// Full CRUD with Supabase

'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import type { TechSystem, Material } from '@/lib/supabase/types'
import {
    Settings,
    Layers,
    ShieldAlert,
    Box,
    LayoutList,
    Plus,
    Trash2,
    Edit2,
    Database,
    Info,
    Boxes,
    Activity,
    FileSpreadsheet,
    Zap,
    Scale,
    FlaskConical
} from 'lucide-react'

type Tab = 'tech_systems' | 'materials' | 'haz_materials' | 'haz_waste'

// Reusable UI Components
const Input = (props: any) => (
    <input
        {...props}
        className={`glass-input px-3 py-1.5 text-xs rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none italic md:not-italic ${props.className || ''}`}
    />
)

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic md:not-italic">
        {children}
    </label>
)

export default function SMHWPage() {
    const { currentProject } = useProject()
    const [activeTab, setActiveTab] = useState<Tab>('tech_systems')

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Settings size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to manage infrastructure data.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Systems & Infrastructure</h1>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] italic md:not-italic">Technology Systems, Material Libraries, and Hazardous Tracking</p>
            </div>

            {/* Modern Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 glass rounded-xl w-fit border border-slate-200/60 italic md:not-italic">
                <button
                    onClick={() => setActiveTab('tech_systems')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'tech_systems' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                    `}
                >
                    <Settings size={16} />
                    Tech Systems
                </button>
                <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'materials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                    `}
                >
                    <Layers size={16} />
                    Materials
                </button>
                <button
                    onClick={() => setActiveTab('haz_materials')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'haz_materials' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                    `}
                >
                    <Activity size={16} />
                    Hazardous Materials
                </button>
                <button
                    onClick={() => setActiveTab('haz_waste')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'haz_waste' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                    `}
                >
                    <Boxes size={16} />
                    Hazardous Waste
                </button>
            </div>

            <div className="glass-panel rounded-3xl border border-white/40 shadow-xl overflow-hidden italic md:not-italic">
                <div className="p-8 italic md:not-italic">
                    {activeTab === 'tech_systems' && <TechSystemsTable projectId={currentProject.id} />}
                    {activeTab === 'materials' && <MaterialsTable projectId={currentProject.id} />}
                    {activeTab === 'haz_materials' && <HazMaterialsTable projectId={currentProject.id} />}
                    {activeTab === 'haz_waste' && <HazWasteTable projectId={currentProject.id} />}
                </div>
            </div>
        </div>
    )
}

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
        const { data } = await supabase.from('tech_systems').select('*').eq('project_id', projectId).order('code')
        if (data) setSystems(data)
        setLoading(false)
    }

    function startEdit(item: TechSystem) {
        setEditingId(item.id)
        setFormData({ code: item.code, name: item.name })
        setShowForm(true)
    }

    function startAdd() {
        setEditingId(null)
        setFormData({ code: '', name: '' })
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
        if (!confirm('Permanently delete this system definition?')) return
        await supabase.from('tech_systems').delete().eq('id', id)
        await loadData()
    }

    if (loading) return (
        <div className="p-24 flex flex-col items-center gap-4 italic md:not-italic">
            <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8 italic md:not-italic"></div>
            <span className="text-sm text-slate-400 italic md:not-italic">Indexing system architectures...</span>
        </div>
    )

    return (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500 italic md:not-italic">
            <div className="flex justify-between items-center italic md:not-italic">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] italic md:not-italic">Technological System Matrix ({systems.length}/19)</h3>
                <button onClick={startAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all italic md:not-italic">
                    <Plus size={14} />
                    Add System
                </button>
            </div>

            {showForm && (
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 mb-6 italic md:not-italic">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end italic md:not-italic">
                        <div>
                            <Label>System Alpha-Code</Label>
                            <Input value={formData.code} onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., PCC" className="bg-white font-mono font-bold" />
                        </div>
                        <div>
                            <Label>Full System Nomenclature</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Primary Coolant Circuit" className="bg-white" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 italic md:not-italic">
                        <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-1.5 text-xs font-bold text-slate-500 italic md:not-italic">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md italic md:not-italic">{saving ? '...' : 'Commit Record'}</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                <table className="w-full text-left border-collapse italic md:not-italic">
                    <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic md:not-italic">
                            <th className="px-6 py-4 w-32 pl-8 italic">Sys Code</th>
                            <th className="px-4 py-4 italic">Description</th>
                            <th className="px-6 py-4 w-24 text-center italic">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                        {systems.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-all italic md:not-italic">
                                <td className="px-6 py-3.5 pl-8 font-mono font-black text-xs text-blue-600 italic md:not-italic">{item.code}</td>
                                <td className="px-4 py-3.5 text-sm font-bold text-slate-700 italic md:not-italic">{item.name}</td>
                                <td className="px-6 py-3.5 italic md:not-italic">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all italic md:not-italic">
                                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all italic md:not-italic"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all italic md:not-italic"><Trash2 size={12} /></button>
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

function MaterialsTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ code: '', name: '', density_kg_m3: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase.from('materials').select('*').eq('project_id', projectId).order('code')
        if (data) setMaterials(data)
        setLoading(false)
    }

    function startEdit(item: Material) {
        setEditingId(item.id)
        setFormData({ code: item.code, name: item.name, density_kg_m3: String(item.density_kg_m3 || '') })
        setShowForm(true)
    }

    function startAdd() {
        setEditingId(null)
        setFormData({ code: '', name: '', density_kg_m3: '' })
        setShowForm(true)
    }

    async function handleSave() {
        setSaving(true)
        const data = {
            code: formData.code,
            name: formData.name,
            density_kg_m3: parseFloat(formData.density_kg_m3) || null,
        }
        if (editingId) {
            await supabase.from('materials').update(data).eq('id', editingId)
        } else {
            await supabase.from('materials').insert({ project_id: projectId, ...data })
        }
        await loadData()
        setShowForm(false)
        setEditingId(null)
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Permanently delete this material from library?')) return
        await supabase.from('materials').delete().eq('id', id)
        await loadData()
    }

    if (loading) return (
        <div className="p-24 flex flex-col items-center gap-4 italic md:not-italic">
            <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8 italic md:not-italic"></div>
            <span className="text-sm text-slate-400 italic md:not-italic">Quantizing material properties...</span>
        </div>
    )

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 italic md:not-italic">
            <div className="flex justify-between items-center italic md:not-italic">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] italic md:not-italic">Dominant Material Catalog ({materials.length}/17)</h3>
                <button onClick={startAdd} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all italic md:not-italic">
                    <Plus size={14} />
                    Register Material
                </button>
            </div>

            {showForm && (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 mb-6 italic md:not-italic">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end italic md:not-italic">
                        <div>
                            <Label>Material Code</Label>
                            <Input value={formData.code} onChange={(e: any) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="bg-white font-mono" />
                        </div>
                        <div>
                            <Label>Material Name</Label>
                            <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} className="bg-white" />
                        </div>
                        <div>
                            <Label>Density (kg/m³)</Label>
                            <Input type="number" value={formData.density_kg_m3} onChange={(e: any) => setFormData({ ...formData, density_kg_m3: e.target.value })} className="bg-white tabular-nums" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 italic md:not-italic">
                        <button onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-1.5 text-xs font-bold text-slate-400 italic md:not-italic">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold italic md:not-italic">Save Property</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                <table className="w-full text-left border-collapse italic md:not-italic">
                    <thead>
                        <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic md:not-italic">
                            <th className="px-6 py-4 w-32 pl-8 italic">Mtl Code</th>
                            <th className="px-4 py-4 italic">Material Properties</th>
                            <th className="px-4 py-4 w-40 text-right italic font-bold">Density (kg/m³)</th>
                            <th className="px-6 py-4 w-24 text-center italic">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                        {materials.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-all italic md:not-italic">
                                <td className="px-6 py-3.5 pl-8 font-mono font-black text-xs text-indigo-600 italic md:not-italic">{item.code}</td>
                                <td className="px-4 py-3.5 text-sm font-bold text-slate-700 italic md:not-italic">{item.name}</td>
                                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{item.density_kg_m3?.toLocaleString() || '-'}</td>
                                <td className="px-6 py-3.5 italic md:not-italic">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all italic md:not-italic">
                                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all italic md:not-italic"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all italic md:not-italic"><Trash2 size={12} /></button>
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

function HazMaterialsTable({ projectId }: { projectId: string }) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 italic md:not-italic">
            <div className="flex justify-between items-center italic md:not-italic">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] italic md:not-italic">Hazardous Material Monitoring</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all italic md:not-italic">
                    <Plus size={14} />
                    Track HAZ Substance
                </button>
            </div>

            <div className="p-8 glass rounded-3xl border border-amber-500/10 bg-amber-50/30 flex flex-col md:flex-row gap-8 items-start italic md:not-italic">
                <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 italic md:not-italic">
                    <Activity size={32} />
                </div>
                <div className="space-y-4 flex-1 italic md:not-italic">
                    <div>
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1 italic md:not-italic">Toxicology & Substance Tracking</h4>
                        <p className="text-[11px] text-amber-700/80 leading-relaxed italic md:not-italic">
                            Beryllium, Asbestos, Lead, and other regulated hazardous substances linked to physical inventory items.
                            Tracking enables secondary waste stream generation during D&D operations.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 italic md:not-italic">
                        {['HM01 (Beryllium)', 'HM02 (Barite)', 'HM03 (Asbestos)', 'HM04 (Lead)'].map(tag => (
                            <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 italic md:not-italic">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function HazWasteTable({ projectId }: { projectId: string }) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 italic md:not-italic">
            <div className="flex justify-between items-center italic md:not-italic">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] italic md:not-italic">Regulated Hazardous Waste Matrix</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all italic md:not-italic">
                    <Plus size={14} />
                    Log HAZ Waste
                </button>
            </div>

            <div className="p-8 glass rounded-3xl border border-red-500/10 bg-red-50/30 flex flex-col md:flex-row gap-8 items-start italic md:not-italic">
                <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20 italic md:not-italic">
                    <ShieldAlert size={32} />
                </div>
                <div className="space-y-4 flex-1 italic md:not-italic">
                    <div>
                        <h4 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1 italic md:not-italic">EU Waste Code Compliance</h4>
                        <p className="text-[11px] text-red-700/80 leading-relaxed italic md:not-italic">
                            Mapping of hazardous processing output to official European Waste Catalogue identifiers.
                            Required for disposal route validation and transport manifests.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 italic md:not-italic">
                        <div className="p-3 bg-white/40 rounded-xl border border-red-100 italic md:not-italic">
                            <span className="text-[9px] font-black text-red-800 uppercase italic md:not-italic">HW01 (Beryllium)</span>
                            <div className="text-[10px] text-slate-500 font-mono italic md:not-italic">Code: 17-04-09</div>
                        </div>
                        <div className="p-3 bg-white/40 rounded-xl border border-red-100 italic md:not-italic">
                            <span className="text-[9px] font-black text-red-800 uppercase italic md:not-italic">HW02 (Asbestos)</span>
                            <div className="text-[10px] text-slate-500 font-mono italic md:not-italic">Code: 17-06-01</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
