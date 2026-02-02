'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { HardHat, Construction, Clock } from 'lucide-react';
import { SiteAccessLogTable } from './site-access-log-table';
import { WorkerCertsTable } from './worker-certs-table';
import { LiftingOpsTable } from './lifting-ops-table';

interface ComplianceClientProps {
    initialAccessLogs: Array<Record<string, unknown>>;
    initialCerts: Array<Record<string, unknown>>;
    initialLifts: Array<Record<string, unknown>>;
    projects: Array<Record<string, unknown>>;
    teamMembers: Array<Record<string, unknown>>;
}

/**
 * Render the compliance dashboard client with KPI summary cards and a tabbed interface for related tables.
 *
 * @param initialAccessLogs - Array of site access log records used for the Access Logs table and KPI counts
 * @param initialCerts - Array of worker certification records used for the Certifications table and expiry KPIs
 * @param initialLifts - Array of lifting operation records used for the Lifting Operations table and KPI counts
 * @param projects - Array of project metadata passed to tables that require project context
 * @param teamMembers - Array of team member metadata passed to tables for member lookup and display
 * @returns A React element that displays KPI cards and a three-tab layout for Site Access Logs, Worker Certifications, and Lifting Operations
 */
export function ComplianceClient({
    initialAccessLogs,
    initialCerts,
    initialLifts,
    projects,
    teamMembers
}: ComplianceClientProps) {
    const [activeTab, setActiveTab] = useState('access-logs');

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Active Site Personnel</p>
                            <h3 className="text-2xl font-bold text-blue-900">
                                {initialAccessLogs.filter((l) => (l as { accessType?: string; entryLogId?: unknown }).accessType === 'ENTRY' && !(l as { entryLogId?: unknown }).entryLogId).length}
                            </h3>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-600">Pending Cert Expiries</p>
                            <h3 className="text-2xl font-bold text-amber-900">
                                {initialCerts.filter((c) => {
                                    const cert = c as { expiryDate?: string };
                                    if (!cert.expiryDate) return false;
                                    const expiry = new Date(cert.expiryDate);
                                    const now = new Date();
                                    const diff = expiry.getTime() - now.getTime();
                                    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
                                }).length}
                            </h3>
                        </div>
                        <HardHat className="h-8 w-8 text-amber-500 opacity-50" />
                    </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-100">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Active Lift Permits</p>
                            <h3 className="text-2xl font-bold text-red-900">
                                {initialLifts.filter((l) => (l as { status?: string }).status === 'IN_PROGRESS').length}
                            </h3>
                        </div>
                        <Construction className="h-8 w-8 text-red-500 opacity-50" />
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="access-logs" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="access-logs" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Site Access Logs
                    </TabsTrigger>
                    <TabsTrigger value="worker-certs" className="flex items-center gap-2">
                        <HardHat className="h-4 w-4" />
                        Worker Certifications
                    </TabsTrigger>
                    <TabsTrigger value="lifting-ops" className="flex items-center gap-2">
                        <Construction className="h-4 w-4" />
                        Lifting Operations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="access-logs" className="mt-0">
                    <SiteAccessLogTable data={initialAccessLogs} projects={projects} teamMembers={teamMembers} />
                </TabsContent>

                <TabsContent value="worker-certs" className="mt-0">
                    <WorkerCertsTable data={initialCerts} teamMembers={teamMembers} />
                </TabsContent>

                <TabsContent value="lifting-ops" className="mt-0">
                    <LiftingOpsTable data={initialLifts} projects={projects} teamMembers={teamMembers} />
                </TabsContent>
            </Tabs>
        </div>
    );
}