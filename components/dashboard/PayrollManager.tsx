"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, DollarSign, Plus, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PayrollItem } from "@/types/business";

interface Employee {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
}

export function PayrollManager() {
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [baseSalary, setBaseSalary] = useState("");
  const [overtime, setOvertime] = useState("");
  const [cisRate, setCisRate] = useState(20);
  const [niContribution, setNiContribution] = useState("");
  const [pension, setPension] = useState("");
  const { toast } = useToast();

  // Mock employees - replace with actual data from project-service
  const employees: Employee[] = [
    { id: "emp-1", name: "Sarah Johnson", role: "Site Supervisor", baseSalary: 3750 },
    { id: "emp-2", name: "Mike Thompson", role: "Quantity Surveyor", baseSalary: 4333 },
    { id: "emp-3", name: "Emma Davis", role: "Safety Officer", baseSalary: 3167 },
  ];

  const calculateCIS = (labour: number, rate: number) => {
    return Math.round(labour * (rate / 100) * 100) / 100;
  };

  const calculateNetPay = (
    baseSalary: number,
    overtime: number,
    cisDeduction: number,
    niContribution: number,
    pension: number
  ) => {
    return Math.round((baseSalary + overtime - cisDeduction - niContribution - pension) * 100) / 100;
  };

  const handleAddPayroll = () => {
    if (!selectedEmployee || !baseSalary) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and enter base salary",
        variant: "destructive",
      });
      return;
    }

    const base = parseFloat(baseSalary);
    const ot = parseFloat(overtime) || 0;
    const ni = parseFloat(niContribution) || 0;
    const pen = parseFloat(pension) || 0;
    const labour = base + ot; // Labour includes base + overtime
    const cis = calculateCIS(labour, cisRate);
    const net = calculateNetPay(base, ot, cis, ni, pen);

    const employee = employees.find(e => e.id === selectedEmployee);

    const newItem: PayrollItem = {
      id: Date.now().toString(),
      employee_id: selectedEmployee,
      period,
      base_salary: base,
      overtime: ot,
      cis_deduction: cis,
      ni_contribution: ni,
      pension: pen,
      net_pay: net,
      status: "draft",
      created_at: new Date().toISOString(),
    };

    setPayrollItems(prev => [newItem, ...prev]);
    toast({
      title: "Payroll Added",
      description: `Payroll entry created for ${employee?.name}`,
    });

    // Reset form
    setBaseSalary("");
    setOvertime("");
    setNiContribution("");
    setPension("");
  };

  const handleDelete = (id: string) => {
    setPayrollItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Deleted",
      description: "Payroll entry has been removed",
    });
  };

  const handleProcess = (id: string) => {
    setPayrollItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: "processed" as const } : item
    ));
    toast({
      title: "Processed",
      description: "Payroll entry marked as processed",
    });
  };

  const handlePay = (id: string) => {
    setPayrollItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: "paid" as const } : item
    ));
    toast({
      title: "Marked as Paid",
      description: "Payroll entry marked as paid",
    });
  };

  const stats = useMemo(() => {
    const totalEmployees = payrollItems.length;
    const totalGross = payrollItems.reduce((sum, item) => sum + item.base_salary + item.overtime, 0);
    const totalCIS = payrollItems.reduce((sum, item) => sum + item.cis_deduction, 0);
    const totalNet = payrollItems.reduce((sum, item) => sum + item.net_pay, 0);
    const draft = payrollItems.filter(i => i.status === "draft").length;
    const processed = payrollItems.filter(i => i.status === "processed").length;
    const paid = payrollItems.filter(i => i.status === "paid").length;

    return { totalEmployees, totalGross, totalCIS, totalNet, draft, processed, paid };
  }, [payrollItems]);

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "processed": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "draft": return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
        <p className="text-muted-foreground">Manage employee payroll with CIS deductions</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Entries</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="text-2xl font-bold text-blue-500">{stats.processed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-green-500">{stats.paid}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Gross</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalGross)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">CIS Deducted</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(stats.totalCIS)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Net Total</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalNet)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Payroll Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Payroll Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="baseSalary">Base Salary (£)</Label>
              <Input
                id="baseSalary"
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="overtime">Overtime (£)</Label>
              <Input
                id="overtime"
                type="number"
                value={overtime}
                onChange={(e) => setOvertime(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="cisRate">CIS Rate (%)</Label>
              <Select value={cisRate.toString()} onValueChange={(v) => setCisRate(parseInt(v))}>
                <SelectTrigger id="cisRate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20% (Registered)</SelectItem>
                  <SelectItem value="30">30% (Unverified)</SelectItem>
                  <SelectItem value="0">0% (Gross)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ni">NI Contribution (£)</Label>
              <Input
                id="ni"
                type="number"
                value={niContribution}
                onChange={(e) => setNiContribution(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="pension">Pension (£)</Label>
              <Input
                id="pension"
                type="number"
                value={pension}
                onChange={(e) => setPension(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Preview Calculation */}
          {baseSalary && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Preview Calculation</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Base</p>
                  <p className="font-medium">{formatCurrency(parseFloat(baseSalary) || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Overtime</p>
                  <p className="font-medium">{formatCurrency(parseFloat(overtime) || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Labour</p>
                  <p className="font-medium">{formatCurrency((parseFloat(baseSalary) || 0) + (parseFloat(overtime) || 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CIS @{cisRate}%</p>
                  <p className="font-medium text-red-500">-{formatCurrency(calculateCIS((parseFloat(baseSalary) || 0) + (parseFloat(overtime) || 0), cisRate))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Deductions</p>
                  <p className="font-medium text-red-500">-{formatCurrency((parseFloat(niContribution) || 0) + (parseFloat(pension) || 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Pay</p>
                  <p className="font-bold text-green-600">{formatCurrency(calculateNetPay(parseFloat(baseSalary) || 0, parseFloat(overtime) || 0, calculateCIS((parseFloat(baseSalary) || 0) + (parseFloat(overtime) || 0), cisRate), parseFloat(niContribution) || 0, parseFloat(pension) || 0))}</p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleAddPayroll} disabled={!selectedEmployee || !baseSalary}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payroll Entry
          </Button>
        </CardContent>
      </Card>

      {/* Payroll List */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll entries yet. Create your first entry above.
            </div>
          ) : (
            <div className="space-y-4">
              {payrollItems.map((item) => {
                const employee = employees.find(e => e.id === item.employee_id);
                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{employee?.name || "Unknown Employee"}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Period: {item.period}</span>
                          <span>{employee?.role || ""}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Base</p>
                          <p className="font-medium">{formatCurrency(item.base_salary)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Overtime</p>
                          <p className="font-medium">{formatCurrency(item.overtime)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">CIS</p>
                          <p className="font-medium text-red-500">-{formatCurrency(item.cis_deduction)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Deductions</p>
                          <p className="font-medium text-red-500">-{formatCurrency(item.ni_contribution + item.pension)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Net Pay</p>
                          <p className="font-bold text-green-600">{formatCurrency(item.net_pay)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcess(item.id)}
                            >
                              Process
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {item.status === "processed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePay(item.id)}
                            className="text-green-600"
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PayrollManager;
