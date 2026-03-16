"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/nextjs_space/components/ui/card';
import { Button } from '@/nextjs_space/components/ui/button';
import { Input } from '@/nextjs_space/components/ui/input';
import { Label } from '@/nextjs_space/components/ui/label';
import { Textarea } from '@/nextjs_space/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/nextjs_space/components/ui/select';
import { Badge } from '@/nextjs_space/components/ui/badge';
import { Plus, Calendar, Users, Cloud, Trash2 } from 'lucide-react';
import type { Daywork, MaterialItem, EquipmentItem } from '@/types/business';

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
  onSave?: (daywork: Partial<Daywork>) => void;
  projects?: Array<{ id: string; name: string }>;
}

export function DayworkManager({ onSave, projects }: DayworkManagerProps) {
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

  const handleSave = () => {
    const daywork: Partial<Daywork> = {
      date: selectedDate,
      project_id: selectedProject,
      weather,
      crew_size: crewSize,
      work_description: workDescription,
      progress_percentage: progressPercentage,
      materials,
      equipment,
    };

    if (onSave) {
      onSave(daywork);
    }

    // Reset form
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedProject('');
    setWeather('');
    setCrewSize('');
    setProgressPercentage('');
    setWorkDescription('');
    setMaterials([]);
    setEquipment([]);
  };

  const isFormValid = workDescription.trim().length > 0 && selectedProject;

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Work Report
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
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects && projects.length > 0 ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="sample">Sample Project</SelectItem>
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
                <SelectTrigger id="weather">
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  {weatherOptions.map((option) => (
                    <SelectItem key={option} value={option}>
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
            />
          </div>

          {/* Materials Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Materials Used</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input
                placeholder="Material name"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Quantity"
                value={newMaterialQuantity}
                onChange={(e) => setNewMaterialQuantity(e.target.value)}
              />
              <Input
                placeholder="Unit (kg, m, etc.)"
                value={newMaterialUnit}
                onChange={(e) => setNewMaterialUnit(e.target.value)}
              />
              <Button onClick={addMaterial} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {materials.map((material, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {material.name}: {material.quantity} {material.unit}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeMaterial(index)}
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
                placeholder="Equipment name"
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(e.target.value)}
              />
              <Input
                type="number"
                step="0.5"
                placeholder="Hours"
                value={newEquipmentHours}
                onChange={(e) => setNewEquipmentHours(e.target.value)}
              />
              <Button onClick={addEquipment} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {equipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {equipment.map((equip, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {equip.name}: {equip.hours}h
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeEquipment(index)}
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
            disabled={!isFormValid}
            className="w-full"
            size="lg"
          >
            Save Daily Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
