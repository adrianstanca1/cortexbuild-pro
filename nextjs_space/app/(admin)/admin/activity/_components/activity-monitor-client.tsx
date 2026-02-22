"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Search,
  RefreshCw,
  User,
  FolderKanban,
  ListTodo,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const entityIcons: Record<string, any> = {
  Project: FolderKanban,
  Task: ListTodo,
  Document: FileText,
  User: User,
  TeamMember: Users,
  Organization: Building2
};

const entityColors: Record<string, string> = {
  Project: "bg-green-100 text-green-600",
  Task: "bg-blue-100 text-blue-600",
  Document: "bg-orange-100 text-orange-600",
  User: "bg-purple-100 text-purple-600",
  TeamMember: "bg-teal-100 text-teal-600",
  Organization: "bg-indigo-100 text-indigo-600"
};

export function ActivityMonitorClient() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async (page = 1) => {
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (searchQuery) params.set("action", searchQuery);
      if (entityFilter !== "all") params.set("entityType", entityFilter);

      const res = await fetch(`/api/admin/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchActivities(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, entityFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities(pagination.page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Activity Monitor
          </h1>
          <p className="text-gray-500 mt-1">Real-time platform activity logs</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pagination.total}</p>
                <p className="text-sm text-gray-500">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FolderKanban className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activities.filter(a => a.entityType === "Project").length}
                </p>
                <p className="text-sm text-gray-500">Project Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activities.filter(a => a.entityType === "Task").length}
                </p>
                <p className="text-sm text-gray-500">Task Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {activities.filter(a => a.entityType === "User").length}
                </p>
                <p className="text-sm text-gray-500">User Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Project">Projects</SelectItem>
                <SelectItem value="Task">Tasks</SelectItem>
                <SelectItem value="Document">Documents</SelectItem>
                <SelectItem value="User">Users</SelectItem>
                <SelectItem value="TeamMember">Team Members</SelectItem>
                <SelectItem value="Organization">Organizations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = entityIcons[activity.entityType] || Activity;
              const colorClass = entityColors[activity.entityType] || "bg-gray-100 text-gray-600";

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className={`p-2 rounded-lg h-fit ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          <span className="text-purple-600">{activity.user.name}</span>
                          {" "}{activity.action}
                          {activity.entityName && (
                            <span className="font-semibold"> &quot;{activity.entityName}&quot;</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <Badge variant="outline">{activity.entityType}</Badge>
                          {activity.project && (
                            <span className="flex items-center gap-1">
                              <FolderKanban className="h-3 w-3" />
                              {activity.project.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {activity.details && (
                          <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(activity.createdAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {activities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500">No activities found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivities(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivities(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
