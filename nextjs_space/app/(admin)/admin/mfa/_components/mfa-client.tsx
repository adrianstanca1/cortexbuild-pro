"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";

export function MFAClient() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Factor Authentication</h1>
          <p className="text-gray-500 mt-2">Manage MFA settings and backup codes</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MFA Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">MFA management interface coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
