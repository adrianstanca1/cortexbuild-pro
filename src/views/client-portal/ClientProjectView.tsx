import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@/services/db';
import {
    Calendar,
    MapPin,
    BarChart3,
    FileText,
    Image as ImageIcon,
    Download,
    ExternalLink,
    Shield,
    Building2,
    Clock
} from 'lucide-react';

export const ClientProjectView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [project, setProject] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'photos'>('overview');

    useEffect(() => {
        if (token) loadProjectData();
    }, [token]);

    const loadProjectData = async () => {
        try {
            const [projData, docsData, photosData] = await Promise.all([
                db.getSharedProject(token!),
                db.getSharedDocuments(token!),
                db.getSharedPhotos(token!)
            ]);
            setProject(projData);
            setDocuments(docsData);
            setPhotos(photosData);
        } catch (error) {
            console.error('Failed to load project data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
                    <p className="text-slate-500">The project could not be loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3">
                                C
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
                                <div className="flex items-center text-sm text-slate-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {project.location || 'No location set'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    project.status === 'Active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-700'
                                }`}
                            >
                                {project.status}
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex space-x-8 -mb-px overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'documents'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Documents ({documents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('photos')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'photos'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Photos ({photos.length})
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Project Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-slate-500">Progress</h3>
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex items-end items-baseline">
                                    <span className="text-2xl font-bold text-slate-900">{project.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-slate-500">Timeline</h3>
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Start Date:</span>
                                        <span className="font-medium">
                                            {new Date(project.startDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">End Date:</span>
                                        <span className="font-medium">
                                            {new Date(project.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-slate-500">Contractor</h3>
                                    <Building2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900">CortexBuild</p>
                                    <div className="flex items-center mt-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Verified Builder
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Description */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">About Project</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {project.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {documents.map((doc: any) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FileText className="w-5 h-5 text-slate-400 mr-2" />
                                                <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {doc.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(doc.date || doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                            >
                                                Download <Download className="w-4 h-4 ml-1" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {documents.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                                            No documents shared yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {photos.map((photo: any) => (
                            <div
                                key={photo.id}
                                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden group"
                            >
                                <div className="aspect-video relative bg-slate-100">
                                    <img
                                        src={photo.url}
                                        alt={photo.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a
                                            href={photo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white rounded-full text-slate-900 hover:bg-slate-200 transition-colors"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm font-medium text-slate-900 truncate">{photo.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {new Date(photo.date || photo.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {photos.length === 0 && (
                            <div className="col-span-full text-center py-10 text-slate-500">No photos shared yet.</div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
