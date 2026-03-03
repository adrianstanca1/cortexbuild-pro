import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addDays, format, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
import { api } from '../services/mockApi';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Equipment, Project, ResourceAssignment, User } from '../types';

interface ResourceSchedulerProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AssignmentWithMeta = ResourceAssignment & {
    project?: Project;
    resource?: User | Equipment;
};

const toDate = (value: string) => parseISO(value);

const isOverlappingWeek = (assignment: ResourceAssignment, start: Date, end: Date) => {
    const assignmentStart = toDate(assignment.startDate);
    const assignmentEnd = toDate(assignment.endDate);
    return isWithinInterval(assignmentStart, { start, end }) || isWithinInterval(assignmentEnd, { start, end }) ||
        (assignmentStart <= start && assignmentEnd >= end);
};

const ResourceScheduler: React.FC<ResourceSchedulerProps> = ({ user, addToast }) => {
    const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [people, setPeople] = useState<User[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user.companyId) {
            setAssignments([]);
            setProjects([]);
            setPeople([]);
            setEquipment([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
                const [assignmentData, projectData, userData, equipmentData] = await Promise.all([
                    api.getResourceAssignments(user.companyId),
                    api.getProjectsByCompany(user.companyId),
                    api.getUsersByCompany(user.companyId),
                    api.getEquipmentByCompany(user.companyId),
                ]);

                setAssignments(assignmentData);
                setProjects(projectData);
                setPeople((userData as unknown as User[]).filter(person => !!person.companyId));
                setEquipment(equipmentData);
        } catch (error) {
            console.error('Failed to load resource assignments', error);
            addToast('Failed to load resource assignments.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user.companyId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
    const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

    const assignmentsWithMeta = useMemo<AssignmentWithMeta[]>(() => {
        const projectMap = new Map(projects.map(project => [project.id, project]));
        const userMap = new Map(people.map(person => [person.id, person]));
        const equipmentMap = new Map(equipment.map(item => [item.id, item]));

        return assignments.map(assignment => ({
            ...assignment,
            project: projectMap.get(assignment.projectId),
            resource: assignment.resourceType === 'user'
                ? userMap.get(assignment.resourceId)
                : equipmentMap.get(assignment.resourceId),
        }));
    }, [assignments, projects, people, equipment]);

    const assignmentsForWeek = useMemo(
        () => assignmentsWithMeta.filter(assignment => isOverlappingWeek(assignment, weekStart, weekEnd)),
        [assignmentsWithMeta, weekStart, weekEnd],
    );

    const assignmentsByDay = useMemo(() => {
        return weekDays.map(day => {
            const start = day;
            const end = addDays(day, 1);
            return {
                day,
                assignments: assignmentsForWeek.filter(assignment =>
                    isWithinInterval(toDate(assignment.startDate), { start, end }) ||
                    isWithinInterval(toDate(assignment.endDate), { start, end }),
                ),
            };
        });
    }, [weekDays, assignmentsForWeek]);

    const resourceSummary = useMemo(() => {
        const summary = new Map<string, { id: string; name: string; type: 'user' | 'equipment'; count: number }>();
        assignmentsForWeek.forEach(assignment => {
            if (!assignment.resource) return;
            const key = `${assignment.resourceType}:${assignment.resource.id}`;
            const label = assignment.resourceType === 'user'
                ? `${(assignment.resource as User).firstName} ${(assignment.resource as User).lastName}`
                : (assignment.resource as Equipment).name;
            const existing = summary.get(key);
            if (existing) {
                existing.count += 1;
            } else {
                summary.set(key, { id: key, name: label, type: assignment.resourceType, count: 1 });
            }
        });
        return Array.from(summary.values()).sort((a, b) => b.count - a.count);
    }, [assignmentsForWeek]);

    const goToPreviousWeek = () => setWeekStart(current => addDays(current, -7));
    const goToNextWeek = () => setWeekStart(current => addDays(current, 7));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Resource Scheduler</h1>
                    <p className="text-muted-foreground">View how people and equipment are assigned across projects.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={goToPreviousWeek}>
                        Previous
                    </Button>
                    <Button variant="secondary" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                        This Week
                    </Button>
                    <Button variant="secondary" onClick={goToNextWeek}>
                        Next
                    </Button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col gap-4 p-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold">Weekly Overview</h2>
                        <span className="text-sm text-muted-foreground">
                            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
                        </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Card>
                            <div className="p-4">
                                <p className="text-sm text-muted-foreground">Assignments this week</p>
                                <p className="text-3xl font-bold">{assignmentsForWeek.length}</p>
                            </div>
                        </Card>
                        <Card>
                            <div className="p-4">
                                <p className="text-sm text-muted-foreground">People assigned</p>
                                <p className="text-3xl font-bold">
                                    {resourceSummary.filter(item => item.type === 'user').length}
                                </p>
                            </div>
                        </Card>
                        <Card>
                            <div className="p-4">
                                <p className="text-sm text-muted-foreground">Equipment in use</p>
                                <p className="text-3xl font-bold">
                                    {resourceSummary.filter(item => item.type === 'equipment').length}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-medium uppercase tracking-wider text-muted-foreground">Assignments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Loading schedule…</td>
                                </tr>
                            ) : assignmentsByDay.every(day => day.assignments.length === 0) ? (
                                <tr>
                                    <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                                        No assignments scheduled for this week.
                                    </td>
                                </tr>
                            ) : (
                                assignmentsByDay.map(({ day, assignments: dayAssignments }) => (
                                    <tr key={day.toISOString()} className="align-top">
                                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                                            <div>{format(day, 'EEE, MMM d')}</div>
                                            <div className="text-xs text-muted-foreground">{dayAssignments.length} assignment{dayAssignments.length === 1 ? '' : 's'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-3">
                                                {dayAssignments.map(assignment => {
                                                    const resourceData = assignment.resource;
                                                    let displayName = 'Unassigned';
                                                    if (assignment.resourceType === 'user' && resourceData && 'firstName' in resourceData) {
                                                        displayName = `${resourceData.firstName} ${resourceData.lastName}`;
                                                    } else if (assignment.resourceType === 'equipment' && resourceData && 'name' in resourceData) {
                                                        displayName = resourceData.name;
                                                    }

                                                    const projectName = assignment.project?.name ?? 'Unknown project';
                                                    return (
                                                        <Card key={assignment.id}>
                                                            <div className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar name={displayName} className="h-10 w-10" />
                                                                    <div>
                                                                        <p className="font-medium">{displayName}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {projectName}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {format(toDate(assignment.startDate), 'MMM d')} – {format(toDate(assignment.endDate), 'MMM d')}
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h2 className="text-lg font-semibold">Resource Utilisation</h2>
                    <p className="text-sm text-muted-foreground">Most scheduled resources this week.</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {resourceSummary.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No resource usage yet.</p>
                        ) : (
                            resourceSummary.slice(0, 6).map(resource => (
                                <Card key={resource.id}>
                                    <div className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-medium">{resource.name}</p>
                                            <p className="text-xs text-muted-foreground">{resource.type === 'user' ? 'Team member' : 'Equipment'}</p>
                                        </div>
                                        <span className="text-sm font-semibold">{resource.count} booking{resource.count === 1 ? '' : 's'}</span>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                    <Button className="mt-4" onClick={() => addToast('Assignment editing coming soon.', 'info')}>
                        Manage Assignments
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export { ResourceScheduler };
export default ResourceScheduler;
