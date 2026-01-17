// Landing page - CERREX Web
// Premium Glassmorphism UI - v1.0 Beta

import Link from 'next/link'
import { Database, Activity, LayoutGrid, Zap, ChevronRight, Atom } from 'lucide-react'

export default function Home() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-400/10 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-indigo-400/10 blur-[80px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Header - Compact */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Atom size={16} className="text-white" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">CERREX</span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">v1.0 Beta</span>
        </div>
        <span className="text-xs font-medium text-slate-400">Nuclear Decommissioning Suite</span>
      </header>

      {/* Main Content - Compact */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-4xl mx-auto space-y-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wide">
            <Zap size={12} />
            ISDC-Based Cost Estimation
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Nuclear Decommissioning
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Cost Intelligence</span>
          </h1>

          {/* Description */}
          <p className="max-w-xl mx-auto text-slate-500 text-sm font-medium leading-relaxed">
            Professional D&D cost estimation platform built on ISDC methodology.
            Manage inventories, calculate WDFs, and generate comprehensive reports.
          </p>

          {/* CTA Button */}
          <div className="pt-2">
            <Link
              href="/gate"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all group"
            >
              Launch Application
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Features Grid - Compact */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-all group text-left">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3 shadow shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Database size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Supabase Backend</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Real-time sync across 18+ modules</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-all group text-left">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-3 shadow shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Activity size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">ISDC Compliant</h3>
              <p className="text-slate-400 text-xs leading-relaxed">OECD/NEA standard structure</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-all group text-left">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3 shadow shadow-slate-900/20 group-hover:scale-105 transition-transform">
                <LayoutGrid size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Premium UI</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Clean, professional interface</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Compact */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="font-bold">CERREX v1.0 Beta</span>
            <span>•</span>
            <span>2026</span>
          </div>
          <span className="text-xs text-slate-400">
            Created by <span className="font-bold text-slate-500">Rafif Sudanta</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
