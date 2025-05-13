import React from 'react';

interface StatsPanelProps {
  completed: number;
  total: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ completed, total }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="stats-panel">
      <h3>Статистика</h3>
      <div className="stats-item">
        <span>Выполнено:</span>
        <span>{completed}/{total}</span>
      </div>
      <div className="stats-item">
        <span>Прогресс:</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
        <span>{percentage}%</span>
      </div>
    </div>
  );
};

export default StatsPanel;