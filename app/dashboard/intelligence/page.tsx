'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, Brain, Info, Database } from 'lucide-react'
import { useProject } from '@/lib/context/ProjectContext'
import { useCerrex } from '@/lib/context/CerrexContext'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function IntelligencePage() {
    const { currentProject } = useProject()
    const { data } = useCerrex()
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'CERREX Intelligence online. I have access to your current project data. How can I assist with your decommissioning estimation today?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    projectId: currentProject?.id
                })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `[ERROR] Intelligence Link Severed: ${err.message}` }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Intelligence <span className="text-indigo-600">Core</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                        <Sparkles size={12} className="text-indigo-500" />
                        Context-Aware Neural Processor
                    </p>
                </div>
                {currentProject && (
                    <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                        <Database size={14} className="text-indigo-600" />
                        <div>
                            <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Context Injector</div>
                            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{currentProject.name}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Container */}
            <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden bg-white/60">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-indigo-600 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-slate-900 text-slate-100 rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex flex-col gap-4 justify-start">
                            <div className="flex gap-4 max-w-[80%]">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    Analyzing Project Matrix...
                                </div>
                            </div>
                            <div className="flex gap-2 ml-12">
                                <button
                                    type="button"
                                    onClick={() => setInput("What is the total manpower for this project?")}
                                    className="px-4 py-2 bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 rounded-xl text-xs font-semibold transition-all border border-slate-200/50"
                                >
                                    Manpower Analysis
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInput("Summarize the hazardous inventory.")}
                                    className="px-4 py-2 bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 rounded-xl text-xs font-semibold transition-all border border-slate-200/50"
                                >
                                    Hazmat Summary
                                </button>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about project costs, unit factors, or inventory..."
                            className="w-full pl-6 pr-24 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                        >
                            <Send size={14} />
                            Transmit
                        </button>
                    </form>
                    <div className="mt-3 flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">ISDC Lookup</button>
                            <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Risk Summary</button>
                        </div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
                            Encrypted Neural Link Active
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
