import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAvailabilitySchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;
  const professionalIdParam = req.nextUrl.searchParams.get("professionalId");

  if (role === "PROFESSIONAL") {
    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional) return NextResponse.json([]);
    const availabilities = await prisma.availability.findMany({
      where: { professionalId: professional.id },
      orderBy: { dayOfWeek: "asc" },
    });
    return NextResponse.json(availabilities);
  }

  if (role === "ADMIN") {
    const where = professionalIdParam ? { professionalId: professionalIdParam } : {};
    const availabilities = await prisma.availability.findMany({
      where,
      include: { professional: { include: { user: { select: { name: true } } } } },
      orderBy: { dayOfWeek: "asc" },
    });
    return NextResponse.json(availabilities);
  }

  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;

  try {
    const body = await req.json();
    const parsed = createAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { professionalId, dayOfWeek, startTime, endTime } = parsed.data;

    if (role === "PROFESSIONAL") {
      const professional = await prisma.professional.findUnique({ where: { userId } });
      if (!professional || professional.id !== professionalId) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const availability = await prisma.availability.create({
      data: { professionalId, dayOfWeek, startTime, endTime },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
