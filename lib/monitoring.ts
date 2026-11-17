import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const componentStack =
    typeof context?.componentStack === 'string' ? context.componentStack : undefined;
  const route =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.pathname
      : undefined;
  const userAgent =
    Platform.OS === 'web' && typeof navigator !== 'undefined'
      ? navigator.userAgent
      : undefined;

  console.error('[app-error]', error, context ?? {});

  void supabase
    .rpc('log_client_error', {
      p_message: message,
      p_stack: stack ?? null,
      p_component_stack: componentStack ?? null,
      p_route: route ?? null,
      p_user_agent: userAgent ?? null,
    })
    .then(({ error: rpcError }) => {
      if (rpcError) console.error('[app-error-log]', rpcError.message);
    });
}
