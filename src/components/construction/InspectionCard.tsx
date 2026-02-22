import React from 'react';
import { Calendar, User, CheckCircle, XCircle, MapPin, ClipboardList, ShieldCheck } from 'lucide-react';
import { Inspection } from '../../services/constructionApi';

interface InspectionCardProps {
    inspection: Inspection;
    onClick: () => void;
}

const InspectionCard: React.FC<InspectionCardProps> = ({ inspection, onClick }) => {
    const getStatusStyles = (status: Inspection['status']) => {
        switch (status) {
            case 'completed':
            case 'passed': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: <ShieldCheck className="h-4 w-4" /> };
            case 'failed': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: <XCircle className="h-4 w-4" /> };
            case 'scheduled': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: <Calendar className="h-4 w-4" /> };
            default: return { bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-100', icon: <ClipboardList className="h-4 w-4" /> };
        }
    };

    const styles = getStatusStyles(inspection.status);

    return (
        <div
            onClick={onClick}
            className="group bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[30px] rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />

            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-tighter">{inspection.inspectionNumber}</span>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest flex items-center gap-2 ${styles.bg} ${styles.text} ${styles.border}`}>
                            {styles.icon}
                            {inspection.status}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{inspection.title}</h3>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Calendar size={14} className="text-zinc-300" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{new Date(inspection.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                            <MapPin size={14} className="text-zinc-300" />
                            <span className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{inspection.location || 'Site Wide'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                            <User size={14} className="text-zinc-300" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{inspection.inspector}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500">
                            <ClipboardList size={14} className="text-zinc-300" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{inspection.type}</span>
                        </div>
                    </div>
                </div>

                <div className="ml-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                        <ShieldCheck size={24} />
                    </div>
                </div>
            </div>

            {inspection.findings && (
                <div className="mt-8 pt-6 border-t border-dotted border-zinc-100">
                    <p className="text-xs font-bold text-zinc-500 line-clamp-2 leading-relaxed italic">
                        &quot;{typeof inspection.findings === 'string' ? JSON.parse(inspection.findings)[0] || 'No notes' : 'Detailed report available'}&quot;
                    </p>
                </div>
            )}
        </div>
    );
};

export default InspectionCard;
