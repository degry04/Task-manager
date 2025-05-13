import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { DropAreaType, DropResult } from '../types/types';

interface DropAreaProps {
  type: DropAreaType;
  onDrop: (result: DropResult) => void;
  children: React.ReactNode;
}

const DropArea: React.FC<DropAreaProps> = ({ type, onDrop, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      onDrop({ taskId: item.id, dropArea: type });
      return { taskId: item.id, dropArea: type };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      className={`drop-area ${type} ${isOver ? 'active' : ''}`}
    >
      {children}
    </div>
  );
};

export default DropArea;