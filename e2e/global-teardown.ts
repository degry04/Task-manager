import { worker } from './mocks/browser';

export default async function globalTeardown() {
  worker.stop();
}