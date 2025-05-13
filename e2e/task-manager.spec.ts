import { test, expect } from '@playwright/test';
import { TaskManagerPage } from './pages/TaskManagerPage';

test.describe('Task Manager E2E Tests', () => {
  let taskManager: TaskManagerPage;

  test.beforeEach(async ({ page }) => {
    taskManager = new TaskManagerPage(page);
    await taskManager.goto();
  });

  test.setTimeout(160000);

  test('Добавление новой задачи', async () => {
    await taskManager.addTask('Тестовая задача', 'Работа', 'high');

    const taskList = taskManager.getTaskList();
    await expect(taskList).toContainText('Тестовая задача');
    await expect(taskList).toContainText('Работа');
    await expect(taskList).toContainText('Высокий');
    await expect(taskManager.getLastToast()).toContainText('Задача добавлена!');
  });

  test('Редактирование задачи', async () => {
    await taskManager.addTask('Задача для редактирования', 'Личное', 'medium');
    await taskManager.editTask('Отредактированная задача', 'high');

    const taskList = taskManager.getTaskList();
    await expect(taskList).toContainText('Отредактированная задача');
    await expect(taskList).toContainText('Высокий');
    await expect(taskManager.getLastToast()).toContainText('Задача обновлена!');
  });

  test('Фильтрация задач по категории', async () => {
    await taskManager.addTask('Задача 1', 'Работа', 'high');
    await taskManager.addTask('Задача 2', 'Личное', 'low');
    await taskManager.filterByCategory('Работа');

    const taskList = taskManager.getTaskList();
    await expect(taskList).toContainText('Задача 1');
    await expect(taskList).not.toContainText('Задача 2');
  });

  test('Архивация и разархивация задачи', async () => {
    await taskManager.addTask('Задача для архива', 'Работа', 'high');
    await taskManager.archiveTask();

    await expect(taskManager.getLastToast()).toContainText('архивирована');
    await expect(taskManager.getTaskList()).toHaveCount(0);

    await taskManager.unarchiveTask();
    await expect(taskManager.getLastToast()).toContainText('разархивирована');
    await expect(taskManager.getTaskList()).toContainText('Задача для архива');
  });

  test('Drag-and-drop задачи в зону архива', async () => {
    await taskManager.addTask('Задача для drag-and-drop', 'Работа', 'high');
    await taskManager.dragAndDropToArchive();

    await expect(taskManager.getLastToast()).toContainText('архивирована');
    await taskManager.unarchiveTask();
    await expect(taskManager.getTaskList()).toContainText('Задача для drag-and-drop');
  });

  test('Добавление комментария к задаче', async () => {
    await taskManager.addTask('Задача с комментарием', 'Работа', 'high');
    await taskManager.addComment('Тестовый комментарий');

    await expect(taskManager.getComments()).toContainText('Тестовый комментарий');
    await expect(taskManager.getLastToast()).toContainText('Комментарий добавлен!');
  });

  test('Удаление задачи', async () => {
    await taskManager.addTask('Задача для удаления', 'Работа', 'high');
    await taskManager.deleteTask();
    await taskManager.confirmDeletion();

    await expect(taskManager.getTaskList()).toHaveCount(0, { timeout: 10000 });
    await expect(taskManager.getLastToast()).toContainText('Задача удалена');
  });



  test('Установка напоминания для задачи', async () => {
    await taskManager.addTask('Задача с напоминанием', 'Работа', 'high');
    await taskManager.setReminder('2025-12-31', '14:00');

    await expect(taskManager.getLastToast()).toContainText('Напоминание: задача \"Задача с напоминанием\" должна быть выполнена до 12/31/2025, 2:30:00 PM!');
    await expect(taskManager.getTaskList().locator('.reminder-info')).toContainText('Напоминание:Dec 31, 2025, 02:00 PM×');
  });

  test('Переключение темы', async () => {
    const initialTheme = await taskManager.getCurrentTheme();
    await taskManager.toggleTheme();
    await taskManager.toggleTheme();
    const restoredTheme = await taskManager.getCurrentTheme();
    expect(restoredTheme).toBe(initialTheme);
  });
  test('Статистика задач', async () => {
    await taskManager.addTask('Задача 1', 'Работа', 'high');
    await taskManager.addTask('Задача 2', 'Личное', 'low');

    const statsPanel = taskManager.getStatsPanel();
    await expect(statsPanel).toContainText('Статистика');
    await expect(statsPanel).toContainText('Выполнено:0/2');
    await taskManager.getTaskList().first().locator('.complete-btn').click();
    await taskManager.wait(500);
    await expect(statsPanel).toContainText('Выполнено:1/2');
    await expect(statsPanel).toContainText('Прогресс:50%');
  });

  test('Подключение к Google Calendar с mock', async () => {
    await taskManager.addTask('Задача для Google Calendar', 'Работа', 'high', '31-12-2025', '14:30');

    await taskManager.syncWithGoogleCalendar();
    const taskItem = taskManager.getTaskList().first();
    await expect(taskItem.locator('.task-synced')).toBeVisible({ timeout: 15000 });
    await expect(taskItem.locator('.task-synced')).toContainText('✓ Синхр.', { timeout: 15000 });

    const toastText = await taskManager.getLastToast().innerText();
    console.log('Текст уведомления после синхронизации:', toastText);

    await expect(taskManager.getLastToast()).toContainText('Синхронизировано с Google Календарем!', { timeout: 10000 });
  });


  test('Удаление события из Google Calendar', async () => {
    await taskManager.addTask('Задача для Google Calendar', 'Работа', 'high', '31-12-2025', '14:30');
    await taskManager.syncWithGoogleCalendar();

    const taskItem = taskManager.getTaskList().first();
    await expect(taskItem.locator('.task-synced')).toBeVisible({ timeout: 15000 });
    
    await taskManager.deleteGoogleCalendarEvent();

    await expect(taskManager.getTaskList()).toHaveCount(0, { timeout: 20000 });
    await expect(taskItem.locator('.task-synced')).not.toBeVisible({ timeout: 10000 });

    const toasts = taskManager.getAllToasts();
    const toastTexts = await toasts.allInnerTexts();

    const combinedText = toastTexts.join(' ');
    expect(combinedText).toContain('Удалено из Google Календаря');
    expect(combinedText).toContain('Задача удалена');
  });
  test('Запуск и остановка таймера задачи', async () => {
    await taskManager.addTask('Задача с таймером', 'Работа', 'high');
    await expect(taskManager.getTimerButton('start')).toBeVisible({ timeout: 5000 });
    await taskManager.startTimer();
    await expect(taskManager.getLastToast()).toContainText('Таймер запущен', { timeout: 5000 });
    await expect(taskManager.getTimerButton('stop')).toBeVisible({ timeout: 5000 });
    await taskManager.wait(65000);
    const isStopButtonVisible = await taskManager.getTimerButton('stop').isVisible();
    await taskManager.stopTimer();
    await expect(taskManager.getLastToast()).toBeVisible({ timeout: 10000 });
    await expect(taskManager.getLastToast()).toContainText('Таймер остановлен', { timeout: 10000 });
    const taskItem = taskManager.getTaskList().first();
    const timeLogged = taskItem.locator('.time-logged');
    await taskManager.wait(3000);
    const timeLoggedText = await timeLogged.innerText();
    await expect(timeLogged).toBeVisible({ timeout: 5000 });
    await expect(timeLogged).toContainText('Затрачено времени:0ч 1м', { timeout: 5000 });
  });
  test('Выполнение задачи', async () => {
    await taskManager.addTask('Задача для выполнения', 'Работа', 'high');

    const taskList = taskManager.getTaskList();
    await expect(taskList).toContainText('Задача для выполнения');
    

    await taskManager.getTaskList().first().locator('.complete-btn').click();
    await taskManager.wait(500);
    

    await expect(taskManager.getLastToast()).toContainText('Задача отмечена как завершенная');
    await taskManager.selectStatusFilter('Выполненные');
    await taskManager.wait(500);
    
    await expect(taskList).toContainText('Задача для выполнения');
    

    await expect(taskList.first().locator('.complete-btn')).toHaveText('✓ Завершено');
    
    const statsPanel = taskManager.getStatsPanel();
    await expect(statsPanel).toContainText('Выполнено:1/1');
    await expect(statsPanel).toContainText('Прогресс:100%');
  });

  test('Полный путь задачи', async () => {
    await taskManager.addTask('Комплексная задача', 'Работа', 'high', '31-12-2025', '14:30');
    await expect(taskManager.getTaskList()).toContainText('Комплексная задача');

    await taskManager.editTask('Обновленная задача', 'low');
    await expect(taskManager.getTaskList()).toContainText('Обновленная задача');

    await taskManager.addComment('Тестовый комментарий');
    await expect(taskManager.getComments()).toContainText('Тестовый комментарий');

    await taskManager.syncWithGoogleCalendar();
    await expect(taskManager.getTaskList().first().locator('.task-synced')).toBeVisible();

    await taskManager.archiveTask();
    await expect(taskManager.getTaskList()).toHaveCount(0);

    await taskManager.unarchiveTask();
    await expect(taskManager.getTaskList()).toContainText('Обновленная задача');

    await taskManager.startTimer();
    await expect(taskManager.getLastToast()).toContainText('Таймер запущен', { timeout: 5000 });
    await expect(taskManager.getTimerButton('stop')).toBeVisible({ timeout: 5000 });
    await taskManager.stopTimer();
    await expect(taskManager.getLastToast()).toBeVisible({ timeout: 10000 });
    await expect(taskManager.getLastToast()).toContainText('Таймер остановлен', { timeout: 10000 });

    await taskManager.deleteTask();
    await taskManager.confirmDeletion();
    await expect(taskManager.getTaskList()).toHaveCount(0);
  });
})