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
    <aside className="w-64 min-h-screen bg-blue-800 text-white flex flex-col shadow-lg">
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-blue-700 text-xs font-bold">CA</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Clicou Agendou</h1>
        </div>
        <p className="text-blue-200 text-xs ml-11">Administração</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              pathname === href
                ? "bg-white text-blue-800 shadow-sm"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-700">
        <p className="text-blue-300 text-xs text-center">Clínica TEA · v1.0</p>
      </div>
    </aside>
  );
}
