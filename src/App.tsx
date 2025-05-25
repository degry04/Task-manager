import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';
import TaskList from './components/TaskList';
import AddTaskForm from './components/AddTaskForm';
import FilterControls from './components/FilterControls';
import StatsPanel from './components/StatsPanel';
import ThemeToggle from './components/ThemeToggle';
import GoogleCalendarIntegration from './components/GoogleCalendarIntegration';
import DropArea from './components/DropArea';
import { Task, FilterOptions, AppData, TaskStatusFilter, DropResult } from './types/types';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { googleCalendar } from './components/googleCalendar';

const DEFAULT_CATEGORIES = ['Работа', 'Личное', 'Шоппинг', 'Здоровье'];

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [data, setData] = useState<AppData>({
    tasks: [],
    categories: DEFAULT_CATEGORIES
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: '',
    priority: '',
    showArchived: false,
    taskStatus: TaskStatusFilter.ACTIVE,
  });
  useEffect(() => {
    const savedData = localStorage.getItem('taskManagerData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setData({
          tasks: parsedData.tasks || [],
          categories: parsedData.categories || DEFAULT_CATEGORIES
        });
      } catch (e) {
        toast.error("Не удалось загрузить сохраненные данные");
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('taskManagerData', JSON.stringify(data));
  }, [data]);

  const moveTask = useCallback((dragIndex: number, hoverIndex: number) => {
    setData(prev => {
      const newTasks = [...prev.tasks];
      const [removed] = newTasks.splice(dragIndex, 1);
      newTasks.splice(hoverIndex, 0, removed);
      return { ...prev, tasks: newTasks };
    });
  }, []);

  const handleSyncWithCalendar = useCallback(async (taskId: string) => {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task || !task.dueDate) return;

    try {
      const accessToken = localStorage.getItem('google_access_token');
      if (!accessToken) {
        toast.error('Подключите Google Календарь');
        return;
      }

      const event = await googleCalendar.syncTaskWithCalendar(task, accessToken);
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId ? { ...t, calendarEventId: event.id } : t
        )
      }));
      toast.success('задача синхронизирована с Google Calendar!');
    } catch (error) {
      toast.error('Ошибка синхрнизации calendar');
      console.error('Ошибка синхронизации:', error);
    }
  }, [data.tasks]);

  const handleTaskDrop = useCallback(({ taskId, dropArea }: DropResult) => {
  if (!taskId) return;

  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return;

  switch (dropArea) {
    case 'completed-tasks':
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      }));
      toast.info(`Задача отмечена как ${!task.completed ? 'завершенная' : 'активная'}`);
      break;

    case 'archive':
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => 
          t.id === taskId ? { ...t, isArchived: !t.isArchived } : t
        )
      }));
      toast.info(`задача ${!task.isArchived ? 'архивирована' : 'разархивирована'}`);
      break;

    case 'calendar':
      if (!task.dueDate) {
        toast.error('Не удалось загрузить сохраненные данные. Для синхронизации с календарем задаче требуется установленная дата выполнения');
        return;
      }
      handleSyncWithCalendar(taskId);
      break;

    case 'trash':
      const deleteTask = async () => {
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
              toast.success('Задача удалена из Google Calendar');
            }
          } catch (error) {
            console.error('Ошибка удаления из календаря', error);
            toast.error('Ошибка удаления из календаря');
          }
        }

        setData(prev => ({
          ...prev,
          tasks: prev.tasks.filter(t => t.id !== taskId)
        }));
        toast.info('Задача удалена');
      };
      deleteTask();
      break;

    default:
      break;
  }
}, [data.tasks, handleSyncWithCalendar]);

  const toggleTaskArchive = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, isArchived: !task.isArchived } : task
      )
    }));
  }, [data.tasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'isArchived' | 'comments' | 'calendarEventId'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
      isArchived: false,
      comments: [],
      calendarEventId: undefined
    };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    toast.success('Задача добавлена!');
  }, []);

  const addTaskFromCalendar = useCallback((event: { title: string; priority: 'low' | 'medium' | 'high'; start: string; calendarEventId: string }) => {
    setData(prev => {
      const taskExists = prev.tasks.some(t =>
        t.calendarEventId === event.calendarEventId ||
        (t.title === event.title && t.dueDate === event.start)
      );

      if (taskExists) return prev;

      const newTask: Task = {
        id: Date.now().toString(),
        title: event.title,
        completed: false,
        priority: event.priority,
        category: 'Import',
        dueDate: event.start,
        createdAt: new Date().toISOString(),
        isArchived: false,
        comments: [],
        calendarEventId: event.calendarEventId
      };

      toast.success('Задача из Google calendar внесена');
      return { ...prev, tasks: [...prev.tasks, newTask] };
    });
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
    const task = data.tasks.find(t => t.id === id);
    toast.info(`Задача отмечена как ${task?.completed ? 'незавершенная' : 'завершенная'}`);
  }, [data.tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const taskToDelete = data.tasks.find(task => task.id === id);
    if (!taskToDelete) return;

    if (taskToDelete.calendarEventId) {
      try {
        const accessToken = localStorage.getItem('google_access_token');
        if (accessToken) {
          await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${taskToDelete.calendarEventId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          toast.success('Задача удалена из Google Calendar');
        }
      } catch (error) {
        console.error('Failed to delete from calendar:', error);
        toast.error('Ошибка удаления из календаря');
      }
    }

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id)
    }));
    toast.info('Задача удалена');
  }, [data.tasks]);

  const editTask = useCallback((id: string, updates: Partial<Task>) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    }));
    if (updates.title) {
    }
  }, []);

  const addCategory = useCallback((category: string) => {
    if (!data.categories.includes(category)) {
      setData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    }
  }, [data.categories]);

  const filteredTasks = data.tasks.filter(task => {
    const matchesSearch = searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterOptions.category || task.category === filterOptions.category;
    const matchesPriority = !filterOptions.priority || task.priority === filterOptions.priority;
    const matchesArchived = filterOptions.showArchived || !task.isArchived;

    switch (filterOptions.taskStatus) {
      case TaskStatusFilter.ACTIVE:
        return !task.completed && matchesCategory && matchesPriority && matchesArchived && matchesSearch;
      case TaskStatusFilter.COMPLETED:
        return task.completed && matchesCategory && matchesPriority && matchesArchived && matchesSearch;
      case TaskStatusFilter.ALL:
        return matchesCategory && matchesPriority && matchesArchived && matchesSearch;
      default:
        return true;
    }
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <div className="container">
          <header className="header">
            <h1>Task Manager</h1>
            <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </header>

          <div className="main-content">
            <div className="sidebar">
              <StatsPanel
                completed={data.tasks.filter(t => t.completed).length}
                total={data.tasks.length}
              />
              <GoogleCalendarIntegration
                tasks={data.tasks}
                onAddTaskFromCalendar={addTaskFromCalendar}
                onDeleteFromCalendar={async (eventId: string) => {
                  const accessToken = localStorage.getItem('google_access_token');
                  if (!accessToken) return;

                  await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
                    {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                      },
                    }
                  );
                }}
              />
              <FilterControls
                categories={data.categories}
                selectedCategory={filterOptions.category}
                onCategoryChange={(category: string) => setFilterOptions(prev => ({ ...prev, category }))}
                onPriorityChange={(priority: string) => setFilterOptions(prev => ({ ...prev, priority }))}
                showArchived={filterOptions.showArchived}
                onToggleArchived={() => setFilterOptions(prev => ({ ...prev, showArchived: !prev.showArchived }))}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                taskStatus={filterOptions.taskStatus}
                onTaskStatusChange={(status: TaskStatusFilter) =>
                  setFilterOptions(prev => ({ ...prev, taskStatus: status }))
                }
              />
            </div>

            <div className="task-area">
              <AddTaskForm
                categories={data.categories}
                onAddTask={addTask}
                onAddCategory={addCategory}
              />

              <div className="drop-zones-container">
                <div className="drop-zones">
                  <DropArea 
                    type="completed-tasks" 
                    onDrop={handleTaskDrop}
                  >
                    <div className="drop-zone-content">
                      <span>✓</span>
                      <p>Перетащите для изменения статуса</p>
                    </div>
                  </DropArea>

                  <DropArea 
                    type="archive" 
                    onDrop={handleTaskDrop}
                  >
                    <div className="drop-zone-content">
                      <span>📦</span>
                      <p>Перетащите для архивации</p>
                    </div>
                  </DropArea>

                  <DropArea 
                    type="calendar" 
                    onDrop={handleTaskDrop}
                  >
                    <div className="drop-zone-content">
                      <span>📅</span>
                      <p>Перетащите для синхронизации</p>
                    </div>
                  </DropArea>

                  <DropArea 
                    type="trash" 
                    onDrop={handleTaskDrop}
                  >
                    <div className="drop-zone-content">
                      <span>🗑️</span>
                      <p>Перетащите для удаления</p>
                    </div>
                  </DropArea>
                </div>
              </div>

              <TaskList
                tasks={filteredTasks}
                onToggleComplete={toggleTaskComplete}
                onDeleteTask={deleteTask}
                onEditTask={editTask}
                onToggleArchive={toggleTaskArchive}
                moveTask={moveTask}
              />
            </div>
          </div>
        </div>
        <ToastContainer position="bottom-right" theme={darkMode ? 'dark' : 'light'} />
      </div>
    </DndProvider>
  );
};

export default App;
