import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "dd/MM/yyyy") {
  return format(new Date(date), fmt, { locale: ptBR });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${(hours ?? "00").padStart(2, "0")}:${(minutes ?? "00").padStart(2, "0")}`;
}

export function translateRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "Administrador",
    PROFESSIONAL: "Profissional",
    RESPONSIBLE: "Responsável",
  };
  return map[role] ?? role;
}

export function translateSpecialty(specialty: string): string {
  const map: Record<string, string> = {
    AT: "Acompanhante Terapêutico",
    TO: "Terapeuta Ocupacional",
    FONO: "Fonoaudiologia",
    PSICO: "Psicologia",
    FISIO: "Fisioterapia",
    OTHER: "Outro",
  };
  return map[specialty] ?? specialty;
}

export function translateStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Agendado",
    IN_PROGRESS: "Em Andamento",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

export function translateDay(day: string): string {
  const map: Record<string, string> = {
    MONDAY: "Segunda-feira",
    TUESDAY: "Terça-feira",
    WEDNESDAY: "Quarta-feira",
    THURSDAY: "Quinta-feira",
    FRIDAY: "Sexta-feira",
    SATURDAY: "Sábado",
  };
  return map[day] ?? day;
}
