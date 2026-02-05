"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  User
} from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  dismissible: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
}

const severityConfig = {
  info: { color: "bg-blue-100 text-blue-800", icon: Info, label: "Info" },
  warning: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, label: "Warning" },
  error: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Error" },
  success: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Success" },
};

export function AnnouncementsClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    severity: "info" as "info" | "warning" | "error" | "success",
    dismissible: true,
    expiresAt: ""
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements);
      }
    } catch {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Please fill in title and message");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null
        })
      });

      if (res.ok) {
        toast.success("Announcement created and broadcast to all users");
        setShowCreateModal(false);
        setFormData({
          title: "",
          message: "",
          severity: "info",
          dismissible: true,
          expiresAt: ""
        });
        fetchAnnouncements();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create announcement");
      }
    } catch {
      toast.error("Failed to create announcement");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement? It will be removed for all users.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Announcement deleted");
        fetchAnnouncements();
      } else {
        toast.error("Failed to delete announcement");
      }
    } catch {
      toast.error("Failed to delete announcement");
    }
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
            System Announcements
          </h1>
          <p className="text-gray-500 mt-1">
            Broadcast messages to all platform users
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No announcements yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first announcement to broadcast to all users
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => {
            const config = severityConfig[announcement.severity];
            const Icon = config.icon;

            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${config.color.replace('text-', 'bg-').replace('100', '200')}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{announcement.title}</CardTitle>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            {announcement.dismissible && (
                              <Badge variant="outline" className="text-xs">
                                Dismissible
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {announcement.message}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {announcement.createdBy.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(announcement.createdAt), "PPp")}
                      </div>
                      {announcement.expiresAt && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          Expires {format(new Date(announcement.expiresAt), "PPp")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Announcement Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Create System Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Scheduled Maintenance"
              />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="The system will be under maintenance on..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v: any) => setFormData({ ...formData, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label htmlFor="dismissible" className="cursor-pointer">
                Allow users to dismiss this announcement
              </Label>
              <Switch
                id="dismissible"
                checked={formData.dismissible}
                onCheckedChange={(v) => setFormData({ ...formData, dismissible: v })}
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                📢 This announcement will be immediately broadcast to all connected users
                and shown on their dashboards.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateAnnouncement}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create & Broadcast"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
