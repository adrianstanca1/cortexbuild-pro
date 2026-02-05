"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Server,
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Database,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
  Power,
  PowerOff,
  Activity,
  History,
  Settings,
  ExternalLink,
  Terminal,
  Mail,
  Brain,
  CreditCard,
  Cloud,
  MessageSquare,
  Bell,
  BarChart,
  Radio,
  Webhook,
  Link2,
  Layers,
  AlertCircle,
  Check,
  Info,
  Save,
  Loader2
} from "lucide-react";
import {  Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { HealthMonitoring } from "./health-monitoring";
import { UsageAnalytics } from "./usage-analytics";
import { RateLimiting } from "./rate-limiting";

// Types
interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  baseUrl: string;
  docsUrl?: string;
  credentialFields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    helpText?: string;
  }>;
  isBuiltIn: boolean;
  isPlatformCore: boolean;
  dependencies: Array<{
    moduleId: string;
    moduleName: string;
    usageDescription: string;
    isRequired: boolean;
  }>;
  status: string;
  environment: string;
  isConfigured: boolean;
  connectionId?: string;
  lastValidatedAt?: string;
  lastErrorMessage?: string;
}

interface ApiConnection {
  id: string;
  name: string;
  serviceName: string;
  description: string | null;
  type: "EXTERNAL" | "INTERNAL";
  environment: "DEVELOPMENT" | "STAGING" | "PRODUCTION";
  credentials: Record<string, string>;
  baseUrl: string | null;
  version: string | null;
  headers: Record<string, string>;
  status: "ACTIVE" | "INACTIVE" | "ERROR" | "EXPIRED" | "DISABLED";
  lastValidatedAt: string | null;
  lastErrorMessage: string | null;
  consecutiveErrors: number;
  isEnabled: boolean;
  expiresAt: string | null;
  createdById: string;
  createdBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  _count: { logs: number };
}

interface ApiConnectionLog {
  id: string;
  connectionId: string;
  connection: { id: string; name: string; serviceName: string };
  action: string;
  details: any;
  previousStatus: string | null;
  newStatus: string | null;
  testSuccess: boolean | null;
  testResponseTime: number | null;
  testErrorMessage: string | null;
  performedBy: { id: string; name: string; email: string } | null;
  ipAddress: string | null;
  createdAt: string;
}

interface DependencyModule {
  moduleId: string;
  moduleName: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    status: string;
    isRequired: boolean;
    usageDescription: string;
  }>;
}

interface CustomApiForm {
  name: string;
  serviceName: string;
  description: string;
  type: "EXTERNAL" | "INTERNAL";
  environment: "DEVELOPMENT" | "STAGING" | "PRODUCTION";
  baseUrl: string;
  version: string;
  credentials: Record<string, string>;
  headers: Record<string, string>;
  expiresAt: string;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Mail: Mail,
  Brain: Brain,
  CreditCard: CreditCard,
  Cloud: Cloud,
  Database: Database,
  MessageSquare: MessageSquare,
  Bell: Bell,
  BarChart: BarChart,
  Radio: Radio,
  Webhook: Webhook,
};

// Status colors and indicators
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  ACTIVE: { color: "text-green-600", bgColor: "bg-green-500", icon: CheckCircle2, label: "Active" },
  INACTIVE: { color: "text-gray-500", bgColor: "bg-gray-400", icon: PowerOff, label: "Inactive" },
  DISCONNECTED: { color: "text-red-600", bgColor: "bg-red-500", icon: XCircle, label: "Disconnected" },
  ERROR: { color: "text-red-600", bgColor: "bg-red-500", icon: AlertTriangle, label: "Error" },
  EXPIRED: { color: "text-yellow-600", bgColor: "bg-yellow-500", icon: Clock, label: "Expired" },
  INVALID: { color: "text-red-600", bgColor: "bg-red-500", icon: AlertCircle, label: "Invalid" },
  NOT_CONFIGURED: { color: "text-gray-400", bgColor: "bg-gray-300", icon: Settings, label: "Not Configured" },
  DISABLED: { color: "text-gray-500", bgColor: "bg-gray-400", icon: PowerOff, label: "Disabled" },
};

const CATEGORY_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-800",
  AI_PROCESSING: "bg-purple-100 text-purple-800",
  PAYMENTS: "bg-green-100 text-green-800",
  STORAGE: "bg-orange-100 text-orange-800",
  DATABASE: "bg-indigo-100 text-indigo-800",
  COMMUNICATION: "bg-pink-100 text-pink-800",
  NOTIFICATIONS: "bg-yellow-100 text-yellow-800",
  INTERNAL: "bg-gray-100 text-gray-800",
  ANALYTICS: "bg-teal-100 text-teal-800",
  CUSTOM: "bg-slate-100 text-slate-800",
};

const INITIAL_CUSTOM_FORM: CustomApiForm = {
  name: "",
  serviceName: "",
  description: "",
  type: "EXTERNAL",
  environment: "PRODUCTION",
  baseUrl: "",
  version: "",
  credentials: {},
  headers: {},
  expiresAt: "",
};

export function ApiManagementClient() {
  // State
  const [activeTab, setActiveTab] = useState("platform");
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [logs, setLogs] = useState<ApiConnectionLog[]>([]);
  const [dependencies, setDependencies] = useState<DependencyModule[]>([]);
  const [stats, setStats] = useState<any>({});
  const [_categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, _setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEnv, setFilterEnv] = useState<string>("PRODUCTION");

  // Modals
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [showCustomApiModal, setShowCustomApiModal] = useState(false);
  const [_showDependenciesModal, _setShowDependenciesModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ApiConnection | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  // Form state
  const [configCredentials, setConfigCredentials] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<Partial<ApiConnection>>({});
  const [rotateCredentials, setRotateCredentials] = useState<Record<string, string>>({});
  const [customApiForm, setCustomApiForm] = useState<CustomApiForm>(INITIAL_CUSTOM_FORM);
  const [customCredentialKeys, setCustomCredentialKeys] = useState<string[]>(["API_KEY"]);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [newCredentialKey, setNewCredentialKey] = useState("");

  // Fetch platform services
  const fetchServices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("environment", filterEnv);
      if (filterCategory !== "all") params.set("category", filterCategory);

      const res = await fetch(`/api/admin/api-connections/services?${params}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
        setStats(data.stats || {});
        setCategories(data.categories || []);
      }
    } catch {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch platform services");
    }
  }, [filterEnv, filterCategory]);

  // Fetch custom connections
  const fetchConnections = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterEnv !== "all") params.set("environment", filterEnv);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/admin/api-connections?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch {
      console.error("Error fetching connections:", error);
    }
  }, [filterEnv, filterStatus]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-connections/logs?limit=100");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      console.error("Error fetching logs:", error);
    }
  }, []);

  // Fetch dependencies
  const fetchDependencies = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-connections/dependencies");
      if (res.ok) {
        const data = await res.json();
        setDependencies(data.dependencyMap || []);
      }
    } catch {
      console.error("Error fetching dependencies:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchServices(),
        fetchConnections(),
        fetchLogs(),
        fetchDependencies()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchServices, fetchConnections, fetchLogs, fetchDependencies]);

  // Fetch decrypted credentials for editing
  const fetchDecryptedCredentials = async (connectionId: string) => {
    setLoadingCredentials(true);
    try {
      const res = await fetch(`/api/admin/api-connections/${connectionId}/credentials`);
      if (res.ok) {
        const data = await res.json();
        return data.credentials;
      }
      toast.error("Failed to fetch credentials");
      return null;
    } catch {
      console.error("Error fetching credentials:", error);
      toast.error("Failed to fetch credentials");
      return null;
    } finally {
      setLoadingCredentials(false);
    }
  };

  // Test a service connection
  const handleTestService = async (service: ServiceDefinition) => {
    if (!service.connectionId) {
      toast.error("Service is not configured");
      return;
    }

    setTesting(service.id);
    try {
      const res = await fetch(`/api/admin/api-connections/${service.connectionId}/test`, {
        method: "POST"
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Connection test passed (${data.responseTime}ms)`);
      } else {
        toast.error(`Connection test failed: ${data.error || "Unknown error"}`);
      }

      fetchServices();
      fetchLogs();
    } catch {
      toast.error("Failed to test connection");
    } finally {
      setTesting(null);
    }
  };

  // Test custom connection
  const handleTestConnection = async (connectionId: string) => {
    setTesting(connectionId);
    try {
      const res = await fetch(`/api/admin/api-connections/${connectionId}/test`, {
        method: "POST"
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Connection test passed (${data.responseTime}ms)`);
      } else {
        toast.error(`Connection test failed: ${data.error || "Unknown error"}`);
      }

      fetchConnections();
      fetchLogs();
    } catch {
      toast.error("Failed to test connection");
    } finally {
      setTesting(null);
    }
  };

  // Configure a service
  const handleConfigureService = async () => {
    if (!selectedService) return;

    const requiredFields = selectedService.credentialFields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!configCredentials[field.key]) {
        toast.error(`Please enter ${field.label}`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/api-connections/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          credentials: configCredentials,
          environment: filterEnv
        })
      });

      if (res.ok) {
        toast.success(`${selectedService.name} configured successfully`);
        setShowConfigureModal(false);
        setSelectedService(null);
        setConfigCredentials({});
        fetchServices();
        fetchLogs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to configure service");
      }
    } catch {
      toast.error("Failed to configure service");
    } finally {
      setSaving(false);
    }
  };

  // Open edit modal
  const handleOpenEdit = async (service: ServiceDefinition) => {
    if (!service.connectionId) return;

    setSelectedService(service);
    setShowEditModal(true);

    // Fetch actual credentials
    const credentials = await fetchDecryptedCredentials(service.connectionId);
    if (credentials) {
      // Find connection details
      const conn = connections.find(c => c.id === service.connectionId);
      setEditForm({
        name: service.name,
        description: service.description,
        baseUrl: service.baseUrl,
        version: conn?.version || "",
        environment: conn?.environment || service.environment as any,
        status: conn?.status || "ACTIVE",
        headers: conn?.headers || {},
        isEnabled: conn?.isEnabled !== false,
        credentials: credentials,
      });
      setConfigCredentials(credentials);
    }
  };

  // Open edit modal for custom connection
  const handleOpenEditConnection = async (connection: ApiConnection) => {
    setSelectedConnection(connection);
    setShowEditModal(true);
    setSelectedService(null);

    // Fetch actual credentials
    const credentials = await fetchDecryptedCredentials(connection.id);
    if (credentials) {
      setEditForm({
        name: connection.name,
        description: connection.description || "",
        baseUrl: connection.baseUrl || "",
        version: connection.version || "",
        environment: connection.environment,
        status: connection.status,
        headers: connection.headers || {},
        isEnabled: connection.isEnabled,
        credentials: credentials,
      });
      setConfigCredentials(credentials);
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    const connectionId = selectedService?.connectionId || selectedConnection?.id;
    if (!connectionId) return;

    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name,
        description: editForm.description,
        baseUrl: editForm.baseUrl,
      };

      // Include optional fields if present
      if (editForm.version !== undefined) {
        payload.version = editForm.version;
      }
      if (editForm.environment !== undefined) {
        payload.environment = editForm.environment;
      }
      if (editForm.status !== undefined) {
        payload.status = editForm.status;
      }
      if (editForm.headers !== undefined) {
        payload.headers = editForm.headers;
      }
      if (editForm.isEnabled !== undefined) {
        payload.isEnabled = editForm.isEnabled;
      }

      // Only include credentials if they were modified (not empty)
      const nonEmptyCredentials = Object.fromEntries(
        Object.entries(configCredentials).filter(([_, v]) => v && v.trim() !== "")
      );
      if (Object.keys(nonEmptyCredentials).length > 0) {
        payload.credentials = nonEmptyCredentials;
      }

      const res = await fetch(`/api/admin/api-connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Configuration updated successfully");
        setShowEditModal(false);
        setSelectedService(null);
        setSelectedConnection(null);
        setEditForm({});
        setConfigCredentials({});
        fetchServices();
        fetchConnections();
        fetchLogs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update configuration");
      }
    } catch {
      toast.error("Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  // Open rotate modal
  const handleOpenRotate = async (service: ServiceDefinition) => {
    if (!service.connectionId) return;

    setSelectedService(service);
    setRotateCredentials({});
    setShowRotateModal(true);
  };

  // Rotate credentials
  const handleRotateCredentials = async () => {
    const connectionId = selectedService?.connectionId || selectedConnection?.id;
    if (!connectionId) return;

    if (Object.keys(rotateCredentials).length === 0) {
      toast.error("Please enter new credentials");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/api-connections/${connectionId}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: rotateCredentials })
      });

      if (res.ok) {
        toast.success("Credentials rotated successfully");
        setShowRotateModal(false);
        setSelectedService(null);
        setSelectedConnection(null);
        setRotateCredentials({});
        fetchServices();
        fetchConnections();
        fetchLogs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to rotate credentials");
      }
    } catch {
      toast.error("Failed to rotate credentials");
    } finally {
      setSaving(false);
    }
  };

  // Toggle service status
  const handleToggleService = async (service: ServiceDefinition) => {
    if (!service.connectionId) {
      toast.error("Service is not configured");
      return;
    }

    try {
      const isCurrentlyActive = service.status === "ACTIVE";
      const res = await fetch(`/api/admin/api-connections/${service.connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: !isCurrentlyActive,
          status: isCurrentlyActive ? "DISABLED" : "ACTIVE"
        })
      });

      if (res.ok) {
        toast.success(`Service ${isCurrentlyActive ? "disabled" : "enabled"}`);
        fetchServices();
        fetchLogs();
      } else {
        toast.error("Failed to update service status");
      }
    } catch {
      toast.error("Failed to update service");
    }
  };

  // Toggle connection status
  const handleToggleConnection = async (connection: ApiConnection) => {
    try {
      const isCurrentlyActive = connection.status === "ACTIVE";
      const res = await fetch(`/api/admin/api-connections/${connection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: !isCurrentlyActive,
          status: isCurrentlyActive ? "DISABLED" : "ACTIVE"
        })
      });

      if (res.ok) {
        toast.success(`Connection ${isCurrentlyActive ? "disabled" : "enabled"}`);
        fetchConnections();
        fetchLogs();
      } else {
        toast.error("Failed to update connection status");
      }
    } catch {
      toast.error("Failed to update connection");
    }
  };

  // Delete service configuration
  const handleDeleteService = async (service: ServiceDefinition) => {
    if (!service.connectionId) return;

    if (!confirm(`Are you sure you want to remove the configuration for "${service.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-connections/${service.connectionId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Service configuration removed");
        fetchServices();
        fetchLogs();
      } else {
        toast.error("Failed to remove configuration");
      }
    } catch {
      toast.error("Failed to remove configuration");
    }
  };

  // Delete custom connection
  const handleDeleteConnection = async (connection: ApiConnection) => {
    if (!confirm(`Are you sure you want to delete "${connection.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-connections/${connection.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Connection deleted");
        fetchConnections();
        fetchLogs();
      } else {
        toast.error("Failed to delete connection");
      }
    } catch {
      toast.error("Failed to delete connection");
    }
  };

  // Create custom API
  const handleCreateCustomApi = async () => {
    if (!customApiForm.name || !customApiForm.serviceName) {
      toast.error("Please enter name and service identifier");
      return;
    }

    if (Object.keys(customApiForm.credentials).length === 0) {
      toast.error("Please add at least one credential");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/api-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customApiForm.name,
          serviceName: customApiForm.serviceName,
          description: customApiForm.description,
          type: customApiForm.type,
          environment: customApiForm.environment,
          baseUrl: customApiForm.baseUrl || null,
          version: customApiForm.version || null,
          credentials: customApiForm.credentials,
          headers: customApiForm.headers,
          expiresAt: customApiForm.expiresAt || null
        })
      });

      if (res.ok) {
        toast.success("Custom API created successfully");
        setShowCustomApiModal(false);
        setCustomApiForm(INITIAL_CUSTOM_FORM);
        setCustomCredentialKeys(["API_KEY"]);
        fetchConnections();
        fetchLogs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create custom API");
      }
    } catch {
      toast.error("Failed to create custom API");
    } finally {
      setSaving(false);
    }
  };

  // Add credential field
  const handleAddCredentialField = () => {
    if (!newCredentialKey.trim()) return;
    const key = newCredentialKey.toUpperCase().replace(/\s+/g, "_");
    if (customCredentialKeys.includes(key)) {
      toast.error("Credential field already exists");
      return;
    }
    setCustomCredentialKeys([...customCredentialKeys, key]);
    setNewCredentialKey("");
  };

  // Remove credential field
  const handleRemoveCredentialField = (key: string) => {
    setCustomCredentialKeys(customCredentialKeys.filter(k => k !== key));
    const newCreds = { ...customApiForm.credentials };
    delete newCreds[key];
    setCustomApiForm({ ...customApiForm, credentials: newCreds });
  };

  // Copy to clipboard
  const _handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || service.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter custom connections (exclude platform services)
  const customConnections = connections.filter(c => !services.some(s => s.id === c.serviceName));

  // Get icon component
  const getIcon = (iconName?: string) => {
    return iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Server;
  };

  // Render status indicator
  const renderStatusIndicator = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_CONFIGURED;
    return (
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${config.bgColor} animate-pulse`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.disconnected || 0}</p>
                <p className="text-xs text-muted-foreground">Disconnected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{stats.notConfigured || 0}</p>
                <p className="text-xs text-muted-foreground">Not Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.coreServices || 0}</p>
                <p className="text-xs text-muted-foreground">Core Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.coreActive || 0}/{stats.coreServices || 0}</p>
                <p className="text-xs text-muted-foreground">Core Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="platform" className="gap-2">
              <Layers className="h-4 w-4" />
              Platform Services
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="gap-2">
              <Link2 className="h-4 w-4" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Plus className="h-4 w-4" />
              Custom APIs
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="rate-limits" className="gap-2">
              <Shield className="h-4 w-4" />
              Rate Limits
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Select value={filterEnv} onValueChange={setFilterEnv}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCTION">Production</SelectItem>
                <SelectItem value="STAGING">Staging</SelectItem>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="NOT_CONFIGURED">Not Configured</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => {
              fetchServices();
              fetchConnections();
              fetchLogs();
              fetchDependencies();
            }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Platform Services Tab */}
        <TabsContent value="platform" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const IconComponent = getIcon(service.icon);
              const _statusConfig = STATUS_CONFIG[service.status] || STATUS_CONFIG.NOT_CONFIGURED;

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`relative overflow-hidden ${service.isPlatformCore ? 'border-l-4 border-l-purple-500' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${service.isConfigured ? 'bg-primary/10' : 'bg-muted'}`}>
                            <IconComponent className={`h-5 w-5 ${service.isConfigured ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {service.name}
                              {service.isPlatformCore && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  Core
                                </Badge>
                              )}
                            </CardTitle>
                            <Badge className={`text-[10px] ${CATEGORY_COLORS[service.category] || CATEGORY_COLORS.CUSTOM}`}>
                              {service.category.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {service.isConfigured ? (
                              <>
                                <DropdownMenuItem onClick={() => handleTestService(service)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Test Connection
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEdit(service)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Configuration
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenRotate(service)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Rotate Credentials
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleService(service)}>
                                  {service.status === "ACTIVE" ? (
                                    <><PowerOff className="h-4 w-4 mr-2" /> Disable</>
                                  ) : (
                                    <><Power className="h-4 w-4 mr-2" /> Enable</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteService(service)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Configuration
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => {
                                setSelectedService(service);
                                setConfigCredentials({});
                                setShowConfigureModal(true);
                              }}>
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </DropdownMenuItem>
                            )}
                            {service.docsUrl && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <a href={service.docsUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Documentation
                                  </a>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        {renderStatusIndicator(service.status)}
                        {service.isConfigured && service.lastValidatedAt && (
                          <span className="text-xs text-muted-foreground">
                            Validated {formatDistanceToNow(new Date(service.lastValidatedAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {service.dependencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Used by:</p>
                          <div className="flex flex-wrap gap-1">
                            {service.dependencies.slice(0, 3).map((dep) => (
                              <Badge key={dep.moduleId} variant="secondary" className="text-[10px]">
                                {dep.moduleName}
                              </Badge>
                            ))}
                            {service.dependencies.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{service.dependencies.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Quick Actions */}
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        {service.isConfigured ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleTestService(service)}
                              disabled={testing === service.id}
                            >
                              {testing === service.id ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3 mr-1" />
                              )}
                              Test
                            </Button>
                            <Button
                              size="sm"
                              variant={service.status === "ACTIVE" ? "destructive" : "default"}
                              className="flex-1"
                              onClick={() => handleToggleService(service)}
                            >
                              {service.status === "ACTIVE" ? (
                                <><PowerOff className="h-3 w-3 mr-1" /> Disable</>
                              ) : (
                                <><Power className="h-3 w-3 mr-1" /> Enable</>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedService(service);
                              setConfigCredentials({});
                              setShowConfigureModal(true);
                            }}
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Configure Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="mt-6">
          <div className="space-y-4">
            {dependencies.map((module) => {
              const requiredServices = module.services.filter(s => s.isRequired);
              const allRequiredActive = requiredServices.every(s => s.status === "ACTIVE");
              const someActive = module.services.some(s => s.status === "ACTIVE");

              return (
                <Card key={module.moduleId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${allRequiredActive ? 'bg-green-100' : someActive ? 'bg-yellow-100' : 'bg-red-100'}`}>
                          <Layers className={`h-5 w-5 ${allRequiredActive ? 'text-green-600' : someActive ? 'text-yellow-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{module.moduleName}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {requiredServices.filter(s => s.status === "ACTIVE").length}/{requiredServices.length} required services active
                          </p>
                        </div>
                      </div>
                      <Badge variant={allRequiredActive ? "default" : someActive ? "secondary" : "destructive"}>
                        {allRequiredActive ? "Operational" : someActive ? "Degraded" : "Offline"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {module.services.map((service) => (
                        <div
                          key={service.serviceId}
                          className={`p-3 rounded-lg border ${service.status === "ACTIVE" ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{service.serviceName}</span>
                            {service.isRequired && (
                              <Badge variant="outline" className="text-[10px]">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{service.usageDescription}</p>
                          {renderStatusIndicator(service.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Custom APIs Tab */}
        <TabsContent value="custom" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => {
              setCustomApiForm(INITIAL_CUSTOM_FORM);
              setCustomCredentialKeys(["API_KEY"]);
              setShowCustomApiModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom API
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customConnections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{connection.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {connection.serviceName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {connection.environment}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTestConnection(connection.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Test Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditConnection(connection)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedConnection(connection);
                          setRotateCredentials({});
                          setShowRotateModal(true);
                        }}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rotate Credentials
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleConnection(connection)}>
                          {connection.status === "ACTIVE" ? (
                            <><PowerOff className="h-4 w-4 mr-2" /> Disable</>
                          ) : (
                            <><Power className="h-4 w-4 mr-2" /> Enable</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteConnection(connection)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {connection.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between">
                    {renderStatusIndicator(connection.status)}
                    {connection.lastValidatedAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(connection.lastValidatedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {connection.baseUrl && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground truncate">
                        <Globe className="h-3 w-3 inline mr-1" />
                        {connection.baseUrl}
                      </p>
                    </div>
                  )}
                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleTestConnection(connection.id)}
                      disabled={testing === connection.id}
                    >
                      {testing === connection.id ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant={connection.status === "ACTIVE" ? "destructive" : "default"}
                      className="flex-1"
                      onClick={() => handleToggleConnection(connection)}
                    >
                      {connection.status === "ACTIVE" ? (
                        <><PowerOff className="h-3 w-3 mr-1" /> Disable</>
                      ) : (
                        <><Power className="h-3 w-3 mr-1" /> Enable</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {customConnections.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No custom API integrations configured</p>
                <p className="text-sm">Add a custom API to get started</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${log.testSuccess === true ? 'bg-green-100' : log.testSuccess === false ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {log.action.includes("test") ? (
                            <Activity className={`h-4 w-4 ${log.testSuccess ? 'text-green-600' : 'text-red-600'}`} />
                          ) : log.action.includes("create") || log.action.includes("configure") ? (
                            <Plus className="h-4 w-4 text-blue-600" />
                          ) : log.action.includes("rotate") ? (
                            <RotateCcw className="h-4 w-4 text-purple-600" />
                          ) : log.action.includes("delete") ? (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          ) : log.action.includes("update") ? (
                            <Edit className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Settings className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {log.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.connection?.name || "Unknown service"}
                          </p>
                          {log.testResponseTime && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              {log.testResponseTime}ms
                            </Badge>
                          )}
                          {log.testErrorMessage && (
                            <p className="text-xs text-red-500 mt-1">{log.testErrorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {log.performedBy?.name || "System"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Monitoring Tab */}
        <TabsContent value="health" className="mt-6">
          <HealthMonitoring />
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <UsageAnalytics />
        </TabsContent>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits" className="mt-6">
          <RateLimiting />
        </TabsContent>
      </Tabs>

      {/* Configure Service Modal */}
      <Dialog open={showConfigureModal} onOpenChange={setShowConfigureModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Configure {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedService?.description || "Enter the API credentials to enable this integration"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedService?.credentialFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    type={field.type === "password" && !showCredentials[field.key] ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={configCredentials[field.key] || ""}
                    onChange={(e) => setConfigCredentials(prev => ({
                      ...prev,
                      [field.key]: e.target.value
                    }))}
                  />
                  {field.type === "password" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowCredentials(prev => ({
                        ...prev,
                        [field.key]: !prev[field.key]
                      }))}
                    >
                      {showCredentials[field.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigureModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigureService} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Configure</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Configuration Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit {selectedService?.name || selectedConnection?.name}
            </DialogTitle>
            <DialogDescription>
              Update the configuration, credentials, and settings for this integration
            </DialogDescription>
          </DialogHeader>
          {loadingCredentials ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Display Name</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="API Display Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-version">Version</Label>
                    <Input
                      id="edit-version"
                      value={editForm.version || ""}
                      onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                      placeholder="v1.0.0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    placeholder="What does this integration do?"
                  />
                </div>
              </div>

              {/* Connection Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Connection Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-environment">Environment</Label>
                    <Select
                      value={editForm.environment || "PRODUCTION"}
                      onValueChange={(v) => setEditForm({ ...editForm, environment: v as any })}
                    >
                      <SelectTrigger id="edit-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCTION">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Production
                          </div>
                        </SelectItem>
                        <SelectItem value="STAGING">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            Staging
                          </div>
                        </SelectItem>
                        <SelectItem value="DEVELOPMENT">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Development
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editForm.status || "ACTIVE"}
                      onValueChange={(v) => setEditForm({ ...editForm, status: v as any })}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="INACTIVE">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            Inactive
                          </div>
                        </SelectItem>
                        <SelectItem value="DISABLED">
                          <div className="flex items-center gap-2">
                            <PowerOff className="h-4 w-4 text-red-500" />
                            Disabled
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-baseUrl">Base URL</Label>
                  <Input
                    id="edit-baseUrl"
                    value={editForm.baseUrl || ""}
                    onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                  />
                </div>
              </div>

              {/* Custom Headers */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Custom Headers
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentHeaders = editForm.headers || {};
                      const newKey = `X-Custom-Header-${Object.keys(currentHeaders).length + 1}`;
                      setEditForm({
                        ...editForm,
                        headers: { ...currentHeaders, [newKey]: "" }
                      });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Header
                  </Button>
                </div>
                {editForm.headers && Object.keys(editForm.headers).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(editForm.headers as Record<string, string>).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Input
                          value={key}
                          onChange={(e) => {
                            const newHeaders = { ...(editForm.headers as Record<string, string>) };
                            delete newHeaders[key];
                            newHeaders[e.target.value] = value;
                            setEditForm({ ...editForm, headers: newHeaders });
                          }}
                          placeholder="Header name"
                          className="flex-1"
                        />
                        <Input
                          value={value}
                          onChange={(e) => {
                            const newHeaders = { ...(editForm.headers as Record<string, string>) };
                            newHeaders[key] = e.target.value;
                            setEditForm({ ...editForm, headers: newHeaders });
                          }}
                          placeholder="Header value"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newHeaders = { ...(editForm.headers as Record<string, string>) };
                            delete newHeaders[key];
                            setEditForm({ ...editForm, headers: newHeaders });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom headers configured</p>
                )}
              </div>

              {/* Credentials */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Key className="h-4 w-4" /> Credentials
                </h4>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Leave credential fields empty to keep existing values. Only enter values you want to update.
                  </p>
                </div>
                {selectedService?.credentialFields ? (
                  selectedService.credentialFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={`edit-${field.key}`}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          id={`edit-${field.key}`}
                          type={field.type === "password" && !showCredentials[field.key] ? "password" : "text"}
                          placeholder={field.placeholder || "Enter new value to update"}
                          value={configCredentials[field.key] || ""}
                          onChange={(e) => setConfigCredentials(prev => ({
                            ...prev,
                            [field.key]: e.target.value
                          }))}
                        />
                        {field.type === "password" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowCredentials(prev => ({
                              ...prev,
                              [field.key]: !prev[field.key]
                            }))}
                          >
                            {showCredentials[field.key] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  ))
                ) : (
                  Object.keys(configCredentials).map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`edit-${key}`}>{key}</Label>
                      <div className="relative">
                        <Input
                          id={`edit-${key}`}
                          type={!showCredentials[key] ? "password" : "text"}
                          value={configCredentials[key] || ""}
                          onChange={(e) => setConfigCredentials(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowCredentials(prev => ({
                            ...prev,
                            [key]: !prev[key]
                          }))}
                        >
                          {showCredentials[key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Enable/Disable Toggle */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="edit-enabled" className="flex items-center gap-2">
                      <Power className="h-4 w-4" />
                      Enable Integration
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When disabled, this integration will not process any requests
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="edit-enabled"
                      checked={editForm.isEnabled !== false}
                      onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setSelectedService(null);
              setSelectedConnection(null);
              setEditForm({});
              setConfigCredentials({});
            }}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={async () => {
                  const connectionId = selectedService?.connectionId || selectedConnection?.id;
                  if (connectionId) {
                    try {
                      const res = await fetch(`/api/admin/api-connections/${connectionId}/test`, {
                        method: "POST"
                      });
                      if (res.ok) {
                        toast.success("Connection test passed!");
                      } else {
                        const error = await res.json();
                        toast.error(error.error || "Connection test failed");
                      }
                    } catch {
                      toast.error("Connection test failed");
                    }
                  }
                }}
                disabled={saving || loadingCredentials}
              >
                <Play className="h-4 w-4 mr-2" /> Test Connection
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || loadingCredentials}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Credentials Modal */}
      <Dialog open={showRotateModal} onOpenChange={setShowRotateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Rotate Credentials
            </DialogTitle>
            <DialogDescription>
              Enter new credentials to replace the existing ones for {selectedService?.name || selectedConnection?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important</p>
                  <p className="text-xs">Rotating credentials will immediately invalidate the old credentials. Make sure you have the new credentials ready.</p>
                </div>
              </div>
            </div>
            {selectedService?.credentialFields ? (
              selectedService.credentialFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`rotate-${field.key}`}>
                    New {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`rotate-${field.key}`}
                      type={field.type === "password" && !showCredentials[`rotate-${field.key}`] ? "password" : "text"}
                      placeholder={`Enter new ${field.label.toLowerCase()}`}
                      value={rotateCredentials[field.key] || ""}
                      onChange={(e) => setRotateCredentials(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                    />
                    {field.type === "password" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowCredentials(prev => ({
                          ...prev,
                          [`rotate-${field.key}`]: !prev[`rotate-${field.key}`]
                        }))}
                      >
                        {showCredentials[`rotate-${field.key}`] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : selectedConnection ? (
              Object.keys(selectedConnection.credentials || {}).map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`rotate-${key}`}>New {key}</Label>
                  <div className="relative">
                    <Input
                      id={`rotate-${key}`}
                      type={!showCredentials[`rotate-${key}`] ? "password" : "text"}
                      placeholder={`Enter new ${key.toLowerCase()}`}
                      value={rotateCredentials[key] || ""}
                      onChange={(e) => setRotateCredentials(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowCredentials(prev => ({
                        ...prev,
                        [`rotate-${key}`]: !prev[`rotate-${key}`]
                      }))}
                    >
                      {showCredentials[`rotate-${key}`] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRotateModal(false);
              setSelectedService(null);
              setSelectedConnection(null);
              setRotateCredentials({});
            }}>
              Cancel
            </Button>
            <Button onClick={handleRotateCredentials} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rotating...</>
              ) : (
                <><RotateCcw className="h-4 w-4 mr-2" /> Rotate Credentials</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom API Modal */}
      <Dialog open={showCustomApiModal} onOpenChange={setShowCustomApiModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Add Custom API
            </DialogTitle>
            <DialogDescription>
              Configure a custom API integration that isn't part of the built-in services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-name"
                  placeholder="My Custom API"
                  value={customApiForm.name}
                  onChange={(e) => setCustomApiForm({ ...customApiForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-service">
                  Service Identifier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-service"
                  placeholder="my-api"
                  value={customApiForm.serviceName}
                  onChange={(e) => setCustomApiForm({ ...customApiForm, serviceName: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                />
                <p className="text-xs text-muted-foreground">Unique identifier for this service</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-description">Description</Label>
              <Textarea
                id="custom-description"
                placeholder="What does this API do?"
                value={customApiForm.description}
                onChange={(e) => setCustomApiForm({ ...customApiForm, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-type">Type</Label>
                <Select
                  value={customApiForm.type}
                  onValueChange={(v) => setCustomApiForm({ ...customApiForm, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXTERNAL">External</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-env">Environment</Label>
                <Select
                  value={customApiForm.environment}
                  onValueChange={(v) => setCustomApiForm({ ...customApiForm, environment: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-baseUrl">Base URL</Label>
              <Input
                id="custom-baseUrl"
                placeholder="https://api.example.com/v1"
                value={customApiForm.baseUrl}
                onChange={(e) => setCustomApiForm({ ...customApiForm, baseUrl: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" /> Credentials
                </h4>
              </div>
              {customCredentialKeys.map((key) => (
                <div key={key} className="flex items-center gap-2 mb-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{key}</Label>
                    <div className="relative">
                      <Input
                        type={!showCredentials[`custom-${key}`] ? "password" : "text"}
                        placeholder={`Enter ${key}`}
                        value={customApiForm.credentials[key] || ""}
                        onChange={(e) => setCustomApiForm({
                          ...customApiForm,
                          credentials: { ...customApiForm.credentials, [key]: e.target.value }
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowCredentials(prev => ({
                          ...prev,
                          [`custom-${key}`]: !prev[`custom-${key}`]
                        }))}
                      >
                        {showCredentials[`custom-${key}`] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {customCredentialKeys.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-5"
                      onClick={() => handleRemoveCredentialField(key)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="Add credential key (e.g., SECRET_KEY)"
                  value={newCredentialKey}
                  onChange={(e) => setNewCredentialKey(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCredentialField()}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddCredentialField}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCustomApiModal(false);
              setCustomApiForm(INITIAL_CUSTOM_FORM);
              setCustomCredentialKeys(["API_KEY"]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomApi} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Create API</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
