"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Check,
  ChevronRight,
  Loader2,
  PenTool,
  AlertTriangle,
  CheckCircle2,
  Download,
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
} from "@/components/ui/dialog";
import { SignaturePad, SignatureDisplay } from "@/components/ui/signature-pad";
import { useRealtimeSubscription } from "@/components/realtime-provider";
import { toast } from "sonner";

interface ToolboxTalk {
  id: string;
  title: string;
  topic: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status: string;
  keyPoints: string[];
  hazardsDiscussed: string[];
  safetyMeasures: string[];
  notes?: string;
  weatherConditions?: string;
  presenter: { id: string; name: string };
  attendees: Array<{
    id: string;
    name: string;
    company?: string;
    trade?: string;
    signedAt?: string;
    signatureData?: string;
    acknowledged: boolean;
    user?: { id: string; name: string };
  }>;
  _count?: { attendees: number };
}

interface ToolboxTalksTabProps {
  projectId: string;
  toolboxTalks: ToolboxTalk[];
  teamMembers: any[];
}

const statusColors: Record<string, string> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export function ToolboxTalksTab({
  projectId,
  toolboxTalks: initialTalks,
  teamMembers,
}: ToolboxTalksTabProps) {
  const router = useRouter();
  const [talks, setTalks] = useState<ToolboxTalk[]>(initialTalks || []);
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedTalk, setSelectedTalk] = useState<ToolboxTalk | null>(null);
  const [newTalk, setNewTalk] = useState({
    title: "",
    topic: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "07:00",
    location: "",
    keyPoints: "",
    hazardsDiscussed: "",
    safetyMeasures: "",
  });
  const [signData, setSignData] = useState({
    name: "",
    company: "",
    trade: "",
  });

  const fetchTalks = useCallback(async () => {
    try {
      const res = await fetch(`/api/toolbox-talks?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTalks(data.toolboxTalks || []);
      }
    } catch (error) {
      console.error("Error fetching toolbox talks:", error);
    }
  }, [projectId]);

  useRealtimeSubscription(
    ["toolbox_talk_created", "toolbox_talk_updated", "toolbox_talk_signed"],
    fetchTalks,
    [projectId],
  );

  const handleCreateTalk = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/toolbox-talks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTalk,
          projectId,
          date: new Date(`${newTalk.date}T${newTalk.startTime}`),
          startTime: new Date(`${newTalk.date}T${newTalk.startTime}`),
          keyPoints: newTalk.keyPoints.split("\n").filter(Boolean),
          hazardsDiscussed: newTalk.hazardsDiscussed
            .split("\n")
            .filter(Boolean),
          safetyMeasures: newTalk.safetyMeasures.split("\n").filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success("Toolbox talk created");
        setShowNewModal(false);
        setNewTalk({
          title: "",
          topic: "",
          description: "",
          date: format(new Date(), "yyyy-MM-dd"),
          startTime: "07:00",
          location: "",
          keyPoints: "",
          hazardsDiscussed: "",
          safetyMeasures: "",
        });
        fetchTalks();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create toolbox talk");
      }
    } catch (error) {
      toast.error("Failed to create toolbox talk");
    } finally {
      setLoading(false);
    }
  };

  const handleSignTalk = async (signatureData: string) => {
    if (!selectedTalk) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/toolbox-talks/${selectedTalk.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signData.name,
          company: signData.company,
          trade: signData.trade,
          signatureData,
        }),
      });

      if (res.ok) {
        toast.success("Signature recorded");
        setShowSignModal(false);
        setSignData({ name: "", company: "", trade: "" });
        fetchTalks();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to record signature");
      }
    } catch (error) {
      toast.error("Failed to record signature");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTalk = async (talk: ToolboxTalk) => {
    try {
      const res = await fetch(`/api/toolbox-talks/${talk.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS", startTime: new Date() }),
      });
      if (res.ok) {
        toast.success("Toolbox talk started");
        fetchTalks();
      }
    } catch (error) {
      toast.error("Failed to start toolbox talk");
    }
  };

  const handleCompleteTalk = async (talk: ToolboxTalk) => {
    try {
      const res = await fetch(`/api/toolbox-talks/${talk.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", endTime: new Date() }),
      });
      if (res.ok) {
        toast.success("Toolbox talk completed");
        fetchTalks();
      }
    } catch (error) {
      toast.error("Failed to complete toolbox talk");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Toolbox Talks
          </h3>
          <p className="text-sm text-muted-foreground">
            Safety briefings with attendance tracking
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} variant="accent">
          <Plus className="h-4 w-4 mr-2" />
          New Toolbox Talk
        </Button>
      </div>

      {/* Talks List */}
      <div className="grid gap-4">
        {talks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No toolbox talks scheduled
              </p>
              <Button
                onClick={() => setShowNewModal(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Talk
              </Button>
            </CardContent>
          </Card>
        ) : (
          talks.map((talk) => (
            <Card
              key={talk.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTalk(talk);
                setShowDetailModal(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={statusColors[talk.status] as any}>
                        {talk.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(talk.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">
                      {talk.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {talk.topic}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {talk.presenter?.name}
                      </span>
                      {talk.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {talk.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <PenTool className="h-3 w-3" />
                        {talk.attendees?.filter((a) => a.signedAt).length ||
                          0}{" "}
                        / {talk.attendees?.length || 0} signed
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {talk.status === "SCHEDULED" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTalk(talk);
                        }}
                      >
                        Start
                      </Button>
                    )}
                    {talk.status === "IN_PROGRESS" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTalk(talk);
                            setShowSignModal(true);
                          }}
                        >
                          <PenTool className="h-4 w-4 mr-1" />
                          Sign
                        </Button>
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteTalk(talk);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Talk Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Toolbox Talk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Title *
                </label>
                <Input
                  value={newTalk.title}
                  onChange={(e) =>
                    setNewTalk({ ...newTalk, title: e.target.value })
                  }
                  placeholder="Morning Safety Briefing"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Topic *
                </label>
                <Input
                  value={newTalk.topic}
                  onChange={(e) =>
                    setNewTalk({ ...newTalk, topic: e.target.value })
                  }
                  placeholder="Working at Heights"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                value={newTalk.description}
                onChange={(e) =>
                  setNewTalk({ ...newTalk, description: e.target.value })
                }
                placeholder="Brief description of what will be covered..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Date *
                </label>
                <Input
                  type="date"
                  value={newTalk.date}
                  onChange={(e) =>
                    setNewTalk({ ...newTalk, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={newTalk.startTime}
                  onChange={(e) =>
                    setNewTalk({ ...newTalk, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Location
                </label>
                <Input
                  value={newTalk.location}
                  onChange={(e) =>
                    setNewTalk({ ...newTalk, location: e.target.value })
                  }
                  placeholder="Site office"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Key Points (one per line)
              </label>
              <Textarea
                value={newTalk.keyPoints}
                onChange={(e) =>
                  setNewTalk({ ...newTalk, keyPoints: e.target.value })
                }
                placeholder="Always wear PPE\nCheck equipment before use\nReport any hazards"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Hazards Discussed (one per line)
              </label>
              <Textarea
                value={newTalk.hazardsDiscussed}
                onChange={(e) =>
                  setNewTalk({ ...newTalk, hazardsDiscussed: e.target.value })
                }
                placeholder="Working at heights\nSlippery surfaces\nMoving machinery"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Safety Measures (one per line)
              </label>
              <Textarea
                value={newTalk.safetyMeasures}
                onChange={(e) =>
                  setNewTalk({ ...newTalk, safetyMeasures: e.target.value })
                }
                placeholder="Use harness when above 2m\nWear non-slip footwear\nMaintain safe distance"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTalk}
                disabled={loading || !newTalk.title || !newTalk.topic}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Toolbox Talk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Modal */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Your Name *
              </label>
              <Input
                value={signData.name}
                onChange={(e) =>
                  setSignData({ ...signData, name: e.target.value })
                }
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Company
                </label>
                <Input
                  value={signData.company}
                  onChange={(e) =>
                    setSignData({ ...signData, company: e.target.value })
                  }
                  placeholder="ABC Construction"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trade
                </label>
                <Input
                  value={signData.trade}
                  onChange={(e) =>
                    setSignData({ ...signData, trade: e.target.value })
                  }
                  placeholder="Electrician"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Signature *
              </label>
              <SignaturePad
                onSignature={handleSignTalk}
                disabled={loading || !signData.name}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>{selectedTalk?.title}</DialogTitle>
            {selectedTalk && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `/api/toolbox-talks/${selectedTalk.id}/pdf`;
                  link.download = `toolbox-talk-${selectedTalk.id}.pdf`;
                  link.click();
                  toast.success("Downloading PDF...");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogHeader>
          {selectedTalk && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Topic:</span>
                  <p className="font-medium text-foreground">
                    {selectedTalk.topic}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant={statusColors[selectedTalk.status] as any}
                    className="ml-2"
                  >
                    {selectedTalk.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Presenter:</span>
                  <p className="font-medium text-foreground">
                    {selectedTalk.presenter?.name}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium text-foreground">
                    {format(new Date(selectedTalk.date), "PPP")}
                  </p>
                </div>
              </div>

              {selectedTalk.keyPoints?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Key Points
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedTalk.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-foreground">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTalk.hazardsDiscussed?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Hazards Discussed
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedTalk.hazardsDiscussed.map((hazard, i) => (
                      <li key={i} className="text-sm text-foreground">
                        {hazard}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedTalk.safetyMeasures?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Safety Measures
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedTalk.safetyMeasures.map((measure, i) => (
                      <li key={i} className="text-sm text-foreground">
                        {measure}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attendees */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Attendees ({selectedTalk.attendees?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedTalk.attendees?.map((attendee) => (
                    <div
                      key={attendee.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {attendee.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[attendee.trade, attendee.company]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {attendee.signedAt ? (
                          <>
                            {attendee.signatureData && (
                              <SignatureDisplay
                                signatureData={attendee.signatureData}
                                timestamp={attendee.signedAt}
                              />
                            )}
                            <Badge variant="success" className="ml-2">
                              <Check className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
