"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
 BarChart3,
 TrendingUp,
 Activity,
 CheckCircle2,
 XCircle,
 RefreshCw,
 Zap,
 Server
} from "lucide-react";
import { Card, CardContent, CardTitle, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface ServiceBreakdown {
 serviceName: string;
 name: string;
 status: string;
 requestCount: number;
 successCount: number;
 errorCount: number;
 avgLatency: number;
 successRate: number;
}

interface TimelineEntry {
 timestamp: string;
 requests: number;
 success: number;
 errors: number;
 avgLatency: number;
}

export function UsageAnalytics() {
 const [period, setPeriod] = useState("24h");
 const [loading, setLoading] = useState(true);
 const [summary, setSummary] = useState({
  totalRequests: 0,
  totalSuccess: 0,
  totalErrors: 0,
  avgLatency: 0,
  successRate: 100
 });
 const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
 const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

 const fetchAnalytics = useCallback(async () => {
  setLoading(true);
  try {
   const res = await fetch(`/api/admin/api-connections/analytics?period=${period}`);
   if (res.ok) {
    const data = await res.json();
    setSummary(data.summary || {});
    setServiceBreakdown(data.serviceBreakdown || []);
    setTimeline(data.timeline || []);
   }
  } catch {
   console.error("Error fetching analytics:", error);
   toast.error("Failed to fetch analytics");
  } finally {
   setLoading(false);
  }
 }, [period]);

 useEffect(() => {
  fetchAnalytics();
 }, [fetchAnalytics]);

 const getSuccessRateColor = (rate: number) => {
  if (rate >= 99) return "text-green-600";
  if (rate >= 95) return "text-yellow-600";
  return "text-red-600";
 };

 const maxRequests = Math.max(...timeline.map(t => t.requests), 1);

 if (loading) {
  return (
   <div className="flex items-center justify-center h-64">
    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {/* Period Selector & Refresh */}
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
     <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className="w-[140px]">
       <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="24h">Last 24 Hours</SelectItem>
       <SelectItem value="7d">Last 7 Days</SelectItem>
       <SelectItem value="30d">Last 30 Days</SelectItem>
      </SelectContent>
     </Select>
    </div>
    <Button variant="outline" size="icon" onClick={fetchAnalytics}>
     <RefreshCw className="h-4 w-4" />
    </Button>
   </div>

   {/* Summary Stats */}
   <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    <Card>
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-blue-100 rounded-lg">
        <Activity className="h-5 w-5 text-blue-600" />
       </div>
       <div>
        <p className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Total Requests</p>
       </div>
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-green-100 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
       </div>
       <div>
        <p className="text-2xl font-bold text-green-600">{summary.totalSuccess.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Successful</p>
       </div>
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-red-100 rounded-lg">
        <XCircle className="h-5 w-5 text-red-600" />
       </div>
       <div>
        <p className="text-2xl font-bold text-red-600">{summary.totalErrors.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Errors</p>
       </div>
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-purple-100 rounded-lg">
        <Zap className="h-5 w-5 text-purple-600" />
       </div>
       <div>
        <p className="text-2xl font-bold">{summary.avgLatency}ms</p>
        <p className="text-xs text-muted-foreground">Avg Latency</p>
       </div>
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="p-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-emerald-100 rounded-lg">
        <TrendingUp className="h-5 w-5 text-emerald-600" />
       </div>
       <div>
        <p className={`text-2xl font-bold ${getSuccessRateColor(summary.successRate)}`}>
         {summary.successRate}%
        </p>
        <p className="text-xs text-muted-foreground">Success Rate</p>
       </div>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Request Timeline Chart */}
   {timeline.length > 0 && (
    <Card>
     <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
       <BarChart3 className="h-4 w-4" />
       Request Timeline
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className="flex items-end gap-1 h-32">
       {timeline.map((entry, idx) => (
        <div
         key={idx}
         className="flex-1 flex flex-col items-center justify-end group relative"
        >
         <div
          className="w-full bg-primary/80 rounded-t transition-all group-hover:bg-primary"
          style={{ height: `${(entry.requests / maxRequests) * 100}%`, minHeight: entry.requests > 0 ? '4px' : '0' }}
         />
         {/* Tooltip */}
         <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
           <p>{entry.requests} requests</p>
           <p>{entry.errors} errors</p>
           <p>{entry.avgLatency}ms avg</p>
          </div>
         </div>
        </div>
       ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
       <span>{timeline[0] && format(new Date(timeline[0].timestamp), "MMM d, HH:mm")}</span>
       <span>{timeline[timeline.length - 1] && format(new Date(timeline[timeline.length - 1].timestamp), "MMM d, HH:mm")}</span>
      </div>
     </CardContent>
    </Card>
   )}

   {/* Service Breakdown */}
   <Card>
    <CardHeader>
     <CardTitle className="text-base flex items-center gap-2">
      <Server className="h-4 w-4" />
      Service Breakdown
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className="space-y-4">
      {serviceBreakdown.map((service) => (
       <motion.div
        key={service.serviceName}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 border rounded-lg"
       >
        <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
          <span className="font-medium">{service.name}</span>
          <Badge variant="outline" className="text-[10px]">
           {service.serviceName}
          </Badge>
         </div>
         <Badge className={service.successRate >= 99 ? "bg-green-100 text-green-800" : service.successRate >= 95 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
          {service.successRate}% success
         </Badge>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
         <div>
          <p className="text-muted-foreground text-xs">Requests</p>
          <p className="font-semibold">{service.requestCount.toLocaleString()}</p>
         </div>
         <div>
          <p className="text-muted-foreground text-xs">Success</p>
          <p className="font-semibold text-green-600">{service.successCount.toLocaleString()}</p>
         </div>
         <div>
          <p className="text-muted-foreground text-xs">Errors</p>
          <p className="font-semibold text-red-600">{service.errorCount.toLocaleString()}</p>
         </div>
         <div>
          <p className="text-muted-foreground text-xs">Avg Latency</p>
          <p className="font-semibold">{service.avgLatency}ms</p>
         </div>
        </div>
        <Progress
         value={service.successRate}
         className="h-1.5 mt-3"
        />
       </motion.div>
      ))}
     </div>

     {serviceBreakdown.length === 0 && (
      <div className="text-center py-8 text-muted-foreground">
       <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
       <p>No usage data available</p>
       <p className="text-sm">API requests will be tracked automatically</p>
      </div>
     )}
    </CardContent>
   </Card>
  </div>
 );
}
