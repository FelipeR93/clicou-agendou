import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startAttendanceSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = startAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { appointmentId } = parsed.data;
    const professional = await prisma.professional.findUnique({ where: { userId: session.user.id } });
    if (!professional) return NextResponse.json({ error: "Perfil profissional não encontrado" }, { status: 404 });

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    if (appointment.professionalId !== professional.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (appointment.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Agendamento não está no estado correto para iniciar" }, { status: 400 });
    }

    const now = new Date();
    const [updatedAppointment] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "IN_PROGRESS", actualStart: now },
      }),
      prisma.attendanceLog.create({
        data: { appointmentId, professionalId: professional.id, startedAt: now },
      }),
    ]);

    return NextResponse.json(updatedAppointment);
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
