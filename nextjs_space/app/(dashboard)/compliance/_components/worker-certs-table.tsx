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
import { format, isPast, addDays } from 'date-fns';
import { Search, ShieldCheck, AlertTriangle, Plus, FileText } from 'lucide-react';

interface WorkerCertsTableProps {
    data: any[];
    teamMembers: any[];
}

export function WorkerCertsTable({ data, teamMembers }: WorkerCertsTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(cert => {
        const workerName = cert.worker?.name || 'Unknown';
        return workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.certificationName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getStatusBadge = (expiryDate: string | null) => {
        if (!expiryDate) return <Badge variant="outline">Lifetime</Badge>;
        const expiry = new Date(expiryDate);

        if (isPast(expiry)) {
            return <Badge variant="destructive">Expired</Badge>;
        }

        if (isPast(addDays(expiry, -30))) {
            return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Expiring Soon</Badge>;
        }

        return <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workers or certs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9"
                    />
                </div>
                <Button size="sm" className="h-9 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Certification
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Worker</TableHead>
                            <TableHead>Certification</TableHead>
                            <TableHead>Card / License #</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verified By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((cert) => (
                            <TableRow key={cert.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {cert.worker?.name?.charAt(0) || '?'}
                                        </div>
                                        {cert.worker?.name}
                                    </div>
                                </TableCell>
                                <TableCell>{cert.certificationName}</TableCell>
                                <TableCell className="font-mono text-xs">{cert.cardNumber || 'N/A'}</TableCell>
                                <TableCell>
                                    {cert.expiryDate ? format(new Date(cert.expiryDate), 'MMM d, yyyy') : 'No Expiry'}
                                </TableCell>
                                <TableCell>{getStatusBadge(cert.expiryDate)}</TableCell>
                                <TableCell>
                                    {cert.verifiedBy ? (
                                        <div className="flex items-center gap-1 text-xs text-green-600">
                                            <ShieldCheck className="h-3 w-3" />
                                            {cert.verifiedBy.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Pending</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center ">
                                    No certifications found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
