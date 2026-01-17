// L0 Sheet - Grand Total Summary
// Project cost overview with visualizations

'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    TrendingUp,
    Users,
    DollarSign,
    BarChart3,
    PieChart,
    Info,
    ArrowUpRight,
    Briefcase
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
    '01': 'Pre-decommissioning actions',
    '02': 'Facility shutdown activities',
    '03': 'Additional activities for safe enclosure',
    '04': 'Dismantling within controlled area',
    '05': 'Waste processing, storage and disposal',
    '06': 'Site infrastructure and operation',
    '07': 'Conventional dismantling and demolition',
    '08': 'Project management, engineering and support',
    '09': 'Research and development',
    '10': 'Fuel and nuclear material',
    '11': 'Miscellaneous expenditures',
}

export default function L0Page() {
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

    // Calculate all costs
    const totals = useMemo(() => {
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

            const itemLabour = wf * labourRate
            const itemCont = (itemLabour + itemInv + itemExp) * ((item.contingency_rate || 10) / 100)

            labour += itemLabour
            investment += itemInv
            expenses += itemExp
            contingency += itemCont
        })

        return { workforce, labour, investment, expenses, contingency, total: labour + investment + expenses + contingency, items: invItems.length }
    }, [invItems, ddQuantities, getUF, labourRate])

    // By L1
    const costsByL1 = useMemo(() => {
        const costs: Record<string, number> = {}

        invItems.forEach(item => {
            const l1 = (item.isdc_l3_code || 'XX').substring(0, 2)
            if (!costs[l1]) costs[l1] = 0

            const wf = calcTotalWF(item)
            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let itemInv = 0, itemExp = 0
            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                itemInv += q.quantity * (uf.investment_uf || 0)
                itemExp += q.quantity * (uf.expenses_uf || 0)
            })
            const labour = wf * labourRate
            const cont = (labour + itemInv + itemExp) * ((item.contingency_rate || 10) / 100)
            costs[l1] += labour + itemInv + itemExp + cont
        })

        return costs
    }, [invItems, ddQuantities, getUF, labourRate])

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 glass rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl">📊</div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500 max-w-sm">Please select a project to view the Grand Total summary.</p>
            </div>
        )
    }

    const formatCost = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k'
        return val.toFixed(0)
    }

    const pct = (part: number) => totals.total > 0 ? (part / totals.total * 100).toFixed(1) : '0'

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    L0 Sheet - Grand Total
                </h1>
                <p className="text-slate-500 mt-1">Project cost overview and summary across all activities.</p>
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><div className="spinner border-slate-300 border-t-blue-600"></div></div>
            ) : (
                <>
                    {/* Hero Section - Total Cost */}
                    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/10">
                        {/* Decorative background mesh */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500 blur-[100px]"></div>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="text-center md:text-left flex-1">
                                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">
                                    Total Project Cost
                                </span>
                                <div className="text-5xl md:text-6xl font-extrabold tracking-tighter flex items-baseline justify-center md:justify-start gap-3">
                                    {formatCost(totals.total)}
                                    <span className="text-2xl md:text-3xl font-medium text-slate-400">{currency}</span>
                                </div>
                                <p className="text-slate-400 mt-4 text-sm flex items-center justify-center md:justify-start gap-2">
                                    <BarChart3 size={14} className="text-blue-400" />
                                    Based on <span className="text-white font-medium">{totals.items}</span> active inventory items
                                </p>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-2">
                                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs font-medium flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-400" />
                                    Live Calculation
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Labour', value: totals.labour, color: 'bg-amber-500', barBg: 'bg-amber-100', icon: Users, textColor: 'text-amber-700', href: '/dashboard/inv' },
                            { name: 'Investment', value: totals.investment, color: 'bg-indigo-500', barBg: 'bg-indigo-100', icon: Briefcase, textColor: 'text-indigo-700', href: '/dashboard/isdc' },
                            { name: 'Expenses', value: totals.expenses, color: 'bg-rose-500', barBg: 'bg-rose-100', icon: DollarSign, textColor: 'text-rose-700', href: '/dashboard/isdc' },
                            { name: 'Contingency', value: totals.contingency, color: 'bg-slate-500', barBg: 'bg-slate-200', icon: Info, textColor: 'text-slate-700', href: '/dashboard/isdc' },
                        ].map(cat => (
                            <Link key={cat.name} href={cat.href || '#'}>
                                <div className="glass p-5 rounded-2xl hover:shadow-lg transition-all duration-200 border border-slate-200/60 h-full group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 ${cat.textColor} group-hover:scale-110 transition-transform`}>
                                            <cat.icon size={18} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat.name}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900 mb-2">
                                        {formatCost(cat.value)} <span className="text-sm font-normal text-slate-400">{currency}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className={`h-2 w-full rounded-full overflow-hidden ${cat.barBg}`}>
                                            <div
                                                className={`h-full ${cat.color} rounded-full`}
                                                style={{ width: `${pct(cat.value)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <span className="text-slate-400">{pct(cat.value)}% OF TOTAL</span>
                                            <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Manpower & Secondary Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Manpower Summary Card */}
                        <div className="lg:col-span-1 glass p-6 rounded-2xl border border-slate-200/60">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Users size={16} className="text-blue-600" />
                                Manpower Summary
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-extrabold text-emerald-700 tracking-tighter">
                                        {totals.workforce.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-400 uppercase">Man-Hours</span>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/50">
                                    <div className="text-xs font-semibold text-emerald-800 mb-1">Equivalent to</div>
                                    <div className="text-xl font-bold text-emerald-900">
                                        {Math.ceil(totals.workforce / 1800)} <span className="text-sm font-medium">person-years</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 mt-1 italic">Based on 1,800 working hours per year</p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Current Rate</div>
                                        <div className="text-lg font-bold text-slate-800">{labourRate} {currency}/h</div>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cost by Principal Activity (L1) */}
                        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <PieChart size={16} className="text-blue-600" />
                                By Principal Activity (L1)
                            </h2>

                            <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white/30 backdrop-blur-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 w-16 text-center">Code</th>
                                            <th className="px-4 py-3">Activity</th>
                                            <th className="px-4 py-3 text-right">Cost</th>
                                            <th className="px-4 py-3 text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(costsByL1)
                                            .filter(([, v]) => v > 0)
                                            .sort(([a], [b]) => a.localeCompare(b))
                                            .map(([code, cost]) => (
                                                <tr key={code} className="hover:bg-blue-50/50 transition-colors group">
                                                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{code}</td>
                                                    <td className="px-4 py-3 text-slate-600">{L1_NAMES[code] || 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                                                        {formatCost(cost)} {currency}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">
                                                            {pct(cost)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-emerald-50/50 font-bold border-t border-slate-200">
                                            <td colSpan={2} className="px-4 py-4 text-emerald-900 uppercase tracking-wider text-xs">Total Estimated Cost</td>
                                            <td className="px-4 py-4 text-right text-emerald-900 font-mono text-lg">
                                                {formatCost(totals.total)} {currency}
                                            </td>
                                            <td className="px-4 py-4 text-right text-emerald-900">100%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
