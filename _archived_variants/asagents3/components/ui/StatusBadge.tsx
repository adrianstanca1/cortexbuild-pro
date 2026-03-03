import React from 'react';
import { DocumentStatus, IncidentSeverity, IncidentStatus, EquipmentStatus } from '../../types';

export const DocumentStatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
    const statusMap = {
        [DocumentStatus.APPROVED]: { text: 'Approved', color: 'bg-green-100 text-green-800' },
        [DocumentStatus.UPLOADING]: { text: 'Uploading...', color: 'bg-sky-100 text-sky-800 animate-pulse' },
        [DocumentStatus.SCANNING]: { text: 'Scanning...', color: 'bg-yellow-100 text-yellow-800 animate-pulse' },
        [DocumentStatus.QUARANTINED]: { text: 'Quarantined', color: 'bg-red-100 text-red-800' },
    };
    const { text, color } = statusMap[status] || { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };

    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>{text}</span>;
};

export const IncidentSeverityBadge: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => {
    const severityMap = {
        [IncidentSeverity.CRITICAL]: 'bg-red-600 text-white',
        [IncidentSeverity.HIGH]: 'bg-red-200 text-red-800',
        [IncidentSeverity.MEDIUM]: 'bg-yellow-200 text-yellow-800',
        [IncidentSeverity.LOW]: 'bg-sky-200 text-sky-800',
    };
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ${severityMap[severity]}`}>{severity}</span>;
};

export const IncidentStatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
    const statusMap = {
        [IncidentStatus.REPORTED]: 'bg-sky-100 text-sky-800',
        [IncidentStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800',
        [IncidentStatus.RESOLVED]: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status]}`}>{status}</span>;
};

export const EquipmentStatusBadge: React.FC<{ status: EquipmentStatus }> = ({ status }) => {
    const statusMap = {
        [EquipmentStatus.AVAILABLE]: 'bg-green-100 text-green-800',
        [EquipmentStatus.IN_USE]: 'bg-sky-100 text-sky-800',
        [EquipmentStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[status]}`}>{status}</span>;
};
