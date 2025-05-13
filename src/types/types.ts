export interface Comment {
  id: string;
  taskId: string;
  text: string;
  createdAt: string;
}
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
}
export interface DragItem {
  index: number;
  id: string;
  type: string;
}
export type DropAreaType = 
  | 'active-tasks' 
  | 'completed-tasks' 
  | 'archive' 
  | 'calendar' 
  | 'trash';

export interface DropResult {
  dropArea: DropAreaType;
  taskId?: string;
}
export interface TimeSession {
  id: string;
  start: string;
  end?: string;
  duration?: number;
}

export interface TimeTracking {
  logged: number;
  sessions: TimeSession[];
  estimated?: number; 
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  dueTime?: string;
  createdAt: string;
  reminderTime?: string;
  isArchived: boolean;
  comments?: Comment[];
  calendarEventId?: string;
  timeTracking?: TimeTracking;
}
export enum TaskStatusFilter {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ALL = 'all'
}

export type FilterOptions = {
  category: string;
  priority: string;
  showArchived: boolean;
  searchQuery?: string;
  taskStatus: TaskStatusFilter;
};

export interface AppData {
  tasks: Task[];
  categories: string[];
}

export interface GoogleEvent {
  id?: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}
