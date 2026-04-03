import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  role: z.enum(["ADMIN", "PROFESSIONAL", "RESPONSIBLE"]),
});

export const createProfessionalSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  specialty: z.enum(["AT", "TO", "FONO", "PSICO", "FISIO", "OTHER"]),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const updateProfessionalSchema = z.object({
  name: z.string().min(2).optional(),
  specialty: z.enum(["AT", "TO", "FONO", "PSICO", "FISIO", "OTHER"]).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export const createAprendizSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  dateOfBirth: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  responsibleId: z.string().optional(),
});

export const createRoomSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional(),
  capacity: z.number().int().min(1).default(1),
});

export const createAvailabilitySchema = z.object({
  professionalId: z.string(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

export const createAppointmentSchema = z.object({
  aprendizId: z.string(),
  professionalId: z.string(),
  roomId: z.string().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  notes: z.string().optional(),
});

export const startAttendanceSchema = z.object({
  appointmentId: z.string(),
});

export const endAttendanceSchema = z.object({
  appointmentId: z.string(),
  notes: z.string().optional(),
});
