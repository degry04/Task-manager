import React, { useState } from 'react';
import { Task } from '../types/types';
import { toast } from 'react-toastify';

interface AddTaskFormProps {
  categories: string[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'isArchived' | 'comments' | 'calendarEventId'>) => void;
  onAddCategory?: (category: string) => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  categories,
  onAddTask,
  onAddCategory
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Требуется название задачи');
      return;
    }

    if (!category) {
      toast.error('Выберите категорию');
      return;
    }

    let dueDateTime = '';
    if (dueDate) {
      if (!/^\d{2}-\d{2}-\d{4}$/.test(dueDate)) {
        toast.error('Пожалуйста, введите дату в формате ДД-ММ-ГГГГ');
        return;
      }

      const [day, month, year] = dueDate.split('-').map(Number);
      const [hours, minutes] = dueTime.split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hours, minutes);
      if (
        dateObj.getDate() !== day ||
        dateObj.getMonth() !== month - 1 ||
        dateObj.getFullYear() !== year
      ) {
        toast.error('Некорректная дата ');
        return;
      }

      if (dateObj < new Date()) {
        toast.error('Дата не может быть в прошлом');
        return;
      }
      if (year > 9999) {
        toast.error('Максимальный год - 9999');
        return;
      }

      dueDateTime = dateObj.toISOString();
    }

    onAddTask({
      title: title.trim(),
      category,
      priority,
      dueDate: dueDateTime || undefined
    });
    setTitle('');
    setDueDate('');
    setDueTime('12:00');
    setCategory('');
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && onAddCategory) {
      onAddCategory(newCategory.trim());
      setCategory(newCategory.trim());
      setNewCategory('');
      setShowAddCategory(false);
      toast.success(`Категория "${newCategory.trim()}" добавлена`);
    }
  };

  const formatDateInput = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 2) cleaned = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    if (cleaned.length > 5) cleaned = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
    return cleaned.slice(0, 10); 
  };

  return (
    <div className="card add-task-form">
      <h2>Добавить новую задачу</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="task-title">Название задачи</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Что нужно сделать?"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-category">Категория</label>
            <div className="category-selector">
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Выберите категорию</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="category-add-btn"
              >
                {showAddCategory ? '×' : '+'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-priority">Приоритет</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
        </div>

        {showAddCategory && (
          <div className="form-group">
            <label htmlFor="new-category">New Category Name*</label>
            <div className="add-category">
              <input
                id="new-category"
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Введите название категории"
                required
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="btn-primary"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-date">Крайний срок (ДД-ММ-ГГГГ)</label>
            <input
              id="task-date"
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(formatDateInput(e.target.value))}
              placeholder="ДД-ММ-ГГГГ"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-time">Время (ЧЧ:ММ)</label>
            <input
              id="task-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              required={!!dueDate}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary">
        Добавить задачу
        </button>
      </form>
    </div>
  );
};

export default AddTaskForm;
