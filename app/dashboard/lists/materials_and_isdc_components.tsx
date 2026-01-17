'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Database, Layers, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Premium Form Components
const ActionButton = ({ onClick, icon: Icon, color = 'blue', label = '' }: { onClick: () => void, icon: any, color?: 'blue' | 'red', label?: string }) => (
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

function formatNumber(num: number, decimals: number = 2) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num)
}

export function MaterialsTable({ projectId }: { projectId: string }) {
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        density_kg_m3: 0,
        description: ''
    })

    const supabase = createClient()

    const fetchMaterials = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .order('name')
        if (error) console.error('Error fetching materials:', error)
        else setMaterials(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMaterials()
    }, [])

    const handleSave = async () => {
        if (!formData.name) return
        setSaving(true)
        const payload = { ...formData }

        if (editingId) {
            const { error } = await supabase.from('materials').update(payload).eq('id', editingId)
            if (error) console.error('Error updating material:', error)
        } else {
            const { error } = await supabase.from('materials').insert([payload])
            if (error) console.error('Error adding material:', error)
        }

        setSaving(false)
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', density_kg_m3: 0, description: '' })
        fetchMaterials()
    }

    const startEdit = (item: any) => {
        setEditingId(item.id)
        setFormData({
            name: item.name,
            density_kg_m3: item.density_kg_m3,
            description: item.description || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this material?')) return
        const { error } = await supabase.from('materials').delete().eq('id', id)
        if (error) console.error('Error deleting material:', error)
        else fetchMaterials()
    }

    if (loading && materials.length === 0) {
        return (
            <div className="p-40 flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Materials Library...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Database size={16} className="text-blue-600" />
                    Materials Depository
                </h2>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', density_kg_m3: 0, description: '' }) }}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
                >
                    <Plus size={14} />
                    New Material
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-blue-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Modify Material' : 'Register New Material'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label>Material Name</Label>
                            <Input placeholder="e.g. Concrete, Steel" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Density (kg/m³)</Label>
                            <Input type="number" value={formData.density_kg_m3} onChange={(e: any) => setFormData({ ...formData, density_kg_m3: parseFloat(e.target.value) || 0 })} className="font-mono" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label>Technical Description</Label>
                            <Input placeholder="Optional physical properties..." value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'SAVING...' : <><Save size={14} /> COMMIT MATERIAL</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40 backdrop-blur-md">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5 w-16 text-center">Ref</th>
                            <th className="px-6 py-5">Substance Name</th>
                            <th className="px-6 py-5">Density [kg/m³]</th>
                            <th className="px-6 py-5">Technical Specs</th>
                            <th className="px-6 py-5 text-center">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {materials.map((item, idx) => (
                            <tr key={item.id} className="group hover:bg-white/50 transition-all">
                                <td className="px-6 py-5 text-center text-slate-400 font-mono text-[10px] uppercase">{idx + 1}</td>
                                <td className="px-6 py-5">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                                </td>
                                <td className="px-6 py-5 font-mono text-xs text-slate-600 font-bold">
                                    {formatNumber(item.density_kg_m3, 0)}
                                </td>
                                <td className="px-6 py-5 text-slate-500 text-[11px] font-medium italic">
                                    {item.description || '--'}
                                </td>
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

export function ISDCCodesTable({ projectId }: { projectId: string }) {
    const [codes, setCodes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        level: 1,
        parent_code: ''
    })

    const supabase = createClient()

    const fetchCodes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('isdc_codes')
            .select('*')
            .order('code')
        if (error) console.error('Error fetching ISDC codes:', error)
        else setCodes(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchCodes()
    }, [])

    const handleSave = async () => {
        if (!formData.code) return
        setSaving(true)
        const payload = { ...formData }

        if (editingId) {
            const { error } = await supabase.from('isdc_codes').update(payload).eq('id', editingId)
            if (error) console.error('Error updating ISDC code:', error)
        } else {
            const { error } = await supabase.from('isdc_codes').insert([payload])
            if (error) console.error('Error adding ISDC code:', error)
        }

        setSaving(false)
        setShowForm(false)
        setEditingId(null)
        setFormData({ code: '', description: '', level: 1, parent_code: '' })
        fetchCodes()
    }

    const startEdit = (item: any) => {
        setEditingId(item.id)
        setFormData({
            code: item.code,
            description: item.description || '',
            level: item.level || 1,
            parent_code: item.parent_code || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ISDC code?')) return
        const { error } = await supabase.from('isdc_codes').delete().eq('id', id)
        if (error) console.error('Error deleting ISDC code:', error)
        else fetchCodes()
    }

    if (loading && codes.length === 0) {
        return (
            <div className="p-40 flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Mapping ISDC Codes Hierarchy...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600" />
                    ISDC Taxonomy
                </h2>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ code: '', description: '', level: 1, parent_code: '' }) }}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20"
                >
                    <Plus size={14} />
                    Define ISDC Code
                </button>
            </div>

            {showForm && (
                <div className="p-8 glass-panel rounded-[2rem] border border-blue-500/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{editingId ? 'Modify ISDC Code' : 'New ISDC Classification'}</h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <Label>ISDC Code</Label>
                            <Input placeholder="e.g. 04.05" value={formData.code} onChange={(e: any) => setFormData({ ...formData, code: e.target.value })} className="font-mono font-black border-blue-100" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Hierarchy Level</Label>
                            <Select value={formData.level} onChange={(e: any) => setFormData({ ...formData, level: parseInt(e.target.value) })}>
                                <option value={1}>Tier 1 (Section)</option>
                                <option value={2}>Tier 2 (Group)</option>
                                <option value={3}>Tier 3 (Element)</option>
                            </Select>
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <Label>Superior (Parent) Code</Label>
                            <Input placeholder="Inherited from..." value={formData.parent_code} onChange={(e: any) => setFormData({ ...formData, parent_code: e.target.value })} className="font-mono" />
                        </div>
                        <div className="md:col-span-4 space-y-1.5">
                            <Label>Taxonomy Description</Label>
                            <Input placeholder="Classification name or function..." value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest transition-all">Discard</button>
                            <button
                                className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center gap-2"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'SAVING...' : <><CheckCircle2 size={14} /> PERSIST TAXONOMY</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200/40 bg-white/40 backdrop-blur-md">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/50">
                            <th className="px-6 py-5 w-16 text-center">Ref</th>
                            <th className="px-6 py-5">ISDC Code</th>
                            <th className="px-6 py-5">Tier</th>
                            <th className="px-6 py-5">Parent</th>
                            <th className="px-6 py-5">Classification Descriptor</th>
                            <th className="px-6 py-5 text-center">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {codes.map((item, idx) => (
                            <tr key={item.id} className="group hover:bg-white/50 transition-all font-medium">
                                <td className="px-6 py-5 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                <td className="px-6 py-5 font-mono font-black text-xs text-blue-700 tracking-tight">{item.code}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${item.level === 1 ? 'bg-amber-100 text-amber-700' :
                                            item.level === 2 ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>Tier {item.level}</span>
                                </td>
                                <td className="px-6 py-5 font-mono text-[10px] text-zinc-400 font-bold">{item.parent_code || '--'}</td>
                                <td className="px-6 py-5 text-slate-800 text-xs font-bold uppercase tracking-tight">{item.description}</td>
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
