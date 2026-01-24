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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Search, MapPin, UserCheck, Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface SiteAccessLogTableProps {
    data: any[];
    projects: any[];
    teamMembers: any[];
}

export function SiteAccessLogTable({ data, projects, teamMembers }: SiteAccessLogTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [projectFilter, setProjectFilter] = useState('ALL');

    const filteredData = data.filter(log => {
        const matchesSearch = log.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.company?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProject = projectFilter === 'ALL' || log.projectId === projectFilter;
        return matchesSearch && matchesProject;
    });

    const handleSignOut = async (logId: string) => {
        try {
            const res = await fetch(`/api/site-access/${logId}/sign-out`, { method: 'POST' });
            if (res.ok) {
                toast.success("Person signed out successfully");
            }
        } catch {
            toast.error("Failed to sign out");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Filter by Project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-9 gap-2">
                        <Plus className="h-4 w-4" />
                        Log Entry
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(log.accessTime), 'MMM d, HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{log.personName}</span>
                                        {log.userId && <span className="text-xs text-muted-foreground">Registered User</span>}
                                    </div>
                                </TableCell>
                                <TableCell>{log.company || '-'}</TableCell>
                                <TableCell>{log.role}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {log.project?.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {log.accessType === 'ENTRY' ? (
                                        log.entryLogId ? (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                                                Signed Out
                                            </Badge>
                                        ) : (
                                            <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                                                On Site
                                            </Badge>
                                        )
                                    ) : (
                                        <Badge variant="secondary">Exit Log</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {log.accessType === 'ENTRY' && !log.entryLogId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleSignOut(log.id)}
                                        >
                                            <LogOut className="h-4 w-4 mr-1" />
                                            Sign Out
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center ">
                                    No active site logs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
