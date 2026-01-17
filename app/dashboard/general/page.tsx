'use client'

import React, { useState, useEffect } from 'react'
import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import {
    Info,
    BarChart3,
    Edit,
    Save,
    X,
    Globe,
    Calendar,
    CircleDollarSign,
    Layers,
    Database,
    Binary,
    Users,
    Cpu,
    Box,
    Building2,
    Trash2,
    AlertCircle,
    ChevronRight,
    Plus,
    Check
} from 'lucide-react'

import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    cloneProject
} from '@/lib/supabase/queries'

export default function GeneralPage() {
    const projectContext = useProject()
    const { currentProject, refreshProjects } = projectContext
    const supabase = createClient()
    const [stats, setStats] = useState({
        currencies: 0,
        ddCategories: 0,
        radionuclides: 0,
        professions: 0,
        techSystems: 0,
        materials: 0,
        buildings: 0,
        wasteCategories: 0
    })
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [duplicating, setDuplicating] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmName, setConfirmName] = useState('')
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null })

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        reference_currency: 'USD',
        national_currency: 'EUR',
        reference_year: '2017',
        reference_labour_rate: '50',
        default_contractor_rate: '15'
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (currentProject) {
            loadStats()
            setFormData({
                name: currentProject.name,
                description: currentProject.description || '',
                reference_currency: currentProject.reference_currency,
                national_currency: currentProject.national_currency,
                reference_year: String(currentProject.reference_year),
                reference_labour_rate: String(currentProject.reference_labour_rate || 50),
                default_contractor_rate: String(currentProject.default_contractor_rate || 15),
            })
        }
    }, [currentProject?.id])

    async function loadStats() {
        if (!currentProject) return
        setLoading(true)
        const projectId = currentProject.id

        const [currencies, ddCats, rnd, profs, techs, mats, blds, wmCats] = await Promise.all([
            supabase.from('currencies').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('dd_categories').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('radionuclides').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('professions').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('tech_systems').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('materials').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('buildings').select('id', { count: 'exact' }).eq('project_id', projectId),
            supabase.from('waste_categories').select('id', { count: 'exact' }).eq('project_id', projectId),
        ])

        setStats({
            currencies: currencies.count || 0,
            ddCategories: ddCats.count || 0,
            radionuclides: rnd.count || 0,
            professions: profs.count || 0,
            techSystems: techs.count || 0,
            materials: mats.count || 0,
            buildings: blds.count || 0,
            wasteCategories: wmCats.count || 0,
        })
        setLoading(false)
    }

    async function handleSave() {
        if (!currentProject) return
        setSaving(true)
        try {
            await updateProject(currentProject.id, {
                name: formData.name,
                description: formData.description,
                reference_currency: formData.reference_currency,
                national_currency: formData.national_currency,
                reference_year: parseInt(formData.reference_year) || 2017,
                reference_labour_rate: parseFloat(formData.reference_labour_rate) || 50,
                default_contractor_rate: parseFloat(formData.default_contractor_rate) || 15,
            })
            await refreshProjects()
            setEditing(false)
            showStatus('Project configuration updated successfully.', 'success')
        } catch (e) {
            showStatus('Failed to update project.', 'error')
        } finally {
            setSaving(false)
        }
    }

    async function handleClone() {
        if (!currentProject) return
        setDuplicating(true)
        try {
            const newName = `${currentProject.name} (Copy)`
            await cloneProject(currentProject.id, newName)
            await refreshProjects()
            showStatus('Project duplicated successfully.', 'success')
        } catch (e) {
            showStatus('Failed to duplicate project.', 'error')
        } finally {
            setDuplicating(false)
        }
    }

    async function handleDelete() {
        if (!currentProject) return
        if (confirmName !== currentProject.name) {
            showStatus('Confirmation name does not match.', 'error')
            return
        }
        setSaving(true)
        try {
            await deleteProject(currentProject.id)
            await refreshProjects()
            setDeleting(false)
            setConfirmName('')
            showStatus('Project permanently deleted.', 'success')
        } catch (e) {
            showStatus('Failed to delete project.', 'error')
        } finally {
            setSaving(false)
        }
    }

    function showStatus(text: string, type: 'success' | 'error') {
        setStatusMessage({ text, type })
        setTimeout(() => setStatusMessage({ text: '', type: null }), 3000)
    }

    if (!currentProject) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-3xl p-12 text-center italic md:not-italic">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-300">
                    <Globe size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter italic md:not-italic">Initialize Workspace</h2>
                <p className="text-slate-500 max-w-sm mb-8 tracking-tight italic md:not-italic font-medium">Select an existing project from the dashboard header or create a new data environment to begin decommissioning analysis.</p>
                <div className="flex gap-4">
                    <Link href="/" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 italic md:not-italic">
                        <Plus size={18} /> Create First Project
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 italic md:not-italic pb-12">
            {/* Status Notification */}
            {statusMessage.type && (
                <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-6 duration-500 glass
                    ${statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}
                `}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <span className="font-bold text-sm tracking-tight">{statusMessage.text}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic md:not-italic">Project Governance</h1>
                    <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-[0.3em] italic md:not-italic opacity-50">Infrastructure Audit & Configuration Ledger</p>
                </div>
                <div className="flex gap-4">
                    <button
                        className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-600 hover:text-slate-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-xl hover:translate-y-[-2px] active:scale-95 disabled:opacity-50"
                        onClick={handleClone}
                        disabled={duplicating}
                    >
                        {duplicating ? <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" /> : <Layers size={16} />}
                        {duplicating ? 'Cloning...' : 'Clone Project'}
                    </button>
                    {!editing && (
                        <button
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:translate-y-[-2px] active:scale-95 italic md:not-italic"
                            onClick={() => setEditing(true)}
                        >
                            <Edit size={16} /> Edit Parameters
                        </button>
                    )}
                </div>
            </div>

            {/* Project Info Card */}
            <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl relative italic md:not-italic">
                <div className="p-10 space-y-10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
                            <Info size={32} />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight italic md:not-italic">{currentProject.name}</h2>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Certified Environment
                                </span>
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">ID: {currentProject.id.split('-')[0]}</span>
                            </div>
                        </div>
                    </div>

                    {editing ? (
                        <div className="space-y-8 animate-in slide-in-from-left-6 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Legal Project Identifier</label>
                                    <Input value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} className="text-xl font-black" placeholder="Enter project name..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Baseline Year</label>
                                    <Input type="number" value={formData.reference_year} onChange={(e: any) => setFormData({ ...formData, reference_year: e.target.value })} placeholder="e.g. 2017" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Infrastructure Description & Scope</label>
                                <TextArea value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the decommissioning scope..." />
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Audit Currency</label>
                                    <Input value={formData.reference_currency} onChange={(e: any) => setFormData({ ...formData, reference_currency: e.target.value.toUpperCase() })} placeholder="USD" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Local Currency</label>
                                    <Input value={formData.national_currency} onChange={(e: any) => setFormData({ ...formData, national_currency: e.target.value.toUpperCase() })} placeholder="EUR" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ref Labour Rate</label>
                                    <Input type="number" value={formData.reference_labour_rate} onChange={(e: any) => setFormData({ ...formData, reference_labour_rate: e.target.value })} placeholder="50.00" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contingency (%)</label>
                                    <Input type="number" value={formData.default_contractor_rate} onChange={(e: any) => setFormData({ ...formData, default_contractor_rate: e.target.value })} placeholder="15" />
                                </div>
                            </div>

                            <div className="flex gap-5 pt-8 border-t border-slate-100">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-2xl shadow-blue-500/20 hover:scale-105 active:scale-95" onClick={handleSave} disabled={saving}>
                                    {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                                    {saving ? 'Syncing...' : 'Publish Changes'}
                                </button>
                                <button className="px-10 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2" onClick={() => setEditing(false)}>
                                    <X size={18} /> Discard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                            <div className="space-y-10">
                                <div className="space-y-3">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Scope</div>
                                    <p className="text-slate-700 text-base leading-relaxed font-medium italic md:not-italic">
                                        {currentProject.description || "No project-specific parameters have been documented for this environment. Define the infrastructure scope to enable analytical traceability."}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-16">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Establishment</div>
                                        <div className="flex items-center gap-3 text-slate-900 font-black text-sm italic md:not-italic">
                                            <Calendar size={16} className="text-slate-300" />
                                            {new Date(currentProject.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Baseline Fiscal</div>
                                        <div className="flex items-center gap-3 text-slate-900 font-black text-sm italic md:not-italic">
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-600/20" />
                                            FY {currentProject.reference_year} Multiplier Base
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Link href="/dashboard/lists" className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-200/50 hover:border-blue-500/40 hover:bg-white hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-[-4px]">
                                        <ChevronRight size={20} className="text-blue-500" />
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600 uppercase text-[10px] font-black tracking-[0.2em] mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <CircleDollarSign size={16} />
                                        Audit Base
                                    </div>
                                    <div className="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tighter tabular-nums">{currentProject.reference_currency}</div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-3">Ref Valuation Unit</p>
                                </Link>
                                <Link href="/dashboard/lists" className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-200/50 hover:border-emerald-500/40 hover:bg-white hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-[-4px]">
                                        <ChevronRight size={20} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-600 uppercase text-[10px] font-black tracking-[0.2em] mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <Globe size={16} />
                                        National
                                    </div>
                                    <div className="text-4xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tighter tabular-nums">{currentProject.national_currency}</div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-3">Local Ledger Unit</p>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" />
                        Infrastructure Data Audit Matrix
                    </h3>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-40 glass rounded-[2rem] animate-pulse bg-slate-50/20" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatWidget label="Currencies" value={stats.currencies} icon={CircleDollarSign} color="bg-blue-600" href="/dashboard/lists" />
                        <StatWidget label="D&D Classes" value={stats.ddCategories} icon={Layers} color="bg-indigo-600" href="/dashboard/ctgr" />
                        <StatWidget label="WM Protocols" value={stats.wasteCategories} icon={Database} color="bg-emerald-600" href="/dashboard/ctgr" />
                        <StatWidget label="Nuclides" value={stats.radionuclides} icon={Binary} color="bg-rose-600" href="/dashboard/rnd" />
                        <StatWidget label="Professionals" value={stats.professions} icon={Users} color="bg-amber-600" href="/dashboard/lists" />
                        <StatWidget label="Systems" value={stats.techSystems} icon={Cpu} color="bg-violet-600" href="/dashboard/lists" />
                        <StatWidget label="Materiality" value={stats.materials} icon={Box} color="bg-cyan-600" href="/dashboard/lists" />
                        <StatWidget label="Assets/BLD" value={stats.buildings} icon={Building2} color="bg-slate-700" href="/dashboard/bld" />
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="mt-16 space-y-6">
                <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] flex items-center gap-2 px-2">
                    <Trash2 size={18} />
                    Project Mortality Control (Destructive Section)
                </h3>
                <div className="glass p-10 rounded-[3rem] border border-rose-500/20 bg-rose-500/[0.02] shadow-2xl relative overflow-hidden italic md:not-italic">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900 tracking-tight italic md:not-italic">Purge Project Data</h4>
                            <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed italic md:not-italic">
                                Deleting this environment will permanently erase all inventory audit trails, radiological maps, and financial projections. This operation is <span className="text-rose-600 font-bold uppercase tracking-tighter">non-recoverable</span>.
                            </p>
                        </div>
                        {!deleting ? (
                            <button
                                className="px-8 py-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-500/5 hover:shadow-rose-500/20 active:scale-95 italic md:not-italic"
                                onClick={() => setDeleting(true)}
                            >
                                Trigger Integrity Purge
                            </button>
                        ) : (
                            <div className="flex flex-col gap-4 w-full md:w-auto animate-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 italic">Type "{currentProject.name}" to authorize</label>
                                    <Input
                                        value={confirmName}
                                        onChange={(e: any) => setConfirmName(e.target.value)}
                                        placeholder="Confirm project name..."
                                        className="border-rose-300/40 focus:ring-rose-500/30 focus:border-rose-500 !bg-white/90 text-slate-900"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-rose-600/30 disabled:opacity-50 disabled:grayscale italic md:not-italic"
                                        disabled={confirmName !== currentProject.name || saving}
                                        onClick={handleDelete}
                                    >
                                        Authorize Destructive Wipe
                                    </button>
                                    <button className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-slate-900 transition-colors italic md:not-italic" onClick={() => { setDeleting(false); setConfirmName('') }}>Abort</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Compliance Footer */}
            <div className="glass p-8 rounded-[2rem] border border-blue-500/20 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden group italic md:not-italic">
                <div className="absolute inset-0 bg-blue-600/[0.02] active:bg-blue-600/[0.04] transition-colors pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <AlertCircle size={32} />
                </div>
                <div className="space-y-2 text-center md:text-left flex-1">
                    <h5 className="font-black text-slate-900 text-sm uppercase tracking-[0.25em] italic md:not-italic tracking-tighter">System-Wide Logic Authorization</h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold italic md:not-italic leading-relaxed opacity-80">
                        Adjusting baseline parameters such as the <span className="font-bold text-blue-600">Reference Year</span> or <span className="font-bold text-blue-600">Audit Units</span> initiates an automated integrity check. All downstream calculation matrices in the ISDC, Inventory, and Cash Flow layers will be synchronized to ensure <span className="text-slate-900 weight-900 font-black">100% audit accuracy</span> for regulatory submittal.
                    </p>
                </div>
            </div>
        </div>
    )
}

interface StatWidgetProps {
    label: string
    value: number | string
    icon: any
    color: string
    href?: string
}

function StatWidget({ label, value, icon: Icon, color, href }: StatWidgetProps) {
    const content = (
        <div className="glass p-8 rounded-[2rem] border border-slate-200/50 transition-all hover:shadow-2xl hover:translate-y-[-6px] hover:border-blue-500/30 group h-full relative overflow-hidden bg-white/60 backdrop-blur-3xl italic md:not-italic">
            <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-all ${color} bg-opacity-[0.08] group-hover:bg-opacity-100 group-hover:text-white shadow-2xl shadow-transparent group-hover:shadow-${color.split('-')[1]}-500/30`}>
                <Icon size={28} className={`${color.replace('bg-', 'text-')} group-hover:text-white transition-colors duration-500`} />
            </div>
            <div className="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tabular-nums tracking-tighter italic md:not-italic">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <span className={`w-1 h-1 rounded-full ${color}`} /> {label}
            </div>
            {href && (
                <div className="absolute right-6 top-6 text-slate-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2">
                    <ChevronRight size={22} className="group-hover:text-blue-500" />
                </div>
            )}
        </div>
    ) as React.ReactNode

    if (href) {
        return (
            <Link href={href}>
                {content as any}
            </Link>
        )
    }

    return content as any
}

const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`glass-input w-full px-6 py-4 text-sm rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-300 font-bold bg-white/40 border-slate-200/60 shadow-sm ${props.className || ''}`}
    />
)

const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className={`glass-input w-full px-6 py-4 text-sm rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder:text-slate-300 min-h-[140px] font-bold leading-relaxed bg-white/40 border-slate-200/60 shadow-sm ${props.className || ''}`}
    />
)
