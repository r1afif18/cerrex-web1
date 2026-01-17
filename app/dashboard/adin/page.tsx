// ADIN Sheet - Advanced Inventory with Radiological Data
// PRD Section 14

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Database,
    Plus,
    Trash2,
    Edit2,
    Box,
    Layers,
    Activity,
    ShieldAlert,
    Package,
    Columns,
    Info,
    Search,
    ChevronRight,
    LayoutGrid,
    Scale,
    Thermometer
} from 'lucide-react'

// Reusable UI Components
const Input = (props: any) => (
    <input
        {...props}
        className={`glass-input px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none italic md:not-italic ${props.className || ''}`}
    />
)

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 italic md:not-italic">
        {children}
    </label>
)

interface ADINItem {
    id: string
    project_id: string
    building: string
    floor: string
    room_no: string
    equipment_id: string
    equipment_name: string
    isdc_no: string
    tech_system: string
    mass_t: number
    cerrex_category: string
    dominant_material: string
    spec_act_rnv: string
    nraw_t: number
    ew_t: number
    vllw_t: number
    llw_t: number
    ilw_t: number
    total_activity_bq: number
    created_at: string
}

export default function ADINPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [items, setItems] = useState<ADINItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [form, setForm] = useState({
        building: 'RB', floor: '+0.0', room_no: '', equipment_id: '', equipment_name: '',
        isdc_no: '', tech_system: 'PCC', mass_t: 0, cerrex_category: 'INV22',
        dominant_material: 'SS304', spec_act_rnv: '',
        nraw_t: 0, ew_t: 0, vllw_t: 0, llw_t: 0, ilw_t: 0,
    })

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)
        const { data } = await supabase
            .from('adin_items')
            .select('*')
            .eq('project_id', currentProject.id)
            .order('equipment_id', { ascending: true })
        if (data) setItems(data as ADINItem[])
        setLoading(false)
    }, [currentProject, supabase])

    useEffect(() => { loadData() }, [loadData])

    const totals = useMemo(() => ({
        count: items.length,
        mass: items.reduce((s, i) => s + (i.mass_t || 0), 0),
        nraw: items.reduce((s, i) => s + (i.nraw_t || 0), 0),
        ew: items.reduce((s, i) => s + (i.ew_t || 0), 0),
        vllw: items.reduce((s, i) => s + (i.vllw_t || 0), 0),
        llw: items.reduce((s, i) => s + (i.llw_t || 0), 0),
        ilw: items.reduce((s, i) => s + (i.ilw_t || 0), 0),
    }), [items])

    function resetForm() {
        const nextNo = items.length + 1
        setForm({
            building: 'RB', floor: '+0.0', room_no: '',
            equipment_id: `EQ${String(nextNo).padStart(3, '0')}`,
            equipment_name: '', isdc_no: '', tech_system: 'PCC', mass_t: 0,
            cerrex_category: 'INV22', dominant_material: 'SS304', spec_act_rnv: '',
            nraw_t: 0, ew_t: 0, vllw_t: 0, llw_t: 0, ilw_t: 0,
        })
    }

    async function handleSave() {
        if (!currentProject || !form.equipment_id.trim()) return
        setSaving(true)

        const data = {
            building: form.building,
            floor: form.floor,
            room_no: form.room_no,
            equipment_id: form.equipment_id.trim(),
            equipment_name: form.equipment_name,
            isdc_no: form.isdc_no,
            tech_system: form.tech_system,
            mass_t: form.mass_t || 0,
            cerrex_category: form.cerrex_category,
            dominant_material: form.dominant_material,
            spec_act_rnv: form.spec_act_rnv,
            nraw_t: form.nraw_t || 0, ew_t: form.ew_t || 0,
            vllw_t: form.vllw_t || 0, llw_t: form.llw_t || 0, ilw_t: form.ilw_t || 0,
            total_activity_bq: 0,
        }

        if (editingId) {
            await supabase.from('adin_items').update(data).eq('id', editingId)
        } else {
            await supabase.from('adin_items').insert({ project_id: currentProject.id, ...data })
        }

        setShowForm(false)
        setEditingId(null)
        setSaving(false)
        await loadData()
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this equipment and all radiological linkages?')) return
        await supabase.from('adin_nuclide_activities').delete().eq('adin_item_id', id)
        await supabase.from('adin_items').delete().eq('id', id)
        await loadData()
    }

    function handleEdit(item: ADINItem) {
        setEditingId(item.id)
        setForm({
            building: item.building || 'RB',
            floor: item.floor || '+0.0',
            room_no: item.room_no || '',
            equipment_id: item.equipment_id,
            equipment_name: item.equipment_name || '',
            isdc_no: item.isdc_no || '',
            tech_system: item.tech_system || 'PCC',
            mass_t: item.mass_t || 0,
            cerrex_category: item.cerrex_category || 'INV22',
            dominant_material: item.dominant_material || 'SS304',
            spec_act_rnv: item.spec_act_rnv || '',
            nraw_t: item.nraw_t || 0, ew_t: item.ew_t || 0,
            vllw_t: item.vllw_t || 0, llw_t: item.llw_t || 0, ilw_t: item.ilw_t || 0,
        })
        setShowForm(true)
    }

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Database size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to manage advanced inventory.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 italic md:not-italic">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Advanced Inventory (ADIN)</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] italic md:not-italic">Radiological Equipment Database (Excel Section 14)</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all italic md:not-italic"
                >
                    <Plus size={18} />
                    Add Equipment
                </button>
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 italic md:not-italic">
                <div className="glass p-4 rounded-xl border border-slate-200/60 bg-white/40 italic md:not-italic">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic md:not-italic">Units</div>
                    <div className="text-xl font-black text-slate-900 italic md:not-italic">{totals.count}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 bg-white/40 italic md:not-italic">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic md:not-italic">Mass (t)</div>
                    <div className="text-xl font-black text-slate-900 italic md:not-italic">{totals.mass.toFixed(1)}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 bg-slate-100/50 italic md:not-italic">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic md:not-italic">NRAW</div>
                    <div className="text-xl font-black text-slate-700 italic md:not-italic">{totals.nraw.toFixed(2)}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-emerald-500/10 bg-emerald-50/30 italic md:not-italic">
                    <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 italic md:not-italic">EW</div>
                    <div className="text-xl font-black text-emerald-700 italic md:not-italic">{totals.ew.toFixed(2)}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-amber-500/10 bg-amber-50/30 italic md:not-italic">
                    <div className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1 italic md:not-italic">VLLW</div>
                    <div className="text-xl font-black text-amber-700 italic md:not-italic">{totals.vllw.toFixed(2)}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-orange-500/10 bg-orange-50/30 italic md:not-italic">
                    <div className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mb-1 italic md:not-italic">LLW</div>
                    <div className="text-xl font-black text-orange-700 italic md:not-italic">{totals.llw.toFixed(2)}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-red-500/10 bg-red-50/20 italic md:not-italic">
                    <div className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-1 italic md:not-italic">ILW</div>
                    <div className="text-xl font-black text-red-700 italic md:not-italic">{totals.ilw.toFixed(2)}</div>
                </div>
            </div>

            {/* Equipment Form */}
            {showForm && (
                <div className="glass p-8 rounded-3xl border-2 border-blue-500/20 shadow-2xl animate-in slide-in-from-top-4 duration-300 italic md:not-italic">
                    <div className="flex items-center gap-4 mb-8 italic md:not-italic">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 italic md:not-italic">
                            <Box size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 italic md:not-italic">{editingId ? 'Modify Inventory Unit' : 'Initialize New Equipment Record'}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic md:not-italic">Entity creation protocol active</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 italic md:not-italic">
                        <div className="space-y-1.5">
                            <Label>Positioning (BLD)</Label>
                            <Input value={form.building} onChange={(e: any) => setForm({ ...form, building: e.target.value })} placeholder="e.g., RB" />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>Elevation (Floor)</Label>
                            <Input value={form.floor} onChange={(e: any) => setForm({ ...form, floor: e.target.value })} placeholder="e.g., +0.0" />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>Space ID (Room)</Label>
                            <Input value={form.room_no} onChange={(e: any) => setForm({ ...form, room_no: e.target.value })} placeholder="Room No." />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>Primary Key (Equip ID) *</Label>
                            <Input value={form.equipment_id} onChange={(e: any) => setForm({ ...form, equipment_id: e.target.value })} className="font-mono bg-blue-50/30 border-blue-200 font-black" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 italic md:not-italic">
                        <div className="md:col-span-2 space-y-1.5 italic md:not-italic">
                            <Label>Descriptive Nomenclature</Label>
                            <Input value={form.equipment_name} onChange={(e: any) => setForm({ ...form, equipment_name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>ISDC Reference Mapping</Label>
                            <Input value={form.isdc_no} onChange={(e: any) => setForm({ ...form, isdc_no: e.target.value })} className="font-mono" />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>System Hierarchy</Label>
                            <Input value={form.tech_system} onChange={(e: any) => setForm({ ...form, tech_system: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 italic md:not-italic">
                        <div className="space-y-1.5">
                            <Label>Physical Mass (t)</Label>
                            <Input type="number" step="0.001" value={form.mass_t} onChange={(e: any) => setForm({ ...form, mass_t: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>CERREX Classification</Label>
                            <Input value={form.cerrex_category} onChange={(e: any) => setForm({ ...form, cerrex_category: e.target.value })} className="font-mono" />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>Dominant Material</Label>
                            <Input value={form.dominant_material} onChange={(e: any) => setForm({ ...form, dominant_material: e.target.value })} />
                        </div>
                        <div className="space-y-1.5 italic md:not-italic">
                            <Label>RNV Vector Signature</Label>
                            <Input value={form.spec_act_rnv} onChange={(e: any) => setForm({ ...form, spec_act_rnv: e.target.value })} className="font-mono" />
                        </div>
                    </div>

                    {/* Waste Breakdown (Colored Grid) */}
                    <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-wrap gap-4 mb-8 italic md:not-italic">
                        <div className="flex-1 min-w-[120px] p-4 bg-white/60 rounded-xl border border-slate-200 hover:border-slate-400 transition-colors italic md:not-italic">
                            <Label>NRAW (t)</Label>
                            <input type="number" step="0.001" value={form.nraw_t} onChange={e => setForm({ ...form, nraw_t: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent font-mono text-lg font-black text-slate-800 focus:outline-none italic md:not-italic" />
                        </div>
                        <div className="flex-1 min-w-[120px] p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/60 hover:border-emerald-200 transition-colors italic md:not-italic">
                            <Label>EW (t)</Label>
                            <input type="number" step="0.001" value={form.ew_t} onChange={e => setForm({ ...form, ew_t: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent font-mono text-lg font-black text-emerald-800 focus:outline-none italic md:not-italic" />
                        </div>
                        <div className="flex-1 min-w-[120px] p-4 bg-amber-50/60 rounded-xl border border-amber-100/60 hover:border-amber-200 transition-colors italic md:not-italic">
                            <Label>VLLW (t)</Label>
                            <input type="number" step="0.001" value={form.vllw_t} onChange={e => setForm({ ...form, vllw_t: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent font-mono text-lg font-black text-amber-800 focus:outline-none italic md:not-italic" />
                        </div>
                        <div className="flex-1 min-w-[120px] p-4 bg-orange-50/60 rounded-xl border border-orange-100/60 hover:border-orange-200 transition-colors italic md:not-italic">
                            <Label>LLW (t)</Label>
                            <input type="number" step="0.001" value={form.llw_t} onChange={e => setForm({ ...form, llw_t: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent font-mono text-lg font-black text-orange-800 focus:outline-none italic md:not-italic" />
                        </div>
                        <div className="flex-1 min-w-[120px] p-4 bg-red-50/60 rounded-xl border border-red-100/60 hover:border-red-200 transition-colors italic md:not-italic">
                            <Label>ILW (t)</Label>
                            <input type="number" step="0.001" value={form.ilw_t} onChange={e => setForm({ ...form, ilw_t: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-transparent font-mono text-lg font-black text-red-800 focus:outline-none italic md:not-italic" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 italic md:not-italic">
                        <button
                            onClick={() => { setShowForm(false); setEditingId(null) }}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all italic md:not-italic"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all italic md:not-italic"
                        >
                            {saving ? 'Synchronizing...' : editingId ? 'Update Record' : 'Commit Changes'}
                        </button>
                    </div>
                </div>
            )}

            {/* ADIN Data Table */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm italic md:not-italic">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 italic md:not-italic">
                        <Activity size={16} className="text-blue-500" />
                        Radiological Assets Master Partition
                    </h3>
                </div>

                <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                    <table className="w-full text-left border-collapse min-w-[1400px] italic md:not-italic">
                        <thead>
                            <tr className="bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 italic md:not-italic">
                                <th className="px-6 py-4 w-20 pl-8 italic">BLD</th>
                                <th className="px-4 py-4 w-20 italic">Floor</th>
                                <th className="px-4 py-4 w-20 italic">Room</th>
                                <th className="px-4 py-4 w-32 italic">Equip ID</th>
                                <th className="px-4 py-4 italic">Nomenclature</th>
                                <th className="px-4 py-4 w-24 italic">ISDC</th>
                                <th className="px-4 py-4 w-20 italic">Tech</th>
                                <th className="px-4 py-4 w-28 text-right italic">Mass (t)</th>
                                <th className="px-4 py-4 w-28 italic">Category</th>
                                <th className="px-4 py-4 w-24 text-right bg-slate-100/50 italic">NRAW</th>
                                <th className="px-4 py-4 w-20 text-right bg-emerald-50/50 italic">EW</th>
                                <th className="px-4 py-4 w-20 text-right bg-amber-50/50 italic">VLLW</th>
                                <th className="px-4 py-4 w-20 text-right bg-orange-50/50 italic">LLW</th>
                                <th className="px-4 py-4 w-20 text-right bg-red-50/50 italic">ILW</th>
                                <th className="px-6 py-4 w-24 text-center italic">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                            {loading ? (
                                <tr>
                                    <td colSpan={15} className="p-20 text-center italic md:not-italic">
                                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8 mx-auto italic md:not-italic"></div>
                                        <p className="mt-4 text-sm text-slate-400 italic md:not-italic">Synthesizing radiological layers...</p>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="p-20 text-center text-slate-400 text-sm italic md:not-italic">
                                        Active inventory partition is empty.
                                    </td>
                                </tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all italic md:not-italic">
                                    <td className="px-6 py-3 font-mono text-[10px] text-slate-400 font-bold pl-8 italic md:not-italic">{item.building || '-'}</td>
                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-600 italic md:not-italic">{item.floor || '-'}</td>
                                    <td className="px-4 py-3 text-[10px] text-slate-400 italic md:not-italic">{item.room_no || '-'}</td>
                                    <td className="px-4 py-3 font-mono font-black text-xs text-blue-600 italic md:not-italic">{item.equipment_id}</td>
                                    <td className="px-4 py-3 text-xs font-bold text-slate-700 italic md:not-italic overflow-hidden truncate max-w-[200px]">{item.equipment_name || '-'}</td>
                                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400 italic md:not-italic">{item.isdc_no || '-'}</td>
                                    <td className="px-4 py-3 text-[10px] font-black text-slate-500 italic md:not-italic">{item.tech_system || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-900 font-black tabular-nums italic md:not-italic">{item.mass_t?.toFixed(3) || '0'}</td>
                                    <td className="px-4 py-3 font-mono text-[10px] text-indigo-500 font-bold italic md:not-italic">{item.cerrex_category || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 bg-slate-50/30 tabular-nums italic md:not-italic">{item.nraw_t?.toFixed(3) || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600 bg-emerald-50/10 tabular-nums italic md:not-italic">{item.ew_t?.toFixed(3) || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-amber-600 bg-amber-50/10 tabular-nums italic md:not-italic">{item.vllw_t?.toFixed(3) || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-orange-600 bg-orange-50/10 tabular-nums italic md:not-italic">{item.llw_t?.toFixed(3) || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-red-600 bg-red-50/10 tabular-nums italic md:not-italic">{item.ilw_t?.toFixed(3) || '-'}</td>
                                    <td className="px-6 py-3 text-center italic md:not-italic">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all italic md:not-italic">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all italic md:not-italic"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all italic md:not-italic"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit & Methodology Notice */}
            <div className="p-6 glass rounded-2xl border border-blue-500/10 flex flex-col md:flex-row gap-6 items-start italic md:not-italic">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 italic md:not-italic">
                    <ShieldAlert size={24} />
                </div>
                <div className="space-y-2 flex-1 italic md:not-italic">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest italic md:not-italic">Radiological Entity Integrity Protocol</h4>
                    <p className="text-xs text-slate-500 leading-relaxed italic md:not-italic">
                        Advanced Inventory (ADIN) is the primary source for activity calculation and waste classification routing.
                        Each <span className="font-bold text-slate-700 italic md:not-italic">Equip ID</span> must be globally unique within the project workspace.
                        Modifications to mass distributions (NRAW to ILW) will trigger immediate recalculations in the <span className="text-indigo-600 font-bold italic md:not-italic">ISDC Grand Total Summary</span>.
                    </p>
                </div>
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 italic md:not-italic">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-[10px] uppercase tracking-wider mb-1 italic md:not-italic">
                        <Info size={14} /> System Stability Note
                    </div>
                    <p className="text-[10px] text-amber-700/80 leading-snug italic md:not-italic">Nuclide specific activity matrix and decay correction algorithms are synchronized with the RND database.</p>
                </div>
            </div>
        </div>
    )
}
