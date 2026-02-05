'use client';

import { useState } from 'react';
import { 
  QrCode, 
  Users, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  UserCheck,
  Building2,
  Clock,
  Download,
  RefreshCw,
  HardHat,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useRealtime } from '@/hooks/use-realtime';
import { toast } from 'sonner';

interface AccessLog {
  id: string;
  personName: string;
  company: string | null;
  role: string | null;
  phone: string | null;
  vehicleReg: string | null;
  accessType: 'ENTRY' | 'EXIT';
  accessTime: string;
  inductionCompleted: boolean;
  ppeProvided: boolean;
  briefingGiven: boolean;
  purpose: string | null;
}

interface Props {
  project: { id: string; name: string; location: string | null };
  accessLogs: AccessLog[];
  stats: { entries: number; exits: number; onSite: number };
}

export default function SiteAccessClient({ project, accessLogs: initialLogs, stats: initialStats }: Props) {
  const [accessLogs, setAccessLogs] = useState(initialLogs);
  const [stats, setStats] = useState(initialStats);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  // Real-time updates
  useRealtime((event) => {
    if ((event.type === 'site_entry' || event.type === 'site_exit') && 
        event.payload?.projectId === project.id) {
      refreshData();
    }
  });

  const refreshData = async () => {
    try {
      const res = await fetch(`/api/site-access?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setAccessLogs(data.logs || []);
        setStats(data.stats || stats);
      }
    } catch {
      console.error('Failed to refresh data:', error);
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/site-access/qr-code?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        
        // Generate QR code using a simple API
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.checkInUrl)}`;
        setQrCodeUrl(qrApiUrl);
        toast.success('QR Code generated!');
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch {
      console.error('QR code error:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${project.name.replace(/\s+/g, '-')}-site-checkin-qr.png`;
      link.click();
    }
  };

  const printQRCode = () => {
    if (qrCodeUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Site Check-in QR Code - ${project.name}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 40px;
                }
                .container { max-width: 400px; margin: 0 auto; }
                h1 { color: #1e3a5f; font-size: 24px; }
                h2 { color: #666; font-size: 18px; margin-bottom: 30px; }
                img { max-width: 300px; margin: 20px 0; }
                .instructions { 
                  margin-top: 30px; 
                  padding: 20px; 
                  background: #f5f5f5; 
                  border-radius: 8px;
                  text-align: left;
                }
                .instructions h3 { margin-top: 0; }
                .instructions ol { padding-left: 20px; }
                @media print {
                  body { padding: 20px; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🏗️ ${project.name}</h1>
                <h2>${project.location || 'Construction Site'}</h2>
                <p><strong>Scan to Check In/Out</strong></p>
                <img src="${qrCodeUrl}" alt="QR Code" />
                <div class="instructions">
                  <h3>Instructions:</h3>
                  <ol>
                    <li>Open your phone camera</li>
                    <li>Point at the QR code</li>
                    <li>Tap the notification to open</li>
                    <li>Fill in your details</li>
                    <li>Tap Check In or Check Out</li>
                  </ol>
                </div>
                <p style="margin-top: 30px; color: #999; font-size: 12px;">Powered by CortexBuild Pro</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Site Access Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {project.name} • {project.location || 'No location set'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateQRCode} disabled={loading}>
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR Code
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <ArrowDownToLine className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Entries</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.entries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <ArrowUpFromLine className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Exits</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.exits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currently On Site</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.onSite}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Display */}
      {qrCodeUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Site Check-in QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-semibold">How to use:</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Print or display this QR code at site entrance</li>
                  <li>Workers scan with their phone camera</li>
                  <li>They fill in their details and check in/out</li>
                  <li>All entries are logged automatically</li>
                </ol>
                <div className="flex gap-2 pt-4">
                  <Button onClick={downloadQRCode} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={printQRCode} variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Access Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accessLogs.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No check-ins recorded today</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Generate a QR code and place it at the site entrance
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Safety</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(log.accessTime), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={log.accessType === 'ENTRY' ? 'default' : 'secondary'}>
                          {log.accessType === 'ENTRY' ? (
                            <><ArrowDownToLine className="h-3 w-3 mr-1" /> IN</>
                          ) : (
                            <><ArrowUpFromLine className="h-3 w-3 mr-1" /> OUT</>
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{log.personName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {log.company || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{log.role || 'Visitor'}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {log.inductionCompleted && (
                            <span title="Induction Complete" className="p-1 rounded bg-blue-100 dark:bg-blue-900">
                              <HardHat className="h-3 w-3 text-blue-600" />
                            </span>
                          )}
                          {log.ppeProvided && (
                            <span title="PPE Provided" className="p-1 rounded bg-orange-100 dark:bg-orange-900">
                              <HardHat className="h-3 w-3 text-orange-600" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
