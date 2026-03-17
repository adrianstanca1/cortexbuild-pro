"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CiscalculationResult {
  labour: number;
  cisDeduction: number;
  niContribution: number;
  pension: number;
  netPay: number;
  cisRate: number;
  cisRateType: string;
}

export default function CisCalculator() {
  const { toast } = useToast();
  const [baseSalary, setBaseSalary] = useState("");
  const [overtime, setOvertime] = useState("");
  const [cisRate, setCisRate] = useState("20");
  const [niContribution, setNiContribution] = useState("");
  const [pension, setPension] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CiscalculationResult | null>(null);

  const handleCalculate = async () => {
    if (!baseSalary) {
      toast({
        title: "Missing Information",
        description: "Please enter base salary",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: parseFloat(baseSalary),
          overtime: parseFloat(overtime) || 0,
          cisRate: parseInt(cisRate),
          niContribution: parseFloat(niContribution) || undefined,
          pension: parseFloat(pension) || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Calculation result:', data.calculation);
        console.log('Setting result state:', data.calculation);
        setResult(data.calculation);
        // Force a re-render by toggling a state
        setTimeout(() => {
          console.log('Result state after timeout:', data.calculation);
        }, 100);
        toast({
          title: "Calculation Complete",
          description: "CIS deduction calculated successfully",
        });
      } else {
        toast({
          title: "Calculation Failed",
          description: "Failed to calculate CIS deduction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error calculating CIS:", error);
      toast({
        title: "Error",
        description: "Failed to calculate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const resetForm = () => {
    setBaseSalary("");
    setOvertime("");
    setCisRate("20");
    setNiContribution("");
    setPension("");
    setResult(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-7 w-7 text-emerald-600" />
            UK CIS Deduction Calculator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            UK Construction Industry Scheme (CIS) deduction calculator
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">About CIS Deductions</p>
                <p className="text-blue-700 dark:text-blue-200">
                  The Construction Industry Scheme (CIS) requires contractors to deduct money from payments to subcontractors.
                  Standard rate is 20% for registered subcontractors, 30% for unverified, and 0% for gross payment status.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculator Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Enter Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gross">Gross Amount (GBP)</Label>
                <Input
                  id="gross"
                  type="number"
                  placeholder="e.g., 5000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="font-mono"
                  data-testid="gross-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materials">Materials (GBP)</Label>
                <Input
                  id="materials"
                  type="number"
                  placeholder="e.g., 500"
                  value={overtime}
                  onChange={(e) => setOvertime(e.target.value)}
                  className="font-mono"
                  data-testid="materials-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">CIS Rate</Label>
                <select
                  id="rate"
                  value={cisRate}
                  onChange={(e) => setCisRate(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5f46e5] focus:ring-offset-2"
                  data-testid="rate-select"
                >
                  <option value="0">0% - Gross Payment Status</option>
                  <option value="20">20% - Standard Rate (Registered)</option>
                  <option value="30">30% - Higher Rate (Unverified)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Retention (%)</Label>
                <Input
                  id="retention"
                  type="number"
                  placeholder="e.g., 5"
                  value={niContribution}
                  onChange={(e) => setNiContribution(e.target.value)}
                  className="font-mono"
                  data-testid="retention-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pension">Pension (GBP)</Label>
                <Input
                  id="pension"
                  type="number"
                  placeholder="e.g., 250"
                  value={pension}
                  onChange={(e) => setPension(e.target.value)}
                  className="font-mono"
                  data-testid="pension-input"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCalculate} disabled={calculating || !baseSalary} className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                {calculating ? "Calculating..." : "Calculate"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button variant="outline" onClick={() => {
                if (result) {
                  navigator.clipboard.writeText(`Labour: ${formatCurrency(result.labour)}, CIS: ${formatCurrency(result.cisDeduction)}, Net: ${formatCurrency(result.netPay)}`);
                  toast({ title: "Copied", description: "Breakdown copied to clipboard" });
                }
              }}>
                Copy breakdown
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg shadow-emerald-500/10" data-testid="calculation-results">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  Calculation Results
                </CardTitle>
                <Badge className={
                  result.cisRateType === "GROSS" ? "bg-green-500/10 text-green-600" :
                  result.cisRateType === "STANDARD" ? "bg-blue-500/10 text-blue-600" :
                  "bg-red-500/10 text-red-600"
                }>
                  <Percent className="h-3 w-3 mr-1" />
                  {result.cisRate}% - {result.cisRateType}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800" data-testid="result-labour">
                  <p className="text-sm text-muted-foreground mb-1">Labour</p>
                  <p className="text-xl font-bold">{formatCurrency(result.labour)}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">CIS Deduction</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(result.cisDeduction)}</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">NI Contribution</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">-{formatCurrency(result.niContribution)}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Pension</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">-{formatCurrency(result.pension)}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Net payment</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(result.netPay)}</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Detailed Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Base Salary</span>
                    <span className="font-medium">{formatCurrency(result.labour - (result.labour - parseFloat(baseSalary || "0")))}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Overtime</span>
                    <span className="font-medium">{formatCurrency(parseFloat(overtime) || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b bg-slate-50 dark:bg-slate-800">
                    <span className="font-semibold">Total Labour (Gross)</span>
                    <span className="font-bold">{formatCurrency(result.labour)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">CIS @ {result.cisRate}%</span>
                    <span className="font-medium text-red-600">-{formatCurrency(result.cisDeduction)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">National Insurance</span>
                    <span className="font-medium text-orange-600">-{formatCurrency(result.niContribution)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Pension Contribution</span>
                    <span className="font-medium text-purple-600">-{formatCurrency(result.pension)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-lg">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Net Pay</span>
                    <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">{formatCurrency(result.netPay)}</span>
                  </div>
                </div>
              </div>

              {/* Warning for high deductions */}
              {result.cisDeduction > result.labour * 0.25 && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-300">High Deduction Notice</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        The total deductions represent more than 25% of gross labour. Consider reviewing the subcontractor's CIS status.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
