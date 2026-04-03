"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/profissional/agenda", icon: Calendar, label: "Minha Agenda" },
  { href: "/profissional/disponibilidade", icon: Clock, label: "Disponibilidade" },
];

export function ProfessionalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-blue-700 text-white flex flex-col">
      <div className="p-6 border-b border-blue-600">
        <h1 className="text-xl font-bold">Clicou Agendou</h1>
        <p className="text-blue-200 text-xs mt-1">Profissional</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-600 text-white"
                : "text-blue-100 hover:bg-blue-600 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
