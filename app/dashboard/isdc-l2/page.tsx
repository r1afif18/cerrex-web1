// ISDC L2 Report - Sub-Activity Level
// PRD Section 7

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Rows,
    Layers,
    BarChart3,
    CircleDollarSign,
    Users,
    ChevronDown,
    ChevronRight,
    Search,
    Info,
    LayoutGrid,
    Filter
} from 'lucide-react'

interface InventoryItem {
    id: string
    isdc_l3_code: string
    is_activated: boolean
    basic_workforce: number
    wdf_f1: number
    wdf_f2: number
    wdf_f3: number
    wdf_f4: number
    wdf_f5: number
    wdf_f6: number
    wdf_f7: number
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

const L1_NAMES: Record<string, string> = {
    '01': 'Pre-decommissioning', '02': 'Facility shutdown', '03': 'Safe enclosure',
    '04': 'Dismantling controlled area', '05': 'Waste management', '06': 'Site infrastructure',
    '07': 'Conventional dismantling', '08': 'Project management', '09': 'R&D',
    '10': 'Fuel & nuclear material', '11': 'Miscellaneous',
}

export default function ISDCL2Page() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showEmpty, setShowEmpty] = useState(false)
    const [expandedL1, setExpandedL1] = useState<string[]>([])

    const labourRate = currentProject?.reference_labour_rate || 50
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

    // Aggregate by L2 code (XX.YY)
    const costsByL2 = useMemo(() => {
        const costs: Record<string, { workforce: number, labour: number, investment: number, expenses: number, contingency: number, total: number, l3Count: number }> = {}

        invItems.forEach(item => {
            const l3 = item.isdc_l3_code || 'UNASSIGNED'
            const l2 = l3.length >= 5 ? l3.substring(0, 5) : l3

            if (!costs[l2]) costs[l2] = { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0, l3Count: 0 }

            const workforce = calcTotalWF(item)
            costs[l2].workforce += workforce
            costs[l2].l3Count += 1

            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let investment = 0, expenses = 0
            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                investment += q.quantity * (uf.investment_uf || 0)
                expenses += q.quantity * (uf.expenses_uf || 0)
            })

            const labour = workforce * labourRate
            const contingency = (labour + investment + expenses) * ((item.contingency_rate || 10) / 100)

            costs[l2].labour += labour
            costs[l2].investment += investment
            costs[l2].expenses += expenses
            costs[l2].contingency += contingency
            costs[l2].total += labour + investment + expenses + contingency
        })

        return costs
    }, [invItems, ddQuantities, getUF, labourRate])

    // Group by L1 for display
    const l2ByL1 = useMemo(() => {
        const grouped: Record<string, typeof costsByL2> = {}
        Object.entries(costsByL2).forEach(([l2, data]) => {
            const l1 = l2.substring(0, 2)
            if (!grouped[l1]) grouped[l1] = {}
            grouped[l1][l2] = data
        })
        return grouped
    }, [costsByL2])

    const grandTotal = useMemo(() => {
        return Object.values(costsByL2).reduce((acc, data) => ({
            workforce: acc.workforce + data.workforce,
            labour: acc.labour + data.labour,
            investment: acc.investment + data.investment,
            expenses: acc.expenses + data.expenses,
            contingency: acc.contingency + data.contingency,
            total: acc.total + data.total,
        }), { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0 })
    }, [costsByL2])

    const toggleL1 = (l1: string) => {
        setExpandedL1(prev => prev.includes(l1) ? prev.filter(x => x !== l1) : [...prev, l1])
    }

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Rows size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to view ISDC reports.</p>
            </div>
        )
    }

    const formatCost = (val: number) => val >= 1000000 ? (val / 1000000).toFixed(2) + 'M' : val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">ISDC Level 2 Report</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Sub-Activity Breakdown (Excel Section 7)</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 text-xs font-bold text-slate-600 border border-slate-200/60">
                        <Filter size={14} className="text-blue-500" />
                        <span>Hide Empty</span>
                        <input type="checkbox" checked={!showEmpty} onChange={e => setShowEmpty(!e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 italic md:not-italic">
                <div className="glass p-5 rounded-2xl border border-slate-200/60 transition-all hover:bg-white/50">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <LayoutGrid size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">L2 Capacity</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">{Object.keys(costsByL2).length} <span className="text-xs font-normal text-slate-400">active codes</span></div>
                </div>
                <div className="glass p-5 rounded-2xl border border-slate-200/60 transition-all hover:bg-white/50 group">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <Users size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Workforce Load</span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 opacity-60">MAN·H</span>
                    </div>
                    <div className="text-2xl font-black text-indigo-700 tracking-tight">{grandTotal.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 translate-x-4 -translate-y-4 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <CircleDollarSign size={80} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-amber-400/80">
                            <BarChart3 size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Aggregated Total</span>
                        </div>
                        <div className="text-2xl font-black text-white tracking-tight">{formatCost(grandTotal.total)} <span className="text-xs font-normal opacity-40 ml-1">{currency}</span></div>
                    </div>
                </div>
            </div>

            {/* Hierarchical Cost View */}
            <div className="space-y-4 italic md:not-italic">
                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4 italic md:not-italic">
                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8"></div>
                        <span className="text-sm text-slate-400 italic">Synthesizing levels...</span>
                    </div>
                ) : (
                    Object.entries(l2ByL1).sort(([a], [b]) => a.localeCompare(b)).map(([l1, l2Data]) => {
                        const l1Total = Object.values(l2Data).reduce((s, d) => s + d.total, 0)
                        const isExpanded = expandedL1.includes(l1) || expandedL1.length === 0 // Default to all expanded if none selected for now

                        return (
                            <div key={l1} className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                {/* L1 Header Row */}
                                <div
                                    className="px-6 py-4 bg-white/40 flex items-center justify-between cursor-pointer group"
                                    onClick={() => toggleL1(l1)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-black text-sm shadow-md">
                                            {l1}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{L1_NAMES[l1] || 'Principal Activity'}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{Object.keys(l2Data).length} sub-activities mapped</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">L1 SUB-TOTAL</div>
                                            <div className="text-sm font-black text-slate-800 tabular-nums">{formatCost(l1Total)} <span className="text-[10px] opacity-40">{currency}</span></div>
                                        </div>
                                        <div className={`p-1.5 rounded-full bg-slate-100 text-slate-400 transition-all ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* L2 Detail Table */}
                                <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse border-t border-slate-100">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                                    <th className="px-6 py-3 w-32 pl-12 italic">L2 Code</th>
                                                    <th className="px-4 py-3 w-20 text-center italic">L3s</th>
                                                    <th className="px-4 py-3 text-right italic">Workforce</th>
                                                    <th className="px-4 py-3 text-right italic">Labour</th>
                                                    <th className="px-4 py-3 text-right italic">Investment</th>
                                                    <th className="px-4 py-3 text-right italic">Expenses</th>
                                                    <th className="px-4 py-3 text-right italic">Contingency</th>
                                                    <th className="px-6 py-3 text-right bg-blue-50/20 italic">Total Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                                                {Object.entries(l2Data).sort(([a], [b]) => a.localeCompare(b)).map(([l2, data]) => (
                                                    <tr key={l2} className="group/row hover:bg-slate-50/50 transition-all italic md:not-italic">
                                                        <td className="px-6 py-3.5 pl-12 font-mono font-black text-xs text-slate-400 group-hover/row:text-blue-600 transition-colors">
                                                            {l2}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500">{data.l3Count}</span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums">{data.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums">{formatCost(data.labour)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums">{formatCost(data.investment)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums">{formatCost(data.expenses)}</td>
                                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums">{formatCost(data.contingency)}</td>
                                                        <td className="px-6 py-3.5 text-right bg-blue-50/10 font-black text-xs text-slate-900 tabular-nums group-hover/row:bg-blue-100/30 transition-colors italic md:not-italic">
                                                            {formatCost(data.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Reconciliation Footer Card */}
            <div className="bg-emerald-900/90 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden italic md:not-italic">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Layers size={120} className="text-white" />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-8 relative z-10 italic md:not-italic">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 uppercase text-[10px] font-black tracking-widest mb-2 italic md:not-italic">
                            <Info size={14} />
                            Grand Total Reconciliation
                        </div>
                        <h4 className="text-white text-sm font-medium leading-relaxed opacity-70 italic md:not-italic">
                            Hierarchical rollup of all ISDC Level 2 activities as defined in the master inventory database.
                        </h4>
                    </div>

                    <div className="flex flex-wrap items-end justify-end gap-10 italic md:not-italic">
                        <div className="text-right italic md:not-italic">
                            <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1 italic md:not-italic">Global Workforce</div>
                            <div className="text-xl font-black text-white tabular-nums italic md:not-italic">{grandTotal.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] opacity-40">MH</span></div>
                        </div>
                        <div className="text-right italic md:not-italic">
                            <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1 italic md:not-italic">Total Liability</div>
                            <div className="text-3xl font-black text-amber-400 tabular-nums italic md:not-italic">{formatCost(grandTotal.total)} <span className="text-sm font-normal text-white opacity-40 ml-1 italic md:not-italic">{currency}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
