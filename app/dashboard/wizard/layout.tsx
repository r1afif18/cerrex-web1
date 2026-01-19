'use client';

import { ReactNode } from 'react';
import { Hexagon, X, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface WizardLayoutProps {
    children: ReactNode;
}

export default function WizardLayout({ children }: WizardLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[150px]" />
                <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-emerald-100/30 rounded-full blur-[150px]" />
            </div>

            {/* Wizard Header */}
            <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
                    {/* Logo & Title */}
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20 rotate-3">
                            <Hexagon size={18} className="text-blue-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl tracking-tight text-slate-900">CERREX</span>
                            <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                                Wizard
                            </span>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Help Button */}
                        <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                            <HelpCircle size={18} />
                            <span className="hidden sm:inline">Help</span>
                        </button>

                        {/* Divider */}
                        <div className="h-6 w-px bg-slate-200" />

                        {/* Exit Button */}
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                        >
                            <X size={18} />
                            <span className="hidden sm:inline">Exit Wizard</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Wizard Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm mt-auto">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>CERREX - Nuclear Decommissioning Cost Estimation</span>
                        <span>Based on ISDC Methodology</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
