// SCHDL Sheet - Project Schedule
// PRD Section 9: 399x89 - Activity scheduling with timeline

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Calendar,
    Clock,
    Users,
    Plus,
    Edit2,
    Trash2,
    GanttChartSquare,
    Activity,
    ChevronRight,
    Search,
    X,
    Info,
    ArrowRight
} from 'lucide-react'

interface ScheduleActivity {
    id: string
    project_id: string
    isdc_l2_code: string
    description: string
    phase: string
    start_year: number
    duration_calc: number
    duration_user: number | null
    working_groups: number
    workforce: number
}

interface InventoryItem {
    id: string
    isdc_l3_code: string
    basic_workforce: number
    wdf_f1: number
    wdf_f2: number
    wdf_f3: number
    wdf_f4: number
    wdf_f5: number
    wdf_f6: number
    wdf_f7: number
    is_activated: boolean
}

function calcTotalWF(item: InventoryItem): number {
    const wdfSum = (item.wdf_f1 || 0) + (item.wdf_f2 || 0) + (item.wdf_f3 || 0) +
        (item.wdf_f4 || 0) + (item.wdf_f5 || 0) + (item.wdf_f6 || 0) + (item.wdf_f7 || 0)
    return (item.basic_workforce || 0) * (100 + wdfSum) / 100
}

const PHASES = ['Preparation', 'Dismantling', 'Waste Processing', 'Site Restoration', 'Closure']

// Reusable UI Components
const ActionButton = ({ onClick, icon: Icon, color = 'slate', size = 16, disabled = false }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${color === 'red' ? 'text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}
        `}
    >
        <Icon size={size} />
    </button>
)

const Input = (props: any) => (
    <input
        {...props}
        className="glass-input w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
    />
)

const Select = (props: any) => (
    <select
        {...props}
        className="glass-input w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
    />
)

export default function SCHDLPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [activities, setActivities] = useState<ScheduleActivity[]>([])
    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const workingHoursPerYear = currentProject?.working_hours_per_year || 1800
    const referenceYear = currentProject?.reference_year || 2020

    const [form, setForm] = useState({
        isdc_l2_code: '04.01',
        description: '',
        phase: 'Dismantling',
        start_year: referenceYear,
        duration_user: null as number | null,
        working_groups: 1,
    })

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)

        const [actRes, invRes] = await Promise.all([
            supabase.from('schedule_activities').select('*').eq('project_id', currentProject.id).order('start_year'),
            supabase.from('inventory_items').select('*').eq('project_id', currentProject.id).eq('is_activated', true),
        ])

        if (actRes.data) setActivities(actRes.data)
        if (invRes.data) setInvItems(invRes.data)
        setLoading(false)
    }, [currentProject, supabase])

    useEffect(() => { loadData() }, [loadData])

    // Calculate workforce by L2 code
    const workforceByL2 = useMemo(() => {
        const wf: Record<string, number> = {}
        invItems.forEach(item => {
            const l2 = (item.isdc_l3_code || 'XX.XX').substring(0, 5)
            if (!wf[l2]) wf[l2] = 0
            wf[l2] += calcTotalWF(item)
        })
        return wf
    }, [invItems])

    // Get duration (user override or calculated)
    const getDuration = (act: ScheduleActivity): number => {
        if (act.duration_user && act.duration_user > 0) return act.duration_user
        const wf = workforceByL2[act.isdc_l2_code] || 0
        if (wf === 0 || act.working_groups === 0) return 0
        return wf / (act.working_groups * workingHoursPerYear)
    }

    // Calculate end year
    const getEndYear = (act: ScheduleActivity): number => {
        return act.start_year + Math.ceil(getDuration(act))
    }

    // Get year range for timeline
    const yearRange = useMemo(() => {
        if (activities.length === 0) return [referenceYear, referenceYear + 10]
        const starts = activities.map(a => a.start_year)
        const ends = activities.map(a => getEndYear(a))
        return [Math.min(...starts), Math.max(...ends) + 1]
    }, [activities, referenceYear])

    const years = useMemo(() => {
        const arr = []
        for (let y = yearRange[0]; y <= yearRange[1]; y++) arr.push(y)
        return arr
    }, [yearRange])

    // Totals
    const totals = useMemo(() => ({
        activities: activities.length,
        workforce: Object.values(workforceByL2).reduce((s, w) => s + w, 0),
        duration: activities.reduce((s, a) => s + getDuration(a), 0),
    }), [activities, workforceByL2])

    function resetForm() {
        setForm({
            isdc_l2_code: '04.01', description: '', phase: 'Dismantling',
            start_year: referenceYear, duration_user: null, working_groups: 1,
        })
    }

    async function handleSave() {
        if (!currentProject || !form.isdc_l2_code.trim()) return
        setSaving(true)

        const data = {
            isdc_l2_code: form.isdc_l2_code.trim(),
            description: form.description,
            phase: form.phase,
            start_year: form.start_year,
            duration_user: form.duration_user,
            working_groups: form.working_groups || 1,
            duration_calc: 0, // Will be calculated
        }

        if (editingId) {
            await supabase.from('schedule_activities').update(data).eq('id', editingId)
        } else {
            await supabase.from('schedule_activities').insert({ project_id: currentProject.id, ...data })
        }

        setShowForm(false); setEditingId(null); setSaving(false)
        await loadData()
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this activity?')) return
        await supabase.from('schedule_activities').delete().eq('id', id)
        await loadData()
    }

    function handleEdit(act: ScheduleActivity) {
        setEditingId(act.id)
        setForm({
            isdc_l2_code: act.isdc_l2_code,
            description: act.description || '',
            phase: act.phase || 'Dismantling',
            start_year: act.start_year || referenceYear,
            duration_user: act.duration_user,
            working_groups: act.working_groups || 1,
        })
        setShowForm(true)
    }

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Calendar size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to manage schedule.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Schedule</h1>
                    <p className="text-slate-500 mt-1">Activity timeline based on workforce and groups (Excel Section 9).</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    onClick={() => { resetForm(); setEditingId(null); setShowForm(true) }}
                >
                    <Plus size={16} /> Add Activity
                </button>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Activity size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Activities</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{totals.activities}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <Users size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total WF</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                        {totals.workforce.toLocaleString()} <span className="text-xs font-normal">man·h</span>
                    </div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Calculated Span</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                        {totals.duration.toFixed(1)} <span className="text-xs font-normal text-slate-400">years</span>
                    </div>
                </div>
            </div>

            {/* Form Panel */}
            {showForm && (
                <div className="glass-panel p-6 rounded-2xl border-blue-500/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
                            </span>
                            {editingId ? 'Edit Activity' : 'Create Schedule Activity'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">ISDC L2 Code *</label>
                                <Input value={form.isdc_l2_code} onChange={(e: any) => setForm({ ...form, isdc_l2_code: e.target.value })} className="font-mono" />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
                                <Input value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Reactor dismantling phase 1" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Phase</label>
                                <Select value={form.phase} onChange={(e: any) => setForm({ ...form, phase: e.target.value })}>
                                    {PHASES.map(p => <option key={p}>{p}</option>)}
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Start Year</label>
                                <Input type="number" value={form.start_year} onChange={(e: any) => setForm({ ...form, start_year: parseInt(e.target.value) || referenceYear })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Working Groups</label>
                                <Input type="number" min={1} value={form.working_groups} onChange={(e: any) => setForm({ ...form, working_groups: parseInt(e.target.value) || 1 })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Duration Override (Auto-calc if 0)</label>
                                <Input type="number" step="0.1" value={form.duration_user ?? ''} onChange={(e: any) => setForm({ ...form, duration_user: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Auto" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors" onClick={() => setShowForm(false)}>Cancel</button>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule & Timeline View */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <GanttChartSquare size={16} className="text-blue-500" />
                        Activity Timeline
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        Reference Year: <span className="text-slate-700">{referenceYear}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4">
                        <div className="spinner border-slate-200 border-t-blue-600"></div>
                        <span className="text-sm text-slate-400">Sequencing activities...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="sticky top-0 z-20">
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-5 py-4 w-24 sticky left-0 z-30 bg-slate-50/80 backdrop-blur-md rounded-br-lg border-r border-slate-200/50 italic">Code</th>
                                    <th className="px-5 py-4 w-48 sticky left-24 z-30 bg-slate-50/80 backdrop-blur-md border-r border-slate-200/50">Description</th>
                                    <th className="px-4 py-4 w-32">Phase</th>
                                    <th className="px-4 py-4 w-24 text-right">Workforce</th>
                                    <th className="px-4 py-4 w-16 text-center">Groups</th>
                                    <th className="px-4 py-4 w-24 text-right border-r border-slate-100">Duration</th>
                                    {years.map(y => (
                                        <th key={y} className="px-1 py-4 w-12 text-center text-[9px] font-mono border-r border-slate-100/50">{y}</th>
                                    ))}
                                    <th className="px-6 py-4 w-24 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={7 + years.length} className="p-20 text-center opacity-40 italic text-slate-500 text-sm">
                                            No activities defined. Create a project to get defaults or add manually.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map(act => {
                                        const wf = workforceByL2[act.isdc_l2_code] || 0
                                        const dur = getDuration(act)
                                        const endYear = getEndYear(act)
                                        return (
                                            <tr key={act.id} className="group hover:bg-blue-50/10 transition-all border-b border-slate-50">
                                                <td className="px-5 py-3 sticky left-0 z-10 bg-white font-mono font-bold text-xs text-slate-400 group-hover:text-blue-600 border-r border-slate-100 transition-colors">
                                                    {act.isdc_l2_code}
                                                </td>
                                                <td className="px-5 py-3 sticky left-24 z-10 bg-white font-semibold text-xs text-slate-800 border-r border-slate-100 max-w-[180px] truncate">
                                                    {act.description}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${act.phase === 'Dismantling' ? 'bg-indigo-100 text-indigo-700' :
                                                            act.phase === 'Waste Processing' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {act.phase}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-500 italic md:not-italic">{wf.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="px-4 py-3 text-center text-xs font-bold text-slate-700">{act.working_groups}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-xs text-slate-800 border-r border-slate-100">{dur.toFixed(1)}y</td>
                                                {years.map(y => {
                                                    const isActive = y >= act.start_year && y < endYear
                                                    const isStart = y === act.start_year
                                                    const isEnd = y === endYear - 1
                                                    return (
                                                        <td key={y} className="px-0 py-2 border-r border-slate-50">
                                                            {isActive && (
                                                                <div className={`h-4 bg-gradient-to-r ${act.phase === 'Dismantling' ? 'from-indigo-400 to-indigo-500' :
                                                                        act.phase === 'Waste Processing' ? 'from-amber-400 to-amber-500' :
                                                                            'from-blue-400 to-blue-500'
                                                                    } shadow-sm shadow-blue-500/10 flex items-center justify-center
                                                                ${isStart ? 'rounded-l-sm ml-0.5' : ''}
                                                                ${isEnd ? 'rounded-r-sm mr-0.5' : ''}
                                                                `}>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ActionButton icon={Edit2} onClick={() => handleEdit(act)} />
                                                        <ActionButton icon={Trash2} color="red" onClick={() => handleDelete(act.id)} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Legend */}
            <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-2xl border border-slate-200/60 text-xs text-slate-500 italic md:not-italic">
                <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Info size={14} className="text-blue-500" />
                        Scheduling Formula
                    </h5>
                    <p className="leading-relaxed">
                        Activity duration is computed using the following formula unless overridden:
                        <br />
                        <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block">
                            Duration (y) = Workforce (man·h) / (Groups × {workingHoursPerYear} h/y)
                        </span>
                    </p>
                </div>
                <div className="flex-1 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <div className="flex items-center gap-2 text-blue-800 font-bold uppercase tracking-wider mb-2">
                        Timeline Guide
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-indigo-500 shadow-sm"></div>
                            <span className="text-[10px] font-semibold">Dismantling</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-amber-500 shadow-sm"></div>
                            <span className="text-[10px] font-semibold">Waste Process.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm"></div>
                            <span className="text-[10px] font-semibold">Other Phases</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="text-[10px] font-semibold">Width = Span</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
