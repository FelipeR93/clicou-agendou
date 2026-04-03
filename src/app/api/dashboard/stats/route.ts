import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  if (role === "ADMIN") {
    const [professionals, aprendizes, today, week, completed] = await Promise.all([
      prisma.professional.count({ where: { active: true } }),
      prisma.aprendiz.count({ where: { active: true } }),
      prisma.appointment.count({ where: { scheduledStart: { gte: startOfDay, lt: endOfDay } } }),
      prisma.appointment.count({ where: { scheduledStart: { gte: startOfWeek, lt: endOfWeek } } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
    ]);
    return NextResponse.json({ professionals, aprendizes, today, week, completed });
  }

  if (role === "PROFESSIONAL") {
    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional) return NextResponse.json({ today: 0, week: 0, completed: 0 });
    const [today, week, completed] = await Promise.all([
      prisma.appointment.count({ where: { professionalId: professional.id, scheduledStart: { gte: startOfDay, lt: endOfDay } } }),
      prisma.appointment.count({ where: { professionalId: professional.id, scheduledStart: { gte: startOfWeek, lt: endOfWeek } } }),
      prisma.appointment.count({ where: { professionalId: professional.id, status: "COMPLETED" } }),
    ]);
    return NextResponse.json({ today, week, completed });
  }

  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}
