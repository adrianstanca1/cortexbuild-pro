'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, Construction, FileCheck, Plus, Eye } from 'lucide-react';

interface LiftingOpsTableProps {
    data: any[];
    projects: any[];
    teamMembers: any[];
}

/**
 * Render a searchable, filterable table of lifting operations with status badges and action controls.
 *
 * The table lists each lift's date, permit number, project, equipment, load details, supervisor, status, and actions.
 * The search field filters rows by equipment name or project name (case-insensitive). If no rows match, a full-width placeholder row is shown.
 *
 * @param data - Array of lifting operation objects to display. Each item should include fields such as `id`, `liftDate`, `number`, `project`, `equipment`, `loadDescription`, `loadWeight`, `supervisor`, and `status`.
 * @param projects - Array of project objects available to the component (used for context or lookups).
 * @param teamMembers - Array of team member objects available to the component (used for context or lookups).
 * @returns The rendered React element containing the searchable table of lifting operations.
 */
export function LiftingOpsTable({ data, projects, teamMembers }: LiftingOpsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(lift => {
        return lift.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lift.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PLANNED': return <Badge variant="outline">Planned</Badge>;
            case 'APPROVED': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Approved</Badge>;
            case 'IN_PROGRESS': return <Badge className="bg-amber-100 text-amber-800 border-amber-200 animate-pulse">In Progress</Badge>;
            case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
            case 'CANCELLED': return <Badge variant="secondary">Cancelled</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search lifts or equipment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9"
                    />
                </div>
                <Button size="sm" className="h-9 gap-2">
                    <Plus className="h-4 w-4" />
                    New Lift Plan
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Permit #</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Equipment</TableHead>
                            <TableHead>Load Details</TableHead>
                            <TableHead>Supervisor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((lift) => (
                            <TableRow key={lift.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(lift.liftDate), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{lift.number}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                        <Construction className="h-3 w-3" />
                                        {lift.project?.name}
                                    </div>
                                </TableCell>
                                <TableCell>{lift.equipment}</TableCell>
                                <TableCell className="text-sm">
                                    {lift.loadDescription} ({lift.loadWeight}kg)
                                </TableCell>
                                <TableCell>
                                    {lift.supervisor ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <FileCheck className="h-3 w-3 text-blue-500" />
                                            {lift.supervisor.name}
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>{getStatusBadge(lift.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center ">
                                    No lifting operations recorded.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}