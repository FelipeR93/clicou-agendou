"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Baby,
  DoorOpen,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/profissionais", icon: Users, label: "Profissionais" },
  { href: "/admin/aprendizes", icon: Baby, label: "Aprendizes" },
  { href: "/admin/salas", icon: DoorOpen, label: "Salas" },
  { href: "/admin/agendamentos", icon: Calendar, label: "Agendamentos" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-teal-700 text-white flex flex-col">
      <div className="p-6 border-b border-teal-600">
        <h1 className="text-xl font-bold">Clicou Agendou</h1>
        <p className="text-teal-200 text-xs mt-1">Administração</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-teal-600 text-white"
                : "text-teal-100 hover:bg-teal-600 hover:text-white"
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
