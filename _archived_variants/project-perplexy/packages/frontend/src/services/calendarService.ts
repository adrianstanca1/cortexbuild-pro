import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'deadline' | 'meeting' | 'renewal' | 'milestone'
  tenderId?: string
  contractId?: string
  projectId?: string
  description?: string
  location?: string
  attendees?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateCalendarEventRequest {
  title: string
  date: string
  type: 'deadline' | 'meeting' | 'renewal' | 'milestone'
  tenderId?: string
  contractId?: string
  projectId?: string
  description?: string
  location?: string
  attendees?: string[]
}

export interface UpdateCalendarEventRequest {
  title?: string
  date?: string
  type?: 'deadline' | 'meeting' | 'renewal' | 'milestone'
  description?: string
  location?: string
  attendees?: string[]
}

function parseCalendarEvent(event: any): CalendarEvent {
  return {
    ...event,
    date: new Date(event.date),
    createdAt: new Date(event.createdAt),
    updatedAt: new Date(event.updatedAt),
  }
}

export const calendarService = {
  async getEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    const params: any = {}
    if (startDate) params.startDate = startDate.toISOString()
    if (endDate) params.endDate = endDate.toISOString()
    const response = await axios.get(`${API_URL}/api/calendar`, { params })
    return response.data.events.map(parseCalendarEvent)
  },

  async getEvent(eventId: string): Promise<CalendarEvent> {
    const response = await axios.get(`${API_URL}/api/calendar/${eventId}`)
    return parseCalendarEvent(response.data.event)
  },

  async createEvent(event: CreateCalendarEventRequest): Promise<CalendarEvent> {
    const response = await axios.post(`${API_URL}/api/calendar`, event)
    return parseCalendarEvent(response.data.event)
  },

  async updateEvent(eventId: string, updates: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    const response = await axios.put(`${API_URL}/api/calendar/${eventId}`, updates)
    return parseCalendarEvent(response.data.event)
  },

  async deleteEvent(eventId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/calendar/${eventId}`)
  },

  async getUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
    const response = await axios.get(`${API_URL}/api/calendar/upcoming`, { params: { days } })
    return response.data.events.map(parseCalendarEvent)
  },
}

