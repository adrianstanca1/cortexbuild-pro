"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Lock,
  Building2,
  Save,
  Loader2,
  Check,
  Mail,
  Phone,
  Key,
  Moon,
  Sun,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface SettingsClientProps {
  user: any;
  organization?: any;
}

const roleLabelMap: Record<string, string> = {
  ADMIN: "Administrator",
  PROJECT_MANAGER: "Project Manager",
  FIELD_WORKER: "Field Worker",
  SUPER_ADMIN: "Super Admin",
  COMPANY_OWNER: "Company Owner",
};

export function SettingsClient({ user, organization }: SettingsClientProps) {
  const roleLabel = roleLabelMap[user?.role ?? "FIELD_WORKER"] ?? "Member";
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailTaskAssigned: true,
    emailProjectUpdates: true,
    emailDailyDigest: false,
    pushTaskReminders: true,
    pushComments: true,
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully!");
    } catch (_error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (_error) {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    toast.success("Notification preference updated");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "organization", label: "Organization", icon: Building2 },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your account, security, and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <tab.icon
                  className={`h-5 w-5 ${activeTab === tab.id ? "text-primary" : ""}`}
                />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary via-purple-500 to-indigo-600" />
                <div className="px-6 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-xl">
                      {(user?.name ?? "U")?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {user?.name ?? "User"}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-primary/10 text-primary border-0">
                          {roleLabel}
                        </Badge>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Personal Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your full name"
                        className="pl-11 h-11 rounded-xl border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="your@email.com"
                        className="pl-11 h-11 rounded-xl border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+44 (0) 7XXX XXXXXX"
                        className="pl-11 h-11 rounded-xl border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="mt-6 h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>

              {/* Permissions */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Permissions
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Create Projects",
                      allowed: user?.role !== "FIELD_WORKER",
                    },
                    {
                      label: "Manage Team",
                      allowed:
                        user?.role === "ADMIN" ||
                        user?.role === "PROJECT_MANAGER" ||
                        user?.role === "COMPANY_OWNER" ||
                        user?.role === "SUPER_ADMIN",
                    },
                    {
                      label: "Delete Projects",
                      allowed:
                        user?.role === "ADMIN" ||
                        user?.role === "COMPANY_OWNER" ||
                        user?.role === "SUPER_ADMIN",
                    },
                    { label: "View Reports", allowed: true },
                  ].map((perm, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <span className="text-slate-600 dark:text-slate-400">
                        {perm.label}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-sm font-medium ${perm.allowed ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}
                      >
                        {perm.allowed ? (
                          <>
                            <Check className="h-4 w-4" /> Enabled
                          </>
                        ) : (
                          "Disabled"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Change Password
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Update your password to keep your account secure
              </p>

              <div className="max-w-md space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Must be at least 8 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Update Password
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Choose how you want to be notified
              </p>

              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email Notifications
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        key: "emailTaskAssigned",
                        label: "Task Assignments",
                        desc: "Get notified when a task is assigned to you",
                      },
                      {
                        key: "emailProjectUpdates",
                        label: "Project Updates",
                        desc: "Receive updates about projects you're part of",
                      },
                      {
                        key: "emailDailyDigest",
                        label: "Daily Digest",
                        desc: "Get a daily summary of all activity",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <Switch
                          checked={
                            notifications[
                              item.key as keyof typeof notifications
                            ]
                          }
                          onCheckedChange={(checked) =>
                            handleNotificationUpdate(item.key, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-400" />
                    Push Notifications
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        key: "pushTaskReminders",
                        label: "Task Reminders",
                        desc: "Get reminded about upcoming due dates",
                      },
                      {
                        key: "pushComments",
                        label: "Comments & Mentions",
                        desc: "Get notified when someone comments or mentions you",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <Switch
                          checked={
                            notifications[
                              item.key as keyof typeof notifications
                            ]
                          }
                          onCheckedChange={(checked) =>
                            handleNotificationUpdate(item.key, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === "organization" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
                <div className="px-6 pb-6">
                  <div className="flex items-end gap-4 -mt-10">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-slate-800 shadow-xl">
                      {(organization?.name ?? "O")?.charAt(0)?.toUpperCase() ??
                        "O"}
                    </div>
                    <div className="pb-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {organization?.name ?? "Your Organization"}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        @{organization?.slug ?? "organization"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Organization Details
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Organization ID",
                      value: (
                        <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300">
                          {organization?.id ?? "N/A"}
                        </code>
                      ),
                    },
                    {
                      label: "Your Role",
                      value: (
                        <Badge className="bg-primary/10 text-primary border-0">
                          {roleLabel}
                        </Badge>
                      ),
                    },
                    {
                      label: "Member Since",
                      value: user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <span className="text-slate-600 dark:text-slate-400">
                        {item.label}
                      </span>
                      <span className="text-slate-900 dark:text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {(user?.role === "ADMIN" ||
                  user?.role === "COMPANY_OWNER" ||
                  user?.role === "SUPER_ADMIN") && (
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Admin Note:</strong> As an administrator, you can
                      manage organization settings, invite team members, and
                      configure integrations from the Team page.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
