import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', () => {
    console.log('Перехвачен запрос на добавление события в Google Calendar');
    return HttpResponse.json({
      id: 'mock-event-id',
      summary: 'Test Event',
      start: { dateTime: '2025-12-31T14:30:00Z' },
      end: { dateTime: '2025-12-31T15:30:00Z' },
    });
  }),
  http.delete('https://www.googleapis.com/calendar/v3/calendars/primary/events/:eventId', () => {
    console.log('Перехвачен запрос на удаление события из Google Calendar');
    return HttpResponse.json({ success: true });
  }),
  http.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', () => {
    console.log('Перехвачен запрос на получение событий из Google Calendar');
    return HttpResponse.json({
      items: [
        { id: 'mock-event-id', summary: 'Test Event', start: { dateTime: '2025-12-31T14:30:00Z' } },
      ],
    });
  }),
];