import { v4 as uuidv4 } from 'uuid'
import { CalendarEvent, CreateCalendarEventRequest, UpdateCalendarEventRequest } from '../types/calendar.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const events: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Tender Deadline - Manchester Development',
    date: new Date('2025-11-15'),
    type: 'deadline',
    tenderId: 'TND-2025-001',
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-09-01'),
  },
  {
    id: 'event-2',
    title: 'Client Meeting - TfL Project',
    date: new Date('2025-10-20'),
    type: 'meeting',
    tenderId: 'TND-2025-002',
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-15'),
  },
  {
    id: 'event-3',
    title: 'Contract Renewal - Steel Supply',
    date: new Date('2025-11-01'),
    type: 'renewal',
    contractId: 'CNT-2025-A01',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
  },
]

export const calendarService = {
  async getEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let filteredEvents = events
    if (startDate && endDate) {
      filteredEvents = events.filter(
        (e) => e.date >= startDate && e.date <= endDate
      )
    }
    return filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
  },

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return events.find((e) => e.id === eventId) || null
  },

  async createEvent(event: CreateCalendarEventRequest): Promise<CalendarEvent> {
    if (!event.title || !event.date || !event.type) {
      throw new ApiError('Missing required fields', 400)
    }

    const newEvent: CalendarEvent = {
      id: uuidv4(),
      title: event.title,
      date: new Date(event.date),
      type: event.type,
      tenderId: event.tenderId,
      contractId: event.contractId,
      projectId: event.projectId,
      description: event.description,
      location: event.location,
      attendees: event.attendees || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    events.push(newEvent)
    return newEvent
  },

  async updateEvent(eventId: string, updates: UpdateCalendarEventRequest): Promise<CalendarEvent> {
    const event = events.find((e) => e.id === eventId)
    if (!event) {
      throw new ApiError('Event not found', 404)
    }

    if (updates.title) event.title = updates.title
    if (updates.date) event.date = new Date(updates.date)
    if (updates.type) event.type = updates.type
    if (updates.description) event.description = updates.description
    if (updates.location) event.location = updates.location
    if (updates.attendees) event.attendees = updates.attendees

    event.updatedAt = new Date()
    return event
  },

  async deleteEvent(eventId: string): Promise<void> {
    const index = events.findIndex((e) => e.id === eventId)
    if (index === -1) {
      throw new ApiError('Event not found', 404)
    }
    events.splice(index, 1)
  },

  async getUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    return events
      .filter((e) => e.date >= today && e.date <= futureDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  },
}

