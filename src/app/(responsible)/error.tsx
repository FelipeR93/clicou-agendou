"use client";

import { RoleErrorBoundary } from "@/components/ui/role-error-boundary";

export default function ResponsibleError({
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
      redirectPath="/responsavel/agenda"
      redirectLabel="Ver agenda"
    />
  );
}
