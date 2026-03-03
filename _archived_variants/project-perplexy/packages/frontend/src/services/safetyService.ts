/**
 * Safety Service
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class SafetyService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async getIncidents(filters?: any) {
    const response = await axios.get(`${API_URL}/api/v1/safety`, {
      headers: this.getAuthHeaders(),
      params: filters,
    })
    return response.data
  }

  async createIncident(data: any) {
    const response = await axios.post(
      `${API_URL}/api/v1/safety`,
      data,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async analyzeIncident(id: string) {
    const response = await axios.post(
      `${API_URL}/api/v1/safety/${id}/analyze`,
      {},
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async predictRisks() {
    const response = await axios.post(
      `${API_URL}/api/v1/safety/predict-risks`,
      {},
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }
}

export const safetyService = new SafetyService()

