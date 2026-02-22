"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, KeyRound, RefreshCw, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface MFAMethod {
  id: string;
  mfaType: string;
  status: "PENDING_SETUP" | "ACTIVE" | "DISABLED";
  isVerified: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface SetupResponse {
  id: string;
  secret: string;
  qrCodeUri: string;
  message: string;
}

export function MFAClient() {
  const [methods, setMethods] = useState<MFAMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const activeMethod = useMemo(() => methods.find((method) => method.status === "ACTIVE"), [methods]);

  const fetchMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/mfa");

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load MFA methods");
      }

      const data = (await response.json()) as MFAMethod[];
      setMethods(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load MFA methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMethods();
  }, [fetchMethods]);

  const clearNotices = () => {
    setError(null);
    setSuccess(null);
  };

  const beginSetup = async () => {
    try {
      clearNotices();
      setWorking(true);

      const response = await fetch("/api/mfa/setup", { method: "POST" });
      const data = (await response.json()) as SetupResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Unable to start MFA setup");
      }

      setSetupData(data as SetupResponse);
      setVerificationCode("");
      setSuccess("MFA setup started. Scan the QR URI in your authenticator app and verify the generated code.");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Unable to start MFA setup");
    } finally {
      setWorking(false);
    }
  };

  const verifySetup = async () => {
    if (!setupData) return;

    try {
      clearNotices();
      setWorking(true);

      const response = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodId: setupData.id, code: verificationCode.trim() }),
      });

      const data = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess(data.message || "MFA is now enabled.");
      setSetupData(null);
      setVerificationCode("");
      await fetchMethods();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed");
    } finally {
      setWorking(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      clearNotices();
      setWorking(true);

      const response = await fetch("/api/mfa/backup-codes", { method: "POST" });
      const data = (await response.json()) as { backupCodes?: string[]; message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate backup codes");
      }

      setBackupCodes(data.backupCodes || []);
      setSuccess(data.message || "Backup codes generated.");
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "Failed to generate backup codes");
    } finally {
      setWorking(false);
    }
  };

  const disableMFA = async () => {
    try {
      clearNotices();
      setWorking(true);

      const response = await fetch("/api/mfa", { method: "DELETE" });
      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to disable MFA");
      }

      setBackupCodes([]);
      setSetupData(null);
      setVerificationCode("");
      setSuccess("MFA has been disabled for your account.");
      await fetchMethods();
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : "Failed to disable MFA");
    } finally {
      setWorking(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess(`${label} copied to clipboard.`);
    } catch {
      setError(`Failed to copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Factor Authentication</h1>
          <p className="text-gray-500 mt-2">Enable account-level MFA and generate one-time backup codes.</p>
        </div>
        {activeMethod ? (
          <Badge className="bg-green-600">
            <ShieldCheck className="h-3 w-3 mr-1" /> Active
          </Badge>
        ) : (
          <Badge variant="secondary">
            <ShieldOff className="h-3 w-3 mr-1" /> Inactive
          </Badge>
        )}
      </div>

      {(error || success) && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${error ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"}`}>
          {error ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{error || success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>MFA Status</CardTitle>
          <CardDescription>Protect your account with a time-based authenticator application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading MFA settings...</p>
          ) : activeMethod ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium">MFA is enabled with {activeMethod.mfaType}.</p>
              <p className="text-gray-500">Last used: {activeMethod.lastUsedAt ? new Date(activeMethod.lastUsedAt).toLocaleString() : "Not available"}</p>
              <div className="flex gap-2">
                <Button onClick={generateBackupCodes} disabled={working}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Generate Backup Codes
                </Button>
                <Button variant="destructive" onClick={disableMFA} disabled={working}>
                  <ShieldOff className="h-4 w-4 mr-2" /> Disable MFA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">MFA is currently disabled. Enable it to improve account security.</p>
              <Button onClick={beginSetup} disabled={working}>
                <Shield className="h-4 w-4 mr-2" />
                {working ? "Starting setup..." : "Enable MFA"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Verification</CardTitle>
            <CardDescription>Use your authenticator app to add this account, then enter a 6-digit code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-xs break-all border">{setupData.qrCodeUri}</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => copyToClipboard(setupData.qrCodeUri, "QR URI")}> 
                <Copy className="h-4 w-4 mr-2" /> Copy QR URI
              </Button>
              <Button variant="outline" onClick={() => copyToClipboard(setupData.secret, "Secret")}> 
                <Copy className="h-4 w-4 mr-2" /> Copy Secret
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="max-w-[220px]"
              />
              <Button onClick={verifySetup} disabled={working || verificationCode.length !== 6}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Verify
              </Button>
              <Button variant="ghost" onClick={beginSetup} disabled={working}>
                <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {backupCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backup Codes</CardTitle>
            <CardDescription>Store these in a secure location. Each code can be used once.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {backupCodes.map((code) => (
                <div key={code} className="rounded border bg-muted px-3 py-2 text-center text-sm font-mono">
                  {code}
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => copyToClipboard(backupCodes.join("\n"), "Backup codes")}>
              <Copy className="h-4 w-4 mr-2" /> Copy All Codes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
