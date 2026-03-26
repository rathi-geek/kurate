import { ErrorBoundaryCore } from './ErrorBoundaryCore';
import ErrorFallback from './ErrorFallback';
import { ErrorInfo, FC, useCallback } from 'react';

type GlobalErrorBoundaryProps = { children: React.ReactNode };

export const GlobalErrorBoundary: FC<GlobalErrorBoundaryProps> = ({
  children,
}) => {
  const handleError = useCallback((error: Error, info: ErrorInfo) => {
    console.error('Global Error Boundary caught an error:', error);
    console.error('Error Info:', info);
    // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
  }, []);

  const handleReset = useCallback(() => {
    // TODO: Reset any global state, clear async tasks, clear caches, etc.
    console.log('App-level error recovery triggered');
  }, []);

  return (
    <ErrorBoundaryCore
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      onError={handleError}
    >
      {children}
    </ErrorBoundaryCore>
  );
};
