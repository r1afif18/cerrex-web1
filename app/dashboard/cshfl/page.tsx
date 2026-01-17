// CSHFL Sheet - Cash Flow
// PRD Section 10: 30x63 - Cash flow projections with inflation

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    TrendingUp,
    Coins,
    BarChart,
    Calendar,
    ArrowUpRight,
    Info,
    ArrowRight,
    Search,
    ChevronRight,
    Database,
    LineChart
} from 'lucide-react'

interface ScheduleActivity {
    id: string
    isdc_l2_code: string
    start_year: number
    duration_user: number | null
    working_groups: number
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

export default function CSHFLPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [activities, setActivities] = useState<ScheduleActivity[]>([])
    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [inflationRate, setInflationRate] = useState(0.02)

    const referenceYear = currentProject?.reference_year || 2020
    const labourRate = currentProject?.reference_labour_rate || 50
    const currency = currentProject?.reference_currency || 'USD'
    const workingHoursPerYear = currentProject?.working_hours_per_year || 1800

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)

        const [actRes, invRes, qtyRes, catRes] = await Promise.all([
            supabase.from('schedule_activities').select('*').eq('project_id', currentProject.id).order('start_year'),
            supabase.from('inventory_items').select('*').eq('project_id', currentProject.id).eq('is_activated', true),
            supabase.from('inventory_dd_quantities').select('*'),
            supabase.from('dd_categories').select('*').eq('project_id', currentProject.id),
        ])

        if (actRes.data) setActivities(actRes.data)
        if (invRes.data) {
            setInvItems(invRes.data)
            if (qtyRes.data) {
                const itemIds = new Set(invRes.data.map(i => i.id))
                setDDQuantities(qtyRes.data.filter(q => itemIds.has(q.inventory_item_id)))
            }
        }
        if (catRes.data) setDDCategories(catRes.data)
        if (currentProject.inflation_rate) setInflationRate(currentProject.inflation_rate)
        setLoading(false)
    }, [currentProject, supabase])

    useEffect(() => { loadData() }, [loadData])

    const getUF = useCallback((code: string): DDCategory => {
        return ddCategories.find(c => c.code === code) || { code, investment_uf: 0, expenses_uf: 0 }
    }, [ddCategories])

    // Calculate cost per L2 code
    const costsByL2 = useMemo(() => {
        const costs: Record<string, { workforce: number, total: number }> = {}

        invItems.forEach(item => {
            const l2 = (item.isdc_l3_code || 'XX.XX').substring(0, 5)
            if (!costs[l2]) costs[l2] = { workforce: 0, total: 0 }

            const wf = calcTotalWF(item)
            costs[l2].workforce += wf

            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let investment = 0, expenses = 0
            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                investment += q.quantity * (uf.investment_uf || 0)
                expenses += q.quantity * (uf.expenses_uf || 0)
            })

            const labour = wf * labourRate
            const contingency = (labour + investment + expenses) * ((item.contingency_rate || 10) / 100)
            costs[l2].total += labour + investment + expenses + contingency
        })

        return costs
    }, [invItems, ddQuantities, getUF, labourRate])

    // Calculate cash flow per year based on schedule
    const cashFlowByYear = useMemo(() => {
        const flow: Record<number, { refCost: number, activities: string[] }> = {}

        activities.forEach(act => {
            const l2Cost = costsByL2[act.isdc_l2_code]
            if (!l2Cost) return

            const wf = l2Cost.workforce
            const dur = act.duration_user && act.duration_user > 0 ? act.duration_user :
                wf > 0 ? wf / (act.working_groups * workingHoursPerYear) : 1
            const durationYears = Math.ceil(dur)
            const costPerYear = l2Cost.total / durationYears

            for (let i = 0; i < durationYears; i++) {
                const year = act.start_year + i
                if (!flow[year]) flow[year] = { refCost: 0, activities: [] }
                flow[year].refCost += costPerYear
                if (!flow[year].activities.includes(act.isdc_l2_code)) {
                    flow[year].activities.push(act.isdc_l2_code)
                }
            }
        })

        return flow
    }, [activities, costsByL2, workingHoursPerYear])

    // Get years array sorted
    const years = useMemo(() => {
        const yearSet = new Set(Object.keys(cashFlowByYear).map(Number))
        if (yearSet.size === 0) {
            // Default range if no schedule
            for (let y = referenceYear; y <= referenceYear + 10; y++) yearSet.add(y)
        }
        return Array.from(yearSet).sort((a, b) => a - b)
    }, [cashFlowByYear, referenceYear])

    // Calculate nominal costs with inflation
    const cashFlowData = useMemo(() => {
        let cumulativeRef = 0
        let cumulativeNominal = 0

        return years.map(year => {
            const data = cashFlowByYear[year] || { refCost: 0, activities: [] }
            const yearsFromRef = year - referenceYear
            const nominalCost = data.refCost * Math.pow(1 + inflationRate, yearsFromRef)

            cumulativeRef += data.refCost
            cumulativeNominal += nominalCost

            return {
                year,
                refCost: data.refCost,
                cumulativeRef,
                nominalCost,
                cumulativeNominal,
                activities: data.activities.length,
            }
        })
    }, [years, cashFlowByYear, inflationRate, referenceYear])

    // Totals
    const totals = useMemo(() => {
        const last = cashFlowData[cashFlowData.length - 1] || { cumulativeRef: 0, cumulativeNominal: 0 }
        return { totalRef: last.cumulativeRef, totalNominal: last.cumulativeNominal }
    }, [cashFlowData])

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Coins size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to view cash flow.</p>
            </div>
        )
    }

    const formatCost = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
        return val.toFixed(0)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cash Flow Projections</h1>
                <p className="text-slate-500 mt-1">Projected expenditure across project timeline (Excel Section 10).</p>
            </div>

            {/* Summary & Control Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl border border-slate-200/60 transition-all hover:bg-white/50">
                    <div className="flex items-center gap-3 mb-3 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Reference Year</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{referenceYear}</div>
                </div>

                <div className="glass p-5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 text-emerald-600">
                            <TrendingUp size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Inflation Rate</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">{(inflationRate * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" min={0} max={10} step={0.5} value={inflationRate * 100}
                        onChange={e => setInflationRate(parseFloat(e.target.value) / 100)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all" />
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                        <span>0%</span>
                        <span>Adjustable</span>
                        <span>10%</span>
                    </div>
                </div>

                <div className="glass p-5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-3 text-slate-400">
                        <Database size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total (Ref Year)</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">{formatCost(totals.totalRef)}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{currency}</div>
                </div>

                <div className="bg-slate-900 p-5 rounded-xl shadow-xl shadow-slate-900/10 ring-1 ring-white/10 relative overflow-hidden">
                    {/* Background indicator */}
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 pointer-events-none">
                        <TrendingUp size={80} className="text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Coins size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Total Nominal</span>
                            </div>
                            {totals.totalRef > 0 && (
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                    <ArrowUpRight size={10} />
                                    +{((totals.totalNominal / totals.totalRef - 1) * 100).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-black text-white tabular-nums">{formatCost(totals.totalNominal)}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{currency}</div>
                    </div>
                </div>
            </div>

            {/* Cash Flow Detailed View */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <LineChart size={16} className="text-blue-500" />
                        Annual Cash Flow Distributions
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <BarChart size={12} />
                        Visual Distribution
                    </div>
                </div>

                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4">
                        <div className="spinner border-slate-200 border-t-blue-600"></div>
                        <span className="text-sm text-slate-400">Projecting flows...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-6 py-4 w-24">Year</th>
                                    <th className="px-4 py-4 w-20 text-center">Acts</th>
                                    <th className="px-4 py-4 text-right">Ref. Cost</th>
                                    <th className="px-4 py-4 text-right text-slate-300">Cumul. Ref</th>
                                    <th className="px-4 py-4 text-right bg-blue-50/30 text-blue-700">Nominal Cost</th>
                                    <th className="px-4 py-4 text-right bg-blue-50/30 text-blue-700">Cumul. Nom</th>
                                    <th className="px-6 py-4 w-40">Load Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cashFlowData.map(row => {
                                    const maxRef = Math.max(...cashFlowData.map(r => r.refCost))
                                    const barWidth = maxRef > 0 ? (row.refCost / maxRef * 100) : 0
                                    return (
                                        <tr key={row.year} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50 italic md:not-italic">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-900">{row.year}</span>
                                                    {row.activities > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${row.activities > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-300'
                                                    }`}>
                                                    {row.activities || '0'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-600 font-semibold">{row.refCost > 0 ? formatCost(row.refCost) : '-'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-[10px] text-slate-300">{row.cumulativeRef > 0 ? formatCost(row.cumulativeRef) : '-'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-blue-700 font-bold bg-blue-50/10 italic md:not-italic">
                                                {row.nominalCost > 0 ? formatCost(row.nominalCost) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-[10px] text-blue-400 bg-blue-50/10 italic md:not-italic">
                                                {row.cumulativeNominal > 0 ? formatCost(row.cumulativeNominal) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.5)]`}
                                                            style={{ width: `${barWidth}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 tabular-nums w-8">{barWidth.toFixed(0)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900 text-white font-bold italic md:not-italic">
                                    <td colSpan={2} className="px-6 py-5 text-[10px] uppercase tracking-widest text-slate-500 italic">Project Final Totals</td>
                                    <td className="px-4 py-5 text-right font-mono text-sm">{formatCost(totals.totalRef)}</td>
                                    <td></td>
                                    <td colSpan={2} className="px-4 py-5 text-right font-mono text-lg text-amber-400 bg-white/5">
                                        {formatCost(totals.totalNominal)}
                                        <div className="text-[9px] font-medium text-slate-500 tracking-normal mt-1 uppercase italic">Nominal Final Cost ({currency})</div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Formulas Info Panel */}
            <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-2xl border border-slate-200/60 text-xs text-slate-500 italic md:not-italic">
                <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Info size={14} className="text-blue-500" />
                        Economic Formula (PRD Section 10)
                    </h5>
                    <p className="leading-relaxed">
                        Cash flow assumes linear distribution of activity costs over their scheduled years.
                        <br />
                        <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block text-[10px]">
                            Nominal (y) = Ref Cost (y) × (1 + Inflation)^{'{'}y - Ref Year{'}'}
                        </span>
                    </p>
                </div>
                <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Search size={14} className="text-blue-500" />
                        Audit Trail
                    </h5>
                    <div className="space-y-1.5 font-medium text-[10px]">
                        <div className="flex items-center gap-2">
                            <ArrowRight size={10} className="text-slate-300" />
                            <span>Costs linked from <span className="text-blue-600">ISDC Sheet</span> aggregating Inventory data</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowRight size={10} className="text-slate-300" />
                            <span>Phasing derived from <span className="text-blue-600">SCHDL Sheet</span> timeline</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
