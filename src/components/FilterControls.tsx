import React from 'react';
import { TaskStatusFilter } from '../types/types';

interface FilterControlsProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onPriorityChange: (priority: string) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  taskStatus: TaskStatusFilter;
  onTaskStatusChange: (status: TaskStatusFilter) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  onPriorityChange,
  showArchived,
  onToggleArchived,
  searchQuery,
  onSearchChange,
  taskStatus,
  onTaskStatusChange
}) => {
  return (
    <div className="card filter-controls">
      <h3>Фильтры</h3>

      <div className="filter-group">
        <label>Поиск:</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск задач..."
        />
      </div>

      <button
        className={`archive-toggle ${showArchived ? 'active' : ''}`}
        onClick={onToggleArchived}
      >
        <span className="toggle-label">
          {showArchived ? 'Скрыть архив 📂 ' : 'Показать архив 📦'}
        </span>
      </button>

      <div className="filter-group">
        <label htmlFor="category-filter">Категории:</label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Все</option>
          <option value="Import">Импортированные</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <label htmlFor="priority-filter">Приоритет:</label>"
      <div className="filter-group">
        <select
          id="priority-filter"
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="">Все</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </div>

      <div className="filter-group task-status-filter">
        <label>Статус задач:</label>
        <div className="status-buttons">
          <button
            className={`status-btn ${taskStatus === TaskStatusFilter.ACTIVE ? 'active' : ''}`}
            onClick={() => onTaskStatusChange(TaskStatusFilter.ACTIVE)}
          >
            Активные
          </button>
          <button
            className={`status-btn ${taskStatus === TaskStatusFilter.COMPLETED ? 'active' : ''}`}
            onClick={() => onTaskStatusChange(TaskStatusFilter.COMPLETED)}
          >
            Выполненные
          </button>
          <button
            className={`status-btn ${taskStatus === TaskStatusFilter.ALL ? 'active' : ''}`}
            onClick={() => onTaskStatusChange(TaskStatusFilter.ALL)}
          >
            Все
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;