// Dashboard layout with Glassmorphism UI
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProjectProvider } from '@/lib/context/ProjectContext'
import { CerrexProvider } from '@/lib/context/CerrexContext'
import { ProjectSelector, UserMenu } from './components/HeaderComponents'
import {
    Hexagon,
    LayoutDashboard,
    Calendar,
    Boxes,
    Calculator,
    ScrollText,
    Settings2,
    ChevronsUpDown,
    FolderOpen,
    ChevronDown,
    Search,
    Bell,
    Menu,
    Database,
    Activity,
    BarChart3,
    Clock,
    Shield,
    Brain,
    Bot
} from 'lucide-react'

// Navigation Interface
interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    category: 'Project' | 'Estimation' | 'System' | 'Reports' | 'Intelligence'
}

const navItems: NavItem[] = [
    // Intelligence (New Category for high-level overview)
    { name: 'Control Room', href: '/dashboard', icon: Brain, category: 'Intelligence' },
    { name: 'AI Chat', href: '/dashboard/intelligence', icon: Bot, category: 'Intelligence' },

    // Project
    { name: 'Summary (L0)', href: '/dashboard/l0', icon: BarChart3, category: 'Project' },
    { name: 'Time Critical', href: '/dashboard/schdl', icon: Clock, category: 'Project' },
    { name: 'Liquidity', href: '/dashboard/cshfl', icon: Calendar, category: 'Project' },

    // Estimation
    { name: 'Asset Inventory', href: '/dashboard/inv', icon: Boxes, category: 'Estimation' },
    { name: 'Infrastructure', href: '/dashboard/bld', icon: Shield, category: 'Estimation' },
    { name: 'ISDC Engine', href: '/dashboard/isdc', icon: Calculator, category: 'Estimation' },
    { name: 'Sensitivity', href: '/dashboard/inv-sa', icon: Activity, category: 'Estimation' },

    // Reports
    { name: 'Report Tier 1', href: '/dashboard/isdc-l1', icon: ScrollText, category: 'Reports' },
    { name: 'Report Tier 2', href: '/dashboard/isdc-l2', icon: ScrollText, category: 'Reports' },
    { name: 'Report Tier 3', href: '/dashboard/isdc-l3', icon: ScrollText, category: 'Reports' },

    // System
    { name: 'Parameters', href: '/dashboard/general', icon: Settings2, category: 'System' },
    { name: 'Unit Factors', href: '/dashboard/uf', icon: Database, category: 'System' },
    { name: 'Nuclide Library', href: '/dashboard/rnd', icon: Activity, category: 'System' },
    { name: 'Master Data', href: '/dashboard/lists', icon: Settings2, category: 'System' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const renderNavSection = (category: string) => {
        const items = navItems.filter(item => item.category === category)
        if (items.length === 0) return null

        return (
            <div className="mb-6">
                <div className="px-5 mb-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {category}
                </div>
                <div className="space-y-0.5 px-2">
                    {items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                                    }
                                `}
                            >
                                <Icon
                                    size={14}
                                    className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-900'}`}
                                />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <ProjectProvider>
            <CerrexProvider>
                <div className="flex h-screen w-full bg-[#f8fafc] text-sm overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
                    {/* SIDEBAR */}
                    <aside className="w-[240px] bg-slate-50/50 backdrop-blur-xl flex flex-col z-20 flex-shrink-0 border-r border-slate-200/60 shadow-2xl">
                        {/* Brand */}
                        <div className="h-14 flex items-center px-6 border-b border-slate-200/40">
                            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center mr-3 shadow-2xl shadow-slate-900/30 rotate-3">
                                <Hexagon size={14} className="text-blue-400" />
                            </div>
                            <div>
                                <span className="block font-black text-base tracking-tighter text-slate-900 leading-none">CERREX</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">v1.0 Beta</span>
                            </div>
                        </div>

                        {/* Nav */}
                        <div className="flex-1 overflow-y-auto py-5 custom-scrollbar">
                            {renderNavSection('Intelligence')}
                            {renderNavSection('Project')}
                            {renderNavSection('Estimation')}
                            {renderNavSection('Reports')}
                            {renderNavSection('System')}
                        </div>

                        {/* User Profile */}
                        <div className="p-4 border-t border-slate-200/40 bg-slate-900/5 mt-auto">
                            <UserMenu customClass="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white transition-all text-left shadow-sm hover:shadow-md border border-transparent hover:border-slate-200/60" />
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
                        {/* Mesh Gradient Backdrop */}
                        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
                            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px]"></div>
                            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px]"></div>
                        </div>

                        {/* Topbar */}
                        <header className="h-14 flex items-center justify-between px-8 border-b border-slate-200/40 bg-white/40 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                    <FolderOpen size={12} className="mr-2.5 text-blue-500" />
                                    <span>Workspace</span>
                                    <span className="mx-3 text-slate-200">|</span>
                                    <ProjectSelector />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Version Badge */}
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">v1.0 Beta</span>
                                </div>
                                <button className="md:hidden p-2 rounded-xl text-slate-500 bg-white shadow-sm">
                                    <Menu size={18} />
                                </button>
                            </div>
                        </header>

                        {/* Scrollable Page Content */}
                        <div className="flex-1 overflow-auto p-8 md:p-12 scroll-smooth custom-scrollbar relative z-10">
                            {children}
                        </div>
                    </main>
                </div>
            </CerrexProvider>
        </ProjectProvider>
    )
}
