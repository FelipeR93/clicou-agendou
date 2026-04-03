"use client";

import { RoleErrorBoundary } from "@/components/ui/role-error-boundary";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RoleErrorBoundary
      error={error}
      reset={reset}
      redirectPath="/admin/dashboard"
      redirectLabel="Ir ao Dashboard"
    />
  );
}
