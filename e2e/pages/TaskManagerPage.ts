import { Page, Locator } from '@playwright/test';

export class TaskManagerPage {
  constructor(private page: Page) { }

  async wait(timeout: number) {
    await this.page.waitForTimeout(timeout);
  }
  getTimerButton(type: 'start' | 'stop'): Locator {
    return this.page.locator(`.timer-btn.${type}`);
  }

  async goto() {

    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await this.page.goto('http://localhost:3000');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.evaluate(() => document.querySelectorAll('.Toastify__toast').forEach(toast => toast.remove()));
    await this.page.reload();
  }

  async addTask(title: string, category: string, priority: string, date: string = '31-12-2025', time: string = '14:30') {
    await this.page.fill('#task-title', title);
    await this.page.selectOption('#task-category', category);
    await this.page.selectOption('#task-priority', priority);
    await this.page.fill('#task-date', date);
    await this.page.fill('#task-time', time);
    await this.page.click('button[type="submit"]');
    await this.page.waitForSelector('.task-item');
  }

  async editTask(newTitle: string, newPriority: string) {
    await this.page.click('.task-item .task-details');
    await this.page.waitForSelector('.edit-input', { state: 'visible' });
    await this.page.fill('.edit-input', newTitle);
    await this.page.selectOption('.edit-controls select', newPriority);
    await this.page.click('.save-btn');
  }

  async filterByCategory(category: string) {
    await this.page.selectOption('#category-filter', category);
  }

  async archiveTask() {
    await this.page.waitForSelector('.archive-btn', { state: 'visible' });
    await this.page.click('.archive-btn');
  }

  async unarchiveTask() {
    await this.page.waitForSelector('.archive-toggle', { state: 'visible' });
    await this.page.click('.archive-toggle');
    await this.page.waitForSelector('.archive-btn', { state: 'visible' });
    await this.page.click('.archive-btn');
  }

  async dragAndDropToArchive() {
    const task = this.page.locator('.task-item').first();
    const archiveZone = this.page.locator('.drop-area.archive');
    await task.dragTo(archiveZone);
  }

  async addComment(comment: string) {
    await this.page.waitForSelector('.comments-btn', { state: 'visible' });
    await this.page.click('.comments-btn');
    await this.page.waitForSelector('textarea', { state: 'visible' });
    await this.page.fill('textarea', comment);
    await this.page.click('.add-comment-btn');
  }

  async deleteTask() {
    await this.page.waitForSelector('.delete-btn', { state: 'visible' });
    await this.page.click('.delete-btn');
  }

  async confirmDeletion() {
    await this.page.click('button:has-text("Да")');
  }

  async startTimer() {
    await this.page.waitForSelector('.timer-btn.start', { state: 'visible' });
    await this.page.click('.timer-btn.start');
  }

  async stopTimer() {
    await this.page.waitForSelector('.timer-btn.stop', { state: 'visible' });
    await this.page.click('.timer-btn.stop');
    await this.page.waitForTimeout(1000);
  }

  async setReminder(date: string, time: string) {
    await this.page.waitForSelector('.add-reminder-btn', { state: 'visible' });
    await this.page.click('.add-reminder-btn');
    await this.page.waitForSelector('input[type="datetime-local"]', { state: 'visible' });
    await this.page.fill('input[type="datetime-local"]', `${date}T${time}`);
    await this.page.click('.btn-primary:has-text("Установить")');
  }

  async toggleTheme() {
    await this.page.waitForSelector('.theme-toggle', { state: 'visible' });
    await this.page.click('.theme-toggle');
    await this.page.waitForTimeout(500);
  }

  async getCurrentTheme(): Promise<'light' | 'dark'> {
    return this.page.evaluate(() =>
      document.body.classList.contains('dark') ? 'dark' : 'light'
    );
  }

 
  async syncWithGoogleCalendar() {
    await this.page.evaluate(() => {
      localStorage.setItem('google_access_token', 'mock-token');
    });

    await this.page.route('https://www.googleapis.com/calendar/v3/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          kind: 'calendar#event',
          id: 'mock-event-id',
          summary: 'Задача для Google Calendar',
          start: { dateTime: '2025-12-31T14:30:00+03:00' },
          end: { dateTime: '2025-12-31T15:30:00+03:00' },
        }),
      });
    });
    await this.page.waitForSelector('.btn-primary:has-text("Подключить")', { state: 'visible' });
    await this.page.click('.btn-primary:has-text("Подключить")');
    await this.wait(1000);

    await this.page.waitForSelector('.sync-btn', { state: 'visible' });
    await this.page.click('.sync-btn');
    await this.wait(2000);
  }
  async selectStatusFilter(status: 'Активные' | 'Выполненные' | 'Все') {
    await this.page.locator('.status-btn').filter({ hasText: status }).click();
  }
  async deleteGoogleCalendarEvent() {
    await this.page.route('https://www.googleapis.com/calendar/v3/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 204, 
        });
      } else {
        route.continue();
      }
    });
    await this.page.waitForSelector('.delete-btn', { state: 'visible' });
    await this.page.click('.delete-btn');
    await this.wait(2000);
  }
  getAllToasts(): Locator {
    return this.page.locator('.Toastify__toast[data-in="true"]');
  }

  getTaskList(): Locator {
    return this.page.locator('.task-item');
  }

  getLastToast(): Locator {
    return this.page.locator('.Toastify__toast:last-child');
  }

  getComments(): Locator {
    return this.page.locator('.comments-list .comment');
  }

  getStatsPanel(): Locator {
    return this.page.locator('.stats-panel');
  }

  getGoogleCalendarEvents(): Locator {
    return this.page.locator('.task-synced');
  }
}