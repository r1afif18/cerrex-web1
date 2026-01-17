// CTGR Sheet - D&D and Waste Categories
// PRD Section 11: 51 D&D Categories (INV1-51) + WM Categories

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    ListFilter,
    Library,
    Layers,
    Database,
    Zap,
    Box,
    Activity,
    Scale,
    ShieldCheck,
    ChevronRight,
    Search,
    Info,
    LayoutList,
    Boxes,
    Settings
} from 'lucide-react'
import Link from 'next/link'

interface DDCategory {
    id: string
    project_id: string
    code: string
    name: string
    unit: string
    abbreviation: string
    category_type: string
    manpower_uf: number
    investment_uf: number
    expenses_uf: number
    sort_order: number
}

interface WasteCategory {
    id: string
    project_id: string
    code: string
    name: string
    isdc_code_primary: string
    isdc_code_secondary: string
    manpower_uf: number
    investment_uf: number
    expenses_uf: number
}

// Default D&D categories based on PRD if none in DB
const DEFAULT_DD_CATEGORIES = [
    { code: 'INV1', name: 'Workforce in controlled area', unit: '[man.h]', abbr: 'WFCA' },
    { code: 'INV2', name: 'General technological equipment', unit: '[t]', abbr: 'GNEQ' },
    { code: 'INV3', name: 'Massive thick wall equipment', unit: '[t]', abbr: 'MTHE' },
    { code: 'INV4', name: 'Auxiliary thin wall equipment', unit: '[t]', abbr: 'ATHE' },
    { code: 'INV5', name: 'Small core components (<50 kg)', unit: '[t]', abbr: 'SCRC' },
    { code: 'INV6', name: 'Medium core components (50-200 kg)', unit: '[t]', abbr: 'MCRC' },
    { code: 'INV7', name: 'Large reactor components (>200 kg)', unit: '[t]', abbr: 'LRCP' },
    { code: 'INV8', name: 'Massive concrete in controlled area', unit: '[t]', abbr: 'MCCA' },
    { code: 'INV9', name: 'Graphite elements, thermal columns', unit: '[t]', abbr: 'GRPH' },
    { code: 'INV10', name: 'Low density & specific materials', unit: '[t]', abbr: 'LDSM' },
    { code: 'INV21', name: 'Piping, valves, pumps', unit: '[t]', abbr: 'PIVA' },
    { code: 'INV22', name: 'Tanks, heat exchangers', unit: '[t]', abbr: 'THEX' },
    { code: 'INV23', name: 'Steel linings', unit: '[t]', abbr: 'STLN' },
    { code: 'INV24', name: 'Ventilation & thin wall equipment', unit: '[t]', abbr: 'VTNE' },
    { code: 'INV25', name: 'Handling equipment', unit: '[t]', abbr: 'HNDE' },
]

export default function CTGRPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [wasteCategories, setWasteCategories] = useState<WasteCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'dd' | 'wm'>('dd')

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)

        const [ddRes, wmRes] = await Promise.all([
            supabase.from('dd_categories').select('*').eq('project_id', currentProject.id).order('code'),
            supabase.from('waste_categories').select('*').eq('project_id', currentProject.id).order('code'),
        ])

        if (ddRes.data) setDDCategories(ddRes.data)
        if (wmRes.data) setWasteCategories(wmRes.data)
        setLoading(false)
    }, [currentProject, supabase])

    useEffect(() => { loadData() }, [loadData])

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <ListFilter size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to view category definitions.</p>
            </div>
        )
    }

    // Show default categories if none in DB for initial view
    const displayDDCategories = ddCategories.length > 0 ? ddCategories : DEFAULT_DD_CATEGORIES.map((c, i) => ({
        id: `default-${i}`, project_id: '', code: c.code, name: c.name, unit: c.unit,
        abbreviation: c.abbr, category_type: 'D&D', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: i
    }))

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Category Definitions</h1>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] italic md:not-italic">D&D (INV1-51) and Waste Management Hierarchy</p>
            </div>

            {/* Modern Tab Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2 p-1 glass rounded-xl w-fit border border-slate-200/60 italic md:not-italic">
                    <button
                        onClick={() => setActiveTab('dd')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                            ${activeTab === 'dd' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                        `}
                    >
                        <Library size={16} />
                        D&D Categories
                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'dd' ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                            {displayDDCategories.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('wm')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all
                            ${activeTab === 'wm' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                        `}
                    >
                        <Boxes size={16} />
                        Waste Management
                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'wm' ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                            {wasteCategories.length}
                        </span>
                    </button>
                </div>

                <Link
                    href="/dashboard/lists"
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 bg-white/50 px-3 py-1.5 rounded-lg border border-blue-100/50 hover:bg-white transition-all w-fit"
                >
                    <Settings size={12} />
                    Manage Categories
                </Link>
            </div>

            {/* Content Table Container */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm italic md:not-italic">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 italic md:not-italic">
                        {activeTab === 'dd' ? <Activity size={16} className="text-blue-500" /> : <Database size={16} className="text-emerald-500" />}
                        {activeTab === 'dd' ? 'Inventory Categories & Unit Factors' : 'Waste Stream Classifications'}
                    </h3>
                </div>

                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4 italic md:not-italic">
                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8 italic md:not-italic"></div>
                        <span className="text-sm text-slate-400 italic">Reading classification database...</span>
                    </div>
                ) : activeTab === 'dd' ? (
                    <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                        <table className="w-full text-left border-collapse min-w-[900px] italic md:not-italic">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 italic md:not-italic">
                                    <th className="px-6 py-4 w-24 text-center italic">Code</th>
                                    <th className="px-4 py-4 w-24 italic">Abbr</th>
                                    <th className="px-4 py-4 italic">Full Nomenclature</th>
                                    <th className="px-4 py-4 w-24 text-center italic">Unit</th>
                                    <th className="px-4 py-4 w-32 text-right italic">Manpower UF</th>
                                    <th className="px-4 py-4 w-32 text-right italic">Investment</th>
                                    <th className="px-6 py-4 w-32 text-right italic">Expenses</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                                {displayDDCategories.map((cat) => (
                                    <tr key={cat.id} className="group hover:bg-slate-50/50 transition-all italic md:not-italic">
                                        <td className="px-6 py-3.5 text-center font-mono font-black text-xs text-blue-600 italic md:not-italic">
                                            {cat.code}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400 font-bold italic md:not-italic">
                                            {cat.abbreviation}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm font-bold text-slate-700 italic md:not-italic">
                                            {cat.name}
                                        </td>
                                        <td className="px-4 py-3.5 text-center italic md:not-italic">
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 italic md:not-italic">{cat.unit.replace('[', '').replace(']', '')}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{cat.manpower_uf}</td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{cat.investment_uf}</td>
                                        <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-900 font-black tabular-nums italic md:not-italic">{cat.expenses_uf}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                        {wasteCategories.length === 0 ? (
                            <div className="p-20 text-center italic md:not-italic">
                                <Box size={40} className="text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 text-sm">No waste categories defined for this project.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[1000px] italic md:not-italic">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 italic md:not-italic">
                                        <th className="px-6 py-4 w-24 text-center italic">Code</th>
                                        <th className="px-4 py-4 italic">Waste Classification Name</th>
                                        <th className="px-4 py-4 w-32 text-center italic">ISDC Primary</th>
                                        <th className="px-4 py-4 w-32 text-center italic">ISDC Second</th>
                                        <th className="px-4 py-4 w-32 text-right italic">Manpower UF</th>
                                        <th className="px-4 py-4 w-32 text-right italic">Investment</th>
                                        <th className="px-6 py-4 w-32 text-right italic">Expenses</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                                    {wasteCategories.map((cat) => (
                                        <tr key={cat.id} className="group hover:bg-slate-50/50 transition-all italic md:not-italic">
                                            <td className="px-6 py-3.5 text-center font-mono font-black text-xs text-emerald-600 italic md:not-italic">
                                                {cat.code}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm font-bold text-slate-700 italic md:not-italic">
                                                {cat.name}
                                            </td>
                                            <td className="px-4 py-3.5 text-center italic md:not-italic">
                                                <span className="font-mono text-[10px] text-slate-400 font-bold italic md:not-italic">{cat.isdc_code_primary || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center italic md:not-italic">
                                                <span className="font-mono text-[10px] text-slate-400 font-bold italic md:not-italic">{cat.isdc_code_secondary || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{cat.manpower_uf}</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{cat.investment_uf}</td>
                                            <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-900 font-black tabular-nums italic md:not-italic">{cat.expenses_uf}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Logical Hierarchy Documentation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 italic md:not-italic">
                <div className="glass p-6 rounded-2xl border border-amber-500/10 italic md:not-italic">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[10px] mb-4 italic md:not-italic">
                        <ShieldCheck size={14} className="text-amber-500" />
                        PRD Section 11 - D&D Structure
                    </h5>
                    <div className="space-y-3">
                        <div className="flex items-start gap-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"></span>
                            <p className="text-[10px] text-slate-500 italic md:not-italic">
                                <span className="font-bold text-slate-700 italic md:not-italic">INV1-INV13:</span> General technological equipment and massive components.
                            </p>
                        </div>
                        <div className="flex items-start gap-4 italic md:not-italic">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 italic md:not-italic"></span>
                            <p className="text-[10px] text-slate-500 italic md:not-italic">
                                <span className="font-bold text-slate-700 italic md:not-italic">INV14-INV20:</span> Additional workforce and support activities as per ISDC standard.
                            </p>
                        </div>
                        <div className="flex items-start gap-4 italic md:not-italic">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 italic md:not-italic"></span>
                            <p className="text-[10px] text-slate-500 italic md:not-italic">
                                <span className="font-bold text-slate-700 italic md:not-italic">INV21-INV36:</span> Specific D&D equipment including piping, tanks, and handling machines.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-blue-500/10 italic md:not-italic">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider text-[10px] mb-4 italic md:not-italic">
                        <Info size={14} className="text-blue-500" />
                        Category Management
                    </h5>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic md:not-italic">
                        These categories serve as the baseline for the <span className="font-bold text-blue-600 italic md:not-italic">Unit Factor (UF)</span> library.
                        Each inventory item must be mapped to exactly one classification code to trigger the correct cost multiplier sequence.
                        Category definitions are project-specific and synchronized with the project's reference currencies.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3 italic md:not-italic">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse italic md:not-italic"></div>
                        <span className="text-[10px] font-bold text-blue-800 italic md:not-italic">System-seeded defaults active</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
