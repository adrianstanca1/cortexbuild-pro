
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Project, AISearchResult, Document as Doc, Role, Todo, SafetyIncident, Expense } from '../types';
import { api } from '../services/mockApi';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface AISearchModalProps {
    user: User;
    currentProject: Project | null;
    onClose: () => void;
    addToast: (message: string, type: 'success' | 'error') => void;
}

// Enhanced search result interface to support both API types
interface EnhancedSearchResult {
    summary: string;
    sources: {
        documentId: number;
        snippet: string;
    }[];
    metadata?: string;
    isFallback?: boolean;
}

const highlightText = (text: string, highlight: string): React.ReactNode => {
    if (!highlight.trim() || !text) {
        return text;
    }
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
            )}
        </span>
    );
};

// Fallback search function for when advanced search is not available
const performFallbackSearch = async (
    query: string,
    context: {
        user: User;
        project: Project | null;
        tasks: Todo[];
        documents: Doc[];
        incidents: SafetyIncident[];
        expenses: Expense[];
    }
): Promise<EnhancedSearchResult> => {
    // Simple keyword matching for fallback
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);

    // Search through documents
    const relevantDocs = context.documents.filter(doc =>
        keywords.some(keyword =>
            doc.name.toLowerCase().includes(keyword) ||
            doc.category.toLowerCase().includes(keyword)
        )
    );

    // Generate a simple summary
    let summary = `Found ${relevantDocs.length} relevant documents`;
    if (context.project) {
        summary += ` in project "${context.project.name}"`;
    }
    summary += ` related to your search for "${query}".`;

    if (relevantDocs.length === 0) {
        summary = `No specific documents found for "${query}". You may want to check the project documents manually or refine your search terms.`;
    }

    return {
        summary,
        sources: relevantDocs.slice(0, 5).map(doc => ({
            documentId: doc.id,
            snippet: `Document: ${doc.name} (${doc.category}) - uploaded ${doc.uploadedAt.toLocaleDateString()}`
        })),
        metadata: 'Generated using offline knowledge search fallback.',
        isFallback: true
    };
};

export const AISearchModal: React.FC<AISearchModalProps> = ({ user, currentProject, onClose, addToast }) => {
    const [query, setQuery] = useState('');
    const [searchScope, setSearchScope] = useState<string>('current');
    const [userProjects, setUserProjects] = useState<Project[]>([]);
    const [allDocuments, setAllDocuments] = useState<Doc[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<EnhancedSearchResult | null>(null);

    // Fetch user's projects for the scope dropdown
    const fetchUserProjects = useCallback(async () => {
        try {
            if (!user.companyId) return;
            let projects: Project[] = [];
            if (user.role === Role.ADMIN) {
                projects = await api.getProjectsByCompany(user.companyId);
            } else if (user.role === Role.PM) {
                projects = await api.getProjectsByManager(user.id);
            } else {
                projects = await api.getProjectsByUser(user.id);
            }
            setUserProjects(projects);

            const allDocs = await api.getDocumentsByProjectIds(projects.map(p => p.id));
            setAllDocuments(allDocs);

        } catch (e) {
            addToast("Could not load project list.", "error");
        }
    }, [user, addToast]);

    useEffect(() => {
        fetchUserProjects();
        if (currentProject) {
            setSearchScope(currentProject.id.toString());
        } else {
            setSearchScope('all');
        }
    }, [currentProject, fetchUserProjects]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            addToast('Please enter a search query.', 'error');
            return;
        }

        let projectIdsToSearch: number[] = [];
        if (searchScope === 'all') {
            projectIdsToSearch = userProjects.map(p => p.id);
        } else {
            projectIdsToSearch = [parseInt(searchScope, 10)];
        }

        if (projectIdsToSearch.length === 0) {
            addToast("No projects selected to search within.", "error");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Try advanced search first
            const searchResult = await api.searchAcrossDocuments(query, projectIdsToSearch, user.id);
            setResult({
                summary: searchResult.summary,
                sources: searchResult.sources,
                metadata: 'Generated using advanced document search.'
            });
        } catch (err) {
            console.warn('Advanced search failed, falling back to knowledge base search:', err);

            try {
                // Fallback to knowledge base search with available data
                let tasks: Todo[] = [];
                let documents: Doc[] = [];
                let incidents: SafetyIncident[] = [];
                let expenses: Expense[] = [];
                let focusProject: Project | null = currentProject;

                if (user.companyId) {
                    const [incidentData, expenseData, documentData] = await Promise.all([
                        api.getSafetyIncidentsByCompany(user.companyId),
                        api.getExpensesByCompany(user.companyId),
                        currentProject ? api.getDocumentsByProject(currentProject.id) : api.getDocumentsByCompany(user.companyId),
                    ]);

                    incidents = incidentData;
                    expenses = expenseData;
                    documents = (documentData as Doc[]).slice(0, 20);

                    if (projectIdsToSearch.length > 0) {
                        tasks = await api.getTodosByProjectIds(projectIdsToSearch);
                    }
                }

                // Simple fallback search implementation
                const fallbackResult = await performFallbackSearch(query, {
                    user,
                    project: focusProject,
                    tasks,
                    documents,
                    incidents,
                    expenses,
                });

                setResult(fallbackResult);
            } catch (fallbackErr) {
                const message = fallbackErr instanceof Error ? fallbackErr.message : "An unknown error occurred.";
                setError(message);
                addToast("AI search failed.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getDocumentById = (id: number): Doc | undefined => {
        return allDocuments.find(d => d.id === id);
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <Card className="w-full max-w-3xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.01M12 15h.01M9 12h.01M12 9h.01" />
                        </svg>
                        AI Project Search
                    </h2>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Ask about rebar specs, safety procedures, deadlines..."
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-lg"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <select
                                value={searchScope}
                                onChange={e => setSearchScope(e.target.value)}
                                aria-label="Search scope"
                                className="p-3 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                            >
                                {currentProject && <option value={currentProject.id.toString()}>This Project</option>}
                                <option value="all">All My Projects</option>
                                <optgroup label="Specific Project">
                                    {userProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </optgroup>
                            </select>
                            <Button type="submit" size="lg" isLoading={isLoading} className="w-full sm:w-auto">Search</Button>
                        </div>
                    </form>
                </div>

                <div className="flex-grow mt-6 overflow-y-auto pr-2">
                    {isLoading && (
                        <div className="text-center py-10">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                            <p className="mt-4 text-slate-600">AI is searching across documents...</p>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-md">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {result && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">AI Generated Summary</h3>
                                <blockquote className="p-4 bg-sky-50 border-l-4 border-sky-500 text-slate-800 rounded-r-md">
                                    {result.summary}
                                </blockquote>
                                {result.metadata && (
                                    <p className="text-xs text-slate-400 mt-2 italic">
                                        {result.metadata}
                                        {result.isFallback && " (Limited search capabilities)"}
                                    </p>
                                )}
                            </div>

                            {result.sources.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">Sources</h3>
                                    <div className="space-y-3">
                                        {result.sources.map((source, index) => {
                                            const doc = getDocumentById(source.documentId);
                                            return (
                                                <div key={index} className="p-3 border rounded-md bg-white">
                                                    <p className="font-semibold text-slate-700">{doc?.name || `Document #${source.documentId}`}</p>
                                                    <p className="text-xs text-slate-500 mb-2">{doc?.category}</p>
                                                    <p className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-2">
                                                        "...{highlightText(source.snippet, query)}..."
                                                    </p>
                                                    {doc && (
                                                        <div className="text-right mt-2">
                                                            <Button size="sm" variant="secondary" onClick={() => window.open(doc.url, '_blank')}>View Document</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && !result && !error && (
                        <div className="text-center py-20 text-slate-500">
                            <p>Ask a question to get started.</p>
                        </div>
                    )}
                </div>

                <div className="text-right mt-4 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </Card>
        </div>
    );
};