"use client";

import { useState, useEffect } from "react";
import { Webhook, Plus, Eye, Edit, Trash2, RefreshCw, Check, X, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
  lastTriggered: string | null;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  status: "success" | "failed" | "pending";
  statusCode: number | null;
  responseTime: number | null;
  error: string | null;
  createdAt: string;
  retryCount: number;
}

const WEBHOOK_EVENTS = [
  "project.created", "project.updated", "project.deleted",
  "user.created", "user.updated",
  "task.created", "task.completed",
  "document.uploaded"
];

export function WebhooksClient() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [activeTab, setActiveTab] = useState("webhooks");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [webhooksRes, deliveriesRes] = await Promise.all([
        fetch("/api/admin/webhooks"),
        fetch("/api/admin/webhooks/deliveries")
      ]);

      if (webhooksRes.ok) {
        const data = await webhooksRes.json();
        setWebhooks(data.webhooks || []);
      }

      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      toast.error("Failed to fetch webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.url) {
      toast.error("Please fill in name and URL");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Webhook created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", url: "", events: [], isActive: true });
        fetchData();
      } else {
        toast.error("Failed to create webhook");
      }
    } catch (error) {
      toast.error("Failed to create webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWebhook) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/webhooks/${selectedWebhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Webhook updated successfully");
        setShowEditModal(false);
        setSelectedWebhook(null);
        fetchData();
      } else {
        toast.error("Failed to update webhook");
      }
    } catch (error) {
      toast.error("Failed to update webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Webhook deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete webhook");
      }
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}/test`, {
        method: "POST"
      });

      if (res.ok) {
        toast.success("Test webhook sent successfully");
        fetchData();
      } else {
        toast.error("Failed to send test webhook");
      }
    } catch (error) {
      toast.error("Failed to send test webhook");
    }
  };

  const openEditModal = (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const activeWebhooks = webhooks.filter(w => w.isActive).length;
  const successfulDeliveries = deliveries.filter(d => d.status === "success").length;
  const failedDeliveries = deliveries.filter(d => d.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="text-gray-500 mt-1">Manage webhook configurations and deliveries</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Webhooks</p>
                <p className="text-2xl font-bold mt-1">{webhooks.length}</p>
              </div>
              <Webhook className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold mt-1">{activeWebhooks}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Successful</p>
                <p className="text-2xl font-bold mt-1">{successfulDeliveries}</p>
              </div>
              <Check className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold mt-1">{failedDeliveries}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <Eye className="h-4 w-4 mr-2" />
            Deliveries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{webhook.events.length} events</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={webhook.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleTest(webhook.id)}>
                            <Play className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditModal(webhook)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(webhook.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {webhooks.length === 0 && (
                <div className="text-center py-12">
                  <Webhook className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No webhooks configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.webhookName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{delivery.event}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(delivery.status)}>
                          {delivery.status === "success" && <Check className="h-3 w-3 mr-1" />}
                          {delivery.status === "failed" && <X className="h-3 w-3 mr-1" />}
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.responseTime ? `${delivery.responseTime}ms` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{format(new Date(delivery.createdAt), "MMM d, HH:mm")}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowDeliveryModal(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {deliveries.length === 0 && (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-gray-500">No delivery history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      {[
        { open: showCreateModal, setOpen: setShowCreateModal, title: "Create Webhook", action: handleCreate },
        { open: showEditModal, setOpen: setShowEditModal, title: "Edit Webhook", action: handleUpdate }
      ].map(({ open, setOpen, title, action }, idx) => (
        <Dialog key={idx} open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {idx === 0 ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                {title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Project Updates Webhook"
                />
              </div>
              <div>
                <Label>URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.example.com/webhooks"
                />
              </div>
              <div>
                <Label>Events</Label>
                <Select
                  value={formData.events[0] || ""}
                  onValueChange={(value) => {
                    if (value && !formData.events.includes(value)) {
                      setFormData({ ...formData, events: [...formData.events, value] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select events" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_EVENTS.map((event) => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.events.map((event) => (
                    <Badge
                      key={event}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, events: formData.events.filter(e => e !== event) })}
                    >
                      {event}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`isActive-${idx}`}
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor={`isActive-${idx}`}>Active</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={action} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  {idx === 0 ? "Create" : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}

      {/* Delivery Details Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Delivery Details
            </DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Webhook</Label>
                  <p className="font-medium mt-1">{selectedDelivery.webhookName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Event</Label>
                  <Badge variant="outline" className="mt-1">{selectedDelivery.event}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedDelivery.status)}>{selectedDelivery.status}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status Code</Label>
                  <p className="text-sm mt-1">{selectedDelivery.statusCode || "N/A"}</p>
                </div>
              </div>

              {selectedDelivery.error && (
                <div>
                  <Label className="text-xs text-gray-500">Error</Label>
                  <div className="mt-1 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <pre className="text-xs whitespace-pre-wrap text-red-900 dark:text-red-100">
                      {selectedDelivery.error}
                    </pre>
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setShowDeliveryModal(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
