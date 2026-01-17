// UF Sheet - Unit Factor Library
// Standardized on the Cerrex Premium Design System
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import type { DDCategory, WasteCategory } from '@/lib/supabase/types'
import {
    Scale,
    Layers,
    Boxes,
    Info,
    Settings,
    Zap,
    Database,
    Activity,
    Box,
    ShieldCheck,
    Search
} from 'lucide-react'

const formatNumber = (value: number, decimals: number = 2) => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })
}

type Tab = 'd_and_d' | 'waste_management'

export default function UFPage() {
    const { currentProject } = useProject()
    const [activeTab, setActiveTab] = useState<Tab>('d_and_d')

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-3xl border border-white/40 shadow-xl">
                <Scale size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to analyze unit factors.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Unit Factor Library</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] opacity-70">
                        Performance Multipliers (Man-hours, Investment, Expenses)
                    </p>
                </div>

                <Link
                    href="/dashboard/lists"
                    className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white border border-slate-200/60 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 transition-all shadow-sm hover:shadow-md h-fit"
                >
                    <Settings size={14} />
                    Configure Categories
                </Link>
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex gap-2 p-1 glass rounded-2xl w-fit border border-slate-200/40 shadow-inner">
                <button
                    onClick={() => setActiveTab('d_and_d')}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-300
                        ${activeTab === 'd_and_d'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-y-[-1px]'
                            : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}
                    `}
                >
                    <Layers size={14} />
                    D&D PERFORMANCE
                </button>
                <button
                    onClick={() => setActiveTab('waste_management')}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-300
                        ${activeTab === 'waste_management'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 translate-y-[-1px]'
                            : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'}
                    `}
                >
                    <Boxes size={14} />
                    WASTE PROCESSING
                </button>
            </div>

            {/* Layout Wrapper */}
            <div className="glass-panel rounded-[2rem] border border-white/40 shadow-2xl overflow-hidden bg-white/30 backdrop-blur-md">
                <div className="p-8">
                    {activeTab === 'd_and_d' && <DDUnitFactorsTable projectId={currentProject.id} />}
                    {activeTab === 'waste_management' && <WMUnitFactorsTable projectId={currentProject.id} />}
                </div>

                {/* Legend / Support Section */}
                <div className="px-8 py-6 bg-slate-900/5 border-t border-white/40">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600">
                                    <Info size={16} />
                                </span>
                                <h5 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">
                                    Metric Definitions & Logic
                                </h5>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1 p-3 rounded-xl bg-white/20 border border-white/40">
                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Manpower UF</span>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">Required man-hours per specific unit (e.g., /t or /m2).</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-xl bg-white/20 border border-white/40">
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Investment UF</span>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">Amortized capital & tool costs per processed unit.</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-xl bg-white/20 border border-white/40">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Expenses UF</span>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">Direct consumables & energy costs per processed unit.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DDUnitFactorsTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [categories, setCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase
            .from('dd_categories')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true })

        if (data) setCategories(data)
        setLoading(false)
    }

    if (loading) return (
        <div className="p-32 flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={16} className="text-blue-600 animate-pulse" />
                </div>
            </div>
            <span className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Allocating Performance Data...</span>
        </div>
    )

    const typeGroups = [
        { key: 'workforce', name: 'Workforce Activities', icon: Activity, color: 'text-blue-500' },
        { key: 'general', name: 'General Equipment', icon: Settings, color: 'text-indigo-500' },
        { key: 'additional', name: 'Additional Activities', icon: Layers, color: 'text-emerald-500' },
        { key: 'specific', name: 'Specific Equipment', icon: Zap, color: 'text-amber-500' },
        { key: 'out_of_ca', name: 'Controlled Area Out', icon: ShieldCheck, color: 'text-slate-500' },
        { key: 'user_defined', name: 'Custom Definitions', icon: Box, color: 'text-rose-500' },
    ]

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
            {typeGroups.map(group => {
                const items = categories.filter(c => c.category_type === group.key)
                if (items.length === 0) return null
                const Icon = group.icon

                return (
                    <div key={group.key} className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3">
                            <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${group.color}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                    {group.name}
                                </h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                    {items.length} Metrics Defined
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200/40 bg-white/20">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4 w-24">Code</th>
                                        <th className="px-6 py-4">Metric / Category</th>
                                        <th className="px-6 py-4 w-24 text-center">Unit</th>
                                        <th className="px-6 py-4 w-32 text-right">Manpower</th>
                                        <th className="px-6 py-4 w-32 text-right">Investment</th>
                                        <th className="px-6 py-4 w-32 text-right">Expenses</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/30">
                                    {items.map((cat) => (
                                        <tr key={cat.id} className="group hover:bg-white/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-black text-[10px] text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">
                                                    {cat.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">
                                                        {cat.abbreviation}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 border border-slate-200/50">
                                                    {cat.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono text-xs text-slate-500 tabular-nums">
                                                    {formatNumber(cat.manpower_uf)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono text-xs text-slate-500 tabular-nums">
                                                    {formatNumber(cat.investment_uf)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono text-xs font-black text-slate-900 tabular-nums">
                                                    {formatNumber(cat.expenses_uf)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })}

            {categories.length === 0 && (
                <div className="p-20 text-center glass rounded-2xl bg-white/10">
                    <Database size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-50">
                        Performance Repository Empty
                    </p>
                </div>
            )}
        </div>
    )
}

function WMUnitFactorsTable({ projectId }: { projectId: string }) {
    const supabase = createClient()
    const [categories, setCategories] = useState<WasteCategory[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [projectId])

    async function loadData() {
        setLoading(true)
        const { data } = await supabase
            .from('waste_categories')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true })

        if (data) setCategories(data)
        setLoading(false)
    }

    if (loading) return (
        <div className="p-32 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Mapping Waste Streams...</span>
        </div>
    )

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Boxes size={20} />
                </div>
                <div>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                        Waste Stream Performance Matrix
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        {categories.length} Process Segments Defined
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200/40 bg-white/20">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-4 w-24">Code</th>
                            <th className="px-6 py-4">Segment Nomenclature</th>
                            <th className="px-6 py-4 w-32 text-center">ISDC Mapping</th>
                            <th className="px-6 py-4 w-32 text-right">Manpower</th>
                            <th className="px-6 py-4 w-32 text-right">Investment</th>
                            <th className="px-6 py-4 w-32 text-right">Expenses</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/30">
                        {categories.map((cat) => (
                            <tr key={cat.id} className="group hover:bg-white/40 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-mono font-black text-[10px] text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg">
                                        {cat.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                                        {cat.isdc_code_primary || '---'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                                        {formatNumber(cat.manpower_uf)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                                        {formatNumber(cat.investment_uf)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-mono text-xs font-black text-slate-900 tabular-nums">
                                        {formatNumber(cat.expenses_uf)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {categories.length === 0 && (
                <div className="p-20 text-center glass rounded-2xl bg-white/10">
                    <Database size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-50">
                        No Waste Segments Defined
                    </p>
                </div>
            )}
        </div>
    )
}
