// ISDC L1 Report - 11 Principal Activities Summary
// PRD Section 8

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutList,
    PieChart,
    CircleDollarSign,
    Users,
    TrendingUp,
    Info,
    ChevronRight,
    Activity,
    ArrowRight
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

const L1_ACTIVITIES = [
    { code: '01', name: 'Pre-decommissioning actions', desc: 'Planning, surveys, regulatory preparation' },
    { code: '02', name: 'Facility shutdown activities', desc: 'Defueling, system draining, decontamination' },
    { code: '03', name: 'Additional activities for safe enclosure', desc: 'SEO-specific preparations' },
    { code: '04', name: 'Dismantling within controlled area', desc: 'Main D&D operations' },
    { code: '05', name: 'Waste processing, storage and disposal', desc: 'All waste management activities' },
    { code: '06', name: 'Site infrastructure and operation', desc: 'Utilities, services, site maintenance' },
    { code: '07', name: 'Conventional dismantling and demolition', desc: 'Non-nuclear demolition work' },
    { code: '08', name: 'Project management, engineering and support', desc: 'PM, design, QA/QC' },
    { code: '09', name: 'Research and development', desc: 'Technology development, testing' },
    { code: '10', name: 'Fuel and nuclear material', desc: 'Spent fuel and special nuclear materials' },
    { code: '11', name: 'Miscellaneous expenditures', desc: 'Other project costs' },
]

export default function ISDCL1Page() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)

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

    const costsByL1 = useMemo(() => {
        const costs: Record<string, { workforce: number, labour: number, investment: number, expenses: number, contingency: number, total: number, items: number }> = {}

        invItems.forEach(item => {
            const l1Code = (item.isdc_l3_code || 'XX').substring(0, 2)
            if (!costs[l1Code]) costs[l1Code] = { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0, items: 0 }

            const workforce = calcTotalWF(item)
            costs[l1Code].workforce += workforce
            costs[l1Code].items += 1

            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let investment = 0, expenses = 0
            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                investment += q.quantity * (uf.investment_uf || 0)
                expenses += q.quantity * (uf.expenses_uf || 0)
            })

            const labour = workforce * labourRate
            const contingency = (labour + investment + expenses) * ((item.contingency_rate || 10) / 100)

            costs[l1Code].labour += labour
            costs[l1Code].investment += investment
            costs[l1Code].expenses += expenses
            costs[l1Code].contingency += contingency
            costs[l1Code].total += labour + investment + expenses + contingency
        })

        return costs
    }, [invItems, ddQuantities, getUF, labourRate])

    const grandTotal = useMemo(() => {
        return Object.values(costsByL1).reduce((acc, data) => ({
            workforce: acc.workforce + data.workforce,
            labour: acc.labour + data.labour,
            investment: acc.investment + data.investment,
            expenses: acc.expenses + data.expenses,
            contingency: acc.contingency + data.contingency,
            total: acc.total + data.total,
            items: acc.items + data.items,
        }), { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0, items: 0 })
    }, [costsByL1])

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <LayoutList size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to view ISDC reports.</p>
            </div>
        )
    }

    const formatCost = (val: number) => val >= 1000000 ? (val / 1000000).toFixed(2) + 'M' : val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">ISDC Level 1 Report</h1>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Principal Activity Summary (Excel Section 8)</p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:bg-white/50">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Users size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider italic md:not-italic">Total Workforce</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">{grandTotal.workforce.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic md:not-italic">man·h</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:bg-white/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <CircleDollarSign size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider italic md:not-italic">Total Project Cost</span>
                    </div>
                    <div className="text-2xl font-black text-blue-700 tabular-nums">{formatCost(grandTotal.total)}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic md:not-italic">{currency}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:bg-white/50">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <TrendingUp size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider italic md:not-italic">Avg. Labour Rate</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">{labourRate}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic md:not-italic">{currency} / h</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 transition-all hover:bg-white/50">
                    <div className="flex items-center gap-3 mb-2 text-slate-400">
                        <Activity size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider italic md:not-italic">Active Inventory</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">{grandTotal.items}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic md:not-italic">line items</div>
                </div>
            </div>

            {/* L1 Detailed Table */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                        <PieChart size={16} className="text-blue-500" />
                        Principal Activity Distribution
                    </h3>
                </div>

                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4 italic md:not-italic">
                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8"></div>
                        <span className="text-sm text-slate-400">Aggregating hierarchical costs...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-6 py-4 w-20 text-center">Code</th>
                                    <th className="px-6 py-4">ISDC Principal Activity</th>
                                    <th className="px-4 py-4 w-28 text-right">Workforce</th>
                                    <th className="px-4 py-4 w-24 text-right">Labour</th>
                                    <th className="px-4 py-4 w-24 text-right">Investment</th>
                                    <th className="px-4 py-4 w-24 text-right">Expenses</th>
                                    <th className="px-4 py-4 w-28 text-right">Contingency</th>
                                    <th className="px-6 py-4 w-32 text-right bg-blue-50/20">Total Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                                {L1_ACTIVITIES.map((act) => {
                                    const data = costsByL1[act.code] || { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0 }
                                    const hasData = data.total > 0
                                    const pctOfTotal = grandTotal.total > 0 ? (data.total / grandTotal.total * 100) : 0
                                    return (
                                        <tr key={act.code} className={`group hover:bg-blue-50/10 transition-all ${!hasData ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                                            <td className="px-6 py-4 text-center font-mono font-black text-lg text-slate-300 group-hover:text-blue-600 transition-colors">
                                                {act.code}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-slate-800">{act.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium leading-relaxed">{act.desc}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-500 tabular-nums">{hasData ? data.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-500 tabular-nums">{hasData ? formatCost(data.labour) : '-'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-500 tabular-nums">{hasData ? formatCost(data.investment) : '-'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-500 tabular-nums">{hasData ? formatCost(data.expenses) : '-'}</td>
                                            <td className="px-4 py-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">{hasData ? formatCost(data.contingency) : '-'}</td>
                                            <td className={`px-6 py-4 text-right bg-blue-50/10 group-hover:bg-blue-100/20 transition-colors`}>
                                                {hasData ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-slate-900 text-sm tabular-nums">{formatCost(data.total)}</span>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctOfTotal}%` }}></div>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-blue-600 leading-none">{pctOfTotal.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-slate-200">-</span>}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900 text-white font-black italic md:not-italic">
                                    <td colSpan={2} className="px-6 py-6 text-[10px] uppercase tracking-[0.3em] text-slate-500">Global Project Reconciliation</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm">{grandTotal.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm">{formatCost(grandTotal.labour)}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm">{formatCost(grandTotal.investment)}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm">{formatCost(grandTotal.expenses)}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm">{formatCost(grandTotal.contingency)}</td>
                                    <td className="px-6 py-6 text-right bg-white/10">
                                        <div className="text-2xl font-black text-amber-400 tabular-nums">{formatCost(grandTotal.total)}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Final Aggregated Cost ({currency})</div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Audit Logic Frame */}
            <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-2xl border border-slate-200/60 text-xs text-slate-500 italic md:not-italic">
                <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Info size={14} className="text-blue-500" />
                        ISDC Aggregation Logic
                    </h5>
                    <p className="leading-relaxed">
                        Level 1 reports aggregate all sub-activities (L2) and itemized details (L3) based on the standardized <span className="font-bold text-blue-600">ISDC Hierarchical Structure</span>.
                        Cost components include workforce, investment, and operational expenses, plus a variable contingency rate per item.
                    </p>
                </div>
                <div className="flex-1 space-y-2 group">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <ArrowRight size={14} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                        Traceability
                    </h5>
                    <div className="space-y-1.5 font-medium text-[10px]">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>Directly mapped from active <span className="text-blue-600">Inventory Items</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>Synchronized with <span className="text-blue-600">D&D / WM Unit Factors</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
