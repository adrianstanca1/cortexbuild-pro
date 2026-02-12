import React, { useState, useEffect } from 'react';
import { Plus, Image, MapPin, Calendar } from 'lucide-react';
import { progressPhotosApi, ProgressPhoto } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import ProgressPhotoForm from '../../components/construction/ProgressPhotoForm';

const ProgressPhotosView: React.FC = () => {
    const { activeProject } = useProjects();
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await progressPhotosApi.getAll(activeProject?.id);
            setPhotos(res.data);
        } catch (error) {
            console.error('Failed to fetch progress photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadPhoto = async (data: any) => {
        try {
            await progressPhotosApi.create({
                ...data,
                projectId: activeProject!.id,
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to upload photo:', error);
        }
    };

    const groupedByDate = photos.reduce((acc, photo) => {
        const date = new Date(photo.captureDate).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(photo);
        return acc;
    }, {} as Record<string, ProgressPhoto[]>);

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Progress Photos</h1>
                    <p className="text-gray-600 mt-1">Document construction progress with photos and 360° views</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={viewMode} onChange={(e) => setViewMode(e.target.value as any)} className="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="grid">Grid View</option>
                        <option value="timeline">Timeline View</option>
                    </select>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Upload Photos
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Photos</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{photos.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">360° Photos</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{photos.filter(p => p.is360).length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Geotagged</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{photos.filter(p => p.latitude && p.longitude).length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">This Week</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">
                            {photos.filter(p => {
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return new Date(p.captureDate) > weekAgo;
                            }).length}
                        </p>
                    </div>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                        <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="relative">
                                <img src={photo.photoUrl} alt={photo.title || 'Progress photo'} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                                {photo.is360 && (
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium shadow-sm">
                                        360°
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-white relative z-10">
                                <h3 className="font-semibold text-gray-900 truncate">{photo.title || 'Untitled Photo'}</h3>
                                {photo.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(photo.captureDate).toLocaleDateString()}</span>
                                    {photo.location && (
                                        <>
                                            <span>•</span>
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{photo.location}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedByDate).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, datePhotos]) => (
                        <div key={date}>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {date}
                                <span className="text-sm font-normal text-gray-500">({datePhotos.length} photos)</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {datePhotos.map((photo) => (
                                    <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <img src={photo.photoUrl} alt={photo.title || 'Progress photo'} className="w-full h-32 object-cover" />
                                        <div className="p-2">
                                            <p className="text-sm font-medium text-gray-900 truncate">{photo.title || 'Untitled'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {photos.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No progress photos yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start documenting your site progress today</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-6 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                        Upload First Photo
                    </button>
                </div>
            )}

            {showForm && (
                <ProgressPhotoForm
                    onSubmit={handleUploadPhoto}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

export default ProgressPhotosView;

