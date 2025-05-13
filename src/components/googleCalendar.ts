import { Task } from '../types/types';

const API_ENDPOINT = 'https://www.googleapis.com/calendar/v3';

export interface GoogleEvent {
  id?: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export const googleCalendar = {
  async syncTaskWithCalendar(task: Task, accessToken: string): Promise<GoogleEvent> {
    if (!task.dueDate) {
      throw new Error('Задача должна иметь дату выполнения для синхронизации с календарем.');
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

    const event: GoogleEvent = {
      summary: `${task.title} [${task.priority}]`,
      description: `Task ID: ${task.id}\nCategory: ${task.category}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timeZone
      }
    };

    try {
      let response;
      if (task.calendarEventId) {
        response = await fetch(
          `${API_ENDPOINT}/calendars/primary/events/${task.calendarEventId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
      } else {
        response = await fetch(
          `${API_ENDPOINT}/calendars/primary/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
      }

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка синхронизации Google Calendar:', error);
      throw error;
    }
  },

  async deleteCalendarEvent(eventId: string, accessToken: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error(`Ошибка удаления задачи: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
      throw error;
    }
  },

  async getUpcomingEvents(accessToken: string, maxResults: number = 10): Promise<GoogleEvent[]> {
    try {
      const now = new Date().toISOString();
      const response = await fetch(
        `${API_ENDPOINT}/calendars/primary/events?` +
        `timeMin=${now}&` +
        `maxResults=${maxResults}&` +
        `orderBy=startTime&` +
        `singleEvents=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }
};