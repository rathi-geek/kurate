"use client";

import { Input } from "@/components/ui/input";
import { FormField } from "@/app/_components/form-field";
import { validateUsername } from "@/app/_libs/utils/validate-username";
import type { HandleStatus } from "@/app/_libs/hooks/useUsernameAvailability";

interface UsernameFieldProps {
  username: string;
  onUsernameChange: (value: string) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
  status: HandleStatus;
  onStatusReset: () => void;
  label: string;
  placeholder: string;
}

export function UsernameField({
  username,
  onUsernameChange,
  error,
  onErrorChange,
  status,
  onStatusReset,
  label,
  placeholder,
}: UsernameFieldProps) {
  return (
    <FormField htmlFor="onboarding-username" label={label}>
      <Input
        id="onboarding-username"
        type="text"
        placeholder={placeholder}
        value={username}
        onChange={(e) => {
          const v = e.target.value.toLowerCase().replace(/\s/g, "");
          onUsernameChange(v);
          onErrorChange(v ? (validateUsername(v) ?? null) : null);
          onStatusReset();
        }}
        onBlur={() => {
          const v = username.trim();
          onErrorChange(v ? (validateUsername(v) ?? null) : "Required");
        }}
      />
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      {!error && status === "checking" && (
        <p className="text-muted-foreground text-xs mt-1">Checking…</p>
      )}
      {!error && status === "available" && (
        <p className="text-success text-xs mt-1">✓ Available</p>
      )}
      {!error && status === "taken" && (
        <p className="text-destructive text-xs mt-1">✗ Already taken</p>
      )}
    </FormField>
  );
}
