import { initializeRedisClient, disconnectRedisClient } from '../config/client.js';

beforeAll(async () => {
  await initializeRedisClient();
});

afterAll(async () => {
  await disconnectRedisClient();
});