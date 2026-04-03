import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfessionalSchema } from "@/lib/validators";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, active: true } },
      availabilities: true,
    },
  });

  if (!professional) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(professional);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateProfessionalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, specialty, phone, bio } = parsed.data;

    const professional = await prisma.$transaction(async (tx) => {
      const prof = await tx.professional.findUnique({ where: { id } });
      if (!prof) throw new Error("Não encontrado");
      if (name) {
        await tx.user.update({ where: { id: prof.userId }, data: { name } });
      }
      return tx.professional.update({
        where: { id },
        data: { ...(specialty && { specialty }), phone, bio },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    return NextResponse.json(professional);
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
    await prisma.$transaction(async (tx) => {
      const prof = await tx.professional.findUnique({ where: { id } });
      if (!prof) throw new Error("Não encontrado");
      await tx.professional.update({ where: { id }, data: { active: false } });
      await tx.user.update({ where: { id: prof.userId }, data: { active: false } });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
