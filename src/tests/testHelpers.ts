/**
 * Log API response body when status is not 2xx. Use after a request to see why a test failed.
 */
export function logIfNotSuccess(res: { statusCode: number; body: unknown }): void {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error('[Test] Non-2xx response:', res.statusCode, JSON.stringify(res.body, null, 2));
    }
  }