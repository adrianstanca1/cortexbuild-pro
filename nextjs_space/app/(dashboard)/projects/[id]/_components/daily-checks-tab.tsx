"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  HardHat, Wrench, Plus, Check, ChevronRight,
  Calendar, CheckCircle2, XCircle, Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignaturePad, SignatureDisplay } from "@/components/ui/signature-pad";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { toast } from "sonner";

const CHECK_ITEMS = {
  mewp: [
    { key: "visualInspection", label: "Visual Inspection" },
    { key: "guardrailsSecure", label: "Guardrails Secure" },
    { key: "floorCondition", label: "Floor Condition" },
    { key: "controlsFunction", label: "Controls Function" },
    { key: "emergencyControls", label: "Emergency Controls" },
    { key: "wheelsAndTyres", label: "Wheels & Tyres" },
    { key: "outriggersStabilizers", label: "Outriggers/Stabilizers" },
    { key: "hydraulicSystem", label: "Hydraulic System" },
    { key: "electricalSystem", label: "Electrical System" },
    { key: "safetyDevices", label: "Safety Devices" },
    { key: "warningAlarms", label: "Warning Alarms" },
    { key: "manualOverride", label: "Manual Override" },
    { key: "loadPlateVisible", label: "Load Plate Visible" },
    { key: "userManualPresent", label: "User Manual Present" }
  ],
  powerTool: [
    { key: "generalCondition", label: "General Condition" },
    { key: "cableCondition", label: "Cable Condition" },
    { key: "plugCondition", label: "Plug Condition" },
    { key: "guardsFunctional", label: "Guards Functional" },
    { key: "switchesFunctional", label: "Switches Functional" },
    { key: "handlesSecure", label: "Handles Secure" },
    { key: "safetyFeatures", label: "Safety Features" },
    { key: "patTestCurrent", label: "PAT Test Current" }
  ],
  ladder: [
    { key: "generalCondition", label: "General Condition" },
    { key: "stileCondition", label: "Stile Condition" },
    { key: "rungCondition", label: "Rung Condition" },
    { key: "feetCondition", label: "Feet Condition" },
    { key: "lockingMechanismOk", label: "Locking Mechanism" },
    { key: "safetyFeatures", label: "Safety Labels" }
  ],
  handTool: [
    { key: "generalCondition", label: "General Condition" },
    { key: "handlesSecure", label: "Handles Secure" },
    { key: "bladeSharpness", label: "Blade/Edge Condition" },
    { key: "safetyFeatures", label: "Safety Features" },
    { key: "storageCondition", label: "Storage Condition" }
  ]
};

const TOOL_TYPES = [
  { value: "POWER_TOOL", label: "Power Tool" },
  { value: "HAND_TOOL", label: "Hand Tool" },
  { value: "LADDER", label: "Ladder" },
  { value: "SCAFFOLD", label: "Scaffold" },
  { value: "OTHER", label: "Other" }
];

const statusColors: Record<string, any> = {
  PASS: "success",
  FAIL: "destructive",
  NEEDS_ATTENTION: "warning",
  NOT_APPLICABLE: "secondary"
};

interface DailyChecksTabProps {
  projectId: string;
  mewpChecks: any[];
  toolChecks: any[];
  equipment: any[];
}

export function DailyChecksTab({
  projectId,
  mewpChecks: initialMewpChecks,
  toolChecks: initialToolChecks
}: DailyChecksTabProps) {
  const router = useRouter();
  const [mewpChecks, setMewpChecks] = useState(initialMewpChecks || []);
  const [toolChecks, setToolChecks] = useState(initialToolChecks || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mewp");
  const [showNewMewpModal, setShowNewMewpModal] = useState(false);
  const [showNewToolModal, setShowNewToolModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [checkType, setCheckType] = useState<"mewp" | "tool">("mewp");

  // MEWP check form
  const [mewpForm, setMewpForm] = useState({
    equipmentId: "",
    equipmentName: "",
    equipmentSerial: "",
    equipmentModel: "",
    manufacturer: "",
    location: "",
    operatorCertNumber: "",
    certExpiryDate: "",
    weatherConditions: "",
    windSpeed: "",
    defectsFound: "",
    actionsTaken: "",
    comments: "",
    checkItems: {} as Record<string, string>
  });

  // Tool check form
  const [toolForm, setToolForm] = useState({
    toolName: "",
    toolType: "POWER_TOOL",
    toolSerial: "",
    toolAssetTag: "",
    manufacturer: "",
    location: "",
    defectsFound: "",
    actionsTaken: "",
    comments: "",
    checkItems: {} as Record<string, string>
  });

  const fetchChecks = useCallback(async () => {
    try {
      const [mewpRes, toolRes] = await Promise.all([
        fetch(`/api/mewp-checks?projectId=${projectId}`),
        fetch(`/api/tool-checks?projectId=${projectId}`)
      ]);
      if (mewpRes.ok) {
        const data = await mewpRes.json();
        setMewpChecks(data.checks || []);
      }
      if (toolRes.ok) {
        const data = await toolRes.json();
        setToolChecks(data.checks || []);
      }
    } catch {
      console.error("Error fetching checks:", error);
    }
  }, [projectId]);

  useRealtimeSubscription(
    ["mewp_check_completed", "mewp_check_updated", "tool_check_completed", "tool_check_updated"],
    fetchChecks,
    [projectId]
  );

  const handleMewpCheckItem = (key: string, value: string) => {
    setMewpForm(prev => ({
      ...prev,
      checkItems: { ...prev.checkItems, [key]: value }
    }));
  };

  const handleToolCheckItem = (key: string, value: string) => {
    setToolForm(prev => ({
      ...prev,
      checkItems: { ...prev.checkItems, [key]: value }
    }));
  };

  const calculateOverallStatus = (items: Record<string, string>): string => {
    const values = Object.values(items);
    if (values.some(v => v === "DEFECTIVE")) return "FAIL";
    if (values.some(v => v === "NEEDS_REPAIR")) return "NEEDS_ATTENTION";
    return "PASS";
  };

  const handleCreateMewpCheck = async (signatureData: string) => {
    setLoading(true);
    try {
      const overallStatus = calculateOverallStatus(mewpForm.checkItems);
      const isSafeToUse = overallStatus === "PASS";

      const res = await fetch("/api/mewp-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...mewpForm,
          equipmentId: mewpForm.equipmentId || null,
          certExpiryDate: mewpForm.certExpiryDate || null,
          ...mewpForm.checkItems,
          overallStatus,
          isSafeToUse,
          operatorSignature: signatureData
        })
      });

      if (res.ok) {
        toast.success("MEWP check completed");
        setShowNewMewpModal(false);
        resetMewpForm();
        fetchChecks();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create check");
      }
    } catch {
      toast.error("Failed to create MEWP check");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToolCheck = async (signatureData: string) => {
    setLoading(true);
    try {
      const overallStatus = calculateOverallStatus(toolForm.checkItems);
      const isSafeToUse = overallStatus === "PASS";

      const res = await fetch("/api/tool-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...toolForm,
          ...toolForm.checkItems,
          overallStatus,
          isSafeToUse,
          inspectorSignature: signatureData
        })
      });

      if (res.ok) {
        toast.success("Tool check completed");
        setShowNewToolModal(false);
        resetToolForm();
        fetchChecks();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create check");
      }
    } catch {
      toast.error("Failed to create tool check");
    } finally {
      setLoading(false);
    }
  };

  const resetMewpForm = () => {
    setMewpForm({
      equipmentId: "",
      equipmentName: "",
      equipmentSerial: "",
      equipmentModel: "",
      manufacturer: "",
      location: "",
      operatorCertNumber: "",
      certExpiryDate: "",
      weatherConditions: "",
      windSpeed: "",
      defectsFound: "",
      actionsTaken: "",
      comments: "",
      checkItems: {}
    });
  };

  const resetToolForm = () => {
    setToolForm({
      toolName: "",
      toolType: "POWER_TOOL",
      toolSerial: "",
      toolAssetTag: "",
      manufacturer: "",
      location: "",
      defectsFound: "",
      actionsTaken: "",
      comments: "",
      checkItems: {}
    });
  };

  const getToolCheckItems = () => {
    switch (toolForm.toolType) {
      case "POWER_TOOL": return CHECK_ITEMS.powerTool;
      case "LADDER": return CHECK_ITEMS.ladder;
      case "HAND_TOOL": return CHECK_ITEMS.handTool;
      default: return CHECK_ITEMS.handTool;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="mewp" className="flex items-center gap-2">
              <HardHat className="h-4 w-4" />
              MEWP Checks
              <Badge variant="secondary" className="ml-1">{mewpChecks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tool Checks
              <Badge variant="secondary" className="ml-1">{toolChecks.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {activeTab === "mewp" ? (
              <Button onClick={() => setShowNewMewpModal(true)} variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                New MEWP Check
              </Button>
            ) : (
              <Button onClick={() => setShowNewToolModal(true)} variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                New Tool Check
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="mewp" className="space-y-4">
          {mewpChecks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HardHat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No MEWP checks recorded</p>
                <Button onClick={() => setShowNewMewpModal(true)} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Complete First Check
                </Button>
              </CardContent>
            </Card>
          ) : (
            mewpChecks.map((check: any) => (
              <Card key={check.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedCheck(check); setCheckType("mewp"); setShowDetailModal(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={statusColors[check.overallStatus]}>
                          {check.overallStatus}
                        </Badge>
                        {check.isSafeToUse ? (
                          <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Safe to Use</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Not Safe</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground">{check.equipmentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {check.equipmentModel} {check.equipmentSerial && `• S/N: ${check.equipmentSerial}`}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {check.operator?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(check.checkDate), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          {toolChecks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No tool checks recorded</p>
                <Button onClick={() => setShowNewToolModal(true)} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Complete First Check
                </Button>
              </CardContent>
            </Card>
          ) : (
            toolChecks.map((check: any) => (
              <Card key={check.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedCheck(check); setCheckType("tool"); setShowDetailModal(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={statusColors[check.overallStatus]}>
                          {check.overallStatus}
                        </Badge>
                        <Badge variant="secondary">{check.toolType.replace("_", " ")}</Badge>
                        {check.isSafeToUse ? (
                          <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>
                        ) : (
                          <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Defective</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground">{check.toolName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {check.manufacturer} {check.toolSerial && `• S/N: ${check.toolSerial}`}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {check.inspector?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(check.checkDate), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* MEWP Check Modal */}
      <Dialog open={showNewMewpModal} onOpenChange={setShowNewMewpModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              MEWP Pre-Use Inspection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Equipment Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Equipment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Equipment Name *</label>
                  <Input
                    value={mewpForm.equipmentName}
                    onChange={(e) => setMewpForm({ ...mewpForm, equipmentName: e.target.value })}
                    placeholder="Cherry Picker / Scissor Lift"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Serial Number</label>
                  <Input
                    value={mewpForm.equipmentSerial}
                    onChange={(e) => setMewpForm({ ...mewpForm, equipmentSerial: e.target.value })}
                    placeholder="SN-12345"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <Input
                    value={mewpForm.equipmentModel}
                    onChange={(e) => setMewpForm({ ...mewpForm, equipmentModel: e.target.value })}
                    placeholder="JLG 460SJ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <Input
                    value={mewpForm.location}
                    onChange={(e) => setMewpForm({ ...mewpForm, location: e.target.value })}
                    placeholder="North facade"
                  />
                </div>
              </div>
            </div>

            {/* Weather & Operator */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Operator & Conditions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">IPAF/Operator Cert Number</label>
                  <Input
                    value={mewpForm.operatorCertNumber}
                    onChange={(e) => setMewpForm({ ...mewpForm, operatorCertNumber: e.target.value })}
                    placeholder="IPAF-12345"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Cert Expiry Date</label>
                  <Input
                    type="date"
                    value={mewpForm.certExpiryDate}
                    onChange={(e) => setMewpForm({ ...mewpForm, certExpiryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Weather Conditions</label>
                  <Input
                    value={mewpForm.weatherConditions}
                    onChange={(e) => setMewpForm({ ...mewpForm, weatherConditions: e.target.value })}
                    placeholder="Clear, 15°C"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Wind Speed</label>
                  <Input
                    value={mewpForm.windSpeed}
                    onChange={(e) => setMewpForm({ ...mewpForm, windSpeed: e.target.value })}
                    placeholder="5 mph"
                  />
                </div>
              </div>
            </div>

            {/* Check Items */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Pre-Use Inspection Checklist</h4>
              <div className="grid gap-3">
                {CHECK_ITEMS.mewp.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <div className="flex gap-2">
                      {["OK", "DEFECTIVE", "NEEDS_REPAIR", "NA"].map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={mewpForm.checkItems[item.key] === status ? "default" : "outline"}
                          className={mewpForm.checkItems[item.key] === status ? (
                            status === "OK" ? "bg-green-500 hover:bg-green-600" :
                            status === "DEFECTIVE" ? "bg-red-500 hover:bg-red-600" :
                            status === "NEEDS_REPAIR" ? "bg-amber-500 hover:bg-amber-600" :
                            ""
                          ) : ""}
                          onClick={() => handleMewpCheckItem(item.key, status)}
                        >
                          {status === "OK" ? <Check className="h-4 w-4" /> :
                           status === "DEFECTIVE" ? <AlertTriangle className="h-4 w-4" /> :
                           status === "NEEDS_REPAIR" ? <AlertTriangle className="h-4 w-4" /> :
                           "N/A"}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defects & Comments */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Defects Found</label>
                <Textarea
                  value={mewpForm.defectsFound}
                  onChange={(e) => setMewpForm({ ...mewpForm, defectsFound: e.target.value })}
                  placeholder="List any defects found during inspection..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Actions Taken</label>
                <Textarea
                  value={mewpForm.actionsTaken}
                  onChange={(e) => setMewpForm({ ...mewpForm, actionsTaken: e.target.value })}
                  placeholder="Describe actions taken to address defects..."
                  rows={2}
                />
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Operator Signature</h4>
              <p className="text-sm text-muted-foreground">
                I confirm I have completed this pre-use inspection and the equipment is safe/unsafe to use as indicated.
              </p>
              <SignaturePad
                onSignature={handleCreateMewpCheck}
                disabled={loading || !mewpForm.equipmentName}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tool Check Modal */}
      <Dialog open={showNewToolModal} onOpenChange={setShowNewToolModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Tool Inspection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Tool Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Tool Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Tool Name *</label>
                  <Input
                    value={toolForm.toolName}
                    onChange={(e) => setToolForm({ ...toolForm, toolName: e.target.value })}
                    placeholder="DeWalt Drill"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Tool Type *</label>
                  <Select
                    value={toolForm.toolType}
                    onValueChange={(value) => setToolForm({ ...toolForm, toolType: value, checkItems: {} })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOOL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Serial Number</label>
                  <Input
                    value={toolForm.toolSerial}
                    onChange={(e) => setToolForm({ ...toolForm, toolSerial: e.target.value })}
                    placeholder="SN-12345"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Asset Tag</label>
                  <Input
                    value={toolForm.toolAssetTag}
                    onChange={(e) => setToolForm({ ...toolForm, toolAssetTag: e.target.value })}
                    placeholder="TOOL-001"
                  />
                </div>
              </div>
            </div>

            {/* Check Items */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Inspection Checklist</h4>
              <div className="grid gap-3">
                {getToolCheckItems().map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <div className="flex gap-2">
                      {["OK", "DEFECTIVE", "NEEDS_REPAIR", "NA"].map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={toolForm.checkItems[item.key] === status ? "default" : "outline"}
                          className={toolForm.checkItems[item.key] === status ? (
                            status === "OK" ? "bg-green-500 hover:bg-green-600" :
                            status === "DEFECTIVE" ? "bg-red-500 hover:bg-red-600" :
                            status === "NEEDS_REPAIR" ? "bg-amber-500 hover:bg-amber-600" :
                            ""
                          ) : ""}
                          onClick={() => handleToolCheckItem(item.key, status)}
                        >
                          {status === "OK" ? <Check className="h-4 w-4" /> :
                           status === "DEFECTIVE" ? <AlertTriangle className="h-4 w-4" /> :
                           status === "NEEDS_REPAIR" ? <AlertTriangle className="h-4 w-4" /> :
                           "N/A"}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defects & Comments */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Defects Found</label>
                <Textarea
                  value={toolForm.defectsFound}
                  onChange={(e) => setToolForm({ ...toolForm, defectsFound: e.target.value })}
                  placeholder="List any defects found..."
                  rows={2}
                />
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Inspector Signature</h4>
              <SignaturePad
                onSignature={handleCreateToolCheck}
                disabled={loading || !toolForm.toolName}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>
              {checkType === "mewp" ? "MEWP Check Details" : "Tool Check Details"}
            </DialogTitle>
            {selectedCheck && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const apiPath = checkType === "mewp" 
                    ? `/api/mewp-checks/${selectedCheck.id}/pdf`
                    : `/api/tool-checks/${selectedCheck.id}/pdf`;
                  const link = document.createElement('a');
                  link.href = apiPath;
                  link.download = `${checkType}-check-${selectedCheck.id}.pdf`;
                  link.click();
                  toast.success('Downloading PDF...');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogHeader>
          {selectedCheck && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge variant={statusColors[selectedCheck.overallStatus]}>
                  {selectedCheck.overallStatus}
                </Badge>
                {selectedCheck.isSafeToUse ? (
                  <Badge variant="success">Safe to Use</Badge>
                ) : (
                  <Badge variant="destructive">Not Safe</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Equipment/Tool:</span>
                  <p className="font-medium text-foreground">
                    {selectedCheck.equipmentName || selectedCheck.toolName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium text-foreground">
                    {format(new Date(selectedCheck.checkDate), "PPP p")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {checkType === "mewp" ? "Operator" : "Inspector"}:
                  </span>
                  <p className="font-medium text-foreground">
                    {selectedCheck.operator?.name || selectedCheck.inspector?.name}
                  </p>
                </div>
                {selectedCheck.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium text-foreground">{selectedCheck.location}</p>
                  </div>
                )}
              </div>

              {selectedCheck.defectsFound && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Defects Found
                  </h4>
                  <p className="text-sm text-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                    {selectedCheck.defectsFound}
                  </p>
                </div>
              )}

              {selectedCheck.actionsTaken && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Actions Taken</h4>
                  <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                    {selectedCheck.actionsTaken}
                  </p>
                </div>
              )}

              {/* Signature */}
              {(selectedCheck.operatorSignature || selectedCheck.inspectorSignature) && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Signature</h4>
                  <SignatureDisplay
                    signatureData={selectedCheck.operatorSignature || selectedCheck.inspectorSignature}
                    name={selectedCheck.operator?.name || selectedCheck.inspector?.name}
                    timestamp={selectedCheck.operatorSignedAt || selectedCheck.inspectorSignedAt}
                  />
                </div>
              )}

              {checkType === "mewp" && selectedCheck.supervisorSignature && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Supervisor Sign-off</h4>
                  <SignatureDisplay
                    signatureData={selectedCheck.supervisorSignature}
                    name={selectedCheck.supervisor?.name}
                    timestamp={selectedCheck.supervisorSignedAt}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
