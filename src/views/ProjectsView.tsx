import React, { useState, useMemo } from 'react';
import {
    Search, Plus, Filter, Calendar, Users, MapPin,
    CheckSquare, Activity, Image as ImageIcon, ArrowRight, MoreVertical,
    LayoutGrid, List as ListIcon, Briefcase, Clock, Building, AlertTriangle, X, Trash2, Sparkles, TrendingUp, BrainCircuit, AlertCircle, Archive, Tag, SlidersHorizontal
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useProjects } from '@/contexts/ProjectContext';
import { Project, Page } from '@/types';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { AddProjectModal } from '@/components/AddProjectModal';
import { Can } from '@/components/Can';
import { EnhancedProjectCard } from '@/components/EnhancedProjectCard';

interface ProjectsViewProps {
    onProjectSelect?: (projectId: string) => void;
    setPage?: (page: Page) => void;
    autoLaunch?: boolean;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ onProjectSelect, setPage, autoLaunch }) => {
    const { projects, addProject, updateProject, deleteProject, documents } = useProjects();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { canAddResource, currentTenant } = useTenant();
    const { joinRoom, lastMessage } = useWebSocket();

    // Real-time Updates
    React.useEffect(() => {
        joinRoom('all_projects');
    }, [joinRoom]);

    React.useEffect(() => {
        if (lastMessage && lastMessage.type === 'project_updated') {
            addToast(`Project updated: ${lastMessage.payload?.name || 'A project'}`, 'info');
        }
    }, [lastMessage, addToast]);

    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPriority, setFilterPriority] = useState<string>('All');
    const [filterHealth, setFilterHealth] = useState<string>('All');
    const [showArchived, setShowArchived] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'progress' | 'risk' | 'lastActivity'>('lastActivity');

    // Modal States
    const [editingProjectStatus, setEditingProjectStatus] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [projectToArchive, setProjectToArchive] = useState<Project | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Auto-launch logic
    React.useEffect(() => {
        if (autoLaunch && setPage) {
            // In a real app, this might trigger a modal or specific route
        }
    }, [autoLaunch, setPage]);

    const filteredProjects = useMemo(() => {
        let filtered = (projects || []).filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
            const matchesPriority = filterPriority === 'All' || p.priority === filterPriority;
            const matchesHealth = filterHealth === 'All' || p.health === filterHealth;
            const matchesArchived = showArchived ? true : !p.archived;
            return matchesSearch && matchesStatus && matchesPriority && matchesHealth && matchesArchived;
        });

        // Sort projects
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'progress':
                    return b.progress - a.progress;
                case 'risk':
                    return (b.riskScore || 0) - (a.riskScore || 0);
                case 'lastActivity':
                    return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
                default:
                    return 0;
            }
        });

        return filtered;
    }, [projects, searchQuery, filterStatus, filterPriority, filterHealth, showArchived, sortBy]);



    const getLatestPhotos = (projectId: string) => {
        return (documents || [])
            .filter(d => d.projectId === projectId && d.type === 'Image')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    };

    const getPhotoCount = (projectId: string) => {
        return (documents || []).filter(d => d.projectId === projectId && d.type === 'Image').length;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Planning': return 'bg-blue-100 text-blue-700';
            case 'Delayed': return 'bg-red-100 text-red-700';
            case 'Completed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-zinc-100 text-zinc-600';
        }
    };

    const handleDelete = async () => {
        if (projectToDelete) {
            await deleteProject(projectToDelete.id);
            addToast(`Project "${projectToDelete.name}" deleted.`, 'success');
            setProjectToDelete(null);
        }
    };

    const handleArchive = async () => {
        if (projectToArchive) {
            await updateProject(projectToArchive.id, {
                archived: !projectToArchive.archived
            });
            addToast(`Project "${projectToArchive.name}" ${projectToArchive.archived ? 'unarchived' : 'archived'}.`, 'success');
            setProjectToArchive(null);
        }
    };

    const handleSaveStatus = async () => {
        if (editingProjectStatus) {
            await updateProject(editingProjectStatus.id, {
                status: editingProjectStatus.status,
                health: editingProjectStatus.health,
                progress: editingProjectStatus.progress
            });
            addToast("Project status updated successfully", "success");
            setEditingProjectStatus(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-1">Projects Portfolio</h1>
                    <p className="text-zinc-500">Manage and monitor all active construction sites.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-zinc-100 p-1 rounded-lg flex border border-zinc-200">
                        <button
                            onClick={() => setViewMode('GRID')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white shadow-sm text-[#0f5c82]' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm text-[#0f5c82]' : 'text-zinc-500 hover:text-zinc-700'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    <Can permission="projects.create">
                        <button
                            onClick={() => {
                                if (!canAddResource('projects')) {
                                    addToast(`Project limit reached for ${currentTenant?.plan} plan.`, 'error');
                                    return;
                                }
                                setIsCreateModalOpen(true);
                            }}
                            disabled={!canAddResource('projects')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all ${canAddResource('projects')
                                ? 'bg-[#0f5c82] text-white hover:bg-[#0c4a6e]'
                                : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-70'
                                }`}
                        >
                            <Plus size={18} /> New Project
                        </button>
                    </Can>
                </div>
            </div>

            {!canAddResource('projects') && (
                <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 text-orange-800 shadow-sm">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <div>
                        <p className="text-sm font-bold">Project limit approaching</p>
                        <p className="text-xs">You&apos;ve reached your maximum of {currentTenant?.maxProjects || 5} projects. <button className="underline font-bold">Upgrade your plan</button> to add more.</p>
                    </div>
                </div>
            )}

            {/* Enhanced Filters */}
            <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search projects by name, location, code, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0f5c82] focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg min-w-[140px]">
                        <Filter size={14} className="text-zinc-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent border-none text-sm text-zinc-700 font-medium focus:ring-0 cursor-pointer w-full outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Planning">Planning</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg min-w-[140px]">
                        <Tag size={14} className="text-zinc-500" />
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-transparent border-none text-sm text-zinc-700 font-medium focus:ring-0 cursor-pointer w-full outline-none"
                        >
                            <option value="All">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg min-w-[140px]">
                        <AlertTriangle size={14} className="text-zinc-500" />
                        <select
                            value={filterHealth}
                            onChange={(e) => setFilterHealth(e.target.value)}
                            className="bg-transparent border-none text-sm text-zinc-700 font-medium focus:ring-0 cursor-pointer w-full outline-none"
                        >
                            <option value="All">All Health</option>
                            <option value="Good">Good</option>
                            <option value="At Risk">At Risk</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg min-w-[140px]">
                        <SlidersHorizontal size={14} className="text-zinc-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent border-none text-sm text-zinc-700 font-medium focus:ring-0 cursor-pointer w-full outline-none"
                        >
                            <option value="lastActivity">Last Activity</option>
                            <option value="name">Name</option>
                            <option value="progress">Progress</option>
                            <option value="risk">Risk Score</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showArchived
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                            }`}
                    >
                        <Archive size={14} />
                        {showArchived ? 'Hide' : 'Show'} Archived
                    </button>

                    {/* Results Count */}
                    <div className="ml-auto text-sm text-zinc-500 font-medium">
                        {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-20">
                {viewMode === 'GRID' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProjects.map(project => (
                            <EnhancedProjectCard
                                key={project.id}
                                project={project}
                                onSelect={onProjectSelect}
                                onEdit={setEditingProjectStatus}
                                onArchive={setProjectToArchive}
                                onDelete={setProjectToDelete}
                                photoCount={getPhotoCount(project.id)}
                                showArchived={showArchived}
                            />
                        ))}

                        {/* Add New Project Card */}
                        <Can permission="projects.create">
                            <button
                                onClick={() => {
                                    if (!canAddResource('projects')) {
                                        addToast(`Project limit reached for ${currentTenant?.plan} plan.`, 'error');
                                        return;
                                    }
                                    setIsCreateModalOpen(true);
                                }}
                                disabled={!canAddResource('projects')}
                                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all group min-h-[300px] ${canAddResource('projects')
                                    ? 'border-zinc-200 text-zinc-400 hover:border-[#0f5c82] hover:text-[#0f5c82] hover:bg-blue-50/30 cursor-pointer'
                                    : 'border-zinc-100 text-zinc-300 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${canAddResource('projects')
                                    ? 'bg-zinc-50 group-hover:bg-white group-hover:shadow-md'
                                    : 'bg-zinc-50/50'
                                    }`}>
                                    <Plus size={32} />
                                </div>
                                <h3 className="font-bold text-lg">Create New Project</h3>
                                <p className="text-sm opacity-70 mt-2 text-center max-w-xs">
                                    {canAddResource('projects')
                                        ? "Launch a new construction project"
                                        : `Project limit reached for ${currentTenant?.plan} plan`}
                                </p>
                            </button>
                        </Can>
                    </div>
                ) : (
                    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Project Name</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Manager</th>
                                    <th className="px-6 py-4 font-bold">Location</th>
                                    <th className="px-6 py-4 font-bold">Progress</th>
                                    <th className="px-6 py-4 font-bold">Budget</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredProjects.map(project => (
                                    <tr
                                        key={project.id}
                                        onClick={() => onProjectSelect && onProjectSelect(project.id)}
                                        className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-medium text-zinc-900 group-hover:text-[#0f5c82]">{project.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600">{project.manager}</td>
                                        <td className="px-6 py-4 text-zinc-600">{project.location}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${project.health === 'At Risk' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${project.progress}%` }} />
                                                </div>
                                                <span className="text-xs font-bold">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 font-mono">£{project.budget.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingProjectStatus(project);
                                                    }}
                                                    className="p-1.5 hover:bg-blue-100 rounded text-zinc-400 hover:text-[#0f5c82] transition-colors"
                                                >
                                                    <Activity size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setProjectToDelete(project);
                                                    }}
                                                    className="p-1.5 hover:bg-red-100 rounded text-zinc-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            <Modal isOpen={!!editingProjectStatus} onClose={() => setEditingProjectStatus(null)} title="Update Project Status" size="sm">
                {editingProjectStatus && (
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Project Phase Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Planned', 'Active', 'On Hold', 'Completed'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setEditingProjectStatus({ ...editingProjectStatus, status: s as any })}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${editingProjectStatus.status === s ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Health Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Good', 'At Risk', 'Critical'].map(h => (
                                    <button
                                        key={h}
                                        onClick={() => setEditingProjectStatus({ ...editingProjectStatus, health: h as any })}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${editingProjectStatus.health === h
                                            ? (h === 'Good' ? 'bg-green-50 border-green-200 text-green-700' : h === 'At Risk' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700')
                                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase">Completion Progress</label>
                                <span className="text-xs font-bold text-[#0f5c82]">{editingProjectStatus.progress}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={editingProjectStatus.progress}
                                onChange={(e) => setEditingProjectStatus({ ...editingProjectStatus, progress: parseInt(e.target.value) })}
                                className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#0f5c82]"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                            <button onClick={() => setEditingProjectStatus(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900">Cancel</button>
                            <button
                                onClick={handleSaveStatus}
                                className="px-6 py-2 bg-[#0f5c82] text-white text-sm font-bold rounded-xl hover:bg-[#0c4a6e] shadow-sm"
                            >
                                Save Updates
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} title="Delete Project" size="sm">
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                        <div>
                            <h4 className="text-sm font-bold text-red-800 mb-1">Are you absolutely sure?</h4>
                            <p className="text-xs text-red-700 leading-relaxed">
                                This action cannot be undone. This will permanently delete <strong>{projectToDelete?.name}</strong> and remove all associated data, including tasks, documents, and logs.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setProjectToDelete(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg">Cancel</button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 shadow-sm"
                        >
                            Delete Project
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Archive Confirmation Modal */}
            <Modal isOpen={!!projectToArchive} onClose={() => setProjectToArchive(null)} title={projectToArchive?.archived ? "Unarchive Project" : "Archive Project"} size="sm">
                <div className="space-y-4">
                    <p className="text-zinc-600">
                        Are you sure you want to {projectToArchive?.archived ? 'unarchive' : 'archive'} <strong>{projectToArchive?.name}</strong>?
                        {!projectToArchive?.archived && " Archived projects will be hidden from the main view but can be restored later."}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setProjectToArchive(null)}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleArchive}
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            {projectToArchive?.archived ? 'Unarchive' : 'Archive'} Project
                        </button>
                    </div>
                </div>
            </Modal>

            <AddProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
};

export default ProjectsView;
