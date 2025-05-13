import React, { useState, useEffect, useRef, useCallback } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { Task } from '../types/types';
import { toast } from 'react-toastify';

interface GoogleCalendarIntegrationProps {
  tasks: Task[];
  onAddTaskFromCalendar: (event: {
    title: string;
    priority: 'low' | 'medium' | 'high';
    start: string;
    calendarEventId: string;
  }) => void;
  onDeleteFromCalendar: (eventId: string) => Promise<void>;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({ 
  tasks, 
  onAddTaskFromCalendar,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const processedEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    const initialProcessedEvents = new Set(
      tasks
        .filter(task => task.calendarEventId)
        .map(task => task.calendarEventId as string)
    );
    processedEvents.current = initialProcessedEvents;
  }, [tasks]);

  const fetchCalendarEvents = useCallback(async () => {
    if (!isAuthenticated || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const accessToken = localStorage.getItem('google_access_token');
      if (!accessToken) {
        setIsAuthenticated(false);
        return;
      }

      const now = new Date();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${now.toISOString()}&` +
        `maxResults=50&` + 
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
      const items = data.items || [];
      let addedCount = 0;

      const newEvents = items.filter((event: any) => {
        return event.id && 
               event.summary && 
               !processedEvents.current.has(event.id);
      });

      for (const event of newEvents) {
        try {
          const taskExists = tasks.some(t => 
            t.calendarEventId === event.id || 
            (t.title === event.summary && t.dueDate === (event.start.dateTime || event.start.date))
          );

          if (!taskExists) {
            onAddTaskFromCalendar({
              title: event.summary.replace(/ \[(low|medium|high)\]$/, ''),
              priority: (event.summary.match(/ \[(low|medium|high)\]$/)?.pop() || 'medium') as 'low' | 'medium' | 'high',
              start: event.start.dateTime || event.start.date,
              calendarEventId: event.id
            });
            processedEvents.current.add(event.id);
            addedCount++;
          }
        } catch (error) {
          console.error('Ошибка обработки события:', event, error);
        }
      }
      if (addedCount > 0) {
        toast.success(`Добавлено ${addedCount} новых задач из календаря`);
      }
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      if (error instanceof Error && error.message.includes('token')) {
        handleLogout();
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, isSyncing, tasks, onAddTaskFromCalendar]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchCalendarEvents();
    
    syncInterval.current = setInterval(fetchCalendarEvents, 10 * 60 * 1000);

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, [isAuthenticated, fetchCalendarEvents]);

  const handleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar',
    onSuccess: (tokenResponse) => {
      localStorage.setItem('google_access_token', tokenResponse.access_token);
      setIsAuthenticated(true);
      processedEvents.current = new Set();
      toast.success('Подключено к Google Calendar!');
    },
    onError: () => {
      toast.error('Ошибка подключения к Google Calendar');
    },
  });

  const handleLogout = useCallback(() => {
    googleLogout();
    localStorage.removeItem('google_access_token');
    setIsAuthenticated(false);
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
    }
    toast.info('Google Calendar отключен');
  }, []);
  return (
    <div className="card google-calendar-integration">
      <h3>Google Calendar</h3>
      
      {!isAuthenticated ? (
        <button onClick={() => handleLogin()} className="btn-primary">
          Подключить
        </button>
      ) : (
        <>
          <button onClick={handleLogout} className="logout-btn">
            Отключиться
          </button>
          <p className="sync-status">
          Автосинхронизация {isSyncing}
          </p>
        </>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration;