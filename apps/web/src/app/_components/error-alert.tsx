interface ErrorAlertProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Banner-style error shown above a form (e.g. auth hash errors, API-level failures).
 * For inline field errors use `<FormField error={...}>` instead.
 *
 * Usage:
 * ```tsx
 * {authError && <ErrorAlert>{authError}</ErrorAlert>}
 * ```
 */
export function ErrorAlert({ children, className }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`bg-destructive/10 border-destructive/20 text-destructive mb-6 rounded-md border px-4 py-3 font-sans text-sm ${className ?? ""}`}>
      {children}
    </div>
  );
}
