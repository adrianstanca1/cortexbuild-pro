"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Cloud, Trash2, Save, Loader2, AlertCircle, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
}

interface EquipmentItem {
  name: string;
  hours: number;
}

interface Daywork {
  id: string;
  date: string;
  project_id: string;
  project: { id: string; name: string };
  weather: string;
  crew_size: string;
  work_description: string;
  materials: MaterialItem[];
  equipment: EquipmentItem[];
  createdAt: string;
}

const weatherOptions = [
  'Sunny',
  'Partly Cloudy',
  'Cloudy',
  'Overcast',
  'Light Rain',
  'Heavy Rain',
  'Drizzle',
  'Snow',
  'Windy',
  'Foggy',
];

interface DayworkManagerProps {
  projects?: Array<{ id: string; name: string }>;
}

export function DayworkManager({ projects }: DayworkManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dayworks, setDayworks] = useState<Daywork[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProject, setSelectedProject] = useState('');
  const [weather, setWeather] = useState('');
  const [crewSize, setCrewSize] = useState('');
  const [progressPercentage, setProgressPercentage] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);

  // New material state
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');

  // New equipment state
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentHours, setNewEquipmentHours] = useState('');

  // Fetch existing dayworks
  useEffect(() => {
    const fetchDayworks = async () => {
      if (!projects?.length) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/dayworks?projectId=${projects[0].id}&page=1&pageSize=10`);
        if (res.ok) {
          const data = await res.json();
          setDayworks(data.dayworks || []);
        }
      } catch (error) {
        console.error('Failed to fetch dayworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDayworks();
  }, [projects]);

  const addMaterial = () => {
    if (newMaterialName && newMaterialQuantity && newMaterialUnit) {
      setMaterials([
        ...materials,
        {
          name: newMaterialName,
          quantity: parseFloat(newMaterialQuantity),
          unit: newMaterialUnit,
        },
      ]);
      setNewMaterialName('');
      setNewMaterialQuantity('');
      setNewMaterialUnit('');
    }
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const addEquipment = () => {
    if (newEquipmentName && newEquipmentHours) {
      setEquipment([
        ...equipment,
        {
          name: newEquipmentName,
          hours: parseFloat(newEquipmentHours),
        },
      ]);
      setNewEquipmentName('');
      setNewEquipmentHours('');
    }
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!workDescription.trim().length || !selectedProject) {
      toast({
        title: "Missing Information",
        description: "Please select a project and enter work description",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/dayworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          project_id: selectedProject,
          weather: weather.toLowerCase(),
          crew_size: crewSize ? parseInt(crewSize) : 0,
          work_description: workDescription.trim(),
          progress_percentage: progressPercentage ? parseFloat(progressPercentage) : null,
          materials: materials.map(m => ({
            name: m.name,
            quantity: m.quantity,
            unit: m.unit,
          })),
          equipment: equipment.map(e => ({
            name: e.name,
            hours: e.hours,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDayworks([data.daywork, ...dayworks]);
        toast({
          title: "Success",
          description: "Daily report saved successfully",
        });

        // Reset form
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedProject('');
        setWeather('');
        setCrewSize('');
        setProgressPercentage('');
        setWorkDescription('');
        setMaterials([]);
        setEquipment([]);
      } else {
        const error = await response.json();
        toast({
          title: "Save Failed",
          description: error.message || "Failed to save daily report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving daywork:', error);
      toast({
        title: "Error",
        description: "Failed to save daily report",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this daily report?')) return;

    try {
      const res = await fetch(`/api/dayworks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDayworks(dayworks.filter(d => d.id !== id));
        toast({ title: "Deleted", description: "Daily report deleted" });
      } else {
        toast({ title: "Delete Failed", description: "Failed to delete", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const projectId = selectedProject || (projects?.length ? projects[0].id : '');
      const url = projectId
        ? `/api/dayworks/export?format=csv&projectId=${projectId}`
        : '/api/dayworks/export?format=csv';

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `dayworks-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast({ title: "Export Complete", description: "Dayworks report downloaded" });
      } else {
        toast({ title: "Export Failed", description: "Failed to export dayworks", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const url = '/api/dayworks/export?format=pdf';
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `dayworks-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        toast({ title: "Export Complete", description: "Dayworks report downloaded. Open in browser and print to PDF." });
      } else {
        toast({ title: "Export Failed", description: "Failed to export dayworks", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const isFormValid = workDescription.trim().length > 0 && selectedProject;

  return (
    <div className="space-y-6">
      {/* Create Form Card */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Daily Work Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger id="project" data-testid="project-select">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects && projects.length > 0 ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} data-testid={`project-${project.id}`}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="sample" data-testid="project-sample">Sample Project</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weather, Crew Size, Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weather" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather
              </Label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger id="weather" data-testid="weather-select">
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  {weatherOptions.map((option) => (
                    <SelectItem key={option} value={option} data-testid={`weather-${option.toLowerCase().replace(' ', '-')}`}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crewSize" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Crew Size
              </Label>
              <Input
                id="crewSize"
                type="number"
                placeholder="Number of workers"
                value={crewSize}
                onChange={(e) => setCrewSize(e.target.value)}
                data-testid="crew-size-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">Progress %</Label>
              <Input
                id="progress"
                type="number"
                placeholder="0-100"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(e.target.value)}
              />
            </div>
          </div>

          {/* Work Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Work Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the work completed today..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="min-h-[120px]"
              data-testid="description-textarea"
            />
          </div>

          {/* Materials Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Materials Used</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                id="materialName"
                placeholder="Material name"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
              />
              <Input
                id="materialQuantity"
                type="number"
                placeholder="Quantity"
                value={newMaterialQuantity}
                onChange={(e) => setNewMaterialQuantity(e.target.value)}
              />
              <Input
                id="materialUnit"
                placeholder="Unit (kg, m, etc.)"
                value={newMaterialUnit}
                onChange={(e) => setNewMaterialUnit(e.target.value)}
              />
              <Button id="addMaterialBtn" onClick={addMaterial} variant="outline" size="icon" aria-label="Add Material" data-testid="add-material-button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {materials.map((material, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {material.name}: {material.quantity} {material.unit}
                    <Button
                      id={`removeMaterial-${index}`}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeMaterial(index)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Equipment Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Equipment Used</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                id="equipmentName"
                placeholder="Equipment name"
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(e.target.value)}
              />
              <Input
                id="equipmentHours"
                type="number"
                step="0.5"
                placeholder="Hours"
                value={newEquipmentHours}
                onChange={(e) => setNewEquipmentHours(e.target.value)}
              />
              <Button id="addEquipmentBtn" onClick={addEquipment} variant="outline" size="icon" aria-label="Add Equipment" data-testid="add-equipment-button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {equipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {equipment.map((equip, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {equip.name}: {equip.hours}h
                    <Button
                      id={`removeEquipment-${index}`}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeEquipment(index)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!isFormValid || saving}
            className="w-full"
            size="lg"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Daily Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Dayworks List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Daily Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 mx-auto animate-spin" />
              <p className="mt-2">Loading daily reports...</p>
            </div>
          ) : dayworks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto opacity-50" />
              <p className="mt-4">No daily reports yet. Create your first report above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayworks.map((daywork) => (
                <div
                  key={daywork.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{daywork.weather}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(daywork.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-medium">{daywork.project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {daywork.work_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Crew: {daywork.crew_size || 'N/A'}
                        </span>
                        <span>Materials: {daywork.materials.length}</span>
                        <span>Equipment: {daywork.equipment.length}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(daywork.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
