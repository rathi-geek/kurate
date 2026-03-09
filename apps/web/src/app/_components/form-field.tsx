interface FormFieldProps {
  /** Matches the `id` on the input inside. */
  htmlFor: string;
  label: string;
  /** Inline error message shown below the input. */
  error?: string;
  children: React.ReactNode;
}

/**
 * Standard label + input + inline error wrapper used across all forms.
 *
 * Usage:
 * ```tsx
 * <FormField htmlFor="login-email" label={t("email_label")} error={error}>
 *   <Input id="login-email" type="email" ... />
 * </FormField>
 * ```
 */
export function FormField({ htmlFor, label, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-foreground mb-2 block font-sans text-xs font-bold tracking-[0.08em] uppercase">
        {label}
      </label>
      {children}
      {error && <p className="text-destructive mt-1.5 font-sans text-sm">{error}</p>}
    </div>
  );
}
