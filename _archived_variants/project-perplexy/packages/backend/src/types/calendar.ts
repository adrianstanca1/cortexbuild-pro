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

