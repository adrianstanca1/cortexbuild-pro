import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Role, User, Project, Timesheet, Document as Doc, Todo, TimesheetStatus, DocumentAcknowledgement, Site, CompanySettings, DocumentStatus, DocumentCategory, View, WorkType, Break, ProjectHealth, AuditLog } from '../types';
import { api } from '../services/mockApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { MapView, MapMarker } from './MapView';
import { ToolsView } from './ToolsView';
import { EquipmentView } from './EquipmentView';

interface DashboardProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error') => void;
    activeView: View;
    onSelectProject: (project: Project | null) => void;
}

const ClockInConfirmationModal: React.FC<{
  timesheet: Timesheet;
  project?: Project;
  onClose: () => void;
}> = ({ timesheet, project, onClose }) => {

  const generateTrustSummary = (ts: Timesheet): string => {
    const score = ts.trustScore;
    if (typeof score !== "number")
      return "Trust score could not be calculated.";
    
    const scorePercentText = `${(score * 100).toFixed(0)}%`;
    let summary = `Trust Score: ${scorePercentText}.`;
    const reasons = ts.trustReasons
      ? Object.values(ts.trustReasons)
      : [];
    
    if (score >= 0.9) {
      summary += " High accuracy and location confirmed.";
    } else if (reasons.length > 0) {
      summary += ` Factors: ${reasons.join(", ")}.`;
    }
    return summary;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md text-center">
         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Clock-In Successful!
        </h3>
        <div className="text-gray-600 space-y-2 mb-4">
            <p>
            <strong>Project:</strong> {project?.name || "Loading..."}
            </p>
            <p>
            <strong>Time:</strong> {new Date(timesheet.clockIn).toLocaleTimeString()}
            </p>
             <p>
            <strong>Work Type:</strong> {timesheet.workType || "N/A"}
            </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border">
            <p className="text-sm text-gray-800 font-semibold">{generateTrustSummary(timesheet)}</p>
        </div>
        <Button onClick={onClose} className="mt-6 w-full">
          OK
        </Button>
      </Card>
    </div>
  );
};

const AdminDashboard: React.FC<{ user: User, addToast: DashboardProps['addToast'], activeView: View, onSelectProject: (project: Project) => void }> = ({ user, addToast, activeView, onSelectProject }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role>(Role.OPERATIVE);
    const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
    const [selectedManagerId, setSelectedManagerId] = useState<string>('');
    const [flaggedTimesheets, setFlaggedTimesheets] = useState<Timesheet[]>([]);
    const [projectHealths, setProjectHealths] = useState<(ProjectHealth & {projectId: number})[]>([]);
    const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
    const [overdueTasks, setOverdueTasks] = useState<Todo[]>([]);
    const [loadingHealth, setLoadingHealth] = useState(true);
    const [loadingSites, setLoadingSites] = useState(true);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>(Role.OPERATIVE);
    
    // State for adding a new site
    const [showAddSiteForm, setShowAddSiteForm] = useState(false);
    const [newSiteName, setNewSiteName] = useState('');
    const [newSiteLat, setNewSiteLat] = useState('');
    const [newSiteLng, setNewSiteLng] = useState('');
    const [newSiteRadius, setNewSiteRadius] = useState('');
    const [isAddingSite, setIsAddingSite] = useState(false);

    const fetchDashboardData = useCallback(() => {
        api.getUsersByCompany(user.companyId).then(setUsers);
        setLoadingSites(true);
        api.getSitesByCompany(user.companyId)
            .then(setSites)
            .finally(() => setLoadingSites(false));
        api.getProjectsByCompany(user.companyId).then(allProjects => {
            setProjects(allProjects);
            // Fetch overdue tasks for all projects
            Promise.all(allProjects.map(p => api.getTodosByProject(p.id)))
                .then(tasksByProject => {
                    const allTasks = tasksByProject.flat();
                    const overdue = allTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done');
                    setOverdueTasks(overdue);
                });
        });
        api.getFlaggedTimesheetsByCompany(user.companyId).then(setFlaggedTimesheets);
        api.getRecentActivityByCompany(user.companyId, 5).then(setRecentActivity);
        setLoadingHealth(true);
        api.getProjectHealthReportsForCompany(user.companyId)
            .then(setProjectHealths)
            .finally(() => setLoadingHealth(false));
    }, [user.companyId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);
    
    const handleAddSite = (e: React.FormEvent) => {
        e.preventDefault();
        const lat = parseFloat(newSiteLat);
        const lng = parseFloat(newSiteLng);
        const radius = parseInt(newSiteRadius, 10);

        if (!newSiteName.trim() || isNaN(lat) || isNaN(lng) || isNaN(radius) || radius <= 0) {
            addToast('Please fill in all fields with valid data.', 'error');
            return;
        }

        setIsAddingSite(true);
        api.addSite({
            name: newSiteName,
            location: { lat, lng },
            radius,
            companyId: user.companyId
        }).then(() => {
            addToast('New site added successfully!', 'success');
            // Reset form
            setShowAddSiteForm(false);
            setNewSiteName('');
            setNewSiteLat('');
            setNewSiteLng('');
            setNewSiteRadius('');
            // Refetch sites to update map
            api.getSitesByCompany(user.companyId).then(setSites);
        }).catch(err => {
            addToast('Failed to add site.', 'error');
        }).finally(() => {
            setIsAddingSite(false);
        });
    };

    const handleSendInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (inviteEmail && inviteName) {
            setIsSendingInvite(true);
            api.inviteUser({ email: inviteEmail, name: inviteName, role: inviteRole, companyId: user.companyId })
               .then(() => {
                   fetchDashboardData(); // Refetch all data
                   setShowInviteForm(false);
                   setInviteName('');
                   setInviteEmail('');
                   setInviteRole(Role.OPERATIVE);
                   addToast(`Invite sent to ${inviteName}`, 'success');
               }).catch(() => {
                   addToast('Failed to send invite', 'error');
               }).finally(() => {
                    setIsSendingInvite(false);
               });
        }
    };
    
    const handleEditUser = (userToEdit: User) => {
        setEditingUserId(userToEdit.id);
        setSelectedRole(userToEdit.role);
    };

    const handleSaveUser = (userId: number) => {
        api.updateUser(userId, { role: selectedRole }).then(() => {
            setEditingUserId(null);
            fetchDashboardData();
            addToast('User role updated successfully', 'success');
        });
    };

     const handleEditProject = (projectToEdit: Project) => {
        setEditingProjectId(projectToEdit.id);
        setSelectedManagerId(projectToEdit.managerId.toString());
    };

    const handleSaveProject = (projectId: number) => {
        api.updateProject(projectId, { managerId: parseInt(selectedManagerId, 10) }, user.id).then(() => {
            setEditingProjectId(null);
            fetchDashboardData();
            addToast('Project manager updated successfully', 'success');
        });
    };
    
    const getActionIcon = (action: string) => { /* simplified icon logic */ return '📄'; };

    const handleMarkerClick = (siteId: number | string) => {
        const site = sites.find(s => s.id === siteId);
        if (site) {
            setSelectedSite(site);
        }
    };

    const SiteDetailModal: React.FC<{ site: Site; onClose: () => void }> = ({ site, onClose }) => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{site.name}</h3>
                        <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-800 -mt-2 -mr-2 p-1">&times;</button>
                    </div>
                    <div className="space-y-4 text-slate-700">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>Address: {site.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 116 0 3 3 0 01-6 0z" /></svg>
                            <span>Geofence Radius: {site.radius}m</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Created: {new Date(site.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <Button onClick={onClose} className="mt-6 w-full" variant="secondary">Close</Button>
                </Card>
            </div>
        );
    };

    if (activeView === 'users') {
        const filteredUsers = users.filter(user => roleFilter === 'All' || user.role === roleFilter);
        return (
            <Card>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-slate-700">Company Users</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">Filter:</label>
                            <select
                                id="role-filter"
                                value={roleFilter}
                                onChange={e => setRoleFilter(e.target.value as Role | 'All')}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                            >
                                <option value="All">All Roles</option>
                                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <Button onClick={() => setShowInviteForm(!showInviteForm)} variant="secondary">
                            {showInviteForm ? 'Cancel' : 'Invite User'}
                        </Button>
                    </div>
                </div>

                {showInviteForm && (
                    <form onSubmit={handleSendInvite} className="p-4 mb-4 bg-slate-50 rounded-lg border">
                        <h4 className="font-semibold text-lg mb-3 text-slate-700">Invite New User</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" id="invite-name" value={inviteName} onChange={e => setInviteName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                            </div>
                            <div>
                                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" id="invite-email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                            </div>
                            <div>
                                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">Role</label>
                                <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value as Role)} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500">
                                    {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 text-right">
                             <Button type="submit" variant="success" isLoading={isSendingInvite}>Send Invite</Button>
                        </div>
                    </form>
                )}
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {editingUserId === u.id ? (
                                          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value as Role)} className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                                              {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                                          </select>
                                      ) : (
                                          u.role
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingUserId === u.id ? (
                                            <>
                                                <Button size="sm" variant="success" onClick={() => handleSaveUser(u.id)} className="mr-2">Save</Button>
                                                <Button size="sm" variant="secondary" onClick={() => setEditingUserId(null)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="secondary" onClick={() => handleEditUser(u)}>Edit Role</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        );
    }
    
    if (activeView === 'projects') {
        const projectManagers = users.filter(u => u.role === Role.PM);
         return (
             <Card>
                <h3 className="text-xl font-semibold text-slate-700 mb-4">Company Projects</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Site</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Manager</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projects.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.location.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                      {editingProjectId === p.id ? (
                                          <select value={selectedManagerId} onChange={e => setSelectedManagerId(e.target.value)} className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
                                              {projectManagers.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                          </select>
                                      ) : (
                                          users.find(u => u.id === p.managerId)?.name || <span className="text-red-600">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingProjectId === p.id ? (
                                            <>
                                                <Button size="sm" variant="success" onClick={() => handleSaveProject(p.id)} className="mr-2">Save</Button>
                                                <Button size="sm" variant="secondary" onClick={() => setEditingProjectId(null)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="secondary" onClick={() => handleEditProject(p)}>Change PM</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </Card>
         );
    }

    if (activeView === 'equipment') {
        return <EquipmentView user={user} addToast={addToast} />;
    }
    
    if (activeView === 'tools') {
        return <ToolsView user={user} addToast={addToast} />;
    }
    
    const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
        <div className="bg-white p-4 rounded-xl border flex items-start gap-4">
            <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );

    const siteMarkers: MapMarker[] = sites.map(site => ({
        id: site.id,
        lat: site.location.lat,
        lng: site.location.lng,
    }));

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
            
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatCard title="Total Users" value={users.length} colorClass="bg-sky-100 text-sky-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125a4 4 0 00-6.44 0A6 6 0 003 20v1h12z" /></svg>} />
                 <StatCard title="Projects In Progress" value={projects.length} colorClass="bg-green-100 text-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
                 <StatCard title="Flagged Timesheets" value={flaggedTimesheets.length} colorClass="bg-yellow-100 text-yellow-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>} />
                 <StatCard title="Overdue Tasks" value={overdueTasks.length} colorClass="bg-red-100 text-red-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Flagged Timesheets */}
                <Card className="lg:col-span-1 animate-card-enter">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Flagged Timesheets</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {flaggedTimesheets.length > 0 ? flaggedTimesheets.map(ts => {
                            const user = users.find(u => u.id === ts.userId);
                            const project = projects.find(p => p.id === ts.projectId);
                            return (
                                <div key={ts.id} className="p-3 bg-slate-50 rounded-lg border">
                                    <p className="font-semibold text-slate-800">{user?.name}</p>
                                    <p className="text-sm text-slate-600">{project?.name}</p>
                                    <p className="text-xs text-yellow-700 mt-1">{Object.values(ts.trustReasons || {}).join(', ')}</p>
                                </div>
                            );
                        }) : <p className="text-sm text-slate-500">No timesheets currently need review.</p>}
                    </div>
                </Card>

                {/* Projects Health */}
                <Card className="lg:col-span-2 animate-card-enter" style={{animationDelay: '100ms'}}>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Projects Health Overview</h3>
                    {loadingHealth ? <p className="text-sm text-slate-500">Analyzing project health...</p> :
                     <div className="space-y-2 max-h-96 overflow-y-auto">
                        {projects.map(p => {
                            const health = projectHealths.find(h => h.projectId === p.id);
                            const scoreColor = health ? (health.score >= 80 ? 'bg-green-500' : health.score >= 60 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-gray-300';
                            return (
                                <div key={p.id} onClick={() => onSelectProject(p)} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-semibold text-slate-800">{p.name}</p>
                                        <p className="text-sm text-slate-500">{health?.summary || 'Data unavailable'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${scoreColor}`}>{health?.score || '?'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>}
                </Card>
                
                {/* Company Sites Map */}
                <Card className="lg:col-span-3 animate-card-enter" style={{animationDelay: '200ms'}}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700">Company Sites</h3>
                         <Button onClick={() => setShowAddSiteForm(prev => !prev)} variant="secondary">
                            {showAddSiteForm ? 'Cancel' : 'Add New Site'}
                        </Button>
                    </div>
                    {showAddSiteForm && (
                        <form onSubmit={handleAddSite} className="p-4 mb-4 bg-slate-50 rounded-lg border space-y-4">
                            <h4 className="font-semibold text-lg text-slate-700">Add New Company Site</h4>
                            <div>
                                <label htmlFor="site-name" className="block text-sm font-medium text-gray-700">Site Name</label>
                                <input type="text" id="site-name" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="site-lat" className="block text-sm font-medium text-gray-700">Latitude</label>
                                    <input type="number" step="any" id="site-lat" value={newSiteLat} onChange={e => setNewSiteLat(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="site-lng" className="block text-sm font-medium text-gray-700">Longitude</label>
                                    <input type="number" step="any" id="site-lng" value={newSiteLng} onChange={e => setNewSiteLng(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="site-radius" className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                                    <input type="number" id="site-radius" value={newSiteRadius} onChange={e => setNewSiteRadius(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                            <div className="text-right">
                                <Button type="submit" isLoading={isAddingSite}>Add Site</Button>
                            </div>
                        </form>
                    )}
                    {loadingSites ? (
                        <div className="h-96 w-full bg-slate-100 rounded-md flex items-center justify-center animate-pulse">
                            <p className="text-slate-500">Loading site map...</p>
                        </div>
                    ) : (
                        <MapView markers={siteMarkers} height="h-96" onMarkerClick={handleMarkerClick} />
                    )}
                </Card>

                {/* Recent Activity */}
                 <Card className="lg:col-span-3 animate-card-enter" style={{animationDelay: '300ms'}}>
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Recent Company Activity</h3>
                    <ul className="space-y-4">
                        {recentActivity.map(log => {
                             const actor = users.find(u => u.id === log.actorId);
                             return (
                                <li key={log.id} className="flex items-center gap-4 text-sm">
                                    <div className="p-2 bg-slate-100 rounded-full">{getActionIcon(log.action)}</div>
                                    <div>
                                        <p className="text-slate-700">
                                            <span className="font-semibold">{actor?.name || 'System'}</span> {log.action.toLowerCase()}
                                            {log.target && ` on "${log.target.name}"`}
                                        </p>
                                        <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                                    </div>
                                </li>
                             )
                        })}
                    </ul>
                </Card>
            </div>
            {selectedSite && <SiteDetailModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
        </div>
    );
};

const PMDashboard: React.FC<{ user: User, addToast: DashboardProps['addToast'], onSelectProject: (project: Project) => void }> = ({ user, addToast, onSelectProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.getProjectsByManager(user.id).then(setProjects).finally(() => setLoading(false));
    }, [user.id]);

    if (loading) {
        return <p>Loading projects...</p>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Your Projects</h2>
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <Card key={p.id} className="hover:shadow-lg transition-shadow flex flex-col">
                            <h3 className="text-xl font-semibold mb-2">{p.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 flex-grow">{p.location.address}</p>
                            <Button onClick={() => onSelectProject(p)}>View Details</Button>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card><p>You are not assigned to manage any projects yet.</p></Card>
            )}
        </div>
    );
};

const ForemanDashboard = PMDashboard; // Same functionality for this mock
const SafetyOfficerDashboard = PMDashboard; // Same functionality for this mock

const OperativeDashboard: React.FC<{ user: User; addToast: DashboardProps['addToast'] }> = ({ user, addToast }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
    const [activeTimesheet, setActiveTimesheet] = useState<Timesheet | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<Timesheet | null>(null);
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);
    const { data: geoData, loading: geoLoading, error: geoError, getLocation } = useGeolocation();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [selectedWorkType, setSelectedWorkType] = useState<WorkType>(WorkType.GENERAL_LABOR);


    const fetchData = useCallback(() => {
        api.getProjectsByUser(user.id).then(data => {
            setProjects(data);
            if (data.length > 0 && !selectedProjectId) {
                setSelectedProjectId(data[0].id.toString());
            }
        });
        api.getTimesheetsByUser(user.id).then(data => {
            setTimesheets(data);
            const active = data.find(t => t.clockOut === null);
            setActiveTimesheet(active || null);
        });
    }, [user.id, selectedProjectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClockIn = async () => {
        if (!selectedProjectId) {
            addToast('Please select a project.', 'error');
            return;
        }
        setIsClockingIn(true);
        getLocation();
    };

    useEffect(() => {
        if (isClockingIn && geoData) {
            const { latitude, longitude, accuracy } = geoData.coords;
            api.clockIn(user.id, parseInt(selectedProjectId, 10), { lat: latitude, lng: longitude, accuracy }, selectedWorkType)
                .then(newTimesheet => {
                    addToast('Successfully clocked in!', 'success');
                    setShowConfirmModal(newTimesheet);
                    fetchData();
                })
                .catch(err => addToast(err.toString(), 'error'))
                .finally(() => setIsClockingIn(false));
        } else if (isClockingIn && geoError) {
             addToast(geoError.message, 'error');
             setIsClockingIn(false);
        }
    }, [geoData, geoError, isClockingIn, user.id, selectedProjectId, addToast, fetchData, selectedWorkType, getLocation]);


    const handleClockOut = async () => {
        if (activeTimesheet) {
            setIsClockingOut(true);
            api.clockOut(activeTimesheet.id)
                .then(() => {
                    addToast('Successfully clocked out!', 'success');
                    fetchData();
                })
                .catch(err => addToast(err.toString(), 'error'))
                .finally(() => setIsClockingOut(false));
        }
    };

    const confirmModalProject = showConfirmModal ? projects.find(p => p.id === showConfirmModal.projectId) : undefined;
    
    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Operative Dashboard</h2>
            <Card>
                <h3 className="text-xl font-semibold mb-4">Time Clock</h3>
                {activeTimesheet ? (
                    <div className="text-center">
                        <p className="mb-2">You are currently clocked in at:</p>
                        <p className="font-bold text-lg mb-4">{projects.find(p => p.id === activeTimesheet.projectId)?.name}</p>
                        <Button onClick={handleClockOut} variant="danger" size="lg" isLoading={isClockingOut}>Clock-Out</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                            <select id="project-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="work-type-select" className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                            <select id="work-type-select" value={selectedWorkType} onChange={e => setSelectedWorkType(e.target.value as WorkType)} className="w-full p-2 border border-gray-300 rounded-md">
                                {Object.values(WorkType).map(wt => <option key={wt} value={wt}>{wt}</option>)}
                            </select>
                        </div>
                        <Button onClick={handleClockIn} variant="success" size="lg" isLoading={isClockingIn || geoLoading} disabled={!selectedProjectId}>Clock-In</Button>
                         {geoError && <p className="text-sm text-red-600">Geolocation Error: {geoError.message}</p>}
                    </div>
                )}
            </Card>
             {showConfirmModal && (
                <ClockInConfirmationModal
                    timesheet={showConfirmModal}
                    project={confirmModalProject}
                    onClose={() => setShowConfirmModal(null)}
                />
            )}
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, addToast, activeView, onSelectProject }) => {
    switch (user.role) {
        case Role.ADMIN:
            return <AdminDashboard user={user} addToast={addToast} activeView={activeView} onSelectProject={onSelectProject} />;
        case Role.PM:
            if (activeView === 'tools') return <ToolsView user={user} addToast={addToast} />;
            if (activeView === 'equipment') return <EquipmentView user={user} addToast={addToast} />;
            return <PMDashboard user={user} addToast={addToast} onSelectProject={onSelectProject}/>;
        case Role.FOREMAN:
             return <ForemanDashboard user={user} addToast={addToast} onSelectProject={onSelectProject} />;
        case Role.SAFETY_OFFICER:
             return <SafetyOfficerDashboard user={user} addToast={addToast} onSelectProject={onSelectProject} />;
        case Role.OPERATIVE:
            return <OperativeDashboard user={user} addToast={addToast} />;
        default:
            return <Card><p>Dashboard not available for your role.</p></Card>;
    }
};