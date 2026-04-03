import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/validators";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;
  const { searchParams } = req.nextUrl;
  const dateParam = searchParams.get("date");
  const professionalIdParam = searchParams.get("professionalId");
  const aprendizIdParam = searchParams.get("aprendizId");
  const statusParam = searchParams.get("status");

  const where: Prisma.AppointmentWhereInput = {};

  if (dateParam) {
    const date = new Date(dateParam);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.scheduledStart = { gte: date, lt: nextDay };
  }
  if (professionalIdParam) where.professionalId = professionalIdParam;
  if (aprendizIdParam) where.aprendizId = aprendizIdParam;
  if (statusParam) where.status = statusParam as Prisma.AppointmentWhereInput["status"];

  if (role === "PROFESSIONAL") {
    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional) return NextResponse.json([]);
    where.professionalId = professional.id;
  } else if (role === "RESPONSIBLE") {
    const responsible = await prisma.responsible.findUnique({ where: { userId } });
    if (!responsible) return NextResponse.json([]);
    const aprendizes = await prisma.aprendiz.findMany({ where: { responsibleId: responsible.id } });
    where.aprendizId = { in: aprendizes.map((a) => a.id) };
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      aprendiz: { select: { id: true, name: true } },
      professional: { include: { user: { select: { name: true } } } },
      room: { select: { id: true, name: true } },
      attendanceLogs: true,
    },
    orderBy: { scheduledStart: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { aprendizId, professionalId, roomId, scheduledStart, scheduledEnd, notes } = parsed.data;
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    const hasOverlap = (extraWhere: Prisma.AppointmentWhereInput) =>
      prisma.appointment.findFirst({
        where: {
          ...extraWhere,
          status: { notIn: ["CANCELLED"] },
          OR: [{ scheduledStart: { lt: end }, scheduledEnd: { gt: start } }],
        },
      });

    if (await hasOverlap({ professionalId })) {
      return NextResponse.json({ error: "Profissional já tem agendamento nesse horário" }, { status: 400 });
    }
    if (await hasOverlap({ aprendizId })) {
      return NextResponse.json({ error: "Aprendiz já tem agendamento nesse horário" }, { status: 400 });
    }
    if (roomId && (await hasOverlap({ roomId }))) {
      return NextResponse.json({ error: "Sala já ocupada nesse horário" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: { aprendizId, professionalId, roomId, scheduledStart: start, scheduledEnd: end, notes, createdById: session.user.id },
      include: {
        aprendiz: { select: { id: true, name: true } },
        professional: { include: { user: { select: { name: true } } } },
        room: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
