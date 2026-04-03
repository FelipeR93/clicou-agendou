import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAprendizSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;

  if (role === "ADMIN") {
    const aprendizes = await prisma.aprendiz.findMany({
      include: { responsible: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(aprendizes);
  }

  if (role === "RESPONSIBLE") {
    const responsible = await prisma.responsible.findUnique({ where: { userId } });
    if (!responsible) return NextResponse.json([]);
    const aprendizes = await prisma.aprendiz.findMany({
      where: { responsibleId: responsible.id, active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(aprendizes);
  }

  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createAprendizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, dateOfBirth, diagnosis, notes, responsibleId } = parsed.data;
    const aprendiz = await prisma.aprendiz.create({
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        diagnosis,
        notes,
        responsibleId,
      },
    });

    return NextResponse.json(aprendiz, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
