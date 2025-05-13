import React from 'react';
import TaskItem from './TaskItem';
import DraggableTaskItem from './DraggableTaskItem';
import DropArea from './DropArea';
import { Task } from '../types/types';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, updates: Partial<Task>) => void;
  onToggleArchive: (id: string) => void;
  moveTask: (dragIndex: number, hoverIndex: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onToggleComplete, 
  onDeleteTask, 
  onEditTask, 
  onToggleArchive,
  moveTask
}) => {
  return (
    <DropArea 
      type="active-tasks" 
      onDrop={() => {}}
    >
    <div className="task-list">
      {tasks.map((task, index) => (
        <DraggableTaskItem
          key={task.id}
          index={index}
          task={task}
          moveTask={moveTask}
        >
          <TaskItem
            task={task}
            onToggleComplete={onToggleComplete}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onToggleArchive={onToggleArchive}
          />
        </DraggableTaskItem>
      ))}
    </div>
    </DropArea>
  );
};

export default TaskList;