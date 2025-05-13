import { RenderResult } from '@testing-library/react';
import { Task } from './types/types';

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Test Task',
  completed: false,
  priority: 'medium',
  category: 'Work',
  createdAt: new Date().toISOString(),
  isArchived: false,
  comments: [],
  ...overrides
});

export const waitForText = async (
  rendered: RenderResult,
  text: string,
  options = {}
) => {
  return await rendered.findByText(text, options);
};


export const mockDnd = {
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
  DndProvider: ({ children }: { children: React.ReactNode }) => children,
};