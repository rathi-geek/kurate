import React, { ErrorInfo, FC } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

type ErrorFallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

type ErrorBoundaryCoreProps = {
  FallbackComponent: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
  children: React.ReactNode;
};

export const ErrorBoundaryCore: FC<ErrorBoundaryCoreProps> = ({
  FallbackComponent,
  onError,
  onReset,
  children,
}) => {
  const handleError = (error: Error, info: ErrorInfo) => {
    try {
      onError?.(error, info);
    } catch (e) {
      // Guard against failures in reporting logic
      console.error('ErrorBoundaryCore onError handler failed', e);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryCore;
