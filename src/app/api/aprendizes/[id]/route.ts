import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAprendizSchema } from "@/lib/validators";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { role, id: userId } = session.user;

  const aprendiz = await prisma.aprendiz.findUnique({
    where: { id },
    include: {
      responsible: { include: { user: { select: { name: true, email: true } } } },
      needs: true,
    },
  });

  if (!aprendiz) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (role === "RESPONSIBLE") {
    const responsible = await prisma.responsible.findUnique({ where: { userId } });
    if (!responsible || aprendiz.responsibleId !== responsible.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(aprendiz);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createAprendizSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, dateOfBirth, diagnosis, notes, responsibleId } = parsed.data;
    const aprendiz = await prisma.aprendiz.update({
      where: { id },
      data: {
        ...(name && { name }),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        diagnosis,
        notes,
        responsibleId,
      },
    });

    return NextResponse.json(aprendiz);
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.aprendiz.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
