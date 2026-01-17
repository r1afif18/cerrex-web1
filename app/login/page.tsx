// Login page - CERREX Web
// Premium Glassmorphism UI

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Hexagon, Loader2, ShieldCheck, Mail, Lock, ChevronRight, Zap } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/40 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full max-w-[440px] animate-in fade-in zoom-in duration-500">
                {/* Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-900/10 mb-6 transform hover:scale-105 transition-all cursor-default">
                        <Hexagon size={32} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500 text-sm font-medium">Enter project credentials for secure access</p>
                </div>

                {/* Login Card */}
                <div className="glass p-8 md:p-10 rounded-[32px] border border-white/60 shadow-2xl backdrop-blur-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                <Mail size={12} className="text-blue-500" />
                                Email Identity
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-2xl text-slate-800 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                placeholder="user@cerrex.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                <Lock size={12} className="text-blue-500" />
                                Access Key
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input w-full px-4 py-3 rounded-2xl text-slate-800 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-[11px] font-bold p-3 rounded-xl border border-red-100 text-center animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    Verify & Enter
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        <ShieldCheck size={12} />
                        AES-256 Vault Encryption Active
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                        Proprietary software of CERREX Industrial © 2024
                    </p>
                </div>
            </div>
        </div>
    )
}
