import { worker } from './mocks/browser';

export default async function globalSetup() {
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
}