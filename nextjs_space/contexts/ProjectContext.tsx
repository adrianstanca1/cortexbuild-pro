import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProjectContextType {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  aiProcessing: boolean;
  setAiProcessing: (processing: boolean) => void;
  projects: any[];
  setProjects: (projects: any[]) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  const refreshProjects = useCallback(async () => {
    // Stub - implement actual fetch logic if needed
    console.log('refreshProjects called (stub)');
  }, []);

  return (
    <ProjectContext.Provider value={{
      currentProjectId,
      setCurrentProjectId,
      aiProcessing,
      setAiProcessing,
      projects,
      setProjects,
      refreshProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
