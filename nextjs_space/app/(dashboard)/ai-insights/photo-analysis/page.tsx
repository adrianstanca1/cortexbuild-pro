'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


import { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Shield, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  ImageIcon,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type AnalysisType = 'general' | 'safety' | 'progress' | 'quality';

const analysisTypes: { id: AnalysisType; name: string; icon: React.ElementType; description: string; color: string }[] = [
  { id: 'general', name: 'General Analysis', icon: Sparkles, description: 'Comprehensive site overview', color: 'blue' },
  { id: 'safety', name: 'Safety Inspection', icon: Shield, description: 'CDM 2015 compliance & hazards', color: 'red' },
  { id: 'progress', name: 'Progress Tracking', icon: TrendingUp, description: 'Work stage & completion', color: 'green' },
  { id: 'quality', name: 'Quality Control', icon: CheckCircle2, description: 'Workmanship & defects', color: 'purple' }
];

const getRiskBadge = (level: string | null) => {
  if (!level) return null;
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className: string }> = {
    'CRITICAL': { variant: 'destructive', icon: AlertCircle, className: 'bg-red-600' },
    'HIGH': { variant: 'destructive', icon: AlertTriangle, className: 'bg-orange-600' },
    'MEDIUM': { variant: 'default', icon: AlertTriangle, className: 'bg-yellow-600' },
    'LOW': { variant: 'secondary', icon: Info, className: 'bg-green-600 text-white' }
  };
  const conf = config[level] || config['LOW'];
  const Icon = conf.icon;
  return (
    <Badge className={`${conf.className} text-white gap-1`}>
      <Icon className="h-3 w-3" />
      {level} RISK
    </Badge>
  );
};

export default function PhotoAnalysisPage() {
  const [selectedType, setSelectedType] = useState<AnalysisType>('general');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysis(null);
      setRiskLevel(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysis(null);
      setRiskLevel(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('analysisType', selectedType);

      const res = await fetch('/api/ai/photo-analysis', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (res.ok) {
        setAnalysis(data.analysis);
        setRiskLevel(data.riskLevel);
        toast.success('Analysis complete!');
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setRiskLevel(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadAnalysis = () => {
    if (!analysis) return;
    const blob = new Blob([analysis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-analysis-${selectedType}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          AI Photo Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload site photos for instant AI-powered analysis
        </p>
      </div>

      {/* Analysis Type Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Select Analysis Type</CardTitle>
          <CardDescription>Choose the type of analysis for your photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-medium text-sm">{type.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">Drag & drop or click to upload</p>
                <p className="text-sm text-muted-foreground/70">Supports JPG, PNG, WebP (max 10MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black/5">
                  <img
                    src={imagePreview}
                    alt="Site photo"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeImage}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Analyze Photo</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Analysis Results
              </span>
              {riskLevel && getRiskBadge(riskLevel)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
                </div>
                <p className="mt-4 text-muted-foreground">AI is analyzing your photo...</p>
                <p className="text-sm text-muted-foreground/70">This may take a few moments</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none max-h-[400px] overflow-y-auto pr-2">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={downloadAnalysis} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Upload a photo to see AI analysis</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Select analysis type and upload a site photo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 h-fit">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Tips for Best Results</h3>
              <ul className="text-sm text-blue-800/80 dark:text-blue-200/80 space-y-1">
                <li>• Take clear, well-lit photos showing the area of interest</li>
                <li>• Include context - wider shots help the AI understand the situation</li>
                <li>• For safety analysis, capture visible PPE, signage, and hazards</li>
                <li>• For progress tracking, take consistent angles for comparison</li>
                <li>• Multiple photos can be analyzed separately for comprehensive coverage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
