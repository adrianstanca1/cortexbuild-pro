/**
 * Field Service
 * Handles field operations API calls with offline support
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface FieldData {
  projectId: string
  type: string
  title: string
  description?: string
  coordinates: { lat: number; lng: number }
  images?: string[]
  data?: any
}

class FieldService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  async createFieldData(data: FieldData) {
    const response = await axios.post(
      `${API_URL}/api/v1/field`,
      data,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async getFieldData(filters?: any) {
    const response = await axios.get(`${API_URL}/api/v1/field`, {
      headers: this.getAuthHeaders(),
      params: filters,
    })
    return response.data
  }

  async syncOfflineData() {
    // Get offline queue and sync
    const queue = await this.getOfflineQueue()
    if (queue.length === 0) return { synced: 0, failed: 0 }

    const response = await axios.post(
      `${API_URL}/api/v1/field/sync`,
      { pendingData: queue },
      { headers: this.getAuthHeaders() }
    )
    return response.data.result
  }

  async getOfflineQueue(): Promise<any[]> {
    // Get from IndexedDB or service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      return new Promise((resolve) => {
        const channel = new MessageChannel()
        channel.port1.onmessage = (event) => {
          resolve(event.data.queue || [])
        }
        registration.active?.postMessage(
          { type: 'GET_QUEUE' },
          [channel.port2]
        )
      })
    }
    return []
  }

  async queueOfflineData(data: FieldData) {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const channel = new MessageChannel()

      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve(true)
          }
        }

        registration.active?.postMessage(
          {
            type: 'QUEUE_REQUEST',
            item: {
              url: `${API_URL}/api/v1/field`,
              method: 'POST',
              headers: this.getAuthHeaders(),
              body: data,
            },
          },
          [channel.port2]
        )
      })
    }
  }

  async sendEmergencyAlert(alert: {
    location?: string
    coordinates: { lat: number; lng: number }
    message?: string
  }) {
    const response = await axios.post(
      `${API_URL}/api/v1/field/emergency/alert`,
      alert,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async getSyncStatus() {
    const response = await axios.get(`${API_URL}/api/v1/field/sync/status`, {
      headers: this.getAuthHeaders(),
    })
    return response.data.status
  }
}

export const fieldService = new FieldService()
