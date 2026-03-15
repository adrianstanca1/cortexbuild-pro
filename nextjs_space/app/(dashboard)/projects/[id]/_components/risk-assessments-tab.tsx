"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  AlertTriangle,
  Shield,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Edit,
  Trash2,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignaturePad, SignatureDisplay } from "@/components/ui/signature-pad";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/use-realtime";

interface RiskAssessmentsTabProps {
  project: any;
  teamMembers: any[];
  riskAssessments: any[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  PENDING_REVIEW: "bg-yellow-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  SUPERSEDED: "bg-purple-500",
};

const riskLevels = [
  { score: [1, 4], label: "Low", color: "bg-green-500" },
  { score: [5, 9], label: "Medium", color: "bg-yellow-500" },
  { score: [10, 16], label: "High", color: "bg-orange-500" },
  { score: [17, 25], label: "Extreme", color: "bg-red-500" },
];

function getRiskLevel(score: number) {
  return (
    riskLevels.find((l) => score >= l.score[0] && score <= l.score[1]) ||
    riskLevels[0]
  );
}

export function RiskAssessmentsTab({
  project,
  teamMembers,
  riskAssessments: initialAssessments,
}: RiskAssessmentsTabProps) {
  const router = useRouter();
  const [assessments, setAssessments] = useState(initialAssessments || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedHazards, setExpandedHazards] = useState<Set<string>>(
    new Set(),
  );

  const [newAssessment, setNewAssessment] = useState({
    title: "",
    activityDescription: "",
    location: "",
    startDate: "",
    endDate: "",
    methodStatement: "",
    sequence: [""],
    requiredPPE: [] as string[],
    emergencyProcedures: "",
    nearestFirstAid: "",
    assemblyPoint: "",
    hazards: [
      {
        hazardDescription: "",
        personsAtRisk: [] as string[],
        initialSeverity: 3,
        initialLikelihood: 3,
        controlMeasures: [""],
        residualSeverity: 1,
        residualLikelihood: 1,
      },
    ],
  });

  const ppeOptions = [
    "Hard Hat",
    "Safety Glasses",
    "High-Vis Vest",
    "Safety Boots",
    "Gloves",
    "Ear Protection",
    "Dust Mask",
    "Fall Arrest",
    "Face Shield",
    "Respirator",
  ];
  const personsAtRiskOptions = [
    "Workers",
    "Supervisors",
    "Visitors",
    "Public",
    "Contractors",
    "Delivery Drivers",
  ];

  // Real-time updates
  useRealtimeSubscription(
    [
      "risk_assessment_created",
      "risk_assessment_updated",
      "risk_assessment_deleted",
      "rams_acknowledged",
    ],
    useCallback(() => {
      router.refresh();
    }, [router]),
  );

  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.activityDescription) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/risk-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAssessment,
          projectId: project.id,
          sequence: newAssessment.sequence.filter((s) => s.trim()),
          hazards: newAssessment.hazards.map((h) => ({
            ...h,
            controlMeasures: h.controlMeasures.filter((c) => c.trim()),
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to create");
      const created = await response.json();
      setAssessments((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewAssessment({
        title: "",
        activityDescription: "",
        location: "",
        startDate: "",
        endDate: "",
        methodStatement: "",
        sequence: [""],
        requiredPPE: [],
        emergencyProcedures: "",
        nearestFirstAid: "",
        assemblyPoint: "",
        hazards: [
          {
            hazardDescription: "",
            personsAtRisk: [],
            initialSeverity: 3,
            initialLikelihood: 3,
            controlMeasures: [""],
            residualSeverity: 1,
            residualLikelihood: 1,
          },
        ],
      });
      toast.success("Risk Assessment created");
    } catch (error) {
      toast.error("Failed to create risk assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/risk-assessments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update");
      const updated = await response.json();
      setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAcknowledge = async (signatureData: string) => {
    if (!selectedAssessment) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/risk-assessments/${selectedAssessment.id}/acknowledge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatureData }),
        },
      );
      if (!response.ok) throw new Error("Failed");
      setShowAcknowledgeModal(false);
      toast.success("RAMS acknowledged");
      router.refresh();
    } catch (error) {
      toast.error("Failed to acknowledge");
    } finally {
      setLoading(false);
    }
  };

  const addHazard = () => {
    setNewAssessment((prev) => ({
      ...prev,
      hazards: [
        ...prev.hazards,
        {
          hazardDescription: "",
          personsAtRisk: [],
          initialSeverity: 3,
          initialLikelihood: 3,
          controlMeasures: [""],
          residualSeverity: 1,
          residualLikelihood: 1,
        },
      ],
    }));
  };

  const updateHazard = (index: number, field: string, value: any) => {
    setNewAssessment((prev) => ({
      ...prev,
      hazards: prev.hazards.map((h, i) =>
        i === index ? { ...h, [field]: value } : h,
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Risk Assessments / RAMS
          </h2>
          <p className="text-muted-foreground">
            Manage risk assessments and method statements
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" /> New RAMS
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {assessments.length}
            </div>
            <p className="text-muted-foreground text-sm">Total RAMS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {assessments.filter((a) => a.status === "APPROVED").length}
            </div>
            <p className="text-muted-foreground text-sm">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {assessments.filter((a) => a.status === "PENDING_REVIEW").length}
            </div>
            <p className="text-muted-foreground text-sm">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {assessments.filter((a) => a.status === "DRAFT").length}
            </div>
            <p className="text-muted-foreground text-sm">Drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-4">
        {assessments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No risk assessments yet</p>
            </CardContent>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Card
              key={assessment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[assessment.status]}>
                        {assessment.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        RAMS #{assessment.number} Rev {assessment.revision}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {assessment.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      {assessment.activityDescription}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {assessment.location && (
                        <span>📍 {assessment.location}</span>
                      )}
                      <span>Created by {assessment.createdBy?.name}</span>
                      <span>
                        {assessment._count?.hazards || 0} hazards identified
                      </span>
                      <span>
                        {assessment._count?.acknowledgements || 0}{" "}
                        acknowledgements
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAssessment(assessment);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {assessment.status === "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAssessment(assessment);
                          setShowAcknowledgeModal(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" /> Acknowledge
                      </Button>
                    )}
                    {assessment.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusChange(assessment.id, "PENDING_REVIEW")
                        }
                      >
                        Submit for Review
                      </Button>
                    )}
                    {assessment.status === "PENDING_REVIEW" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleStatusChange(assessment.id, "APPROVED")
                        }
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Risk Assessment / RAMS</DialogTitle>
            <DialogDescription>
              Create a comprehensive risk assessment and method statement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Title *
                  </label>
                  <Input
                    value={newAssessment.title}
                    onChange={(e) =>
                      setNewAssessment((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Working at Height - Scaffolding Installation"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Activity Description *
                  </label>
                  <Textarea
                    value={newAssessment.activityDescription}
                    onChange={(e) =>
                      setNewAssessment((prev) => ({
                        ...prev,
                        activityDescription: e.target.value,
                      }))
                    }
                    placeholder="Describe the work activity in detail..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Location
                  </label>
                  <Input
                    value={newAssessment.location}
                    onChange={(e) =>
                      setNewAssessment((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Work location"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={newAssessment.startDate}
                      onChange={(e) =>
                        setNewAssessment((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={newAssessment.endDate}
                      onChange={(e) =>
                        setNewAssessment((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Required PPE */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Required PPE</h4>
              <div className="flex flex-wrap gap-2">
                {ppeOptions.map((ppe) => (
                  <Badge
                    key={ppe}
                    variant={
                      newAssessment.requiredPPE.includes(ppe)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      setNewAssessment((prev) => ({
                        ...prev,
                        requiredPPE: prev.requiredPPE.includes(ppe)
                          ? prev.requiredPPE.filter((p) => p !== ppe)
                          : [...prev.requiredPPE, ppe],
                      }));
                    }}
                  >
                    {ppe}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Hazards */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground">
                  Hazard Identification & Risk Assessment
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHazard}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Hazard
                </Button>
              </div>
              {newAssessment.hazards.map((hazard, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Hazard Description
                      </label>
                      <Textarea
                        value={hazard.hazardDescription}
                        onChange={(e) =>
                          updateHazard(
                            index,
                            "hazardDescription",
                            e.target.value,
                          )
                        }
                        placeholder="Describe the hazard..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Persons at Risk
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {personsAtRiskOptions.map((person) => (
                          <Badge
                            key={person}
                            variant={
                              hazard.personsAtRisk.includes(person)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => {
                              const newPersons = hazard.personsAtRisk.includes(
                                person,
                              )
                                ? hazard.personsAtRisk.filter(
                                    (p: string) => p !== person,
                                  )
                                : [...hazard.personsAtRisk, person];
                              updateHazard(index, "personsAtRisk", newPersons);
                            }}
                          >
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Initial Risk (Before Controls)
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Select
                            value={String(hazard.initialSeverity)}
                            onValueChange={(v) =>
                              updateHazard(
                                index,
                                "initialSeverity",
                                parseInt(v),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  Severity: {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={String(hazard.initialLikelihood)}
                            onValueChange={(v) =>
                              updateHazard(
                                index,
                                "initialLikelihood",
                                parseInt(v),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Likelihood" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  Likelihood: {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="mt-1">
                          <Badge
                            className={
                              getRiskLevel(
                                hazard.initialSeverity *
                                  hazard.initialLikelihood,
                              ).color
                            }
                          >
                            Score:{" "}
                            {hazard.initialSeverity * hazard.initialLikelihood}{" "}
                            -{" "}
                            {
                              getRiskLevel(
                                hazard.initialSeverity *
                                  hazard.initialLikelihood,
                              ).label
                            }
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Residual Risk (After Controls)
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Select
                            value={String(hazard.residualSeverity)}
                            onValueChange={(v) =>
                              updateHazard(
                                index,
                                "residualSeverity",
                                parseInt(v),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  Severity: {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={String(hazard.residualLikelihood)}
                            onValueChange={(v) =>
                              updateHazard(
                                index,
                                "residualLikelihood",
                                parseInt(v),
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Likelihood" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  Likelihood: {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="mt-1">
                          <Badge
                            className={
                              getRiskLevel(
                                hazard.residualSeverity *
                                  hazard.residualLikelihood,
                              ).color
                            }
                          >
                            Score:{" "}
                            {hazard.residualSeverity *
                              hazard.residualLikelihood}{" "}
                            -{" "}
                            {
                              getRiskLevel(
                                hazard.residualSeverity *
                                  hazard.residualLikelihood,
                              ).label
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">
                        Control Measures
                      </label>
                      {hazard.controlMeasures.map(
                        (measure: string, mIndex: number) => (
                          <div key={mIndex} className="flex gap-2 mt-1">
                            <Input
                              value={measure}
                              onChange={(e) => {
                                const newMeasures = [...hazard.controlMeasures];
                                newMeasures[mIndex] = e.target.value;
                                updateHazard(
                                  index,
                                  "controlMeasures",
                                  newMeasures,
                                );
                              }}
                              placeholder={`Control measure ${mIndex + 1}`}
                            />
                            {mIndex === hazard.controlMeasures.length - 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateHazard(index, "controlMeasures", [
                                    ...hazard.controlMeasures,
                                    "",
                                  ])
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Method Statement */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">
                Method Statement
              </h4>
              <Textarea
                value={newAssessment.methodStatement}
                onChange={(e) =>
                  setNewAssessment((prev) => ({
                    ...prev,
                    methodStatement: e.target.value,
                  }))
                }
                placeholder="Describe the safe working method..."
                rows={4}
              />
            </div>

            {/* Emergency */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">
                Emergency Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Nearest First Aid
                  </label>
                  <Input
                    value={newAssessment.nearestFirstAid}
                    onChange={(e) =>
                      setNewAssessment((prev) => ({
                        ...prev,
                        nearestFirstAid: e.target.value,
                      }))
                    }
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Assembly Point
                  </label>
                  <Input
                    value={newAssessment.assemblyPoint}
                    onChange={(e) =>
                      setNewAssessment((prev) => ({
                        ...prev,
                        assemblyPoint: e.target.value,
                      }))
                    }
                    placeholder="Fire assembly point"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-sm font-medium text-foreground">
                    Emergency Procedures
                  </label>
                  <Textarea
                    value={newAssessment.emergencyProcedures}
                    onChange={(e) =>
                      setNewAssessment((prev) => ({
                        ...prev,
                        emergencyProcedures: e.target.value,
                      }))
                    }
                    placeholder="Emergency contact numbers and procedures..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssessment} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create RAMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              RAMS #{selectedAssessment?.number} - {selectedAssessment?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedAssessment && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedAssessment.status]}>
                  {selectedAssessment.status.replace("_", " ")}
                </Badge>
                <span className="text-muted-foreground">
                  Revision {selectedAssessment.revision}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Activity Description
                </h4>
                <p className="text-muted-foreground">
                  {selectedAssessment.activityDescription}
                </p>
              </div>

              {selectedAssessment.requiredPPE?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Required PPE
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssessment.requiredPPE.map((ppe: string) => (
                      <Badge key={ppe} variant="outline">
                        {ppe}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssessment.hazards?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Hazards & Controls
                  </h4>
                  <div className="space-y-3">
                    {selectedAssessment.hazards.map(
                      (hazard: any, index: number) => (
                        <Card key={hazard.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-foreground">
                                Hazard {index + 1}: {hazard.hazardDescription}
                              </p>
                              <div className="flex gap-4 mt-2">
                                <Badge
                                  className={
                                    getRiskLevel(hazard.initialRiskScore).color
                                  }
                                >
                                  Initial: {hazard.initialRiskScore}
                                </Badge>
                                <Badge
                                  className={
                                    getRiskLevel(hazard.residualRiskScore).color
                                  }
                                >
                                  Residual: {hazard.residualRiskScore}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm font-medium text-foreground">
                              Control Measures:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {hazard.controlMeasures?.map(
                                (m: string, i: number) => (
                                  <li key={i}>{m}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        </Card>
                      ),
                    )}
                  </div>
                </div>
              )}

              {selectedAssessment.acknowledgements?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Acknowledgements (
                    {selectedAssessment.acknowledgements.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedAssessment.acknowledgements.map((ack: any) => (
                      <div
                        key={ack.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-foreground">
                          {ack.workerName || ack.worker?.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(ack.acknowledgedAt), "dd/MM/yy")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            {selectedAssessment?.status === "APPROVED" && (
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowAcknowledgeModal(true);
                }}
              >
                <Check className="h-4 w-4 mr-1" /> Acknowledge
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acknowledge Modal */}
      <Dialog
        open={showAcknowledgeModal}
        onOpenChange={setShowAcknowledgeModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge RAMS</DialogTitle>
            <DialogDescription>
              By signing, you confirm you have read, understood, and will comply
              with this risk assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SignaturePad onSave={handleAcknowledge} onClear={() => {}} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
