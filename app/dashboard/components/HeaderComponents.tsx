'use client'

import { useProject } from '@/lib/context/ProjectContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus, Trash2, LogOut, ChevronsUpDown, Check, X, FolderOpen } from 'lucide-react'

// ============================================================================
// PROJECT SELECTOR - Uses Portal for robust dropdown positioning
// ============================================================================

export function ProjectSelector() {
    const { projects, currentProject, selectProject, createProject, deleteProject, isLoading } = useProject()
    const [showNewProject, setShowNewProject] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [creating, setCreating] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [mounted, setMounted] = useState(false)

    // Wait for client-side mount for Portal
    useEffect(() => {
        setMounted(true)
    }, [])

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
            })
        }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
                setShowNewProject(false)
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return
        setCreating(true)
        try {
            await createProject(newProjectName.trim())
            setNewProjectName('')
            setShowNewProject(false)
        } catch (err) {
            console.error('Failed to create project:', err)
            alert('Failed to create project: ' + (err as Error).message)
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteProject = async () => {
        if (!currentProject) return
        if (!confirm(`Delete project "${currentProject.name}" and ALL its data? This cannot be undone.`)) return
        setIsOpen(false)
        try {
            await deleteProject(currentProject.id)
        } catch (err) {
            console.error('Failed to delete project:', err)
            alert('Failed to delete project: ' + (err as Error).message)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-500 font-medium">Loading...</span>
            </div>
        )
    }

    // Create Project Form
    if (showNewProject) {
        return (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-lg">
                <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New project name..."
                    className="px-3 py-2 bg-transparent text-sm w-48 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject()
                        if (e.key === 'Escape') setShowNewProject(false)
                    }}
                />
                <button
                    onClick={handleCreateProject}
                    disabled={creating || !newProjectName.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={16} />}
                </button>
                <button
                    onClick={() => { setShowNewProject(false); setNewProjectName('') }}
                    className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        )
    }

    // Dropdown Menu Portal Content
    const dropdownContent = isOpen && mounted ? createPortal(
        <>
            {/* Full screen backdrop */}
            <div
                className="fixed inset-0 z-[99998]"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
                onClick={() => setIsOpen(false)}
            />

            {/* Dropdown panel */}
            <div
                className="fixed z-[99999] w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                }}
            >
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FolderOpen size={14} className="text-indigo-500" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Projects</span>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs font-bold rounded-full">
                            {projects.length}
                        </span>
                    </div>
                </div>

                {/* Project List */}
                <div className="max-h-64 overflow-y-auto">
                    {projects.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                            <div className="text-slate-400 text-sm">No projects yet</div>
                            <div className="text-slate-300 text-xs mt-1">Create your first project below</div>
                        </div>
                    ) : (
                        projects.map(p => (
                            <button
                                key={p.id}
                                onClick={() => { selectProject(p); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${currentProject?.id === p.id
                                        ? 'bg-indigo-50 border-l-4 border-indigo-500'
                                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                                    }`}
                            >
                                <span className={`text-sm font-medium truncate ${currentProject?.id === p.id ? 'text-indigo-700' : 'text-slate-700'
                                    }`}>
                                    {p.name}
                                </span>
                                {currentProject?.id === p.id && (
                                    <Check size={16} className="text-indigo-600 shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 p-2 bg-slate-50 space-y-1">
                    <button
                        onClick={() => { setShowNewProject(true); setIsOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        Create New Project
                    </button>
                    {currentProject && (
                        <button
                            onClick={handleDeleteProject}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete "{currentProject.name}"
                        </button>
                    )}
                </div>
            </div>
        </>,
        document.body
    ) : null

    return (
        <>
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all font-semibold text-sm ${currentProject
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
            >
                <span className="truncate max-w-[140px]">
                    {currentProject ? currentProject.name : 'Select Project'}
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Render dropdown via Portal */}
            {dropdownContent}
        </>
    )
}

// ============================================================================
// USER MENU
// ============================================================================

export function UserMenu({ customClass }: { customClass?: string }) {
    const supabase = createClient()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState('Estimator')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) setUserEmail(user.email)
        }
        getUser()
    }, [supabase])

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setLoading(true)
        await supabase.auth.signOut()
        document.cookie = 'cerrex_passcode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        router.push('/gate')
    }

    if (customClass) {
        return (
            <div className="relative group">
                <button className={customClass}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {userEmail.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold text-slate-900 truncate">{userEmail.split('@')[0]}</div>
                        <div className="text-xs text-slate-500">Estimator</div>
                    </div>
                    <ChevronsUpDown size={16} className="text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 mb-1">
                        Signed in as<br />
                        <strong className="text-slate-900">{userEmail}</strong>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={16} />
                        {loading ? 'Signing out...' : 'Sign Out'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium shadow-sm transition-colors"
        >
            <LogOut size={16} />
            {loading ? '...' : 'Logout'}
        </button>
    )
}
