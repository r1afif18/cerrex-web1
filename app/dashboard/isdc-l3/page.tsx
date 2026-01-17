// ISDC L3 Report - Detailed Item Level
// PRD Section 6

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import {
    Rows,
    Layers,
    Columns,
    Search,
    Filter,
    CircleDollarSign,
    Users,
    ChevronRight,
    Info,
    LayoutList,
    Activity,
    Box,
    FileSpreadsheet
} from 'lucide-react'

// Reusable UI Components
const Select = (props: any) => (
    <select
        {...props}
        className="glass-input px-3 py-1.5 text-xs rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none italic md:not-italic"
    />
)

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

export default function ISDCL3Page() {
    const { currentProject } = useProject()
    const supabase = createClient()

    const [invItems, setInvItems] = useState<InventoryItem[]>([])
    const [ddQuantities, setDDQuantities] = useState<DDQuantity[]>([])
    const [ddCategories, setDDCategories] = useState<DDCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [filterL1, setFilterL1] = useState<string>('')

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

    // Group by L3 code
    const costsByL3 = useMemo(() => {
        const costs: Record<string, { workforce: number, labour: number, investment: number, expenses: number, contingency: number, total: number, items: InventoryItem[] }> = {}

        const filteredItems = filterL1 ? invItems.filter(i => (i.isdc_l3_code || '').startsWith(filterL1)) : invItems

        filteredItems.forEach(item => {
            const code = item.isdc_l3_code || 'UNASSIGNED'
            if (!costs[code]) costs[code] = { workforce: 0, labour: 0, investment: 0, expenses: 0, contingency: 0, total: 0, items: [] }

            const workforce = calcTotalWF(item)
            costs[code].workforce += workforce
            costs[code].items.push(item)

            const itemQtys = ddQuantities.filter(q => q.inventory_item_id === item.id)
            let investment = 0, expenses = 0
            itemQtys.forEach(q => {
                const uf = getUF(q.dd_category_code)
                investment += q.quantity * (uf.investment_uf || 0)
                expenses += q.quantity * (uf.expenses_uf || 0)
            })

            const labour = workforce * labourRate
            const contingency = (labour + investment + expenses) * ((item.contingency_rate || 10) / 100)

            costs[code].labour += labour
            costs[code].investment += investment
            costs[code].expenses += expenses
            costs[code].contingency += contingency
            costs[code].total += labour + investment + expenses + contingency
        })

        return costs
    }, [invItems, ddQuantities, getUF, labourRate, filterL1])

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
                <LayoutList size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-800 mb-2">No Project Selected</h2>
                <p className="text-slate-500">Please select a project to view detailed ISDC reports.</p>
            </div>
        )
    }

    const formatCost = (val: number) => val >= 1000000 ? (val / 1000000).toFixed(2) + 'M' : val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)

    const l1Codes = ['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">ISDC Level 3 Report</h1>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] italic md:not-italic">Granular Itemized Breakdown (Excel Section 6)</p>
            </div>

            {/* Filtering & Unified Summary */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch italic md:not-italic">
                <div className="glass p-4 rounded-xl border border-slate-200/60 flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Filter size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest italic md:not-italic">Primary Activity Filter</span>
                    </div>
                    <Select value={filterL1} onChange={(e: any) => setFilterL1(e.target.value)}>
                        <option value="">L1 - All Principal Activities</option>
                        {l1Codes.slice(1).map(c => <option key={c} value={c}>Activity {c}</option>)}
                    </Select>
                </div>

                <div className="glass p-4 rounded-xl border border-slate-200/60 flex-1 flex items-center justify-around gap-8 italic md:not-italic">
                    <div className="text-center group">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic md:not-italic flex items-center justify-center gap-1.5 group-hover:text-blue-500 transition-colors">
                            <Box size={10} /> Active L3 Units
                        </div>
                        <div className="text-lg font-black text-slate-900 tabular-nums italic md:not-italic">{Object.keys(costsByL3).length}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-100 flex-shrink-0"></div>
                    <div className="text-center group">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic md:not-italic flex items-center justify-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                            <Users size={10} /> Total Load (MH)
                        </div>
                        <div className="text-lg font-black text-slate-900 tabular-nums italic md:not-italic">{grandTotal.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className="w-px h-8 bg-slate-100 flex-shrink-0"></div>
                    <div className="text-center group italic md:not-italic">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic md:not-italic flex items-center justify-center gap-1.5 group-hover:text-amber-500 transition-colors">
                            <CircleDollarSign size={10} /> Segment Cost
                        </div>
                        <div className="text-lg font-black text-emerald-700 tabular-nums italic md:not-italic">{formatCost(grandTotal.total)} <span className="text-[10px] opacity-40 font-bold">{currency}</span></div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="glass rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm italic md:not-italic">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/30 backdrop-blur-sm">
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 italic md:not-italic">
                        <FileSpreadsheet size={16} className="text-blue-500" />
                        Level 3 Hierarchical Segments
                    </h3>
                </div>

                {loading ? (
                    <div className="p-24 flex flex-col items-center gap-4 italic md:not-italic">
                        <div className="spinner border-slate-200 border-t-blue-600 h-8 w-8 italic md:not-italic"></div>
                        <span className="text-sm text-slate-400 italic">Formatting detail layers...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar italic md:not-italic">
                        <table className="w-full text-left border-collapse min-w-[1000px] italic md:not-italic">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 italic md:not-italic">
                                    <th className="px-6 py-4 w-32 pl-8 italic">ISDC L3 Code</th>
                                    <th className="px-4 py-4 w-20 text-center italic">Items</th>
                                    <th className="px-4 py-4 text-right italic">Workforce</th>
                                    <th className="px-4 py-4 text-right italic">Labour</th>
                                    <th className="px-4 py-4 text-right italic">Investment</th>
                                    <th className="px-4 py-4 text-right italic">Expenses</th>
                                    <th className="px-4 py-4 text-right italic">Contingency</th>
                                    <th className="px-6 py-4 w-32 text-right bg-blue-50/20 italic">Total L3 Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 italic md:not-italic">
                                {Object.entries(costsByL3).length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-20 text-center italic text-slate-400 text-sm">
                                            No data satisfies current filters. Ensure items are activated in Inventory.
                                        </td>
                                    </tr>
                                ) : (
                                    Object.entries(costsByL3).sort(([a], [b]) => a.localeCompare(b)).map(([code, data]) => {
                                        const pctOfTotal = grandTotal.total > 0 ? (data.total / grandTotal.total * 100) : 0
                                        return (
                                            <tr key={code} className="group hover:bg-slate-50/50 transition-all italic md:not-italic">
                                                <td className="px-6 py-3.5 pl-8 font-mono font-black text-xs text-slate-400 group-hover:text-blue-600 transition-colors italic md:not-italic">
                                                    {code}
                                                </td>
                                                <td className="px-4 py-3.5 text-center italic md:not-italic">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500 italic md:not-italic">{data.items.length}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{data.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{formatCost(data.labour)}</td>
                                                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{formatCost(data.investment)}</td>
                                                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{formatCost(data.expenses)}</td>
                                                <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-500 tabular-nums italic md:not-italic">{formatCost(data.contingency)}</td>
                                                <td className={`px-6 py-3.5 text-right bg-blue-50/10 transition-colors group-hover:bg-blue-100/20 italic md:not-italic`}>
                                                    <div className="flex flex-col items-end italic md:not-italic">
                                                        <span className="font-black text-slate-900 text-sm tabular-nums italic md:not-italic">{formatCost(data.total)}</span>
                                                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter italic md:not-italic">{pctOfTotal.toFixed(1)}% weight</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                            <tfoot className="italic md:not-italic">
                                <tr className="bg-slate-900 text-white font-black italic md:not-italic">
                                    <td colSpan={2} className="px-6 py-6 text-[10px] uppercase tracking-[0.2em] text-slate-500 italic md:not-italic pl-8">Consolidated Segment Total</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm italic md:not-italic">{grandTotal.workforce.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm italic md:not-italic">{formatCost(grandTotal.labour)}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm italic md:not-italic">{formatCost(grandTotal.investment)}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm italic md:not-italic">{formatCost(grandTotal.expenses)}</td>
                                    <td className="px-4 py-6 text-right font-mono text-sm italic md:not-italic">{formatCost(grandTotal.contingency)}</td>
                                    <td className="px-6 py-6 text-right bg-white/10 italic md:not-italic">
                                        <div className="text-2xl font-black text-amber-400 tabular-nums italic md:not-italic">{formatCost(grandTotal.total)}</div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic md:not-italic">Liability ({currency})</div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Methodology Context */}
            <div className="flex flex-col md:flex-row gap-6 p-6 glass rounded-2xl border border-slate-200/60 text-xs text-slate-500 italic md:not-italic">
                <div className="flex-1 space-y-2 italic md:not-italic">
                    <h5 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px] italic md:not-italic">
                        <Info size={14} className="text-blue-500" />
                        L3 Detail Resolution
                    </h5>
                    <p className="leading-relaxed italic md:not-italic">
                        Level 3 provides the finest granularity in the ISDC hierarchy. Costs are aggregated by unique <span className="text-blue-600 font-bold uppercase tracking-tight italic md:not-italic">XX.YYYY</span> identifiers assigned to individual inventory records.
                    </p>
                </div>
                <div className="flex-1 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-start gap-3 italic md:not-italic">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 italic md:not-italic">
                        <Activity size={16} />
                    </div>
                    <div className="italic md:not-italic">
                        <h6 className="font-bold text-blue-800 text-[10px] uppercase tracking-wider mb-1 italic md:not-italic">Database Integrity</h6>
                        <p className="text-[10px] text-blue-700/80 leading-snug italic md:not-italic">
                            Report excludes records tagged as inactive. Verify item activation status in the <span className="font-bold border-b border-blue-500/30">Inventory management</span> pane.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
