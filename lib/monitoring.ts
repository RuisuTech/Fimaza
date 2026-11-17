export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  console.error('[app-error]', error, context ?? {});
}
