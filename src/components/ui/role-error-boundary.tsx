"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface RoleErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  redirectPath: string;
  redirectLabel: string;
}

export function RoleErrorBoundary({ error, reset, redirectPath, redirectLabel }: RoleErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar página</h2>
      <p className="text-gray-500 mb-6">
        Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href={redirectPath}>{redirectLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
