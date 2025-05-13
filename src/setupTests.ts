// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
// setupTests.ts
// Удалите ненужный импорт jest-canvas-mock, если вы не тестируете Canvas-элементы
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
  DndProvider: ({ children }: { children: React.ReactNode }) => children,
}));

configure({ testIdAttribute: 'data-test' });
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

configure({ testIdAttribute: 'data-test' });