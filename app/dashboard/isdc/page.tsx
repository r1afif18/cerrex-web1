// ISDC Sheet - International Standard for Decommissioning Costing
// Cost calculation based on Inventory items and Unit Factors

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Calculator,
    BarChart3,
    Users,
    Coins,
    TrendingUp,
    Info,
    CheckCircle2,
    PieChart,
    ChevronRight,
    Search
} from 'lucide-react'

interface ISDCCode {
    id: string
    project_id: string
    level: number
    code: string
    name: string
    parent_code: string
    is_activated: boolean
    contingency_rate: number
}

interface InventoryItem {
    id: string
    item_id: string
    description: string
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
    is_contractor: boolean
    contingency_rate: number
}

interface DDQuantity {
    inventory_item_id: string
    dd_category_code: string
    quantity: number
}

interface DDCategory {
    code: string
    manpower_uf: number
    investment_uf: number
    expenses_uf: number
}

// Calculate total workforce with WDF
function calcTotalWF(item: InventoryItem): number {
    const wdfSum = (item.wdf_f1 || 0) + (item.wdf_f2 || 0) + (item.wdf_f3 || 0) +
        (item.wdf_f4 || 0) + (item.wdf_f5 || 0) + (item.wdf_f6 || 0) + (item.wdf_f7 || 0)
    return (item.basic_workforce || 0) * (100 + wdfSum) / 100
}

// 11 Principal Activities (L1)
const L1_ACTIVITIES = [
    { code: '01', name: 'Pre-decommissioning actions' },
    { code: '02', name: 'Facility shutdown activities' },
    { code: '03', name: 'Additional activities for safe enclosure' },
    { code: '04', name: 'Dismantling activities within controlled area' },
    { code: '05', name: 'Waste processing, storage and disposal' },
    { code: '06', name: 'Site infrastructure and operation' },
    { code: '07', name: 'Conventional dismantling and demolition' },
    { code: '08', name: 'Project management, engineering and support' },
    { code: '09', name: 'Research and development' },
    { code: '10', name: 'Fuel and nuclear material' },
    { code: '11', name: 'Miscellaneous expenditures' },
]

export default function ISDCPage() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [isdcCodes, setIsdcCodes] = useState<ISDCCode[]>([])
    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)

    const labourRate = currentProject?.reference_labour_rate || 50
    const currency = currentProject?.reference_currency || 'USD'

    const loadData = useCallback(async () => {
        if (!currentProject) return
        setLoading(true)

        const [codesRes, invRes, qtyRes, catRes] = await Promise.all([
            supabase.from('isdc_codes').select('*').eq('project_id', currentProject.id).order('code'),
            supabase.from('inventory_items').select('*').eq('project_id', currentProject.id).eq('is_activated', true),
            supabase.from('inventory_dd_quantities').select('*'),
            supabase.from('dd_categories').select('*').eq('project_id', currentProject.id),
        ])

        if (codesRes.data) setIsdcCodes(codesRes.data)
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

    // Get UF for a D&D category
    const getUF = useCallback((code: string): DDCategory => {
        return ddCategories.find(c => c.code === code) || { code, manpower_uf: 0, investment_uf: 0, expenses_uf: 0 }
    }, [ddCategories])

    // Calculate costs per ISDC L3 code
    const costsByL3 = useMemo(() => {
        const costs: Record<string, { workforce: number, labour: number, investment: number, expenses: number, contingency: number, total: number, items: number }> = {}

        invItems.forEach(item => {
            const code = item.isdc_l3_code || 'UNASSIGNED'
            if (!costs[code]) costs[code] = { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0, items: 0 }

            // Workforce from inventory item
            const workforce = calcTotalWF(item)
            costs[code].workforce += workforce
            costs[code].items += 1

            // Get D&D quantities for this item and calculate costs
            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let itemInvestment = 0
            let itemExpenses = 0

            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                itemInvestment += q.quantity * (uf.investment_uf || 0)
                itemExpenses += q.quantity * (uf.expenses_uf || 0)
            })

            // Labour = Workforce × Rate
            const labour = workforce * labourRate

            // Contingency
            const contingencyRate = (item.contingency_rate || 10) / 100
            const contingency = (labour + itemInvestment + itemExpenses) * contingencyRate

            costs[code].labour += labour
            costs[code].investment += itemInvestment
            costs[code].expenses += itemExpenses
            costs[code].contingency += contingency
            costs[code].total += labour + itemInvestment + itemExpenses + contingency
        })

        return costs
    }, [invItems, ddQuantities, getUF, labourRate])

    // Aggregate to L1 (XX)
    const costsByL1 = useMemo(() => {
        const costs: Record<string, { workforce: number, labour: number, investment: number, expenses: number, contingency: number, total: number }> = {}

        Object.entries(costsByL3).forEach(([l3Code, data]) => {
            const l1Code = l3Code.substring(0, 2) // XX from XX.YYYY
            if (!costs[l1Code]) costs[l1Code] = { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0 }
            costs[l1Code].workforce += data.workforce
            costs[l1Code].labour += data.labour
            costs[l1Code].investment += data.investment
            costs[l1Code].expenses += data.expenses
            costs[l1Code].contingency += data.contingency
            costs[l1Code].total += data.total
        })

        return costs
    }, [costsByL3])

    // Grand totals
    const grandTotal = useMemo(() => {
        return Object.values(costsByL3).reduce((acc, data) => ({
            workforce: acc.workforce + data.workforce,
            labour: acc.labour + data.labour,
            investment: acc.investment + data.investment,
            expenses: acc.expenses + data.expenses,
            contingency: acc.contingency + data.contingency,
            total: acc.total + data.total,
        }), { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0 })
    }, [costsByL3])

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl">
                <Calculator size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to view cost calculations.</p>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                        ISDC Cost Calculations
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest">Live</span>
                    </h1>
                    <p className="text-slate-500 mt-1">International Structure for Decommissioning Costing (PRD Section 4)</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border border-slate-200/50 text-xs font-medium text-slate-600">
                    <TrendingUp size={14} className="text-emerald-500" />
                    Labour Rate: <span className="font-bold text-slate-900">{labourRate} {currency}/h</span>
                </div>
            </div>

            {/* Summary Grid - Premium Look */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="glass p-4 rounded-xl border border-slate-200/60 group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Users size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Workforce</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums">{grandTotal.workforce.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-400 font-medium">Man-Hours</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                        <Coins size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Labour</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums">{formatCost(grandTotal.labour)}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{currency}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-2 text-indigo-500">
                        <BarChart3 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Investment</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums">{formatCost(grandTotal.investment)}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{currency}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-2 text-rose-500">
                        <Coins size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Expenses</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums">{formatCost(grandTotal.expenses)}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{currency}</div>
                </div>
                <div className="glass p-4 rounded-xl border border-slate-200/60 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Info size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Contingency</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums">{formatCost(grandTotal.contingency)}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{currency}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl shadow-xl shadow-slate-900/10 ring-1 ring-white/10 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Grand Total</span>
                    </div>
                    <div className="text-2xl font-black text-white tabular-nums">{formatCost(grandTotal.total)}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">{currency}</div>
                </div>
            </div>

            {/* Level 1 Summary Table */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <PieChart size={16} className="text-blue-500" />
                        Level 1 - Principal Activities
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4 w-20">Code</th>
                                <th className="px-6 py-4">Activity Name</th>
                                <th className="px-4 py-4 text-right">Workforce</th>
                                <th className="px-4 py-4 text-right">Labour</th>
                                <th className="px-4 py-4 text-right">Invest.</th>
                                <th className="px-4 py-4 text-right">Exp.</th>
                                <th className="px-4 py-4 text-right">Contingency</th>
                                <th className="px-6 py-4 text-right bg-emerald-50/50 text-emerald-800">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {L1_ACTIVITIES.map(act => {
                                const data = costsByL1[act.code] || { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0 }
                                const hasData = data.total > 0
                                return (
                                    <tr key={act.code} className={`group hover:bg-blue-50/30 transition-all ${!hasData ? 'opacity-30' : ''}`}>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-400 group-hover:text-blue-600 transition-colors">{act.code}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{act.name}</td>
                                        <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{hasData ? data.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{hasData ? formatCost(data.labour) : '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{hasData ? formatCost(data.investment) : '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{hasData ? formatCost(data.expenses) : '-'}</td>
                                        <td className="px-4 py-4 text-right font-mono text-xs text-slate-600">{hasData ? formatCost(data.contingency) : '-'}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/10">
                                            {hasData ? formatCost(data.total) : '0'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-900 text-white font-bold border-t border-slate-700">
                                <td colSpan={2} className="px-6 py-5 text-xs uppercase tracking-widest text-slate-400">Estimated Project Totals</td>
                                <td className="px-4 py-5 text-right font-mono text-sm">{grandTotal.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="px-4 py-5 text-right font-mono text-sm">{formatCost(grandTotal.labour)}</td>
                                <td className="px-4 py-5 text-right font-mono text-sm">{formatCost(grandTotal.investment)}</td>
                                <td className="px-4 py-5 text-right font-mono text-sm">{formatCost(grandTotal.expenses)}</td>
                                <td className="px-4 py-5 text-right font-mono text-sm">{formatCost(grandTotal.contingency)}</td>
                                <td className="px-6 py-5 text-right font-mono text-lg text-emerald-400 bg-emerald-950/20">{formatCost(grandTotal.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Level 3 Details */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/40 backdrop-blur-sm flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-500" />
                        Level 3 Details
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Search size={12} />
                        Filter Active
                    </div>
                </div>
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8"></div>
                        <span className="text-sm text-slate-400 animate-pulse">Computing costs...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                    <th className="px-6 py-4">ISDC Code</th>
                                    <th className="px-4 py-4 text-center">Inv Items</th>
                                    <th className="px-4 py-4 text-right">Workforce</th>
                                    <th className="px-4 py-4 text-right">Labour</th>
                                    <th className="px-4 py-4 text-right">Investment</th>
                                    <th className="px-4 py-4 text-right">Expenses</th>
                                    <th className="px-4 py-4 text-right">Contingency</th>
                                    <th className="px-6 py-4 text-right bg-blue-50/50 text-blue-800">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(costsByL3).length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-20 text-center opacity-40 italic text-slate-500 text-sm">
                                            No inventory items with valid ISDC codes assigned. Assign codes in Inventory (INV) tab.
                                        </td>
                                    </tr>
                                ) : (
                                    Object.entries(costsByL3)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([code, data]) => (
                                            <tr key={code} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900">{code}</span>
                                                        <ChevronRight size={12} className="text-slate-300" />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-[10px] font-bold text-slate-500">
                                                        {data.items}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{data.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{formatCost(data.labour)}</td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{formatCost(data.investment)}</td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{formatCost(data.expenses)}</td>
                                                <td className="px-4 py-4 text-right font-mono text-xs text-slate-500">{formatCost(data.contingency)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-blue-700 bg-blue-50/20">
                                                    {formatCost(data.total)}
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Formulas Info Card */}
            <div className="glass p-6 rounded-2xl border border-slate-200/60 divide-y divide-slate-100 space-y-4">
                <h5 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Info size={14} className="text-blue-500" />
                    Calculation Formulas (PRD Section 4)
                </h5>
                <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Labour Cost</div>
                        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded">Workforce × Rate</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Investment</div>
                        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded">Qty × Invest. UF</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Expenses</div>
                        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded">Qty × Expenses UF</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Contingency</div>
                        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded">(L + I + E) × %</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
