import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { role, id: userId } = session.user;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      aprendiz: { select: { id: true, name: true } },
      professional: { include: { user: { select: { name: true } } } },
      room: { select: { id: true, name: true } },
      attendanceLogs: true,
    },
  });

  if (!appointment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (role === "PROFESSIONAL") {
    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional || appointment.professionalId !== professional.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  } else if (role === "RESPONSIBLE") {
    const responsible = await prisma.responsible.findUnique({ where: { userId } });
    if (!responsible) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    const aprendiz = await prisma.aprendiz.findFirst({
      where: { id: appointment.aprendizId, responsibleId: responsible.id },
    });
    if (!aprendiz) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(appointment);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(body.scheduledStart && { scheduledStart: new Date(body.scheduledStart) }),
        ...(body.scheduledEnd && { scheduledEnd: new Date(body.scheduledEnd) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.roomId !== undefined && { roomId: body.roomId }),
      },
    });
    return NextResponse.json(appointment);
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED", cancelReason: body.cancelReason ?? "Cancelado pelo administrador" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
