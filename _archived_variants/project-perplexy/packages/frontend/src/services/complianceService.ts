/**
 * Compliance Service
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ComplianceService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  async getComplianceRecords(filters?: any) {
    const response = await axios.get(`${API_URL}/api/v1/compliance`, {
      headers: this.getAuthHeaders(),
      params: filters,
    })
    return response.data
  }

  async createComplianceRecord(data: any) {
    const response = await axios.post(
      `${API_URL}/api/v1/compliance`,
      data,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async monitorCompliance() {
    const response = await axios.post(
      `${API_URL}/api/v1/compliance/monitor`,
      {},
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  async getViolations(regulation?: string) {
    const response = await axios.get(`${API_URL}/api/v1/compliance/violations`, {
      headers: this.getAuthHeaders(),
      params: { regulation },
    })
    return response.data
  }
}

export const complianceService = new ComplianceService()

