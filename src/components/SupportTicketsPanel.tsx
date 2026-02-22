import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MessageSquare,
    Clock,
    AlertCircle,
    CheckCircle2,
    User,
    Building2,
    MoreHorizontal,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { DatabaseService } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';

interface Ticket {
    id: string;
    subject: string;
    company: string;
    user: string;
    status: 'open' | 'pending' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'billing' | 'technical' | 'feature' | 'access';
    createdAt: string;
    lastUpdate: string;
}

export const SupportTicketsPanel: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const toast = useToast();
    const db = new DatabaseService();

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await db.getTickets();
            // Backend returns snake_case or different fields?
            // supportController returns: { id, companyId, userId, subject, status, priority, category, lastMessageAt, createdAt, updatedAt }
            const mapped: Ticket[] = data.map((t: any) => ({
                id: t.id,
                subject: t.subject,
                company: t.companyId === 'PLATFORM' ? 'Platform' : (t.companyName || t.companyId),
                user: t.userName || t.userId,
                status: t.status?.toLowerCase() as any,
                priority: t.priority?.toLowerCase() as any,
                category: t.category?.toLowerCase() as any,
                createdAt: t.createdAt,
                lastUpdate: t.lastMessageAt || t.updatedAt || t.createdAt
            }));
            setTickets(mapped);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            toast.error('Could not load support tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            (ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (ticket.id?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (ticket.company?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
        const matchesStatus = statusFilter === 'all' || ticket.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-rose-600';
            case 'high': return 'text-orange-600';
            case 'medium': return 'text-amber-600';
            case 'low': return 'text-emerald-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tickets, companies, IDs..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                        {['all', 'open', 'pending', 'resolved'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${statusFilter === status
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ticket List */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            <th className="px-6 py-3 border-b border-slate-100">Ticket</th>
                            <th className="px-6 py-3 border-b border-slate-100">Status</th>
                            <th className="px-6 py-3 border-b border-slate-100">Customer</th>
                            <th className="px-6 py-3 border-b border-slate-100">Priority</th>
                            <th className="px-6 py-3 border-b border-slate-100">Last Update</th>
                            <th className="px-6 py-3 border-b border-slate-100"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-indigo-600 mb-0.5">{ticket.id}</span>
                                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{ticket.subject}</span>
                                        <span className="text-xs text-slate-500 mt-1 capitalize">{ticket.category}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                            {ticket.company}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                            <User className="w-3 h-3 text-slate-400" />
                                            {ticket.user}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        {ticket.priority.toUpperCase()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                        {new Date(ticket.lastUpdate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTickets.length === 0 && (
                    <div className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-slate-900">No tickets found</h3>
                        <p className="text-xs text-slate-500">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {tickets.filter(t => t.status?.toLowerCase() === 'open').length} Open
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {tickets.filter(t => t.status?.toLowerCase() === 'pending').length} Pending
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {tickets.filter(t => t.status?.toLowerCase() === 'resolved').length} Resolved
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchTickets}
                        className="hover:text-indigo-600 transition-colors"
                    >
                        Refresh List
                    </button>
                    <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                        View CRM Dashboard
                        <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};
