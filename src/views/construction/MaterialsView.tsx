import React, { useState, useEffect } from 'react';
import { Plus, Package, TrendingUp, AlertCircle, Truck } from 'lucide-react';
import { materialsApi, MaterialDelivery, MaterialInventory, MaterialRequisition } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import MaterialForm from '../../components/construction/MaterialForm';

const MaterialsView: React.FC = () => {
    const { activeProject } = useProjects();
    const [activeTab, setActiveTab] = useState<'deliveries' | 'inventory' | 'requisitions'>('deliveries');
    const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
    const [inventory, setInventory] = useState<MaterialInventory[]>([]);
    const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeProject, activeTab]);

    const fetchData = async () => {
        if (!activeProject) return;
        try {
            setLoading(true);
            if (activeTab === 'deliveries') {
                const res = await materialsApi.deliveries.getAll(activeProject.id);
                setDeliveries(res.data);
            } else if (activeTab === 'inventory') {
                const res = await materialsApi.inventory.getAll(activeProject.id);
                setInventory(res.data);
            } else {
                const res = await materialsApi.requisitions.getAll(activeProject.id);
                setRequisitions(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const lowStockItems = inventory.filter(item => item.quantity < item.minQuantity);

    const stats = {
        totalDeliveries: deliveries.length,
        inventoryItems: inventory.length,
        lowStock: lowStockItems.length,
        pendingRequisitions: requisitions.filter(r => r.status === 'pending').length,
    };

    const handleLogDelivery = async (data: any) => {
        try {
            await materialsApi.deliveries.create({
                ...data,
                projectId: activeProject!.id,
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to log delivery:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Material Management</h1>
                    <p className="text-gray-600 mt-1">Track deliveries, inventory, and requisitions</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Log Delivery
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Deliveries</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDeliveries}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Inventory Items</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inventoryItems}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Package className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Low Stock</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStock}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Requests</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingRequisitions}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('deliveries')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'deliveries'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Deliveries
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'inventory'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('requisitions')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'requisitions'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Requisitions
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'deliveries' && (
                        <div className="space-y-4">
                            {deliveries.map((delivery) => (
                                <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{delivery.material}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {delivery.quantity} {delivery.unit} • Supplier: {delivery.supplier}
                                            </p>
                                            {delivery.poNumber && (
                                                <p className="text-sm text-gray-500 mt-1">PO# {delivery.poNumber}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(delivery.deliveryDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {delivery.notes && (
                                        <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">{delivery.notes}</p>
                                    )}
                                </div>
                            ))}
                            {deliveries.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No deliveries logged</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Material</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Min Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {inventory.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{item.material}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.quantity} {item.unit}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.location}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.minQuantity} {item.unit}</td>
                                            <td className="px-4 py-3">
                                                {item.quantity < item.minQuantity ? (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Low Stock</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">In Stock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {inventory.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No inventory items</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'requisitions' && (
                        <div className="space-y-4">
                            {requisitions.map((req) => (
                                <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{req.material}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {req.quantity} {req.unit} • Requested by: {req.requestedBy}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${req.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                                req.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {req.urgency.toUpperCase()}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${req.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                req.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                                    req.status === 'approved' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {requisitions.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No requisitions</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <MaterialForm
                    onSubmit={handleLogDelivery}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

export default MaterialsView;

