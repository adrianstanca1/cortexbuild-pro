"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Flame,
  AlertOctagon,
  Check,
  X,
  Eye,
  Loader2,
  Clock,
  ShieldAlert,
  Wind,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/ui/signature-pad";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/use-realtime";

interface PermitsToWorkTabProps {
  project: any;
  teamMembers: any[];
  hotWorkPermits: any[];
  confinedSpacePermits: any[];
}

const statusColors: Record<string, string> = {
  REQUESTED: "bg-yellow-500",
  APPROVED: "bg-blue-500",
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-gray-500",
  CANCELLED: "bg-red-500",
  EXPIRED: "bg-orange-500",
};

export function PermitsToWorkTab({
  project,
  teamMembers,
  hotWorkPermits: initialHotWork,
  confinedSpacePermits: initialCS,
}: PermitsToWorkTabProps) {
  const router = useRouter();
  const [hotWorkPermits, setHotWorkPermits] = useState(initialHotWork || []);
  const [csPermits, setCsPermits] = useState(initialCS || []);
  const [activeTab, setActiveTab] = useState("hot-work");
  const [showHotWorkModal, setShowHotWorkModal] = useState(false);
  const [showCSModal, setShowCSModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);
  const [permitType, setPermitType] = useState<"hot-work" | "confined-space">(
    "hot-work",
  );
  const [loading, setLoading] = useState(false);

  const [hotWorkForm, setHotWorkForm] = useState({
    workDescription: "",
    location: "",
    floor: "",
    equipment: "",
    validFrom: "",
    validTo: "",
    fireExtinguisherAvailable: false,
    areaCleared: false,
    combustiblesRemoved: false,
    fireWatchAssigned: false,
    sprinklersOperational: true,
    detectorsIsolated: false,
    ventilationAdequate: false,
    fireWatchName: "",
    fireWatchDuration: 30,
    requesterSignature: "",
  });

  const [csForm, setCSForm] = useState({
    spaceDescription: "",
    location: "",
    reasonForEntry: "",
    validFrom: "",
    validTo: "",
    oxygenLevel: "",
    h2sLevel: "",
    coLevel: "",
    lelLevel: "",
    testDateTime: "",
    testPerformedBy: "",
    spaceLocked: false,
    spaceIsolated: false,
    ventilationProvided: false,
    lightingProvided: false,
    communicationTested: false,
    rescueEquipmentReady: false,
    entrantsTrained: false,
    entrantNames: [""],
    attendantName: "",
    rescueTeamNotified: false,
    emergencyContact: "",
    emergencyNumber: "",
    nearestHospital: "",
    requesterSignature: "",
  });

  useRealtimeSubscription(
    [
      "hot_work_permit_created",
      "hot_work_permit_updated",
      "confined_space_permit_created",
      "confined_space_permit_updated",
    ],
    useCallback(() => router.refresh(), [router]),
  );

  const createHotWorkPermit = async () => {
    if (
      !hotWorkForm.workDescription ||
      !hotWorkForm.location ||
      !hotWorkForm.validFrom ||
      !hotWorkForm.validTo
    ) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/hot-work-permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...hotWorkForm, projectId: project.id }),
      });
      if (!response.ok) throw new Error("Failed");
      const created = await response.json();
      setHotWorkPermits((prev) => [created, ...prev]);
      setShowHotWorkModal(false);
      toast.success("Hot Work Permit requested");
      resetHotWorkForm();
    } catch (error) {
      toast.error("Failed to create permit");
    } finally {
      setLoading(false);
    }
  };

  const createCSPermit = async () => {
    if (
      !csForm.spaceDescription ||
      !csForm.location ||
      !csForm.validFrom ||
      !csForm.validTo
    ) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/confined-space-permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...csForm,
          projectId: project.id,
          entrantNames: csForm.entrantNames.filter((n) => n.trim()),
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const created = await response.json();
      setCsPermits((prev) => [created, ...prev]);
      setShowCSModal(false);
      toast.success("Confined Space Permit requested");
      resetCSForm();
    } catch (error) {
      toast.error("Failed to create permit");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (
    id: string,
    type: "hot-work" | "confined-space",
    signature: string,
  ) => {
    try {
      const endpoint =
        type === "hot-work"
          ? `/api/hot-work-permits/${id}`
          : `/api/confined-space-permits/${id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          approverSignature: signature,
        }),
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Permit approved");
      router.refresh();
    } catch (error) {
      toast.error("Failed to approve");
    }
  };

  const handleComplete = async (
    id: string,
    type: "hot-work" | "confined-space",
  ) => {
    try {
      const endpoint =
        type === "hot-work"
          ? `/api/hot-work-permits/${id}`
          : `/api/confined-space-permits/${id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Permit completed");
      router.refresh();
    } catch (error) {
      toast.error("Failed to complete");
    }
  };

  const resetHotWorkForm = () => {
    setHotWorkForm({
      workDescription: "",
      location: "",
      floor: "",
      equipment: "",
      validFrom: "",
      validTo: "",
      fireExtinguisherAvailable: false,
      areaCleared: false,
      combustiblesRemoved: false,
      fireWatchAssigned: false,
      sprinklersOperational: true,
      detectorsIsolated: false,
      ventilationAdequate: false,
      fireWatchName: "",
      fireWatchDuration: 30,
      requesterSignature: "",
    });
  };

  const resetCSForm = () => {
    setCSForm({
      spaceDescription: "",
      location: "",
      reasonForEntry: "",
      validFrom: "",
      validTo: "",
      oxygenLevel: "",
      h2sLevel: "",
      coLevel: "",
      lelLevel: "",
      testDateTime: "",
      testPerformedBy: "",
      spaceLocked: false,
      spaceIsolated: false,
      ventilationProvided: false,
      lightingProvided: false,
      communicationTested: false,
      rescueEquipmentReady: false,
      entrantsTrained: false,
      entrantNames: [""],
      attendantName: "",
      rescueTeamNotified: false,
      emergencyContact: "",
      emergencyNumber: "",
      nearestHospital: "",
      requesterSignature: "",
    });
  };

  const isExpired = (validTo: string) => new Date(validTo) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Permits to Work
          </h2>
          <p className="text-muted-foreground">
            Manage hot work and confined space entry permits
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="hot-work" className="flex items-center gap-2">
            <Flame className="h-4 w-4" /> Hot Work ({hotWorkPermits.length})
          </TabsTrigger>
          <TabsTrigger
            value="confined-space"
            className="flex items-center gap-2"
          >
            <AlertOctagon className="h-4 w-4" /> Confined Space (
            {csPermits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hot-work" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowHotWorkModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Hot Work Permit
            </Button>
          </div>

          {hotWorkPermits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Flame className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hot work permits</p>
              </CardContent>
            </Card>
          ) : (
            hotWorkPermits.map((permit) => (
              <Card
                key={permit.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <Badge
                          className={
                            isExpired(permit.validTo)
                              ? "bg-orange-500"
                              : statusColors[permit.status]
                          }
                        >
                          {isExpired(permit.validTo)
                            ? "EXPIRED"
                            : permit.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          HW-{permit.number}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {permit.workDescription}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        📍 {permit.location}{" "}
                        {permit.floor && `- ${permit.floor}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          <Clock className="h-4 w-4 inline mr-1" />{" "}
                          {format(new Date(permit.validFrom), "dd/MM HH:mm")} -{" "}
                          {format(new Date(permit.validTo), "dd/MM HH:mm")}
                        </span>
                        <span>Requested by {permit.requestedBy?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPermit(permit);
                          setPermitType("hot-work");
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {permit.status === "REQUESTED" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleApprove(permit.id, "hot-work", "")
                          }
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                      {(permit.status === "APPROVED" ||
                        permit.status === "ACTIVE") &&
                        !isExpired(permit.validTo) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleComplete(permit.id, "hot-work")
                            }
                          >
                            Complete
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confined-space" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCSModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Confined Space Permit
            </Button>
          </div>

          {csPermits.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertOctagon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No confined space permits
                </p>
              </CardContent>
            </Card>
          ) : (
            csPermits.map((permit) => (
              <Card
                key={permit.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertOctagon className="h-5 w-5 text-red-500" />
                        <Badge
                          className={
                            isExpired(permit.validTo)
                              ? "bg-orange-500"
                              : statusColors[permit.status]
                          }
                        >
                          {isExpired(permit.validTo)
                            ? "EXPIRED"
                            : permit.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          CS-{permit.number}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {permit.spaceDescription}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        📍 {permit.location}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {permit.oxygenLevel && (
                          <span
                            className={`${parseFloat(permit.oxygenLevel) < 19.5 || parseFloat(permit.oxygenLevel) > 23.5 ? "text-red-500 font-bold" : "text-green-600"}`}
                          >
                            O₂: {permit.oxygenLevel}%
                          </span>
                        )}
                        {permit.h2sLevel && (
                          <span
                            className={`${parseFloat(permit.h2sLevel) > 10 ? "text-red-500 font-bold" : "text-muted-foreground"}`}
                          >
                            H₂S: {permit.h2sLevel}ppm
                          </span>
                        )}
                        {permit.lelLevel && (
                          <span
                            className={`${parseFloat(permit.lelLevel) > 10 ? "text-red-500 font-bold" : "text-muted-foreground"}`}
                          >
                            LEL: {permit.lelLevel}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          <Clock className="h-4 w-4 inline mr-1" />{" "}
                          {format(new Date(permit.validFrom), "dd/MM HH:mm")} -{" "}
                          {format(new Date(permit.validTo), "dd/MM HH:mm")}
                        </span>
                        <span>{permit.entrantNames?.length || 0} entrants</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPermit(permit);
                          setPermitType("confined-space");
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {permit.status === "REQUESTED" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleApprove(permit.id, "confined-space", "")
                          }
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                      {(permit.status === "APPROVED" ||
                        permit.status === "ACTIVE") &&
                        !isExpired(permit.validTo) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleComplete(permit.id, "confined-space")
                            }
                          >
                            Complete
                          </Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Hot Work Modal */}
      <Dialog open={showHotWorkModal} onOpenChange={setShowHotWorkModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" /> Hot Work Permit
              Request
            </DialogTitle>
            <DialogDescription>
              Request a permit for welding, cutting, grinding, or other
              fire-producing work
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Work Description *
              </label>
              <Textarea
                value={hotWorkForm.workDescription}
                onChange={(e) =>
                  setHotWorkForm((prev) => ({
                    ...prev,
                    workDescription: e.target.value,
                  }))
                }
                placeholder="Describe the hot work to be performed..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Location *
                </label>
                <Input
                  value={hotWorkForm.location}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Work location"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Floor/Level
                </label>
                <Input
                  value={hotWorkForm.floor}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      floor: e.target.value,
                    }))
                  }
                  placeholder="Floor"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Equipment
                </label>
                <Input
                  value={hotWorkForm.equipment}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      equipment: e.target.value,
                    }))
                  }
                  placeholder="e.g., MIG Welder"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Valid From *
                </label>
                <Input
                  type="datetime-local"
                  value={hotWorkForm.validFrom}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Valid To *
                </label>
                <Input
                  type="datetime-local"
                  value={hotWorkForm.validTo}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      validTo: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">
                Pre-Work Checklist
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: "fireExtinguisherAvailable",
                    label: "Fire extinguisher available (min 2)",
                  },
                  {
                    key: "areaCleared",
                    label: "Area cleared of unauthorized personnel",
                  },
                  {
                    key: "combustiblesRemoved",
                    label: "Combustibles removed/protected",
                  },
                  { key: "fireWatchAssigned", label: "Fire watch assigned" },
                  {
                    key: "sprinklersOperational",
                    label: "Sprinklers operational",
                  },
                  {
                    key: "detectorsIsolated",
                    label: "Smoke/heat detectors isolated",
                  },
                  { key: "ventilationAdequate", label: "Adequate ventilation" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={(hotWorkForm as any)[key]}
                      onCheckedChange={(checked) =>
                        setHotWorkForm((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                    <label
                      htmlFor={key}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Fire Watch Name
                </label>
                <Input
                  value={hotWorkForm.fireWatchName}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      fireWatchName: e.target.value,
                    }))
                  }
                  placeholder="Name of fire watch"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Fire Watch Duration (mins after)
                </label>
                <Input
                  type="number"
                  value={hotWorkForm.fireWatchDuration}
                  onChange={(e) =>
                    setHotWorkForm((prev) => ({
                      ...prev,
                      fireWatchDuration: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Requester Signature
              </label>
              <SignaturePad
                onSave={(sig) =>
                  setHotWorkForm((prev) => ({
                    ...prev,
                    requesterSignature: sig,
                  }))
                }
                onClear={() =>
                  setHotWorkForm((prev) => ({
                    ...prev,
                    requesterSignature: "",
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHotWorkModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={createHotWorkPermit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confined Space Modal */}
      <Dialog open={showCSModal} onOpenChange={setShowCSModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-500" /> Confined Space
              Entry Permit
            </DialogTitle>
            <DialogDescription>
              Request a permit for confined space entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Space Description *
              </label>
              <Textarea
                value={csForm.spaceDescription}
                onChange={(e) =>
                  setCSForm((prev) => ({
                    ...prev,
                    spaceDescription: e.target.value,
                  }))
                }
                placeholder="Describe the confined space (tank, pit, vessel, etc.)..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Location *
                </label>
                <Input
                  value={csForm.location}
                  onChange={(e) =>
                    setCSForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Location"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Reason for Entry
                </label>
                <Input
                  value={csForm.reasonForEntry}
                  onChange={(e) =>
                    setCSForm((prev) => ({
                      ...prev,
                      reasonForEntry: e.target.value,
                    }))
                  }
                  placeholder="Inspection, cleaning, repair..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Valid From *
                </label>
                <Input
                  type="datetime-local"
                  value={csForm.validFrom}
                  onChange={(e) =>
                    setCSForm((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Valid To *
                </label>
                <Input
                  type="datetime-local"
                  value={csForm.validTo}
                  onChange={(e) =>
                    setCSForm((prev) => ({ ...prev, validTo: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">
                Atmosphere Testing
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Oxygen (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={csForm.oxygenLevel}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        oxygenLevel: e.target.value,
                      }))
                    }
                    placeholder="19.5-23.5"
                    className={
                      parseFloat(csForm.oxygenLevel) < 19.5 ||
                      parseFloat(csForm.oxygenLevel) > 23.5
                        ? "border-red-500"
                        : ""
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    H₂S (ppm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={csForm.h2sLevel}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        h2sLevel: e.target.value,
                      }))
                    }
                    placeholder="<10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    CO (ppm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={csForm.coLevel}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        coLevel: e.target.value,
                      }))
                    }
                    placeholder="<35"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    LEL (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={csForm.lelLevel}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        lelLevel: e.target.value,
                      }))
                    }
                    placeholder="<10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Test Date/Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={csForm.testDateTime}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        testDateTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Tested By
                  </label>
                  <Input
                    value={csForm.testPerformedBy}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        testPerformedBy: e.target.value,
                      }))
                    }
                    placeholder="Name"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">
                Pre-Entry Checklist
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "spaceLocked", label: "Space locked out/tagged out" },
                  {
                    key: "spaceIsolated",
                    label: "Space isolated from hazards",
                  },
                  { key: "ventilationProvided", label: "Ventilation provided" },
                  { key: "lightingProvided", label: "Lighting provided" },
                  { key: "communicationTested", label: "Communication tested" },
                  {
                    key: "rescueEquipmentReady",
                    label: "Rescue equipment ready",
                  },
                  { key: "entrantsTrained", label: "Entrants trained" },
                  { key: "rescueTeamNotified", label: "Rescue team notified" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={(csForm as any)[key]}
                      onCheckedChange={(checked) =>
                        setCSForm((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                    <label
                      htmlFor={key}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Entrant Names
                </label>
                {csForm.entrantNames.map((name, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <Input
                      value={name}
                      onChange={(e) => {
                        const newNames = [...csForm.entrantNames];
                        newNames[i] = e.target.value;
                        setCSForm((prev) => ({
                          ...prev,
                          entrantNames: newNames,
                        }));
                      }}
                      placeholder={`Entrant ${i + 1}`}
                    />
                    {i === csForm.entrantNames.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCSForm((prev) => ({
                            ...prev,
                            entrantNames: [...prev.entrantNames, ""],
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Attendant Name
                </label>
                <Input
                  value={csForm.attendantName}
                  onChange={(e) =>
                    setCSForm((prev) => ({
                      ...prev,
                      attendantName: e.target.value,
                    }))
                  }
                  placeholder="Name of standby attendant"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">
                Emergency Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Emergency Contact
                  </label>
                  <Input
                    value={csForm.emergencyContact}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        emergencyContact: e.target.value,
                      }))
                    }
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Emergency Number
                  </label>
                  <Input
                    value={csForm.emergencyNumber}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        emergencyNumber: e.target.value,
                      }))
                    }
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Nearest Hospital
                  </label>
                  <Input
                    value={csForm.nearestHospital}
                    onChange={(e) =>
                      setCSForm((prev) => ({
                        ...prev,
                        nearestHospital: e.target.value,
                      }))
                    }
                    placeholder="Hospital name"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCSModal(false)}>
              Cancel
            </Button>
            <Button onClick={createCSPermit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {permitType === "hot-work"
                ? "Hot Work Permit"
                : "Confined Space Permit"}{" "}
              #{selectedPermit?.number}
            </DialogTitle>
          </DialogHeader>
          {selectedPermit && (
            <div className="space-y-4 py-4">
              <Badge className={statusColors[selectedPermit.status]}>
                {selectedPermit.status}
              </Badge>

              {permitType === "hot-work" ? (
                <>
                  <p className="text-foreground">
                    {selectedPermit.workDescription}
                  </p>
                  <p className="text-muted-foreground">
                    📍 {selectedPermit.location}{" "}
                    {selectedPermit.floor && `- ${selectedPermit.floor}`}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Valid:</span>{" "}
                      {format(
                        new Date(selectedPermit.validFrom),
                        "dd/MM/yyyy HH:mm",
                      )}{" "}
                      -{" "}
                      {format(
                        new Date(selectedPermit.validTo),
                        "dd/MM/yyyy HH:mm",
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Equipment:</span>{" "}
                      {selectedPermit.equipment || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Fire Watch:</span>{" "}
                      {selectedPermit.fireWatchName || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Fire Watch Duration:</span>{" "}
                      {selectedPermit.fireWatchDuration} mins
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Pre-Work Checks
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        {
                          key: "fireExtinguisherAvailable",
                          label: "Fire Extinguisher",
                        },
                        { key: "areaCleared", label: "Area Cleared" },
                        {
                          key: "combustiblesRemoved",
                          label: "Combustibles Removed",
                        },
                        {
                          key: "fireWatchAssigned",
                          label: "Fire Watch Assigned",
                        },
                        {
                          key: "detectorsIsolated",
                          label: "Detectors Isolated",
                        },
                        {
                          key: "ventilationAdequate",
                          label: "Ventilation Adequate",
                        },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          {selectedPermit[key] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-foreground">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-foreground">
                    {selectedPermit.spaceDescription}
                  </p>
                  <p className="text-muted-foreground">
                    📍 {selectedPermit.location}
                  </p>
                  <div className="grid grid-cols-4 gap-4 text-sm bg-muted p-3 rounded">
                    <div>
                      <span className="font-medium">O₂:</span>{" "}
                      {selectedPermit.oxygenLevel}%
                    </div>
                    <div>
                      <span className="font-medium">H₂S:</span>{" "}
                      {selectedPermit.h2sLevel} ppm
                    </div>
                    <div>
                      <span className="font-medium">CO:</span>{" "}
                      {selectedPermit.coLevel} ppm
                    </div>
                    <div>
                      <span className="font-medium">LEL:</span>{" "}
                      {selectedPermit.lelLevel}%
                    </div>
                  </div>
                  {selectedPermit.entrantNames?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        Entrants
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPermit.entrantNames.map(
                          (name: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {name}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
