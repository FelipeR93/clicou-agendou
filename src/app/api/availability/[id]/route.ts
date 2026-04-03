import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;
  const { id } = await params;

  try {
    const availability = await prisma.availability.findUnique({
      where: { id },
      include: { professional: true },
    });
    if (!availability) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (role === "PROFESSIONAL") {
      const professional = await prisma.professional.findUnique({ where: { userId } });
      if (!professional || availability.professionalId !== professional.id) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.availability.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
