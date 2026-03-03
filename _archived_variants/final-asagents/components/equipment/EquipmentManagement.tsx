import React, { useState, useEffect, useCallback } from 'react';
import {
    User,
    Equipment,
    EquipmentStatus,
    Permission,
    View
} from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewHeader } from '../layout/ViewHeader';
import { hasPermission } from '../../services/auth';
import { api } from '../../services/mockApi';
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    MapPin,
    Settings,
    Search,
    Filter,
    CheckCircle,
    AlertTriangle,
    Wrench,
    DollarSign,
    Clock
} from 'lucide-react';
import { format, differenceInDays } from '../../utils/date';

interface EquipmentManagementProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    setActiveView: (view: View) => void;
}

interface EquipmentFormData {
    name: string;
    type: string;
    model: string;
    serialNumber: string;
    manufacturer: string;
    purchaseDate: string;
    purchasePrice: number;
    location: string;
    operatorRequired: boolean;
    notes: string;
}

const EquipmentCard: React.FC<{
    equipment: Equipment;
    onEdit: (equipment: Equipment) => void;
    onDelete: (equipment: Equipment) => void;
    onMaintenance: (equipment: Equipment) => void;
    canEdit: boolean;
    canDelete: boolean;
}> = ({ equipment, onEdit, onDelete, onMaintenance, canEdit, canDelete }) => {
    const statusColors = {
        [EquipmentStatus.AVAILABLE]: 'bg-green-100 text-green-800',
        [EquipmentStatus.IN_USE]: 'bg-blue-100 text-blue-800',
        [EquipmentStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
        [EquipmentStatus.OUT_OF_SERVICE]: 'bg-red-100 text-red-800',
    };

    const statusIcons = {
        [EquipmentStatus.AVAILABLE]: CheckCircle,
        [EquipmentStatus.IN_USE]: Clock,
        [EquipmentStatus.MAINTENANCE]: Wrench,
        [EquipmentStatus.OUT_OF_SERVICE]: AlertTriangle,
    };

    const StatusIcon = statusIcons[equipment.status];

    const nextMaintenanceDate = equipment.nextMaintenanceDate ? new Date(equipment.nextMaintenanceDate) : null;
    const daysUntilMaintenance = nextMaintenanceDate ? differenceInDays(nextMaintenanceDate, new Date()) : null;
    const maintenanceDue = daysUntilMaintenance !== null && daysUntilMaintenance <= 7;

    const utilizationPercentage = equipment.utilization || 0;

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{equipment.name}</h3>
                        {maintenanceDue && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{equipment.type} • {equipment.model}</p>
                    <p className="text-xs text-gray-500">S/N: {equipment.serialNumber}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <StatusIcon className="w-5 h-5 text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[equipment.status]}`}>
                        {equipment.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{equipment.location}</span>
                </div>
                <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${equipment.purchasePrice?.toLocaleString() || 'N/A'}</span>
                </div>
                {nextMaintenanceDate && (
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className={maintenanceDue ? 'text-orange-600 font-medium' : ''}>
                            Maintenance: {format(nextMaintenanceDate, 'MMM dd')}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <Settings className="w-4 h-4" />
                    <span>{equipment.operatorRequired ? 'Operator Required' : 'Self-Operated'}</span>
                </div>
            </div>

            {/* Utilization Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Current Utilization</span>
                    <span>{utilizationPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${utilizationPercentage > 80 ? 'bg-red-500' :
                            utilizationPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                        style={{ width: `${utilizationPercentage}%` }}
                    ></div>
                </div>
            </div>

            {equipment.notes && (
                <p className="text-xs text-gray-600 mb-3 italic">{equipment.notes}</p>
            )}

            <div className="flex justify-between items-center">
                <Button
                    size="sm"
                    variant={equipment.status === EquipmentStatus.MAINTENANCE ? "outline" : "primary"}
                    onClick={() => onMaintenance(equipment)}
                >
                    {equipment.status === EquipmentStatus.MAINTENANCE ? (
                        <>
                            <Wrench className="w-4 h-4 mr-1" />
                            In Maintenance
                        </>
                    ) : (
                        'Schedule Maintenance'
                    )}
                </Button>        <div className="flex gap-2">
                    {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(equipment)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    {canDelete && (
                        <Button variant="outline" size="sm" onClick={() => onDelete(equipment)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};

const EquipmentModal: React.FC<{
    equipment: Equipment | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (equipmentData: EquipmentFormData) => void;
    title: string;
}> = ({ equipment, isOpen, onClose, onSave, title }) => {
    const [formData, setFormData] = useState<EquipmentFormData>({
        name: '',
        type: '',
        model: '',
        serialNumber: '',
        manufacturer: '',
        purchaseDate: '',
        purchasePrice: 0,
        location: '',
        operatorRequired: false,
        notes: '',
    });

    useEffect(() => {
        if (equipment) {
            setFormData({
                name: equipment.name,
                type: equipment.type,
                model: equipment.model,
                serialNumber: equipment.serialNumber,
                manufacturer: equipment.manufacturer,
                purchaseDate: equipment.purchaseDate?.substring(0, 10) || '',
                purchasePrice: equipment.purchasePrice || 0,
                location: equipment.location,
                operatorRequired: equipment.operatorRequired || false,
                notes: equipment.notes || '',
            });
        } else {
            setFormData({
                name: '',
                type: '',
                model: '',
                serialNumber: '',
                manufacturer: '',
                purchaseDate: '',
                purchasePrice: 0,
                location: '',
                operatorRequired: false,
                notes: '',
            });
        }
    }, [equipment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <Button variant="outline" onClick={onClose}>
                        ×
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Equipment Name *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                title="Equipment Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                            </label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                aria-label="Select equipment type"
                            >
                                <option value="">Select equipment type</option>
                                <option value="Heavy Machinery">Heavy Machinery</option>
                                <option value="Power Tools">Power Tools</option>
                                <option value="Vehicle">Vehicle</option>
                                <option value="Safety Equipment">Safety Equipment</option>
                                <option value="Testing Equipment">Testing Equipment</option>
                                <option value="Lifting Equipment">Lifting Equipment</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.model}
                                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                title="Model"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Serial Number *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                                title="Serial Number"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manufacturer
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                                title="Manufacturer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., Site A - Yard, Building B - Floor 2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.purchaseDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                                title="Purchase Date"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Price ($)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                                title="Purchase Price"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={formData.operatorRequired}
                                onChange={(e) => setFormData(prev => ({ ...prev, operatorRequired: e.target.checked }))}
                            />
                            <span className="text-sm font-medium text-gray-700">Certified operator required</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this equipment..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {equipment ? 'Update Equipment' : 'Add Equipment'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const EquipmentManagement: React.FC<EquipmentManagementProps> = ({
    user,
    addToast,
    setActiveView
}) => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const canCreateEquipment = hasPermission(user, Permission.MANAGE_ALL_EQUIPMENT);
    const canEditEquipment = hasPermission(user, Permission.MANAGE_ALL_EQUIPMENT);
    const canDeleteEquipment = hasPermission(user, Permission.MANAGE_ALL_EQUIPMENT);

    const loadEquipment = useCallback(async () => {
        try {
            setLoading(true);
            const equipmentData = await api.getEquipment();
            setEquipment(equipmentData);
        } catch (error) {
            console.error('Failed to load equipment:', error);
            addToast('Failed to load equipment', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadEquipment();
    }, [loadEquipment]);

    const filteredEquipment = equipment.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const uniqueTypes = [...new Set(equipment.map(item => item.type))];

    const handleCreateEquipment = () => {
        setSelectedEquipment(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEditEquipment = (item: Equipment) => {
        setSelectedEquipment(item);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDeleteEquipment = async (item: Equipment) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            try {
                setEquipment(prev => prev.filter(e => e.id !== item.id));
                addToast('Equipment deleted successfully', 'success');
            } catch (error) {
                console.error('Failed to delete equipment:', error);
                addToast('Failed to delete equipment', 'error');
            }
        }
    };

    const handleMaintenanceToggle = async (item: Equipment) => {
        try {
            const newStatus = item.status === EquipmentStatus.MAINTENANCE
                ? EquipmentStatus.AVAILABLE
                : EquipmentStatus.MAINTENANCE;

            const updatedEquipment = await api.updateEquipment(item.id, {
                status: newStatus,
                lastMaintenanceDate: newStatus === EquipmentStatus.MAINTENANCE ? new Date().toISOString() : item.lastMaintenanceDate
            });

            setEquipment(prev => prev.map(e => e.id === item.id ? updatedEquipment : e));
            addToast(`Equipment ${newStatus === EquipmentStatus.MAINTENANCE ? 'scheduled for' : 'released from'} maintenance`, 'success');
        } catch (error) {
            console.error('Failed to update equipment status:', error);
            addToast('Failed to update equipment status', 'error');
        }
    };

    const handleSaveEquipment = async (equipmentData: EquipmentFormData) => {
        try {
            if (modalMode === 'create') {
                const newEquipment = await api.createEquipment({
                    ...equipmentData,
                    status: EquipmentStatus.AVAILABLE,
                    utilization: 0,
                    purchaseDate: equipmentData.purchaseDate ? `${equipmentData.purchaseDate}T00:00:00Z` : null,
                    createdBy: user.id
                });
                setEquipment(prev => [...prev, newEquipment]);
                addToast('Equipment added successfully', 'success');
            } else if (selectedEquipment) {
                const updatedEquipment = await api.updateEquipment(selectedEquipment.id, {
                    ...equipmentData,
                    purchaseDate: equipmentData.purchaseDate ? `${equipmentData.purchaseDate}T00:00:00Z` : null
                });
                setEquipment(prev => prev.map(e => e.id === selectedEquipment.id ? updatedEquipment : e));
                addToast('Equipment updated successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save equipment:', error);
            addToast('Failed to save equipment', 'error');
        }
    };

    const equipmentStats = {
        total: equipment.length,
        available: equipment.filter(e => e.status === EquipmentStatus.AVAILABLE).length,
        inUse: equipment.filter(e => e.status === EquipmentStatus.IN_USE).length,
        maintenance: equipment.filter(e => e.status === EquipmentStatus.MAINTENANCE).length,
        outOfService: equipment.filter(e => e.status === EquipmentStatus.OUT_OF_SERVICE).length,
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <ViewHeader
                title="Equipment Management"
                subtitle={`${equipmentStats.total} total equipment • ${equipmentStats.available} available`}
                actions={
                    canCreateEquipment && (
                        <Button onClick={handleCreateEquipment}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Equipment
                        </Button>
                    )
                }
            />

            {/* Equipment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-2xl font-bold">{equipmentStats.total}</p>
                        </div>
                        <Wrench className="w-8 h-8 text-gray-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Available</p>
                            <p className="text-2xl font-bold">{equipmentStats.available}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">In Use</p>
                            <p className="text-2xl font-bold">{equipmentStats.inUse}</p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Maintenance</p>
                            <p className="text-2xl font-bold">{equipmentStats.maintenance}</p>
                        </div>
                        <Wrench className="w-8 h-8 text-yellow-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Out of Service</p>
                            <p className="text-2xl font-bold">{equipmentStats.outOfService}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search equipment..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'ALL')}
                            aria-label="Filter by status"
                        >
                            <option value="ALL">All Status</option>
                            <option value={EquipmentStatus.AVAILABLE}>Available</option>
                            <option value={EquipmentStatus.IN_USE}>In Use</option>
                            <option value={EquipmentStatus.MAINTENANCE}>Maintenance</option>
                            <option value={EquipmentStatus.OUT_OF_SERVICE}>Out of Service</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            aria-label="Filter by type"
                        >
                            <option value="ALL">All Types</option>
                            {uniqueTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Equipment Grid */}
            {filteredEquipment.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="text-gray-500">
                        {equipment.length === 0 ? (
                            <div>
                                <h3 className="text-lg font-medium mb-2">No equipment registered</h3>
                                <p className="mb-4">Start by adding your first piece of equipment</p>
                                {canCreateEquipment && (
                                    <Button onClick={handleCreateEquipment}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Equipment
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-lg font-medium mb-2">No equipment matches your search</h3>
                                <p>Try adjusting your search criteria</p>
                            </div>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEquipment.map((item) => (
                        <EquipmentCard
                            key={item.id}
                            equipment={item}
                            onEdit={handleEditEquipment}
                            onDelete={handleDeleteEquipment}
                            onMaintenance={handleMaintenanceToggle}
                            canEdit={canEditEquipment}
                            canDelete={canDeleteEquipment}
                        />
                    ))}
                </div>
            )}

            {/* Equipment Modal */}
            <EquipmentModal
                equipment={selectedEquipment}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEquipment}
                title={modalMode === 'create' ? 'Add New Equipment' : 'Edit Equipment'}
            />
        </div>
    );
};