/**
 * Field Operations Page
 * Mobile-first PWA for field workers
 */

import { useState, useEffect } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { fieldService } from '../services/fieldService'
import { MapPin, Camera, Mic, AlertTriangle, CheckCircle, Wifi, WifiOff, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FieldOperationsPage() {
  const { position, getCurrentPosition, isLoading: locationLoading } = useGeolocation({
    enableHighAccuracy: true,
    watch: true,
  })
  const { isOnline, queueLength, isSyncing, triggerSync } = useOfflineSync()
  const [selectedType, setSelectedType] = useState<string>('DAILY_REPORT')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Request location on mount
    getCurrentPosition()
  }, [getCurrentPosition])

  const handleCapturePhoto = () => {
    // Use camera API
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setImages([...images, result])
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleVoiceNote = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        // Convert to text (would use speech-to-text API)
        toast.success('Voice note recorded')
      }

      mediaRecorder.start()
      toast('Recording... Click again to stop', { duration: 5000 })

      // Stop after 30 seconds or on click
      setTimeout(() => {
        mediaRecorder.stop()
        stream.getTracks().forEach((track) => track.stop())
      }, 30000)
    } catch (error) {
      toast.error('Microphone access denied')
    }
  }

  const handleEmergencyAlert = async () => {
    if (!position) {
      toast.error('Location required for emergency alert')
      getCurrentPosition()
      return
    }

    try {
      await fieldService.sendEmergencyAlert({
        location: 'Current location',
        coordinates: {
          lat: position.latitude,
          lng: position.longitude,
        },
        message: 'Emergency assistance required',
      })
      toast.success('Emergency alert sent!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send emergency alert')
    }
  }

  const handleSubmit = async () => {
    if (!position) {
      toast.error('Location required')
      return
    }

    setIsSubmitting(true)
    try {
      const data = {
        projectId: 'current-project', // Would come from context
        type: selectedType,
        title: `${selectedType} - ${new Date().toLocaleString()}`,
        description,
        coordinates: {
          lat: position.latitude,
          lng: position.longitude,
        },
        images,
        data: {
          timestamp: new Date().toISOString(),
          location: {
            lat: position.latitude,
            lng: position.longitude,
            accuracy: position.accuracy,
          },
        },
      }

      if (isOnline) {
        await fieldService.createFieldData(data)
        toast.success('Field data submitted')
        setDescription('')
        setImages([])
      } else {
        // Queue for offline sync
        await fieldService.queueOfflineData(data)
        toast.success('Queued for offline sync')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 p-2 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
          {queueLength > 0 && (
            <span className="text-xs bg-yellow-500 px-2 py-1 rounded">
              {queueLength} pending
            </span>
          )}
        </div>
        {!isOnline && queueLength > 0 && (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-3 py-1 bg-primary-600 rounded text-sm"
          >
            <Upload className="w-4 h-4" />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>
        )}
      </div>

      {/* Location Status */}
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-primary-400" />
          <span className="font-semibold">Location</span>
        </div>
        {position ? (
          <div className="text-sm text-gray-300">
            <div>Lat: {position.latitude.toFixed(6)}</div>
            <div>Lng: {position.longitude.toFixed(6)}</div>
            {position.accuracy && (
              <div className="text-xs text-gray-400">
                Accuracy: ±{Math.round(position.accuracy)}m
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            {locationLoading ? 'Getting location...' : 'Location unavailable'}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleCapturePhoto}
          className="flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          <Camera className="w-6 h-6 text-primary-400" />
          <span className="text-sm">Photo</span>
        </button>
        <button
          onClick={handleVoiceNote}
          className="flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          <Mic className="w-6 h-6 text-primary-400" />
          <span className="text-sm">Voice Note</span>
        </button>
        <button
          onClick={handleEmergencyAlert}
          className="flex flex-col items-center gap-2 p-4 bg-red-600 rounded-lg hover:bg-red-700 col-span-2"
        >
          <AlertTriangle className="w-6 h-6" />
          <span className="text-sm font-semibold">Emergency Alert</span>
        </button>
      </div>

      {/* Field Data Form */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Field Report</h2>
        
        <div className="mb-4">
          <label className="block text-sm mb-2">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          >
            <option value="DAILY_REPORT">Daily Report</option>
            <option value="INSPECTION">Inspection</option>
            <option value="SAFETY_INCIDENT">Safety Incident</option>
            <option value="EQUIPMENT_STATUS">Equipment Status</option>
            <option value="MATERIAL_TRACKING">Material Tracking</option>
            <option value="MEASUREMENT">Measurement</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description..."
            className="w-full p-2 bg-gray-700 rounded text-white min-h-[100px]"
          />
        </div>

        {images.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm mb-2">Photos ({images.length})</label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !position}
          className="w-full py-3 bg-primary-600 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Submit Report
            </>
          )}
        </button>
      </div>
    </div>
  )
}
