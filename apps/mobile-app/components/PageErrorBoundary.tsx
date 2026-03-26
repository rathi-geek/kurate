import { ErrorBoundaryCore } from './ErrorBoundaryCore';
import { ErrorInfo, FC, useCallback } from 'react';
import ErrorFallback from './ErrorFallback';

type PageErrorBoundaryProps = {
  children: React.ReactNode;
  onRetry?: () => void;
};

export const PageErrorBoundary: FC<PageErrorBoundaryProps> = ({
  children,
  onRetry,
}) => {
  const handleError = useCallback((error: Error, info: ErrorInfo) => {
    console.log('Local Error Boundary caught an error:', error);
    console.log('Error Info:', info);
    // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
  }, []);

  const handleReset = useCallback(() => {
    // TODO: Re-run route-level initialization, refetch data, etc.
    onRetry?.();
    console.log('Page-level error recovery triggered');
  }, [onRetry]);

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
