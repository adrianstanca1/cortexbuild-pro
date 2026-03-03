import { Plus } from 'lucide-react'

interface Project {
    id: string
    name: string
    description?: string
}

interface ProjectSelectorProps {
    projects: Project[]
    selectedProject: string
    onProjectChange: (projectId: string) => void
    onNewProject?: () => void
}

export default function ProjectSelector({
    projects,
    selectedProject,
    onProjectChange,
    onNewProject,
}: ProjectSelectorProps) {
    return (
        <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Project:</label>
            <select
                value={selectedProject}
                onChange={(e) => onProjectChange(e.target.value)}
                className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-colors font-medium"
            >
                {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.name}
                    </option>
                ))}
            </select>
            {onNewProject && (
                <button
                    onClick={onNewProject}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
                    title="New Project"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

