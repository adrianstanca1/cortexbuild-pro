import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Project, Todo, Document as Doc, User, Role, DocumentAcknowledgement, DocumentStatus, DocumentCategory, AuditLog, AuditLogAction, TodoPriority, SafetyIncident, IncidentSeverity, IncidentType, IncidentStatus, SubTask, Comment, ProjectHealth, TodoStatus, DailyLog, Equipment, EquipmentStatus, RFI, RFIStatus, CostEstimate } from '../types';
import { api } from '../services/mockApi';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { MapView } from './MapView';
import { KanbanBoard } from './KanbanBoard';
import { PriorityDisplay } from './ui/PriorityDisplay';
import { ReminderControl } from './ReminderControl';
import { DocumentStatusBadge, IncidentSeverityBadge, IncidentStatusBadge, EquipmentStatusBadge } from './ui/StatusBadge';

interface ProjectHealthDashboardProps {
    project: Project;
    todos: Todo[];
    incidents: SafetyIncident[];
    logs: AuditLog[];
    personnel: User[];
    documents: Doc[];
    dailyLogs: DailyLog[];
    onRefreshRequest: (isInitial?: boolean) => void;
}

const ProjectHealthDashboard: React.FC<ProjectHealthDashboardProps> = ({ project, todos, incidents, logs, personnel, documents, dailyLogs, onRefreshRequest }) => {
    const [report, setReport] = useState<ProjectHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealthReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.generateProjectHealthReport(project, todos, incidents, logs, personnel, documents);
            setReport(data);
        } catch (err) {
            setError("Could not generate AI health report. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [project, todos, incidents, logs, personnel, documents]);

    useEffect(() => {
        fetchHealthReport();
    }, [fetchHealthReport]);

    const handleRefresh = async () => {
        setLoading(true); // Indicate loading immediately
        await onRefreshRequest(false); // Trigger parent to refetch data
        // The useEffect will automatically re-run analysis when new props arrive.
    };

    const HealthScoreCircle = ({ score }: { score: number }) => {
        const sqSize = 120;
        const strokeWidth = 10;
        const radius = (sqSize - strokeWidth) / 2;
        const viewBox = `0 0 ${sqSize} ${sqSize}`;
        const dashArray = radius * Math.PI * 2;
        const dashOffset = dashArray - (dashArray * score) / 100;

        let colorClass = 'text-green-500';
        if (score < 75) colorClass = 'text-yellow-500';
        if (score < 50) colorClass = 'text-red-500';

        return (
            <div className="relative" style={{ width: sqSize, height: sqSize }}>
                <svg width={sqSize} height={sqSize} viewBox={viewBox}>
                    <circle
                        className="text-gray-200"
                        cx={sqSize / 2}
                        cy={sqSize / 2}
                        r={radius}
                        strokeWidth={`${strokeWidth}px`}
                        fill="none"
                        stroke="currentColor"
                    />
                    <circle
                        className={`transition-all duration-1000 ease-in-out ${colorClass}`}
                        cx={sqSize / 2}
                        cy={sqSize / 2}
                        r={radius}
                        strokeWidth={`${strokeWidth}px`}
                        transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        style={{ strokeDasharray: dashArray, strokeDashoffset: dashOffset }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
                </div>
            </div>
        );
    };
    
    const HealthListItem: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
        <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 mt-0.5">{icon}</div>
            <span className="text-sm text-slate-700">{text}</span>
        </li>
    );

    if (loading) {
        return (
             <Card>
                <h3 className="text-xl font-semibold mb-4 text-slate-700">AI Project Health</h3>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="animate-pulse flex-shrink-0 bg-gray-200 rounded-full w-32 h-32"></div>
                    <div className="w-full space-y-3">
                        <div className="animate-pulse bg-gray-200 rounded h-5 w-4/5"></div>
                        <div className="animate-pulse bg-gray-200 rounded h-5 w-full"></div>
                        <div className="animate-pulse bg-gray-200 rounded h-5 w-3/4"></div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-slate-700">AI Project Health</h3>
                <Button size="sm" variant="secondary" onClick={handleRefresh} isLoading={loading}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4l1.5 1.5M20 20l-1.5-1.5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 11a8 8 0 0114.95-2.95" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13a8 8 0 01-14.95 2.95" /></svg>
                    Refresh
                </Button>
            </div>

            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            
            {report && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center md:col-span-1">
                        <HealthScoreCircle score={report.score} />
                        <p className="mt-2 text-sm text-slate-500 font-semibold">Overall Health Score</p>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <p className="text-slate-600 italic text-center md:text-left">{report.summary}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {report.risks.length > 0 && <div>
                                <h4 className="font-semibold mb-2 text-red-600">Risks & Concerns</h4>
                                <ul className="space-y-2">
                                    {report.risks.map((risk, i) => <HealthListItem key={i} text={risk} icon={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    }/>)}
                                </ul>
                            </div>}
                             {report.positives.length > 0 && <div>
                                <h4 className="font-semibold mb-2 text-green-600">Positives & Progress</h4>
                                <ul className="space-y-2">
                                     {report.positives.map((positive, i) => <HealthListItem key={i} text={positive} icon={
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     }/>)}
                                </ul>
                            </div>}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

const AcknowledgementModal: React.FC<{ doc: Doc; acks: DocumentAcknowledgement[]; personnel: User[]; onClose: () => void }> = ({ doc, acks, personnel, onClose }) => {
    const acknowledgedUserIds = new Set(acks.map(ack => ack.userId));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Acknowledgement Status</h3>
                    <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <p className="font-bold mb-2 break-words">{doc.name}</p>
                <div className="max-h-80 overflow-y-auto border-t border-b my-4 py-2">
                    <ul className="divide-y divide-gray-200">
                        {personnel.map(p => (
                            <li key={p.id} className="py-2 flex justify-between items-center">
                                <span>{p.name} ({p.role})</span>
                                {acknowledgedUserIds.has(p.id) ? (
                                    <span className="text-green-600 font-semibold flex items-center gap-1 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Acknowledged
                                    </span>
                                ) : (
                                    <span className="text-red-600 font-semibold flex items-center gap-1 text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                        Pending
                                    </span>
                                )}
                            </li>
                        ))}
                         {personnel.length === 0 && <p className="text-gray-500 py-2 text-center">No personnel assigned to this project.</p>}
                    </ul>
                </div>
                <div className="text-right">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </Card>
        </div>
    );
};

const VersionHistoryModal: React.FC<{
    latestDoc: Doc;
    allDocs: Doc[];
    user: User;
    onClose: () => void;
    onPreview: (doc: Doc) => void;
    onRevert: (documentId: number) => void;
}> = ({ latestDoc, allDocs, user, onClose, onPreview, onRevert }) => {
    const history = allDocs
        .filter(d => d.documentGroupId === latestDoc.documentGroupId)
        .sort((a, b) => b.version - a.version);
    
    const latestVersionNumber = Math.max(...history.map(h => h.version));
    const isManager = user.role === Role.PM || user.role === Role.ADMIN;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Version History</h3>
                    <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <p className="font-bold mb-3 break-words">{latestDoc.name} (Latest)</p>
                <div className="max-h-96 overflow-y-auto border-t">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date Uploaded</th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th scope="col" className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.map(docVersion => {
                                const isLatest = docVersion.version === latestVersionNumber;
                                return (
                                <tr key={docVersion.id} className={isLatest ? 'bg-sky-50' : ''}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        v{docVersion.version}
                                        {isLatest && <span className="ml-2 text-xs font-bold text-white bg-sky-600 px-2 py-0.5 rounded-full">Latest</span>}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{docVersion.name}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(docVersion.uploadedAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm"><DocumentStatusBadge status={docVersion.status} /></td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        {docVersion.status === DocumentStatus.APPROVED && (
                                            <button onClick={() => onPreview(docVersion)} className="text-sky-600 hover:text-sky-900">Preview</button>
                                        )}
                                        {!isLatest && isManager && docVersion.status === DocumentStatus.APPROVED && (
                                            <Button size="sm" variant="secondary" onClick={() => onRevert(docVersion.id)}>
                                                Revert to this version
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                 <div className="text-right mt-4">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </Card>
        </div>
    );
};

const LinkDocumentsModal: React.FC<{
    sourceDoc: Doc;
    allDocs: Doc[];
    onClose: () => void;
    onSave: (targetDocIds: number[]) => void;
}> = ({ sourceDoc, allDocs, onClose, onSave }) => {
    const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [suggestedIds, setSuggestedIds] = useState<number[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            try {
                const { suggestedIds: ids } = await api.suggestDocumentLinks(sourceDoc, allDocs);
                setSuggestedIds(ids);
            } catch (error) {
                console.error("Failed to fetch AI suggestions:", error);
                // Silently fail, user can still search manually
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [sourceDoc, allDocs]);


    const handleToggle = (docId: number) => {
        setSelectedDocIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const allAvailableDocs = useMemo(() => allDocs
        .filter(d => d.id !== sourceDoc.id && !sourceDoc.relatedDocumentIds?.includes(d.id) && d.status === DocumentStatus.APPROVED)
        .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    , [allDocs, sourceDoc, search]);

    const suggestedDocs = useMemo(() => 
        allAvailableDocs.filter(d => suggestedIds.includes(d.id))
    , [allAvailableDocs, suggestedIds]);

    const otherDocs = useMemo(() => 
        allAvailableDocs.filter(d => !suggestedIds.includes(d.id))
    , [allAvailableDocs, suggestedIds]);

    const renderDocList = (docs: Doc[]) => (
        <ul className="divide-y divide-y-gray-200">
            {docs.map(doc => (
                <li key={doc.id} className="py-2 px-1 flex items-center justify-between hover:bg-gray-50 rounded-md">
                    <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.category}</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={selectedDocIds.has(doc.id)}
                        onChange={() => handleToggle(doc.id)}
                        className="h-5 w-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                    />
                </li>
            ))}
        </ul>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl flex flex-col h-[80vh]">
                <h3 className="text-xl font-semibold mb-1">Link Documents to:</h3>
                <p className="font-bold mb-4 break-words text-gray-700">{sourceDoc.name}</p>
                <input
                    type="text"
                    placeholder="Search for documents to link..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full p-2 mb-4 border rounded-md"
                />
                <div className="flex-grow overflow-y-auto border-t border-b my-2 py-2">
                    {isLoadingSuggestions && (
                        <div className="text-center py-4 text-gray-500 flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            AI is searching for relevant links...
                        </div>
                    )}
                    
                    {!isLoadingSuggestions && suggestedDocs.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-2 px-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                AI Suggestions
                            </h4>
                            {renderDocList(suggestedDocs)}
                        </div>
                    )}

                    {!isLoadingSuggestions && otherDocs.length > 0 && (
                        <div>
                             {suggestedDocs.length > 0 && <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-2 mt-4 px-1">All Documents</h4>}
                            {renderDocList(otherDocs)}
                        </div>
                    )}
                    
                    {!isLoadingSuggestions && allAvailableDocs.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No other approved documents available to link.</p>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={() => onSave(Array.from(selectedDocIds))}
                        disabled={selectedDocIds.size === 0}
                    >
                        Link {selectedDocIds.size} Document{selectedDocIds.size !== 1 && 's'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

interface AiConversationTurn {
    role: 'user' | 'model' | 'system';
    text: string;
    key: string;
}

const AiAssistantModal: React.FC<{
    doc: Doc;
    user: User;
    onClose: () => void;
    onNewLog: () => void;
}> = ({ doc, user, onClose, onNewLog }) => {
    const [conversation, setConversation] = useState<AiConversationTurn[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const conversationEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [conversation]);

    const handleAskQuestion = async (questionText: string) => {
        if (!questionText.trim() || isLoading) return;

        const userTurn: AiConversationTurn = { role: 'user', text: questionText, key: `user-${Date.now()}` };
        const loadingTurn: AiConversationTurn = { role: 'system', text: 'Thinking...', key: `loading-${Date.now()}` };
        
        setConversation(prev => [...prev, userTurn, loadingTurn]);
        setCurrentQuestion('');
        setIsLoading(true);

        try {
            const response = await api.askAiAboutDocument(doc.id, questionText, user.id);
            const modelTurn: AiConversationTurn = { role: 'model', text: response.answer, key: `model-${Date.now()}` };
            setConversation(prev => [...prev.slice(0, -1), modelTurn]);
            onNewLog(); // Refresh the activity log in the background
        } catch (error) {
            console.error(error);
            const errorTurn: AiConversationTurn = { role: 'system', text: 'Sorry, I encountered an error. Please try again.', key: `error-${Date.now()}` };
            setConversation(prev => [...prev.slice(0, -1), errorTurn]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAskQuestion(currentQuestion);
    };

    const suggestedQuestions = [
        "Summarize this document in 3 key points.",
        "What are the main safety requirements mentioned?",
        `What does this document say about "${doc.name.split(/[\s-]/)[0]}"?`,
    ];

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-2 pb-2 border-b">
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                           AI Assistant
                        </h3>
                         <p className="text-sm text-gray-500 ml-8">Querying: <span className="font-medium">{doc.name}</span></p>
                    </div>
                     <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-4">
                    {conversation.map(turn => (
                        <div key={turn.key} className={`flex items-start gap-3 ${turn.role === 'user' ? 'justify-end' : ''}`}>
                            {turn.role === 'model' && <div className="h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>}
                            <div className={`max-w-md p-3 rounded-lg ${
                                turn.role === 'user' ? 'bg-slate-800 text-white' : 
                                turn.role === 'model' ? 'bg-gray-200 text-gray-800' :
                                'bg-yellow-100 text-yellow-800 italic w-full text-center'
                            }`}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{turn.text}</p>
                            </div>
                        </div>
                    ))}
                    {conversation.length === 0 && (
                        <div className="text-center text-gray-500 pt-8">
                            <h4 className="text-lg font-semibold">Ask anything about this document</h4>
                            <p className="mt-2">Try one of these suggestions:</p>
                             <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAskQuestion(q)}
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={conversationEndRef} />
                </div>
                <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                    <input
                        type="text"
                        value={currentQuestion}
                        onChange={e => setCurrentQuestion(e.target.value)}
                        placeholder="Ask a question about the document..."
                        disabled={isLoading}
                        className="flex-grow p-2 border rounded-md"
                    />
                    <Button type="submit" isLoading={isLoading} disabled={!currentQuestion.trim()}>
                        Ask
                    </Button>
                </form>
            </Card>
        </div>
    );
};

interface ProjectDetailProps {
  project: Project;
  user: User;
  onBack: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

type DocWithProgress = Doc & { uploadProgress?: number };
type Tab = 'overview' | 'documents' | 'tasks' | 'team' | 'equipment' | 'safety' | 'rfis' | 'activity' | 'daily-logs' | 'tools';

const TabButton: React.FC<{
    label: string;
    tabName: Tab;
    activeTab: Tab;
    onClick: (tab: Tab) => void;
    icon: React.ReactNode;
}> = ({ label, tabName, activeTab, onClick, icon }) => {
    const isActive = activeTab === tabName;
    return (
        <button
            onClick={() => onClick(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors ${
                isActive 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
            {icon}
            {label}
        </button>
    );
};

// Helper function to format time relatively
const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

// Helper to get an icon for each action type
const getActionIcon = (action: AuditLogAction): React.ReactNode => {
    const baseClass = "h-5 w-5";
    if (action.startsWith('TIMESHEET')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    if (action.startsWith('DOCUMENT')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    if (action.startsWith('USER')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
    if (action.startsWith('TODO') || action.startsWith('SUBTASK')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    if (action.startsWith('SAFETY')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    if (action.startsWith('DAILY')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    if (action.startsWith('EQUIPMENT')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
    if (action.startsWith('RFI')) return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
};

// Helper to format Date to YYYY-MM-DD for input[type=date] without timezone issues
const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Skeleton: React.FC<{className?: string}> = ({ className }) => <div className={`bg-gray-200 rounded animate-pulse ${className}`}></div>

const Avatar: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => {
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };
    return (
        <div className={`rounded-full bg-slate-700 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
            {getInitials(name)}
        </div>
    );
};

export const ProjectDetailView: React.FC<ProjectDetailProps> = ({ project, user, onBack, addToast }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [personnel, setPersonnel] = useState<User[]>([]);
    const [unassignedUsers, setUnassignedUsers] = useState<User[]>([]);
    const [documents, setDocuments] = useState<DocWithProgress[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
    const [rfis, setRfis] = useState<RFI[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
    const [acks, setAcks] = useState<DocumentAcknowledgement[]>([]);
    const [companyUsers, setCompanyUsers] = useState<User[]>([]);

    // Modal states
    const [showAckModal, setShowAckModal] = useState<Doc | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState<Doc | null>(null);
    const [showLinkModal, setShowLinkModal] = useState<Doc | null>(null);
    const [showAiModal, setShowAiModal] = useState<Doc | null>(null);
    const [viewingIncidentPhoto, setViewingIncidentPhoto] = useState<string | null>(null);
    const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [showSafetyAnalysisModal, setShowSafetyAnalysisModal] = useState(false);
    const [safetyReport, setSafetyReport] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    // States for task management
    const [newTodoText, setNewTodoText] = useState('');
    const [newTodoPriority, setNewTodoPriority] = useState<TodoPriority>(TodoPriority.MEDIUM);
    const [newTodoDueDate, setNewTodoDueDate] = useState<string>('');
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [newTodoSubTasks, setNewTodoSubTasks] = useState<{id: number, text: string}[]>([{ id: Date.now(), text: '' }]);
    const [newSubTaskText, setNewSubTaskText] = useState<Record<number, string>>({});
    const [editingSubTask, setEditingSubTask] = useState<{ todoId: number; subTaskId: number } | null>(null);
    const [editingSubTaskText, setEditingSubTaskText] = useState('');
    const [editingTodo, setEditingTodo] = useState<(Partial<Todo> & { id: number }) | null>(null);
    const [taskSortKey, setTaskSortKey] = useState('priority_desc'); // Default sort: Priority High to Low
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
    const [newCommentText, setNewCommentText] = useState<Record<number, string>>({});
    const [showAiTaskForm, setShowAiTaskForm] = useState(false);
    const [aiTaskGoal, setAiTaskGoal] = useState('');
    const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

    // States for document upload & management
    const fileInputRef = useRef<HTMLInputElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const [openMoreMenuId, setOpenMoreMenuId] = useState<number | null>(null);
    const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>(DocumentCategory.GENERAL);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [docSearch, setDocSearch] = useState('');
    const [docFilters, setDocFilters] = useState({
        category: 'all',
        status: 'all',
    });
    const [docSort, setDocSort] = useState({
        by: 'uploadedAt',
        order: 'desc',
    });
    
    // States for team management
    const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>('');
    
    // State for activity log filter
    const [activityFilters, setActivityFilters] = useState({ user: 'all', action: 'all' });
    const [activitySort, setActivitySort] = useState<'newest' | 'oldest'>('newest');


    // States for safety incident reporting
    const [showReportForm, setShowReportForm] = useState(false);
    const [newIncidentType, setNewIncidentType] = useState<IncidentType>(IncidentType.NEAR_MISS);
    const [newIncidentSeverity, setNewIncidentSeverity] = useState<IncidentSeverity>(IncidentSeverity.LOW);
    const [newIncidentLocation, setNewIncidentLocation] = useState('');
    const [newIncidentDescription, setNewIncidentDescription] = useState('');
    const [newIncidentAction, setNewIncidentAction] = useState('');
    const [newIncidentPhoto, setNewIncidentPhoto] = useState<{ file: File, preview: string } | null>(null);

    // States for Daily Logs
    const [newLogNotes, setNewLogNotes] = useState('');
    const [newLogWeather, setNewLogWeather] = useState<DailyLog['weather']>('Sunny');
    const [newLogTemp, setNewLogTemp] = useState('20');
    
    // States for RFI management
    const [showRFIForm, setShowRFIForm] = useState(false);
    const [newRFISubject, setNewRFISubject] = useState('');
    const [newRFIQuestion, setNewRFIQuestion] = useState('');
    const [newRFIAssignee, setNewRFIAssignee] = useState<string>('');
    const [isSuggestingAssignee, setIsSuggestingAssignee] = useState(false);
    const [answeringRFIId, setAnsweringRFIId] = useState<number | null>(null);
    const [rfiAnswer, setRfiAnswer] = useState('');
    const [expandedRFIs, setExpandedRFIs] = useState<Set<number>>(new Set());
    
    // States for equipment management
    const [showAssignEquipment, setShowAssignEquipment] = useState(false);
    const [equipmentToAssign, setEquipmentToAssign] = useState('');
    
    const isManager = useMemo(() => user.role === Role.PM || user.role === Role.ADMIN, [user.role]);
    const isForeman = useMemo(() => user.role === Role.FOREMAN, [user.role]);
    const isSafetyOfficer = useMemo(() => user.role === Role.SAFETY_OFFICER, [user.role]);

    const canManageTasks = useMemo(() => isManager || isForeman, [isManager, isForeman]);
    const canManageSafety = useMemo(() => isManager || isSafetyOfficer, [isManager, isSafetyOfficer]);
    const canReportSafety = useMemo(() => isManager || isSafetyOfficer || isForeman || user.role === Role.OPERATIVE, [isManager, isSafetyOfficer, isForeman, user.role]);
    const canUploadDocs = useMemo(() => isManager || isForeman, [isManager, isForeman]);
    const canWriteLogs = useMemo(() => isManager || isForeman, [isManager, isForeman]);
    const canManageEquipment = useMemo(() => isManager, [isManager]);
    const projectManager = useMemo(() => companyUsers.find(u => u.id === project.managerId), [companyUsers, project.managerId]);


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
    
    const getContentSnippet = (content: string | undefined, search: string): React.ReactNode | null => {
        if (!content || !search.trim()) {
            return null;
        }
        const lowercasedContent = content.toLowerCase();
        const lowercasedSearch = search.toLowerCase();
        const index = lowercasedContent.indexOf(lowercasedSearch);
    
        if (index === -1) {
            return null;
        }
    
        const snippetRadius = 50; // characters before and after
        const startIndex = Math.max(0, index - snippetRadius);
        const endIndex = Math.min(content.length, index + lowercasedSearch.length + snippetRadius);
        
        let snippet = content.substring(startIndex, endIndex);
        if (startIndex > 0) snippet = '...' + snippet;
        if (endIndex < content.length) snippet = snippet + '...';
    
        return (
            <div className="text-xs text-gray-500 mt-1 italic">
                {highlightText(snippet, search)}
            </div>
        );
    };

    const fetchData = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [
                personnelData,
                unassignedData,
                docsData,
                todosData,
                incidentsData,
                logsData,
                acksData,
                companyUsersData,
                dailyLogsData,
                equipmentData,
                rfisData,
            ] = await Promise.all([
                api.getUsersByProject(project.id),
                isManager ? api.getUnassignedUsers(project.id, user.companyId) : Promise.resolve([]),
                api.getDocumentsByProject(project.id),
                api.getTodosByProject(project.id),
                api.getIncidentsByProject(project.id),
                api.getAuditLogsByProject(project.id),
                api.getAcksByDocument(project.id),
                api.getUsersByCompany(user.companyId),
                api.getDailyLogsByProject(project.id),
                api.getEquipmentByCompany(user.companyId).then(allEquipment => {
                    if (isManager) {
                        setAvailableEquipment(allEquipment.filter(e => e.status === EquipmentStatus.AVAILABLE && e.projectId !== project.id));
                    }
                    return allEquipment.filter(e => e.projectId === project.id);
                }),
                api.getRFIsByProject(project.id),
            ]);
            setPersonnel(personnelData);
            setUnassignedUsers(unassignedData);
            setDocuments(docsData);
            setTodos(todosData);
            setIncidents(incidentsData);
            setAuditLogs(logsData);
            setAcks(acksData);
            setCompanyUsers(companyUsersData);
            setDailyLogs(dailyLogsData);
            setEquipment(equipmentData);
            setRfis(rfisData);
        } catch (error) {
            console.error("Failed to fetch project details:", error);
            addToast('Failed to load project data.', 'error');
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [project.id, user.companyId, isManager, addToast]);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setOpenMoreMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAcknowledge = async (docId: number) => {
        try {
            await api.acknowledgeDocument(user.id, docId);
            addToast('Document acknowledged!', 'success');
            fetchData();
        } catch (error) {
            addToast(String(error), 'error');
        }
    };

    const handleSaveLinks = async (sourceDocId: number, targetDocIds: number[]) => {
        try {
            await Promise.all(targetDocIds.map(targetDocId =>
                api.linkDocuments(sourceDocId, targetDocId, user.id)
            ));
            addToast(`Successfully linked ${targetDocIds.length} document(s).`, 'success');
            setShowLinkModal(null);
            fetchData();
        } catch (error) {
            addToast('Failed to link documents.', 'error');
        }
    };

    const handleUnlinkDocuments = async (sourceDocId: number, targetDocId: number) => {
        try {
            await api.unlinkDocuments(sourceDocId, targetDocId, user.id);
            addToast('Document unlinked successfully.', 'success');
            fetchData();
        } catch (error) {
            addToast('Failed to unlink document.', 'error');
        }
    };


    const handleUpdateTodo = async (todoId: number, updates: Partial<Todo>) => {
        try {
            await api.updateTodo(todoId, updates, user.id);
            fetchData();
            addToast('Task updated!', 'success');
        } catch (error) {
            addToast('Failed to update task.', 'error');
        }
    };
    
    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoText.trim()) {
            addToast('Task description cannot be empty.', 'error');
            return;
        }
        try {
            await api.addTodo({
                text: newTodoText,
                priority: newTodoPriority,
                dueDate: newTodoDueDate ? new Date(`${newTodoDueDate}T00:00:00`) : undefined,
                projectId: project.id,
                creatorId: user.id,
            }, user.id);
            addToast('Task added successfully!', 'success');
            // Reset form
            setNewTodoText('');
            setNewTodoPriority(TodoPriority.MEDIUM);
            setNewTodoDueDate('');
            setShowAddTaskForm(false);
            fetchData();
        } catch (error) {
            addToast('Failed to add task.', 'error');
        }
    };
    
    const handleAddComment = async (todoId: number) => {
        const text = newCommentText[todoId];
        if (!text || !text.trim()) return;

        try {
            await api.addComment(todoId, text, user.id);
            addToast('Comment added!', 'success');
            setNewCommentText(prev => ({ ...prev, [todoId]: '' }));
            fetchData();
        } catch (error) {
            addToast('Failed to add comment.', 'error');
        }
    };

    const handleAddDailyLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLogNotes.trim()) {
            addToast("Notes cannot be empty.", "error");
            return;
        }
        try {
            const temp = parseInt(newLogTemp, 10);
            if (isNaN(temp)) {
                addToast("Please enter a valid temperature.", "error");
                return;
            }
            await api.addDailyLog({
                projectId: project.id,
                authorId: user.id,
                date: new Date(),
                weather: newLogWeather,
                temperature: temp,
                notes: newLogNotes,
            }, user.id);
            addToast("Daily log added successfully!", "success");
            // Reset form
            setNewLogNotes('');
            setNewLogWeather('Sunny');
            setNewLogTemp('20');
            fetchData();
        } catch (error) {
            addToast("Failed to add daily log.", "error");
        }
    };

    const handleCreateRFI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRFISubject.trim() || !newRFIQuestion.trim()) {
            addToast("Subject and Question are required.", "error");
            return;
        }

        try {
            await api.createRFI({
                projectId: project.id,
                subject: newRFISubject,
                question: newRFIQuestion,
                creatorId: user.id,
                assigneeId: newRFIAssignee ? parseInt(newRFIAssignee, 10) : undefined,
            }, user.id);

            addToast("RFI created successfully!", "success");
            setShowRFIForm(false);
            setNewRFISubject('');
            setNewRFIQuestion('');
            setNewRFIAssignee('');
            fetchData();
        } catch (error) {
            addToast("Failed to create RFI.", "error");
            console.error(error);
        }
    };

    const handleSuggestAssignee = async () => {
        if (!newRFIQuestion.trim()) {
            addToast("Please write the RFI question first.", "error");
            return;
        }
        setIsSuggestingAssignee(true);
        try {
            const { userId } = await api.suggestRFIAssignee(newRFIQuestion, personnel);
            if (userId) {
                setNewRFIAssignee(userId.toString());
                addToast("AI suggested an assignee.", "success");
            } else {
                addToast("AI could not determine a suitable assignee.", "error");
            }
        } catch (error) {
            addToast("Failed to get AI suggestion.", "error");
        } finally {
            setIsSuggestingAssignee(false);
        }
    };

    const handleAnswerRFI = async (e: React.FormEvent, rfiId: number) => {
        e.preventDefault();
        if (!rfiAnswer.trim()) {
            addToast("Answer cannot be empty.", "error");
            return;
        }

        try {
            await api.updateRFI(rfiId, { answer: rfiAnswer }, user.id);
            addToast("RFI answered successfully!", "success");
            setAnsweringRFIId(null);
            setRfiAnswer('');
            fetchData();
        } catch (error) {
            addToast("Failed to submit answer.", "error");
        }
    };
    
    const toggleTaskExpansion = (todoId: number) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(todoId)) {
                newSet.delete(todoId);
            } else {
                newSet.add(todoId);
            }
            return newSet;
        });
    };

    const toggleRFIExpansion = (rfiId: number) => {
        setExpandedRFIs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rfiId)) {
                newSet.delete(rfiId);
            } else {
                newSet.add(rfiId);
            }
            return newSet;
        });
    };
    
    const handleGenerateTasks = async () => {
        if (!aiTaskGoal.trim()) {
            addToast("Please provide a goal for the AI.", "error");
            return;
        }
        setIsGeneratingTasks(true);
        try {
            await api.generateTasksWithAi(project.id, aiTaskGoal, user.id);
            addToast("AI has generated new tasks!", "success");
            setShowAiTaskForm(false);
            setAiTaskGoal('');
            fetchData(); // Refresh the tasks list
        } catch (error) {
            addToast("Failed to generate tasks with AI.", "error");
        } finally {
            setIsGeneratingTasks(false);
        }
    };
    
    const handleAssignEquipment = async () => {
        if (!equipmentToAssign) return;
        try {
            await api.assignEquipmentToProject(parseInt(equipmentToAssign, 10), project.id, user.id);
            addToast("Equipment assigned successfully.", "success");
            setShowAssignEquipment(false);
            setEquipmentToAssign('');
            fetchData();
        } catch (error) {
            addToast("Failed to assign equipment.", "error");
        }
    };

    const handleUnassignEquipment = async (equipmentId: number) => {
        try {
            await api.unassignEquipmentFromProject(equipmentId, user.id);
            addToast("Equipment unassigned successfully.", "success");
            fetchData();
        } catch (error) {
            addToast("Failed to unassign equipment.", "error");
        }
    };

    const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
    const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
    
    const sortedTodos = useMemo(() => {
        return [...todos].sort((a, b) => {
            const priorityOrder = { [TodoPriority.HIGH]: 0, [TodoPriority.MEDIUM]: 1, [TodoPriority.LOW]: 2 };
            switch (taskSortKey) {
                case 'priority_desc':
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                case 'priority_asc':
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'dueDate_asc':
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                case 'dueDate_desc':
                     if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                default:
                    return 0;
            }
        });
    }, [todos, taskSortKey]);

    const equipmentWithLocation = useMemo(() => equipment.filter(e => e.location), [equipment]);

    if (loading) {
        return (
            <div>
                 <Button onClick={onBack} variant="ghost" className="mb-4">
                    &larr; Back to Projects
                </Button>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <Button onClick={onBack} variant="ghost" className="mb-4 text-sm">
                &larr; Back to Projects
            </Button>
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{project.name}</h2>
                    <p className="text-slate-500">{project.location.address}</p>
                </div>
                {projectManager && (
                    <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg">
                        <Avatar name={projectManager.name} className="w-10 h-10" />
                        <div>
                            <p className="text-xs text-slate-500">Project Manager</p>
                            <p className="font-semibold text-sm text-slate-800">{projectManager.name}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                     <TabButton label="Overview" tabName="overview" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
                     <TabButton label="Tasks" tabName="tasks" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
                     <TabButton label="Documents" tabName="documents" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} />
                     <TabButton label="Tools" tabName="tools" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l.354-.354a3.75 3.75 0 00-5.303-5.303l-.354.353M3 21l3.75-3.75m.75-7.5l3-3L11.25 3" /></svg>} />
                     <TabButton label="RFIs" tabName="rfis" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                     <TabButton label="Daily Logs" tabName="daily-logs" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                     <TabButton label="Safety" tabName="safety" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
                     <TabButton label="Team" tabName="team" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                     <TabButton label="Equipment" tabName="equipment" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>} />
                     <TabButton label="Activity" tabName="activity" activeTab={activeTab} onClick={setActiveTab} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <ProjectHealthDashboard 
                        project={project} 
                        todos={todos} 
                        incidents={incidents} 
                        logs={auditLogs} 
                        personnel={personnel} 
                        documents={documents} 
                        dailyLogs={dailyLogs}
                        onRefreshRequest={fetchData}
                     />
                    <Card>
                        <h3 className="text-xl font-semibold mb-4 text-slate-700">Site Location & Geofence</h3>
                        <MapView markers={[{ id: project.id, lat: project.location.lat, lng: project.location.lng, radius: project.radius }]} height="h-64" />
                    </Card>
                </div>
            )}
            
            {activeTab === 'tasks' && (
                <Card>
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h3 className="text-xl font-semibold text-slate-700">Project Tasks</h3>
                        {canManageTasks && (
                            <div className="flex items-center gap-2">
                                <Button variant="primary" onClick={() => setShowAddTaskForm(prev => !prev)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    {showAddTaskForm ? 'Cancel' : 'Add Task'}
                                </Button>
                                <Button variant="secondary" onClick={() => setShowAiTaskForm(prev => !prev)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    {showAiTaskForm ? 'Cancel' : 'Generate with AI'}
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {showAddTaskForm && (
                        <form onSubmit={handleAddTodo} className="p-4 mb-4 bg-slate-50 rounded-lg border transition-all duration-300 ease-in-out">
                            <h4 className="font-semibold text-lg mb-3 text-slate-700">Add New Task</h4>
                            <div className="mb-4">
                                <label htmlFor="task-text" className="block text-sm font-medium text-gray-700">Task Description</label>
                                <input
                                    type="text"
                                    id="task-text"
                                    value={newTodoText}
                                    onChange={e => setNewTodoText(e.target.value)}
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="e.g., Inspect foundation rebar"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        id="task-priority"
                                        value={newTodoPriority}
                                        onChange={e => setNewTodoPriority(e.target.value as TodoPriority)}
                                        className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        {Object.values(TodoPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                                    <input
                                        type="date"
                                        id="task-due-date"
                                        value={newTodoDueDate}
                                        onChange={e => setNewTodoDueDate(e.target.value)}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 text-right">
                                <Button type="submit">Create Task</Button>
                            </div>
                        </form>
                    )}

                    {showAiTaskForm && (
                        <div className="p-4 mb-4 bg-slate-50 rounded-lg border transition-all duration-300 ease-in-out">
                            <h4 className="font-semibold text-lg mb-2 text-slate-700">Generate Tasks from a Goal</h4>
                            <p className="text-sm text-slate-500 mb-3">Describe a high-level objective, and the AI will break it down into actionable tasks for you.</p>
                            <textarea
                                value={aiTaskGoal}
                                onChange={e => setAiTaskGoal(e.target.value)}
                                placeholder="e.g., Prepare the site for foundation pouring."
                                className="w-full p-2 border rounded-md"
                                rows={3}
                            />
                            <div className="text-right mt-2">
                                <Button onClick={handleGenerateTasks} isLoading={isGeneratingTasks} disabled={!aiTaskGoal.trim()}>
                                    Generate Tasks
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end mb-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="task-sort" className="text-sm font-medium text-gray-700">Sort by:</label>
                            <select
                                id="task-sort"
                                value={taskSortKey}
                                onChange={e => setTaskSortKey(e.target.value)}
                                className="block pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                            >
                                <option value="priority_desc">Priority (High to Low)</option>
                                <option value="priority_asc">Priority (Low to High)</option>
                                <option value="dueDate_desc">Due Date (Newest first)</option>
                                <option value="dueDate_asc">Due Date (Oldest first)</option>
                            </select>
                        </div>
                    </div>

                    <KanbanBoard 
                        todos={sortedTodos}
                        onUpdateTaskStatus={(todoId, newStatus) => handleUpdateTodo(todoId, { status: newStatus })}
                        onUpdateTodo={handleUpdateTodo}
                        onUpdateSubTask={(todoId, subTaskId, updates) => { /* Placeholder */ }}
                        canManageTasks={canManageTasks}
                    />
                </Card>
            )}

            {activeTab === 'documents' && (
                <Card>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Project Documents</h3>
                    <div className="space-y-4">
                        {documents.map(doc => {
                            const isAcknowledged = acks.some(ack => ack.documentId === doc.id && ack.userId === user.id);
                            const canQueryAi = doc.status === DocumentStatus.APPROVED && !!doc.indexedContent;
                            const hasMultipleVersions = documents.filter(d => d.documentGroupId === doc.documentGroupId).length > 1;

                            return (
                                <div key={doc.id} className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-800 break-words">{doc.name}</p>
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                                <DocumentStatusBadge status={doc.status} />
                                                <span>{doc.category}</span>
                                                <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                                            <Button
                                                size="sm"
                                                variant={isAcknowledged ? 'success' : 'secondary'}
                                                onClick={() => handleAcknowledge(doc.id)}
                                                disabled={isAcknowledged}
                                                className="w-[140px]"
                                            >
                                                {isAcknowledged ? (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Acknowledged
                                                    </>
                                                ) : (
                                                    'Acknowledge'
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setShowAiModal(doc)}
                                                disabled={!canQueryAi}
                                                title={canQueryAi ? "Ask AI about this document" : "AI Assistant is unavailable for this document."}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                                AI Assistant
                                            </Button>

                                            <div className="relative" ref={openMoreMenuId === doc.id ? moreMenuRef : null}>
                                                <button 
                                                    onClick={() => setOpenMoreMenuId(openMoreMenuId === doc.id ? null : doc.id)} 
                                                    className="p-2 rounded-md hover:bg-slate-100"
                                                    aria-label="More actions"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                                </button>
                                                {openMoreMenuId === doc.id && (
                                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 border z-20">
                                                        <button onClick={() => { setShowAckModal(doc); setOpenMoreMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Acknowledgements</button>
                                                        {hasMultipleVersions && <button onClick={() => { setShowHistoryModal(doc); setOpenMoreMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Version History</button>}
                                                        {isManager && <button onClick={() => { setShowLinkModal(doc); setOpenMoreMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Link Documents...</button>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {doc.relatedDocumentIds && doc.relatedDocumentIds.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-slate-200/80">
                                            <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Linked Documents</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {doc.relatedDocumentIds.map(id => {
                                                    const linkedDoc = documents.find(d => d.id === id);
                                                    if (!linkedDoc) return null;
                                                    return (
                                                        <div key={id} className="flex items-center gap-1 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-sm text-slate-700">
                                                            <span>{linkedDoc.name}</span>
                                                            {isManager && (
                                                                <button onClick={() => handleUnlinkDocuments(doc.id, id)} className="w-4 h-4 rounded-full bg-slate-300 hover:bg-red-500 text-white flex items-center justify-center text-xs font-bold" title={`Unlink ${linkedDoc.name}`}>
                                                                    &times;
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {documents.length === 0 && (
                            <p className="text-center text-slate-500 py-4">No documents have been uploaded for this project.</p>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'tools' && (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">AI Cost Estimator</h3>
                        <p className="text-sm text-slate-500 mb-4">Leverage AI to generate a preliminary cost breakdown for a scope of work.</p>
                        {/* Cost Estimator Component would go here */}
                    </Card>
                     <Card>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">AI Safety Analysis</h3>
                        <p className="text-sm text-slate-500 mb-4">Analyze reported safety incidents to identify trends and get actionable recommendations.</p>
                         {/* Safety Analysis Component would go here */}
                    </Card>
                </div>
            )}

            {activeTab === 'rfis' && (
                 <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700">Requests for Information (RFIs)</h3>
                        <Button onClick={() => setShowRFIForm(prev => !prev)}>{showRFIForm ? 'Cancel' : 'Create RFI'}</Button>
                    </div>
                    {showRFIForm && (
                        <form onSubmit={handleCreateRFI} className="p-4 mb-6 bg-slate-50 rounded-lg border transition-all duration-300">
                            <h4 className="font-semibold text-lg mb-3 text-slate-700">New Request for Information</h4>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="rfi-subject" className="block text-sm font-medium text-gray-700">Subject</label>
                                    <input type="text" id="rfi-subject" value={newRFISubject} onChange={e => setNewRFISubject(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                                </div>
                                <div>
                                    <label htmlFor="rfi-question" className="block text-sm font-medium text-gray-700">Question</label>
                                    <textarea id="rfi-question" value={newRFIQuestion} onChange={e => setNewRFIQuestion(e.target.value)} required rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" placeholder="Provide details, reference document numbers, or ask your question here."></textarea>
                                </div>
                                <div>
                                    <label htmlFor="rfi-assignee" className="block text-sm font-medium text-gray-700">Assign To</label>
                                    <div className="flex items-center gap-2">
                                        <select id="rfi-assignee" value={newRFIAssignee} onChange={e => setNewRFIAssignee(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500">
                                            <option value="" disabled>Select a team member...</option>
                                            {personnel.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                            ))}
                                        </select>
                                        <Button type="button" variant="secondary" onClick={handleSuggestAssignee} isLoading={isSuggestingAssignee} className="mt-1 flex-shrink-0">
                                            Suggest with AI
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-right">
                                <Button type="submit" variant="primary">Submit RFI</Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-4 mt-6">
                        {rfis.length > 0 ? rfis.map(rfi => {
                            const creator = companyUsers.find(u => u.id === rfi.creatorId);
                            const assignee = companyUsers.find(u => u.id === rfi.assigneeId);
                            const isExpanded = expandedRFIs.has(rfi.id);
                            return (
                                <div key={rfi.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                    <div className="flex justify-between items-start cursor-pointer" onClick={() => toggleRFIExpansion(rfi.id)}>
                                        <div>
                                            <p className="font-semibold text-slate-800">{rfi.subject}</p>
                                            <p className="text-xs text-slate-500">
                                                Created by {creator?.name || 'Unknown'} on {new Date(rfi.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                rfi.status === RFIStatus.OPEN ? 'bg-yellow-100 text-yellow-800' :
                                                rfi.status === RFIStatus.ANSWERED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>{rfi.status}</span>
                                            <button className="p-1 rounded-full hover:bg-slate-100">
                                                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t space-y-4">
                                            <div>
                                                <label className="text-sm font-bold text-slate-600">Question:</label>
                                                <p className="mt-1 text-slate-700 whitespace-pre-wrap">{rfi.question}</p>
                                            </div>
                                            {assignee && (
                                                <p className="text-sm text-slate-500">
                                                    Assigned to: <span className="font-medium text-slate-700">{assignee.name}</span>
                                                </p>
                                            )}
                                            {rfi.status === RFIStatus.ANSWERED && rfi.answer ? (
                                                <div>
                                                    <label className="text-sm font-bold text-green-700">Answer:</label>
                                                    <div className="mt-1 text-slate-700 bg-green-50 p-3 rounded-md whitespace-pre-wrap">{rfi.answer}</div>
                                                    {rfi.answeredAt && <p className="text-xs text-slate-500 mt-1">Answered on {new Date(rfi.answeredAt).toLocaleDateString()}</p>}
                                                </div>
                                            ) : (
                                                isManager && (
                                                    <div className="mt-4">
                                                        {answeringRFIId === rfi.id ? (
                                                            <form onSubmit={(e) => handleAnswerRFI(e, rfi.id)}>
                                                                <textarea
                                                                    value={rfiAnswer}
                                                                    onChange={e => setRfiAnswer(e.target.value)}
                                                                    rows={3}
                                                                    className="w-full p-2 border rounded-md"
                                                                    placeholder="Type your official answer here..."
                                                                    required
                                                                />
                                                                <div className="flex justify-end gap-2 mt-2">
                                                                    <Button type="button" variant="secondary" size="sm" onClick={() => setAnsweringRFIId(null)}>Cancel</Button>
                                                                    <Button type="submit" size="sm">Submit Answer</Button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <Button onClick={() => { setAnsweringRFIId(rfi.id); setRfiAnswer(''); }} size="sm">
                                                                Provide Answer
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <p className="text-center text-slate-500 py-4">No RFIs have been submitted for this project.</p>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'daily-logs' && (
                <Card>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Daily Site Logs</h3>
                    {canWriteLogs && (
                        <form onSubmit={handleAddDailyLog} className="p-4 mb-6 bg-slate-50 rounded-lg border">
                            <h4 className="font-semibold text-lg mb-3 text-slate-700">Add New Log for Today</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="log-weather" className="block text-sm font-medium text-gray-700">Weather</label>
                                    <select id="log-weather" value={newLogWeather} onChange={e => setNewLogWeather(e.target.value as DailyLog['weather'])} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm">
                                        <option>Sunny</option>
                                        <option>Cloudy</option>
                                        <option>Rain</option>
                                        <option>Windy</option>
                                        <option>Snow</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="log-temp" className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                                    <input type="number" id="log-temp" value={newLogTemp} onChange={e => setNewLogTemp(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="log-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea id="log-notes" value={newLogNotes} onChange={e => setNewLogNotes(e.target.value)} rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Record progress, delays, incidents, deliveries, etc."></textarea>
                            </div>
                             <div className="mt-4 text-right">
                                <Button type="submit">Add Log</Button>
                            </div>
                        </form>
                    )}
                     <div className="space-y-4">
                        {dailyLogs.map(log => (
                            <div key={log.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-slate-800">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <div className="text-sm text-slate-600">{log.weather}, {log.temperature}°C</div>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.notes}</p>
                                <p className="text-xs text-slate-500 mt-2">Logged by: {companyUsers.find(u => u.id === log.authorId)?.name || 'Unknown'}</p>
                            </div>
                        ))}
                        {dailyLogs.length === 0 && <p className="text-center text-slate-500 py-4">No daily logs have been added yet.</p>}
                    </div>
                </Card>
            )}

            {activeTab === 'safety' && (
                <Card>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Safety Incidents</h3>
                     <div className="space-y-4">
                        {incidents.map(incident => (
                            <div key={incident.id} className="p-4 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                                    <div>
                                        <p className="font-semibold text-slate-800">{incident.type}</p>
                                        <p className="text-xs text-slate-500">{new Date(incident.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <IncidentSeverityBadge severity={incident.severity} />
                                        <IncidentStatusBadge status={incident.status} />
                                    </div>
                                </div>
                                {incident.aiSummary && <p className="text-sm italic text-slate-600 bg-slate-50 p-2 rounded-md mb-2">AI Summary: {incident.aiSummary}</p>}
                                <p className="text-sm text-slate-700">{incident.description}</p>
                            </div>
                        ))}
                         {incidents.length === 0 && <p className="text-center text-slate-500 py-4">No safety incidents reported for this project.</p>}
                    </div>
                </Card>
            )}

            {activeTab === 'team' && (
                <Card>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Project Team</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {personnel.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.email}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {personnel.length === 0 && <p className="text-center text-slate-500 py-4">No one is assigned to this project yet.</p>}
                    </div>
                </Card>
            )}

            {activeTab === 'equipment' && (
                <Card>
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                        <h3 className="text-xl font-semibold text-slate-700">Project Equipment</h3>
                        {canManageEquipment && <Button onClick={() => setShowAssignEquipment(prev => !prev)}>{showAssignEquipment ? 'Cancel' : 'Assign Equipment'}</Button>}
                    </div>
                    
                    {showAssignEquipment && (
                        <div className="p-4 mb-4 bg-slate-50 rounded-lg border flex flex-col sm:flex-row items-end gap-2">
                            <div className="flex-grow w-full sm:w-auto">
                                <label htmlFor="equipment-select" className="block text-sm font-medium text-gray-700">Available Equipment</label>
                                <select id="equipment-select" value={equipmentToAssign} onChange={e => setEquipmentToAssign(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="" disabled>Select equipment...</option>
                                    {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                                </select>
                            </div>
                            <Button onClick={handleAssignEquipment} disabled={!equipmentToAssign} className="w-full sm:w-auto">Assign</Button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Map View */}
                        <div className="lg:col-span-3">
                             <h4 className="text-lg font-semibold text-slate-600 mb-2">Equipment Locations</h4>
                             {equipmentWithLocation.length > 0 ? (
                                <MapView
                                    height="h-96 lg:h-[60vh]"
                                    markers={equipmentWithLocation.map(e => ({
                                        id: e.id,
                                        lat: e.location!.lat,
                                        lng: e.location!.lng,
                                    }))}
                                />
                             ) : (
                                <div className="h-96 lg:h-[60vh] bg-slate-50 flex items-center justify-center text-slate-500 rounded-md border">
                                    No equipment with location data assigned.
                                </div>
                             )}
                        </div>

                        {/* Equipment List */}
                        <div className="lg:col-span-2">
                            <h4 className="text-lg font-semibold text-slate-600 mb-2">Assigned Equipment ({equipment.length})</h4>
                            <div className="overflow-y-auto pr-2 space-y-3" style={{ maxHeight: '60vh' }}>
                                {equipment.length > 0 ? equipment.map(e => (
                                     <div key={e.id} className="p-3 bg-white rounded-lg border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-800">{e.name}</p>
                                                <p className="text-sm text-slate-600">{e.type}</p>
                                            </div>
                                            <EquipmentStatusBadge status={e.status} />
                                        </div>
                                        {canManageEquipment && (
                                            <div className="text-right mt-2 pt-2 border-t">
                                                <Button size="sm" variant="danger" onClick={() => handleUnassignEquipment(e.id)}>Unassign</Button>
                                            </div>
                                        )}
                                    </div>
                                )) : <p className="text-slate-500 text-sm">No equipment assigned to this project.</p>}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {activeTab === 'activity' && (
                <Card>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Project Activity Log</h3>
                    <ul className="divide-y divide-gray-200">
                        {auditLogs.map(log => {
                            const actor = companyUsers.find(u => u.id === log.actorId);
                            return (
                                <li key={log.id} className="py-4 flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-full">{getActionIcon(log.action)}</div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-slate-800">
                                            <span className="font-semibold">{actor?.name || 'System'}</span> {log.action.toLowerCase()}
                                            {log.target && ` ${log.target.type}: "${log.target.name}"`}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-500 flex-shrink-0">{formatRelativeTime(log.timestamp)}</p>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}

            {showAckModal && (
                <AcknowledgementModal
                    doc={showAckModal}
                    acks={acks}
                    personnel={personnel}
                    onClose={() => setShowAckModal(null)}
                />
            )}
             {showHistoryModal && (
                <VersionHistoryModal
                    latestDoc={showHistoryModal}
                    allDocs={documents}
                    user={user}
                    onClose={() => setShowHistoryModal(null)}
                    onPreview={(doc) => window.open(doc.url, '_blank')}
                    onRevert={(docId) => {
                        api.revertToDocumentVersion(docId, user.id)
                            .then(() => {
                                addToast('Document reverted successfully.', 'success');
                                setShowHistoryModal(null);
                                fetchData();
                            })
                            .catch(err => addToast(String(err), 'error'));
                    }}
                />
            )}
             {showLinkModal && (
                <LinkDocumentsModal
                    sourceDoc={showLinkModal}
                    allDocs={documents}
                    onClose={() => setShowLinkModal(null)}
                    onSave={(targetIds) => handleSaveLinks(showLinkModal.id, targetIds)}
                />
            )}
             {showAiModal && (
                <AiAssistantModal
                    doc={showAiModal}
                    user={user}
                    onClose={() => setShowAiModal(null)}
                    onNewLog={() => api.getAuditLogsByProject(project.id).then(setAuditLogs)}
                />
            )}
        </div>
    );
};