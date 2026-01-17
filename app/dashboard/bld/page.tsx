// BLD Sheet - Building List from Excel
// Simple table with Building Code, Name, and hierarchy

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Building2,
    Home,
    Plus,
    Edit2,
    Trash2,
    ChevronRight,
    Layers,
    Maximize2,
    Search,
    X,
    Info
} from 'lucide-react'

interface Building {
    id: string
    project_id: string
    code: string
    name: string
    parent_code?: string
    floor_count?: number
    gross_area_m2?: number
    created_at: string
}

// Reusable UI Components
const ActionButton = ({ onClick, icon: Icon, color = 'slate', size = 16, disabled = false }: any) => (
    <button
        type="button"
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
        className={`glass-input w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 ${props.className || ''}`}
    />
)

export default function BLDPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [buildings, setBuildings] = useState<Building[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [form, setForm] = useState({ code: '', name: '', parent_code: '', floor_count: 0, gross_area_m2: 0 })

    const filteredBuildings = useMemo(() => {
        if (!searchQuery.trim()) return buildings
        const q = searchQuery.toLowerCase()
        return buildings.filter(b =>
            b.code.toLowerCase().includes(q) ||
            b.name.toLowerCase().includes(q) ||
            b.parent_code?.toLowerCase().includes(q)
        )
    }, [buildings, searchQuery])

    useEffect(() => {
        if (currentProject) loadData()
    }, [currentProject])

    async function loadData() {
        if (!currentProject) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('buildings')
                .select('*')
                .eq('project_id', currentProject.id)
                .order('code')
            if (error) throw error
            if (data) setBuildings(data)
        } catch (err) {
            console.error('Error loading buildings:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!currentProject || !form.code) return

        const data = {
            code: form.code,
            name: form.name,
            parent_code: form.parent_code || null,
            floor_count: form.floor_count || null,
            gross_area_m2: form.gross_area_m2 || null,
        }

        if (editingId) {
            await supabase.from('buildings').update(data).eq('id', editingId)
        } else {
            await supabase.from('buildings').insert({ project_id: currentProject.id, ...data })
        }

        setShowForm(false)
        setEditingId(null)
        setForm({ code: '', name: '', parent_code: '', floor_count: 0, gross_area_m2: 0 })
        await loadData()
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this building?')) return
        await supabase.from('buildings').delete().eq('id', id)
        await loadData()
    }

    function startEdit(b: Building) {
        setEditingId(b.id)
        setForm({
            code: b.code,
            name: b.name,
            parent_code: b.parent_code || '',
            floor_count: b.floor_count || 0,
            gross_area_m2: b.gross_area_m2 || 0,
        })
        setShowForm(true)
    }

    function startAdd() {
        setEditingId(null)
        const nextCode = String(buildings.length + 1).padStart(2, '0')
        setForm({ code: nextCode, name: '', parent_code: '', floor_count: 0, gross_area_m2: 0 })
        setShowForm(true)
    }

    // Get hierarchy level from code (01 = L1, 01.0100 = L2, 01.0101 = L3)
    function getLevel(code: string): number {
        const parts = code.split('.')
        if (parts.length === 1) return 1
        if (parts[1]?.endsWith('00')) return 2
        return 3
    }

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Building2 size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to manage buildings.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">BLD Sheet - Building List</h1>
                    <p className="text-slate-500 mt-1">Facility buildings with hierarchical structure (Excel cols A-C).</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative group flex-1 sm:flex-initial">
                        {React.createElement(Search as any, {
                            size: 14,
                            className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                        })}
                        <Input
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            placeholder="Search buildings..."
                            className="pl-9 w-full sm:w-64"
                        />
                    </div>
                    <button
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-slate-900/10 whitespace-nowrap"
                        onClick={startAdd}
                    >
                        {React.createElement(Plus as any, { size: 16 })} Add Building
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <Building2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Buildings</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{buildings.length}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:bg-blue-50/10">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <Layers size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">L1 Buildings</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                        {buildings.filter(b => getLevel(b.code) === 1).length}
                    </div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <Home size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Floors</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {buildings.reduce((s, b) => s + (b.floor_count || 0), 0)}
                    </div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <Maximize2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Gross Area</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700 tabular-nums">
                        {buildings.reduce((s, b) => s + (b.gross_area_m2 || 0), 0).toLocaleString()} <span className="text-xs font-normal">m²</span>
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
                            {editingId ? 'Edit Building' : 'Add New Building'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Code *</label>
                            <Input value={form.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value })} placeholder="01 or 01.0100" className="font-mono" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Building Name *</label>
                            <Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Reactor Building" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Parent Code</label>
                            <Input value={form.parent_code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, parent_code: e.target.value })} placeholder="01" className="font-mono" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Floors</label>
                                <Input type="number" value={form.floor_count} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, floor_count: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Area (m²)</label>
                                <Input type="number" value={form.gross_area_m2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, gross_area_m2: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors" onClick={() => setShowForm(false)}>Cancel</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20" onClick={handleSave}>
                            {editingId ? 'Update Building' : 'Save Building'}
                        </button>
                    </div>
                </div>
            )}

            {/* List Table */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8"></div>
                        <span className="text-sm text-slate-400 animate-pulse">Loading buildings...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-6 py-4 w-32">Code</th>
                                    <th className="px-6 py-4">Building Structure</th>
                                    <th className="px-4 py-4 w-20 text-center">Level</th>
                                    <th className="px-4 py-4 w-32">Parent</th>
                                    <th className="px-4 py-4 w-24 text-right">Floors</th>
                                    <th className="px-4 py-4 w-32 text-right">Area (m²)</th>
                                    <th className="px-6 py-4 w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBuildings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <Building2 size={48} className="mb-4 text-slate-400" />
                                                <p className="font-semibold text-slate-600">No buildings matching criteria</p>
                                                <p className="text-sm mt-1">Try a different search or add a new building.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBuildings.map(b => {
                                        const level = getLevel(b.code)
                                        const indent = (level - 1) * 24
                                        return (
                                            <tr key={b.id} className="group hover:bg-blue-50/20 transition-all">
                                                <td className="px-6 py-4 font-mono font-bold text-slate-400 group-hover:text-blue-600 transition-colors">{b.code}</td>
                                                <td className="px-6 py-4">
                                                    <div style={{ paddingLeft: `${indent}px` }} className="flex items-center gap-2">
                                                        {level > 1 && <span className="text-slate-300 font-mono">└─</span>}
                                                        <span className={`text-sm font-semibold ${level === 1 ? 'text-slate-900' : 'text-slate-600'}`}>{b.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${level === 1 ? 'bg-emerald-100 text-emerald-700' :
                                                        level === 2 ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        L{level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 font-mono text-xs text-slate-400">{b.parent_code || '-'}</td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{b.floor_count || '-'}</td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{b.gross_area_m2?.toLocaleString() || '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <ActionButton icon={Edit2} onClick={() => startEdit(b)} />
                                                        <ActionButton icon={Trash2} color="red" onClick={() => handleDelete(b.id)} />
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

            {/* Info Card */}
            <div className="glass p-6 rounded-2xl border border-slate-200/60 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Info size={20} />
                </div>
                <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 text-sm">Building Code Hierarchy</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Codes follow a hierarchical pattern: <code className="bg-slate-100 px-1 rounded text-blue-600">01</code> is a root building (Level 1),
                        <code className="bg-slate-100 px-1 rounded text-blue-600">01.0100</code> is a section (Level 2), and
                        <code className="bg-slate-100 px-1 rounded text-blue-600">01.0101</code> is a sub-section (Level 3).
                        This hierarchy is visually represented in the table above.
                    </p>
                </div>
            </div>
        </div>
    )
}
