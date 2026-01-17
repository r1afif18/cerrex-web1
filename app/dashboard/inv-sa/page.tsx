// INV SA Sheet - Inventory Sensitivity Analysis
// PRD Section 10: Sensitivity analysis with multipliers

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Microscope,
    Settings2,
    Activity,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Zap,
    Scale,
    Info,
    ArrowRight,
    PieChart,
    BarChart3
} from 'lucide-react'

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
    contingency_rate: number
}

interface DDQuantity {
    inventory_item_id: string
    dd_category_code: string
    quantity: number
}

interface DDCategory {
    code: string
    investment_uf: number
    expenses_uf: number
}

function calcTotalWF(item: InventoryItem): number {
    const wdfSum = (item.wdf_f1 || 0) + (item.wdf_f2 || 0) + (item.wdf_f3 || 0) +
        (item.wdf_f4 || 0) + (item.wdf_f5 || 0) + (item.wdf_f6 || 0) + (item.wdf_f7 || 0)
    return (item.basic_workforce || 0) * (100 + wdfSum) / 100
}

// Sensitivity factors from PRD
const SENSITIVITY_FACTORS = [
    { label: '-50%', factor: 0.50, color: 'from-rose-500 to-rose-600' },
    { label: '-25%', factor: 0.75, color: 'from-orange-400 to-orange-500' },
    { label: 'Base', factor: 1.00, color: 'from-emerald-500 to-emerald-600' },
    { label: '+25%', factor: 1.25, color: 'from-blue-500 to-blue-600' },
    { label: '+50%', factor: 1.50, color: 'from-indigo-600 to-indigo-700' },
]

const ANALYSIS_PARAMETERS = [
    { key: 'labourRate', name: 'Labour Rate', unit: 'per hour', icon: Zap },
    { key: 'unitFactor', name: 'Unit Factors', unit: '% change', icon: Scale },
    { key: 'contingency', name: 'Contingency Rate', unit: '% rate', icon: Activity },
    { key: 'wdf', name: 'Work Difficulty', unit: 'multiplier', icon: Settings2 },
]

export default function INVSAPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedParam, setSelectedParam] = useState('labourRate')

    const baseLabourRate = currentProject?.reference_labour_rate || 50
    const currency = currentProject?.reference_currency || 'USD'

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)

        const [invRes, qtyRes, catRes] = await Promise.all([
            supabase.from('inventory_items').select('*').eq('project_id', currentProject.id).eq('is_activated', true),
            supabase.from('inventory_dd_quantities').select('*'),
            supabase.from('dd_categories').select('*').eq('project_id', currentProject.id),
        ])

        if (invRes.data) {
            setInvItems(invRes.data)
            if (qtyRes.data) {
                const itemIds = new Set(invRes.data.map(i => i.id))
                setDDQuantities(qtyRes.data.filter(q => itemIds.has(q.inventory_item_id)))
            }
        }
        if (catRes.data) setDDCategories(catRes.data)
        setLoading(false)
    }, [currentProject, supabase])

    useEffect(() => { loadData() }, [loadData])

    const getUF = useCallback((code: string): DDCategory => {
        return ddCategories.find(c => c.code === code) || { code, investment_uf: 0, expenses_uf: 0 }
    }, [ddCategories])

    // Calculate base cost
    const baseCosts = useMemo(() => {
        let workforce = 0, labour = 0, investment = 0, expenses = 0, contingency = 0

        invItems.forEach(item => {
            const wf = calcTotalWF(item)
            workforce += wf

            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let itemInv = 0, itemExp = 0
            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                itemInv += q.quantity * (uf.investment_uf || 0)
                itemExp += q.quantity * (uf.expenses_uf || 0)
            })

            const itemLabour = wf * baseLabourRate
            const itemCont = (itemLabour + itemInv + itemExp) * ((item.contingency_rate || 10) / 100)

            labour += itemLabour
            investment += itemInv
            expenses += itemExp
            contingency += itemCont
        })

        return { workforce, labour, investment, expenses, contingency, total: labour + investment + expenses + contingency }
    }, [invItems, ddQuantities, getUF, baseLabourRate])

    // Calculate sensitivity for selected parameter
    const sensitivityResults = useMemo(() => {
        return SENSITIVITY_FACTORS.map(sf => {
            let adjustedTotal = 0

            if (selectedParam === 'labourRate') {
                const adjustedLabour = baseCosts.labour * sf.factor
                adjustedTotal = adjustedLabour + baseCosts.investment + baseCosts.expenses +
                    (adjustedLabour + baseCosts.investment + baseCosts.expenses) * 0.1
            } else if (selectedParam === 'unitFactor') {
                const adjustedInv = baseCosts.investment * sf.factor
                const adjustedExp = baseCosts.expenses * sf.factor
                adjustedTotal = baseCosts.labour + adjustedInv + adjustedExp +
                    (baseCosts.labour + adjustedInv + adjustedExp) * 0.1
            } else if (selectedParam === 'contingency') {
                const baseWithoutCont = baseCosts.labour + baseCosts.investment + baseCosts.expenses
                const adjustedCont = baseWithoutCont * (0.1 * sf.factor)
                adjustedTotal = baseWithoutCont + adjustedCont
            } else if (selectedParam === 'wdf') {
                const adjustedWorkforce = baseCosts.workforce * sf.factor
                const adjustedLabour = adjustedWorkforce * baseLabourRate
                adjustedTotal = adjustedLabour + baseCosts.investment + baseCosts.expenses +
                    (adjustedLabour + baseCosts.investment + baseCosts.expenses) * 0.1
            }

            const diff = adjustedTotal - baseCosts.total
            const pctDiff = baseCosts.total > 0 ? (diff / baseCosts.total * 100) : 0

            return { ...sf, total: adjustedTotal, diff, pctDiff }
        })
    }, [baseCosts, selectedParam, baseLabourRate])

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Microscope size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to analyze sensitivity.</p>
            </div>
        )
    }

    const formatCost = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
        return val.toFixed(0)
    }

    const maxTotal = Math.max(...sensitivityResults.map(r => r.total))

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sensitivity Analysis</h1>
                <p className="text-slate-500 mt-1">Simulate cost impact by varying key performance parameters.</p>
            </div>

            {/* Base Cost Detail Panel */}
            <div className="glass p-6 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <PieChart size={120} className="text-slate-900" />
                </div>

                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Activity size={12} className="text-blue-500" />
                    Reference (Base) Cost Profile
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Labour</span>
                        <div className="text-lg font-black text-slate-800 tabular-nums">{formatCost(baseCosts.labour)}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Investment</span>
                        <div className="text-lg font-black text-slate-800 tabular-nums">{formatCost(baseCosts.investment)}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Expenses</span>
                        <div className="text-lg font-black text-slate-800 tabular-nums">{formatCost(baseCosts.expenses)}</div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contingency</span>
                        <div className="text-lg font-black text-slate-800 tabular-nums">{formatCost(baseCosts.contingency)}</div>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl ring-1 ring-emerald-100 flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Base Total</span>
                        <div className="text-xl font-black text-emerald-700 tabular-nums">{formatCost(baseCosts.total)} <span className="text-xs font-normal opacity-60 ml-0.5">{currency}</span></div>
                    </div>
                </div>
            </div>

            {/* Parameter Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 italic md:not-italic">
                {ANALYSIS_PARAMETERS.map(param => {
                    const isActive = selectedParam === param.key
                    const Icon = param.icon
                    return (
                        <button
                            key={param.key}
                            onClick={() => setSelectedParam(param.key)}
                            className={`p-4 rounded-xl border transition-all text-left flex items-start gap-4 relative overflow-hidden group
                                ${isActive ? 'glass-panel border-blue-500/30 ring-1 ring-blue-500/10 shadow-lg' : 'glass border-slate-200/60 hover:bg-white/50 hover:shadow-md'}
                            `}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}
                            `}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-bold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{param.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">{param.unit}</p>
                            </div>
                            {isActive && (
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <span className="text-[8px] font-bold text-blue-600 uppercase">Selected</span>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Simulation Results (Tornado Chart Style) */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-500" />
                        Cost Sensitivity Visualization
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic md:not-italic">
                        Parameter: <span className="text-blue-600 uppercase">{ANALYSIS_PARAMETERS.find(p => p.key === selectedParam)?.name}</span>
                    </div>
                </div>

                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4">
                        <div className="spinner border-slate-200 border-t-blue-600"></div>
                        <span className="text-sm text-slate-400">Recalculating models...</span>
                    </div>
                ) : (
                    <div className="p-8 space-y-8">
                        {/* The Tornado Bars */}
                        <div className="space-y-4">
                            {sensitivityResults.map(result => {
                                const barWidth = maxTotal > 0 ? (result.total / maxTotal * 100) : 0
                                const isBase = result.factor === 1.0
                                const isPositive = result.diff >= 0
                                return (
                                    <div key={result.label} className={`flex items-center gap-6 group transition-all ${isBase ? 'py-4' : ''}`}>
                                        <div className={`w-14 text-right font-bold transition-colors ${isBase ? 'text-slate-900 text-sm' : 'text-slate-400 text-xs'}`}>
                                            {result.label}
                                        </div>
                                        <div className="flex-1 relative h-8 flex items-center">
                                            {/* Bar Background */}
                                            <div className="absolute inset-0 bg-slate-50/50 rounded-lg -z-10 ring-1 ring-slate-100/50"></div>

                                            {/* Data Bar */}
                                            <div
                                                className={`h-6 rounded-md bg-gradient-to-r ${result.color} shadow-lg shadow-blue-500/5 transition-all duration-1000 flex items-center justify-end px-3 relative
                                                    ${isBase ? 'ring-2 ring-slate-900/10 ring-offset-2' : ''}
                                                `}
                                                style={{ width: `${barWidth}%` }}
                                            >
                                                {barWidth > 20 && (
                                                    <span className="text-white text-[10px] font-black tabular-nums">{formatCost(result.total)}</span>
                                                )}
                                                {isBase && (
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                                        <span className="text-[8px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm">BASE PROJECT COST</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-32 flex flex-col items-end">
                                            <div className={`text-xs font-black tabular-nums ${isPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {isPositive ? <TrendingUp size={10} className="inline mr-1" /> : <TrendingDown size={10} className="inline mr-1" />}
                                                {isPositive ? '+' : ''}{formatCost(result.diff)}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {result.pctDiff >= 0 ? '+' : ''}{result.pctDiff.toFixed(1)}% variance
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Analysis Table */}
                        <div className="pt-8 border-t border-slate-100 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="px-4 py-3">Simulation Case</th>
                                        <th className="px-4 py-3 text-center">Multiplier</th>
                                        <th className="px-4 py-3 text-right">Project Total</th>
                                        <th className="px-4 py-3 text-right">Delta ({currency})</th>
                                        <th className="px-4 py-3 text-right">Impact %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sensitivityResults.map(result => {
                                        const isBase = result.factor === 1.0
                                        return (
                                            <tr key={result.label} className={`border-t border-slate-50 transition-colors ${isBase ? 'bg-emerald-50/10' : 'hover:bg-slate-50/50'}`}>
                                                <td className={`px-4 py-3 text-xs font-bold ${isBase ? 'text-emerald-700' : 'text-slate-600'}`}>{result.label} Simulation</td>
                                                <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">{result.factor.toFixed(2)}x</td>
                                                <td className={`px-4 py-3 text-right font-black text-xs tabular-nums ${isBase ? 'text-emerald-700' : 'text-slate-800'}`}>
                                                    {formatCost(result.total)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono text-xs ${result.diff >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {result.diff >= 0 ? '+' : ''}{formatCost(result.diff)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isBase ? 'bg-emerald-100 text-emerald-700' :
                                                            result.pctDiff >= 10 ? 'bg-rose-100 text-rose-700' :
                                                                result.pctDiff <= -10 ? 'bg-emerald-100 text-emerald-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {result.pctDiff >= 0 ? '+' : ''}{result.pctDiff.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Theoretical Background */}
            <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-2xl border border-slate-200/60 text-xs text-slate-500 italic md:not-italic">
                <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Info size={14} className="text-blue-500" />
                        PRD Sensitivity Logic
                    </h5>
                    <p className="leading-relaxed">
                        Simulation maps a ±50% range around the base project parameters. This identifies <span className="text-blue-600 font-bold uppercase tracking-tight">Critical Cost Drivers</span>
                        where small changes in efficiency or market rates can disproportionately affect the total decommissioning liability.
                    </p>
                </div>
                <div className="flex-1 p-4 bg-orange-50/30 rounded-xl border border-orange-100/50 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <h6 className="font-bold text-orange-800 text-[10px] uppercase tracking-wider mb-1">Risk Assessment</h6>
                        <p className="text-[10px] text-orange-700/80 leading-snug">
                            Parameters with vertical spreads in the tornado chart represent the highest project risk factors.
                            Contingency planning should focus primarily on these areas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
