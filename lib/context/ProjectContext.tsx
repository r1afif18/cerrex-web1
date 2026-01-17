'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { seedProjectDefaults } from '@/lib/supabase/seed-defaults'
import type { Project } from '@/lib/supabase/types'

interface ProjectContextType {
    projects: Project[]
    currentProject: Project | null
    isLoading: boolean
    error: string | null
    selectProject: (project: Project) => void
    createProject: (name: string, description?: string) => Promise<Project>
    deleteProject: (id: string) => Promise<void>
    refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([])
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // Load projects on mount
    useEffect(() => {
        loadProjects()
    }, [])

    // Load saved project from localStorage
    useEffect(() => {
        if (projects.length > 0 && !currentProject) {
            const savedProjectId = localStorage.getItem('cerrex_current_project')
            if (savedProjectId) {
                const saved = projects.find(p => p.id === savedProjectId)
                if (saved) {
                    setCurrentProject(saved)
                }
            }
        }
    }, [projects, currentProject])

    async function loadProjects() {
        setIsLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setProjects(data || [])
        } catch (err) {
            console.error('Error loading projects:', err)
            setError('Failed to load projects')
        } finally {
            setIsLoading(false)
        }
    }

    function selectProject(project: Project) {
        setCurrentProject(project)
        localStorage.setItem('cerrex_current_project', project.id)
    }

    async function createProject(name: string, description?: string): Promise<Project> {
        let userId: string | undefined = undefined
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) userId = user.id
        } catch (e) {
            console.warn('Silent user check failed, proceeding without user_id')
        }

        const { data, error: insertError } = await supabase
            .from('projects')
            .insert({
                user_id: userId,
                name,
                description,
                reference_currency: 'USD',
                national_currency: 'EUR',
                reference_labour_rate: 50,
                reference_year: 2017,
                original_year: 1997,
                total_bdf: 1.0,
                inflation_rate: 0.02,
                working_hours_per_year: 1800,
                contingency_enabled: true,
                currency_in_thousands: false,
                wdf_global_multiplier: 1.5,
                expenses_pct_contractor: 15,
                expenses_pct_owner: 12,
            })
            .select()
            .single()

        if (insertError) throw insertError

        // Auto-seed all default master data
        await seedProjectDefaults(supabase, data.id)

        setProjects(prev => [data, ...prev])
        selectProject(data)

        return data
    }

    async function deleteProject(id: string) {
        const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (deleteError) throw deleteError

        setProjects(prev => prev.filter(p => p.id !== id))

        if (currentProject?.id === id) {
            setCurrentProject(null)
            localStorage.removeItem('cerrex_current_project')
        }
    }

    async function refreshProjects() {
        await loadProjects()
    }

    return (
        <ProjectContext.Provider
            value={{
                projects,
                currentProject,
                isLoading,
                error,
                selectProject,
                createProject,
                deleteProject,
                refreshProjects,
            }}
        >
            {children as any}
        </ProjectContext.Provider>
    ) as any
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider')
    }
    return context
}
