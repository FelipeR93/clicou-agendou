"use client";

import { RoleErrorBoundary } from "@/components/ui/role-error-boundary";

export default function ProfessionalError({
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
      redirectPath="/profissional/agenda"
      redirectLabel="Ver minha agenda"
    />
  );
}
