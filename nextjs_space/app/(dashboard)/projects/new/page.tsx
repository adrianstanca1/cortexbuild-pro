"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    clientName: "",
    clientEmail: "",
    budget: "",
    startDate: "",
    endDate: "",
    status: "PLANNING"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create project");
        return;
      }

      toast.success("Project created successfully!");
      router.push(`/projects/${data?.project?.id ?? ""}`);
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600">Set up a new construction project.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#5f46e5]" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
                  <Input
                    placeholder="e.g., Downtown Office Complex"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <Textarea
                    placeholder="Brief description of the project..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                  <Input
                    placeholder="e.g., 123 Main Street, City"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
                  <Input
                    placeholder="e.g., Acme Corporation"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email</label>
                  <Input
                    type="email"
                    placeholder="client@company.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget (£)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/projects">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
