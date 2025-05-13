import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../types/types';
import ArchiveButton from './ArchiveButton';
import { toast } from 'react-toastify';
import { googleCalendar } from './googleCalendar';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Task>) => void;
  onToggleArchive: (id: string) => void;
  searchQuery?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggleComplete, 
  onDelete, 
  onEdit,
  onToggleArchive,
  searchQuery = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDueDateTime, setEditDueDateTime] = useState(task.dueDate || '');
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [showReminderSettings, setShowReminderSettings] = useState(false);


  useEffect(() => {
    const activeSession = task.timeTracking?.sessions?.find(s => !s.end);
    if (activeSession) {
      setIsTracking(true);
      setCurrentSessionId(activeSession.id);
    }
  }, [task.id]);


  useEffect(() => {
    if (task.completed && isTracking) {
      stopTracking(false);
      toast.info('Таймер остановлен, задача завершена');
    }
  }, [task.completed, isTracking]);

  useEffect(() => {
    if (!task.dueDate) return;

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    if (dueDate < now && !task.completed) {
      toast.warning(`Задача "${task.title}" просрочена!`, {
        autoClose: false,
        toastId: `overdue-${task.id}`
      });
    }

    if (task.reminderTime) {
      const reminderDate = new Date(task.reminderTime);
      if (reminderDate > now) {
        const timeout = reminderDate.getTime() - now.getTime();
        const timer = setTimeout(() => {
          toast.info(`Напоминание: задача "${task.title}" должна быть выполнена до ${dueDate.toLocaleString()}!`, {
            toastId: `reminder-${task.id}`
          });
        }, timeout);

        return () => clearTimeout(timer);
      }
    }
  }, [task.dueDate, task.reminderTime, task.completed, task.title, task.id]);

  const stopTracking = useCallback((cancelSession = false) => {
    if (!currentSessionId || !task.timeTracking) return;
    
    const now = new Date();
    const updatedSessions = task.timeTracking.sessions.reduce<typeof task.timeTracking.sessions>(
      (acc, session) => {
        if (session.id === currentSessionId && !session.end) {
          if (cancelSession) return acc;
          
          const startDate = new Date(session.start);
          const duration = Math.round((now.getTime() - startDate.getTime()) / 60000);
          
          return [
            ...acc,
            {
              ...session,
              end: now.toISOString(),
              duration
            }
          ];
        }
        return [...acc, session];
      }, 
      []
    );
    
    const totalLogged = updatedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    onEdit(task.id, {
      timeTracking: {
        ...task.timeTracking,
        sessions: updatedSessions,
        logged: totalLogged
      }
    });
    
    setIsTracking(false);
    setCurrentSessionId(null);
    toast.info('Таймер остановлен');
  }, [currentSessionId, task.id, task.timeTracking, onEdit]);

  const startTracking = useCallback(() => {
    if (task.completed) {
      toast.warning('Нельзя запустить таймер для завершенной задачи');
      return;
    }
    
    const sessionId = Date.now().toString();
    const now = new Date().toISOString();
    
    onEdit(task.id, {
      timeTracking: {
        ...(task.timeTracking || { logged: 0, sessions: [] }),
        sessions: [
          ...(task.timeTracking?.sessions || []),
          { id: sessionId, start: now }
        ]
      }
    });
    
    setIsTracking(true);
    setCurrentSessionId(sessionId);
    toast.info('Таймер запущен');
  }, [task.completed, task.id, task.timeTracking, onEdit]);

  const handleToggleComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isTracking && !task.completed) {
      stopTracking(false);
    }
    
    onToggleComplete(task.id);
  }, [onToggleComplete, task.id, isTracking, stopTracking, task.completed]);

  const handleSave = () => {
    if (!editTitle.trim()) {
      toast.error('Название задачи не может быть пустым');
      return;
    }
    const updates: Partial<Task> = {
      title: editTitle,
      priority: editPriority,
      dueDate: editDueDateTime || undefined
    };
    
    onEdit(task.id, updates);
    setIsEditing(false);
    toast.success('Задача обновлена!');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('Комментарий не может быть пустым');
      return;
    }

    const comment = {
      id: Date.now().toString(),
      taskId: task.id,
      text: newComment,
      createdAt: new Date().toISOString()
    };
    
    onEdit(task.id, {
      comments: [...(task.comments || []), comment]
    });
    
    setNewComment('');
    toast.success('Комментарий добавлен!');
  };

  const setReminder = () => {
    if (!task.dueDate) {
      toast.error('Сначала установите срок выполнения');
      return;
    }

    if (!reminderTime) {
      toast.error('Укажите время напоминания');
      return;
    }

    const dueDate = new Date(task.dueDate);
    const reminderDate = new Date(reminderTime);
    const now = new Date();

    if (reminderDate < now) {
      toast.error('Напоминание не может быть установлено в прошлом');
      return;
    }
    if (reminderDate >= dueDate) {
      toast.error('Напоминание должно быть раньше дедлайна');
      return;
    }

    onEdit(task.id, {
      reminderTime: reminderDate.toISOString()
    });

    toast.success(`Напоминание установлено на ${reminderDate.toLocaleString()}`);
    setShowReminderSettings(false);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSyncWithCalendar = async () => {
    if (!task.dueDate) {
      toast.error('Для синхронизации укажите срок выполнения');
      return;
    }

    try {
      const accessToken = localStorage.getItem('google_access_token');
      if (!accessToken) {
        toast.error('Подключите Google Календарь');
        return;
      }

      const event = await googleCalendar.syncTaskWithCalendar(task, accessToken);
      onEdit(task.id, { calendarEventId: event.id });
      toast.success('Синхронизировано с Google Календарем!');
    } catch (error) {
      toast.error('Ошибка синхронизации');
      console.error('Sync error:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить задачу и все связанные данные?')) return;
    
    if (task.calendarEventId) {
      try {
        const accessToken = localStorage.getItem('google_access_token');
        if (accessToken) {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendarEventId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          toast.success('Удалено из Google Календаря');
        }
      } catch (error) {
        toast.error('Ошибка удаления из календаря');
      }
    }
    onDelete(task.id);
  };

  const highlightSearch = (text: string) => {
    if (!searchQuery || searchQuery.trim() === '') return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  const priorityClasses = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} ${isTracking ? 'time-tracking-active' : ''}`}>
      <div className="task-content">
        <button
          onClick={handleToggleComplete}
          className={`complete-btn ${task.completed ? 'completed' : ''}`}
          aria-label={task.completed ? 'Отметить как невыполненную' : 'Отметить как выполненную'}
        >
          {task.completed ? '✓ Завершено' : 'Завершить'}
        </button>

        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="edit-input"
              placeholder="Название задачи"
              required
            />
            
            <div className="edit-controls">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Низкий приоритет</option>
                <option value="medium">Средний приоритет</option>
                <option value="high">Высокий приоритет</option>
              </select>

              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setEditDueDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)} 
                max={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : undefined}
                className="reminder-input"
              />

              <button type="button" onClick={handleSave} className="save-btn">
                Сохранить
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="cancel-btn">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="task-details" onClick={() => setIsEditing(true)}>
            <h3 className="task-title">{highlightSearch(task.title)}</h3>
            
            <div className="task-meta">
              <span className="task-category">{task.category}</span>
              <span className={`task-priority ${priorityClasses[task.priority]}`}>
                {task.priority === 'high' ? 'Высокий' : 
                 task.priority === 'medium' ? 'Средний' : 'Низкий'}
              </span>
              
              {task.dueDate && (
                <span className="task-due">
                  Срок: {formatDate(task.dueDate)}
                </span>
              )}

              {task.calendarEventId && (
                <span className="task-synced">✓ Синхр.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Блок дедлайна и напоминаний */}
      <div className="deadline-reminder">
        {task.dueDate && (
          <div className="deadline-info">
            <span className="deadline-label">Дедлайн:</span>
            <span className={`deadline-value ${new Date(task.dueDate) < new Date() && !task.completed ? 'overdue' : ''}`}>
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}

        {task.reminderTime && (
          <div className="reminder-info">
            <span className="reminder-label">Напоминание:</span>
            <span className="reminder-value">
              {formatDate(task.reminderTime)}
              <button 
                onClick={() => onEdit(task.id, { reminderTime: undefined })}
                className="remove-reminder"
              >
                ×
              </button>
            </span>
          </div>
        )}

        {!task.reminderTime && task.dueDate && (
          <button 
            onClick={() => setShowReminderSettings(!showReminderSettings)}
            className="add-reminder-btn"
          >
            + Добавить напоминание
          </button>
        )}
      </div>

      {showReminderSettings && (
        <div className="reminder-settings">
          <input
            type="datetime-local"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            max={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : undefined}
          />
          <button onClick={setReminder} className="btn-primary">
            Установить
          </button>
          <button 
            onClick={() => setShowReminderSettings(false)}
            className="cancel-btn"
          >
            Отмена
          </button>
        </div>
      )}

      <div className="time-tracking">
        <div className="time-logged">
          <span>Затрачено времени:</span>
          <strong>{formatTime(task.timeTracking?.logged || 0)}</strong>
        </div>
        
        {!isTracking ? (
          <button 
            onClick={startTracking} 
            className="timer-btn start"
            disabled={task.completed}
          >
            ▶ Старт
          </button>
        ) : (
          <button onClick={() => stopTracking(false)} className="timer-btn stop">
            ⏹ Стоп
          </button>
        )}
        
        <button 
          onClick={() => setShowSessions(!showSessions)}
          className="toggle-sessions"
        >
          {showSessions ? 'Скрыть историю' : 'История'}
        </button>
      </div>

      {showSessions && (
        <div className="time-sessions">
          <h4>История работы:</h4>
          {task.timeTracking?.sessions?.length ? (
            task.timeTracking.sessions.map(session => (
              <div key={session.id} className="time-session">
                <span>
                  {new Date(session.start).toLocaleString()}
                  {session.end && ` → ${new Date(session.end).toLocaleTimeString()}`}
                </span>
                <span>
                  {session.duration ? `${session.duration} мин` : 'В процессе...'}
                </span>
              </div>
            ))
          ) : (
            <p>Нет данных о сессиях</p>
          )}
        </div>
      )}

      <div className="task-actions">
        <ArchiveButton 
          isArchived={task.isArchived}
          onToggleArchive={() => onToggleArchive(task.id)}
          taskTitle={task.title}
        />

        {task.dueDate && !task.calendarEventId && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleSyncWithCalendar();
            }}
            className="sync-btn"
          >
            Синхр.
          </button>
        )}

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(!showComments);
          }}
          className="comments-btn"
        >
          {showComments ? 'Скрыть' : `Комментарии (${task.comments?.length || 0})`}
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="delete-btn"
        >
          Удалить
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {task.comments?.length ? (
              task.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <p className="comment-text">{comment.text}</p>
                  <small className="comment-date">
                    {new Date(comment.createdAt).toLocaleString()}
                  </small>
                </div>
              ))
            ) : (
              <p>Нет комментариев</p>
            )}
          </div>

          <div className="add-comment">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Добавить комментарий..."
              rows={3}
            />
            <button onClick={handleAddComment} className="add-comment-btn">
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;