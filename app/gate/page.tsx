'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export default function GatePage() {
    const [passcode, setPasscode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Check for passcode cookie on mount
        const hasPasscode = document.cookie.split('; ').find(row => row.startsWith('cerrex_passcode='))?.split('=')[1] === 'verified'
        if (hasPasscode) {
            setIsVerified(true)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/verify-passcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            })

            const data = await res.json()

            if (data.success) {
                router.push('/dashboard')
            } else {
                setError('Invalid passcode')
            }
        } catch {
            setError('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleQuickEnter = () => {
        router.push('/dashboard')
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] overflow-hidden relative">
            {/* Background graphics */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[50%] rounded-full bg-indigo-100/40 blur-[100px]"></div>
            </div>

            <div className="relative w-full max-w-[420px] p-6 z-10 animate-in fade-in zoom-in duration-700">
                <div className="bg-white/20 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/40 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-6 transform transition-all duration-500 ${isVerified ? 'bg-emerald-500 scale-110' : 'bg-slate-900 hover:scale-105'}`}>
                            {isVerified ? (
                                <CheckCircle2 size={32} className="text-white animate-in zoom-in duration-300" />
                            ) : (
                                <ShieldCheck size={32} strokeWidth={1.5} className="text-white" />
                            )}
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            {isVerified ? 'Access Granted' : 'Security Portal'}
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">
                            {isVerified ? 'Session already verified' : 'Cerrex Estimation System'}
                        </p>
                    </div>

                    {/* Content Section */}
                    {isVerified ? (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex flex-col items-center text-center gap-2">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Authorized Access Active</p>
                                <p className="text-[10px] text-emerald-600/70 font-medium">Your device is registered and authenticated.</p>
                            </div>
                            <button
                                onClick={handleQuickEnter}
                                className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 flex items-center justify-center gap-3 group"
                            >
                                <span>Enter Workspace</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setIsVerified(false)}
                                className="w-full text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                Need to re-enter passcode?
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="passcode" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                                    Security Passcode
                                </label>
                                <input
                                    type="password"
                                    id="passcode"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-4 bg-white/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-center text-xl tracking-[0.5em]"
                                    required
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center gap-3 animate-in shake duration-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span className="uppercase tracking-widest">Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="uppercase tracking-widest text-sm">Verify & Enter</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-10 text-center border-t border-slate-100 pt-6">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            Restricted Access Level 4
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                <p className="text-center text-[10px] text-slate-400/60 mt-8 font-bold uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} CERREX Web System v2.5
                </p>
            </div>
        </div>
    )
}

