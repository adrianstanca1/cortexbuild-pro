import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { calendarService, CalendarEvent, CreateCalendarEventRequest, UpdateCalendarEventRequest } from '../services/calendarService'
import toast from 'react-hot-toast'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const data = await calendarService.getUpcomingEvents(365)
      setEvents(data)
    } catch (error) {
      toast.error('Failed to load events')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await calendarService.deleteEvent(eventId)
      toast.success('Event deleted successfully')
      loadEvents()
    } catch (error) {
      toast.error('Failed to delete event')
      console.error(error)
    }
  }

  const handleSubmit = async (formData: CreateCalendarEventRequest | UpdateCalendarEventRequest) => {
    try {
      if (selectedEvent) {
        await calendarService.updateEvent(selectedEvent.id, formData as UpdateCalendarEventRequest)
        toast.success('Event updated successfully')
      } else {
        await calendarService.createEvent(formData as CreateCalendarEventRequest)
        toast.success('Event created successfully')
      }
      setIsModalOpen(false)
      setSelectedEvent(null)
      loadEvents()
    } catch (error) {
      toast.error(selectedEvent ? 'Failed to update event' : 'Failed to create event')
      console.error(error)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'deadline':
        return 'bg-red-100 text-red-800'
      case 'meeting':
        return 'bg-blue-100 text-blue-800'
      case 'renewal':
        return 'bg-yellow-100 text-yellow-800'
      case 'milestone':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-gray-500">
            Calendar view coming soon. See upcoming events below.
          </div>
        </div>

        <div className="md:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleEdit(event)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-500">{event.date.toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>
                {event.description && (
                  <div className="text-sm text-gray-600 mt-2">{event.description}</div>
                )}
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">No events found</div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEvent(null)
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

function EventModal({
  event,
  onClose,
  onSubmit,
}: {
  event: CalendarEvent | null
  onClose: () => void
  onSubmit: (data: CreateCalendarEventRequest | UpdateCalendarEventRequest) => void
}) {
  const [formData, setFormData] = useState<CreateCalendarEventRequest | UpdateCalendarEventRequest>({
    title: event?.title || '',
    date: event?.date.toISOString().split('T')[0] || '',
    type: event?.type || 'meeting',
    description: event?.description || '',
    location: event?.location || '',
    attendees: event?.attendees || [],
  } as CreateCalendarEventRequest)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{event ? 'Edit Event' : 'New Event'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="deadline">Deadline</option>
                <option value="meeting">Meeting</option>
                <option value="renewal">Renewal</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

