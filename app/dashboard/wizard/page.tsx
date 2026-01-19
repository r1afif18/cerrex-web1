'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    Wand2,
    Plus,
    ChevronRight,
    Calendar,
    Loader2,
    FolderOpen,
    AlertCircle
} from 'lucide-react';

interface Project {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface WizardSession {
    project_id: string;
    current_step: number;
    status: string;
}

export default function WizardSelectorPage() {
    const router = useRouter();
    const supabase = createClient();

    const [projects, setProjects] = useState<Project[]>([]);
    const [wizardSessions, setWizardSessions] = useState<Map<string, WizardSession>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        setIsLoading(true);
        try {
            // Load projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .order('updated_at', { ascending: false });

            if (projectsError) throw projectsError;
            setProjects(projectsData || []);

            // Load wizard sessions
            const { data: sessionsData } = await supabase
                .from('wizard_sessions')
                .select('*');

            const sessionsMap = new Map<string, WizardSession>();
            sessionsData?.forEach((session: WizardSession) => {
                sessionsMap.set(session.project_id, session);
            });
            setWizardSessions(sessionsMap);

        } catch (err) {
            console.error('Error loading projects:', err);
            setError('Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateProject() {
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            // Create project
            const { data: project, error: createError } = await supabase
                .from('projects')
                .insert({
                    name: newProjectName.trim(),
                    reference_currency: 'EUR',
                    national_currency: 'IDR',
                    reference_year: new Date().getFullYear(),
                })
                .select()
                .single();

            if (createError) throw createError;

            // Navigate to wizard
            router.push(`/dashboard/wizard/${project.id}`);

        } catch (err) {
            console.error('Error creating project:', err);
            setError('Failed to create project');
            setIsCreating(false);
        }
    }

    function getStepLabel(step: number): string {
        const steps = ['Context', 'ISDC', 'Inventory', 'Waste', 'UF', 'Period', 'Contingency', 'Results', 'Cashflow', 'Sensitivity'];
        return steps[step] || 'Unknown';
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-slate-500">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-100/40 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                        <Wand2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cost Estimation Wizard</h1>
                    <p className="text-slate-500 mt-3 max-w-lg mx-auto">
                        Create a new project or continue an existing estimation using the ISDC methodology.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Create New Project */}
                <div className="glass-panel rounded-2xl p-6 mb-8">
                    {!showCreateForm ? (
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                        >
                            <Plus size={20} />
                            <span className="font-semibold">Create New Project</span>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g., TRIGA MARK II Decommissioning"
                                    className="glass-input w-full px-4 py-3 rounded-xl"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim() || isCreating}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isCreating ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Wand2 size={18} />
                                            Start Wizard
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewProjectName('');
                                    }}
                                    className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Existing Projects */}
                {projects.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FolderOpen size={20} className="text-slate-400" />
                            Existing Projects
                        </h2>

                        <div className="space-y-3">
                            {projects.map((project) => {
                                const session = wizardSessions.get(project.id);
                                const hasSession = !!session;
                                const currentStep = session?.current_step || 0;

                                return (
                                    <button
                                        key={project.id}
                                        onClick={() => router.push(`/dashboard/wizard/${project.id}`)}
                                        className="w-full glass-panel rounded-xl p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                                    {project.name}
                                                </h3>
                                                {project.description && (
                                                    <p className="text-sm text-slate-500 mt-1 truncate">{project.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(project.updated_at).toLocaleDateString()}
                                                    </span>
                                                    {hasSession && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                                                            Step {currentStep}: {getStepLabel(currentStep)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="ml-4 flex items-center gap-3">
                                                {hasSession ? (
                                                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                                                        Continue
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                                        Start
                                                    </span>
                                                )}
                                                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {projects.length === 0 && !showCreateForm && (
                    <div className="text-center py-12">
                        <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No projects yet. Create your first project to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
