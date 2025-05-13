import React from 'react';
import { toast } from 'react-toastify';

interface ArchiveButtonProps {
  isArchived: boolean;
  onToggleArchive: () => void;
  taskTitle?: string;
}

const ArchiveButton: React.FC<ArchiveButtonProps> = ({ 
  isArchived, 
  onToggleArchive,
  taskTitle = ''
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleArchive();
    toast.success(
      `Задача "${taskTitle}" ${isArchived ? 'разархивирована' : 'архивирована'}`
    );
  };
  return (
    <button 
      onClick={handleClick}
      className={`archive-btn ${isArchived ? 'archived' : ''}`}
      aria-label={isArchived ? 'Unarchive task' : 'Archive task'}
    >
      {isArchived ? (
        <>
          <span role="img" aria-label="unarchive">📂</span> Разархивировать
        </>
      ) : (
        <>
          <span role="img" aria-label="archive">📦</span> Архив
        </>
      )}
    </button>
  );
};
export default ArchiveButton;