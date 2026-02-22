import React, { useState, useEffect } from 'react';
import {
    Flag,
    Settings,
    ToggleLeft,
    ToggleRight,
    Search,
    AlertTriangle,
    Zap,
    Box,
    Globe,
    Lock,
    MessageSquare,
    Cpu,
    RefreshCw,
    MoreVertical,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { DatabaseService } from '../services/db';
import { useToast } from '../contexts/ToastContext';

interface Feature {
    id: string;
    name: string;
    displayname: string;
    description: string;
    category: string;
    enabled: boolean;
    requiresfeatures?: string[];
    globalStatus?: 'enabled' | 'disabled' | 'partial';
}

const FeatureFlagManager: React.FC = () => {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const { success, error } = useToast();

    const db = new DatabaseService();

    const fetchFeatures = async () => {
        setLoading(true);
        try {
            const data = await db.getFeatureFlags();
            setFeatures(data);
        } catch (err) {
            error('Failed to load global features');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    const toggleFeature = async (featureId: string, currentStatus: boolean) => {
        try {
            await db.updateFeatureFlag(featureId, !currentStatus);
            setFeatures(prev => prev.map(f =>
                f.name === featureId ? { ...f, enabled: !currentStatus } : f
            ));
            success(`Feature ${featureId} ${!currentStatus ? 'enabled' : 'disabled'} globally`);
        } catch (err) {
            error('Failed to update feature status');
        }
    };

    const filteredFeatures = features.filter(f => {
        const matchesSearch = f.displayname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['ALL', ...new Set(features.map(f => f.category))];

    const getIcon = (featureId: string) => {
        if (featureId.includes('ai')) return <Cpu className="w-5 h-5" />;
        if (featureId.includes('chat') || featureId.includes('msg')) return <MessageSquare className="w-5 h-5" />;
        if (featureId.includes('security') || featureId.includes('auth')) return <Lock className="w-5 h-5" />;
        if (featureId.includes('api') || featureId.includes('webhook')) return <Globe className="w-5 h-5" />;
        return <Box className="w-5 h-5" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Flag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Feature Flag Management</h2>
                            <p className="text-sm text-slate-500">Enable or disable platform features globally</p>
                        </div>
                    </div>

                    <button
                        onClick={fetchFeatures}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search features..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedCategory === cat
                                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <p className="text-sm font-medium">Scanning manifests...</p>
                    </div>
                ) : filteredFeatures.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Box className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-medium">No features found matching &quot;{searchQuery}&quot;</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredFeatures.map(feature => (
                            <div
                                key={feature.name}
                                className={`p-4 border rounded-xl transition-all hover:shadow-md group ${feature.enabled ? 'border-indigo-100 bg-white' : 'border-slate-100 bg-slate-50/50 grayscale-[0.5]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${feature.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                            {getIcon(feature.name)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900">{feature.displayname}</h3>
                                                {feature.enabled ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-3.5 h-3.5 text-slate-300" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{feature.description}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleFeature(feature.name, feature.enabled)}
                                        className={`shrink-0 transition-colors ${feature.enabled ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'
                                            }`}
                                    >
                                        {feature.enabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                                    </button>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                                            {feature.category}
                                        </span>
                                        {feature.requiresfeatures && feature.requiresfeatures.length > 0 && (
                                            <span className="px-2 py-0.5 bg-amber-50 rounded text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                                <Zap className="w-2.5 h-2.5" />
                                                +{feature.requiresfeatures.length} Depends
                                            </span>
                                        )}
                                    </div>
                                    <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                        Configuration
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-400 tracking-widest uppercase px-6">
                <div className="flex gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {features.filter(f => f.enabled).length} Enabled
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        {features.filter(f => !f.enabled).length} Disabled
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Changes affect all companies
                </div>
            </div>
        </div>
    );
};

export default FeatureFlagManager;
