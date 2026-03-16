"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CISCalculator() {
  const [gross, setGross] = useState<number>(0);
  const [materials, setMaterials] = useState<number>(0);
  const [rate, setRate] = useState<number>(20); // 20% or 30%
  const [retention, setRetention] = useState<number>(0);
  const { toast } = useToast();

  const result = useMemo(() => {
    const labour = Math.max(0, gross - materials);
    const cisDeduction = round2(labour * (rate / 100));
    const retentionAmt = round2(gross * (retention / 100));
    const netPaid = round2(gross - cisDeduction - retentionAmt);
    return { labour, cisDeduction, retentionAmt, netPaid };
  }, [gross, materials, rate, retention]);

  function copyBreakdown() {
    const text = [
      `Gross: ${formatCurrency(gross)}`,
      `Materials: ${formatCurrency(materials)}`,
      `Labour: ${formatCurrency(result.labour)}`,
      `CIS @ ${rate}%: -${formatCurrency(result.cisDeduction)}`,
      `Retention @ ${retention}%: -${formatCurrency(result.retentionAmt)}`,
      `Net payment: ${formatCurrency(result.netPaid)}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "CIS breakdown copied to clipboard." });
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>UK CIS Deduction Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="grid gap-2">
            <Label htmlFor="gross">Gross amount (£)</Label>
            <Input
              id="gross"
              type="number"
              step="0.01"
              value={gross}
              onChange={(e) => setGross(parseFloat(e.target.value || "0"))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="materials">Materials (£)</Label>
            <Input
              id="materials"
              type="number"
              step="0.01"
              value={materials}
              onChange={(e) => setMaterials(parseFloat(e.target.value || "0"))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rate">CIS rate</Label>
            <select
              id="rate"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={rate}
              onChange={(e) => setRate(parseInt(e.target.value, 10))}
            >
              <option value={20}>20% (Registered)</option>
              <option value={30}>30% (Unverified)</option>
              <option value={0}>0% (Gross)</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="retention">Retention (%)</Label>
            <Input
              id="retention"
              type="number"
              step="0.1"
              value={retention}
              onChange={(e) => setRetention(parseFloat(e.target.value || "0"))}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <SummaryItem label="Labour" value={formatCurrency(result.labour)} />
          <SummaryItem label={`CIS @ ${rate}%`} value={`-${formatCurrency(result.cisDeduction)}`} />
          <SummaryItem label={`Retention @ ${retention}%`} value={`-${formatCurrency(result.retentionAmt)}`} />
          <SummaryItem label="Net payment" value={formatCurrency(result.netPaid)} />
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={copyBreakdown}>
            <Copy className="h-4 w-4 mr-2" />
            Copy breakdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-md p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function formatCurrency(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
