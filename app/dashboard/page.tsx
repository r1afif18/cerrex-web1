// Dashboard home - Glassmorphism UI
'use client'

import Link from 'next/link'
import {
    Terminal,
    DollarSign,
    Database,
    Shield, // Changed from ShieldCheck to Shield
    BarChart3,
    Settings, // Changed from Settings2 to Settings
    Layers,
    LayoutDashboard, // Added LayoutDashboard
    ArrowRight // Keep ArrowRight as it's used
} from 'lucide-react'

export default function DashboardHome() {
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Hero Section - Premium Animated Design */}
            <div className="relative overflow-hidden p-8 rounded-[2rem] border border-white/10 shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                {/* Animated Background Orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 blur-[100px] rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-500/25 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-cyan-500/20 blur-[60px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                    {/* Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-start justify-between">
                        {/* Left Content */}
                        <div className="max-w-xl">
                            {/* Version Badge */}
                            <div className="inline-flex items-center gap-3 mb-6">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 backdrop-blur-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.25em]">CERREX v1.0 Beta</span>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">2026 Edition</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl font-black text-white tracking-tight mb-4 leading-[1.1]">
                                Nuclear Decommissioning
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Cost Intelligence</span>
                            </h1>

                            {/* Description */}
                            <p className="text-sm text-slate-400 leading-relaxed font-medium max-w-md mb-6">
                                Advanced ISDC-based estimation platform with real-time risk analysis, component tracking, and automated cost projection workflows.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-3">
                                <Link href="/dashboard/inv" className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]">
                                    Launch Inventory
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/dashboard/lists" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all backdrop-blur-sm">
                                    View Master Data
                                </Link>
                            </div>
                        </div>

                        {/* Right Side - Decorative Stats */}
                        <div className="hidden lg:flex flex-col gap-3">
                            <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center min-w-[140px]">
                                <div className="text-3xl font-black text-white mb-1">ISDC</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Standard</div>
                            </div>
                            <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-400/20 backdrop-blur-md text-center">
                                <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">∞</div>
                                <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Precision</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Credit */}
                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] font-medium text-slate-500">
                            <Terminal size={12} className="text-slate-600" />
                            <span>Intelligence Control Room</span>
                        </div>
                        <div className="text-[9px] font-medium text-slate-600">
                            Created by <span className="text-slate-400 font-bold">Rafif Sudanta</span> • © 2026
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Exposure"
                    value="$642.5k"
                    subtitle="Aggregated ISDC"
                    icon={DollarSign}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    trend="+12.3%"
                />
                <StatCard
                    title="Inventory"
                    value="1,280"
                    subtitle="Active Components"
                    icon={Database}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    trend="+56"
                />
                <StatCard
                    title="Risk Level"
                    value="Low"
                    subtitle="Validation Score"
                    icon={Shield}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    trend="Stable"
                />
                <StatCard
                    title="Variables"
                    value="42"
                    subtitle="Active Parameters"
                    icon={BarChart3}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    trend="Ready"
                />
            </div>

            {/* Quick Links Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <QuickLinkCard
                    title="Variable Setups"
                    desc="Define unit factors and labor rates"
                    icon={Settings}
                    href="/dashboard/unit-factors"
                    accent="blue"
                />
                <QuickLinkCard
                    title="Master Data"
                    desc="Manage radionuclides and materials"
                    icon={Layers}
                    href="/dashboard/lists"
                    accent="indigo"
                />
                <QuickLinkCard
                    title="Facility Inventory"
                    desc="Configure room-by-room inventory"
                    icon={LayoutDashboard}
                    href="/dashboard/inventory"
                    accent="emerald"
                />
            </div>
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg, trend }: any) {
    return (
        <div className="glass-panel p-5 group hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${bg} ${color} transition-transform group-hover:scale-110 duration-500`}>
                    <Icon size={18} />
                </div>
                <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {trend}
                </div>
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-0.5">{value}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <div className="mt-2 h-1 w-8 bg-slate-100 rounded-full group-hover:w-full transition-all duration-700"></div>
            </div>
        </div>
    )
}

function QuickLinkCard({ title, desc, icon: Icon, href, accent }: any) {
    const accents: any = {
        blue: "hover:border-blue-200 hover:shadow-blue-500/5",
        indigo: "hover:border-indigo-200 hover:shadow-indigo-500/5",
        emerald: "hover:border-emerald-200 hover:shadow-emerald-500/5"
    }

    return (
        <Link
            href={href}
            className={`glass-panel p-6 flex flex-col items-center text-center group transition-all duration-500 hover:-translate-y-1 ${accents[accent]}`}
        >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-blue-400 transition-all duration-500 mb-4 shadow-sm">
                <Icon size={20} />
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-2">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[180px]">
                {desc}
            </p>
        </Link>
    )
}
