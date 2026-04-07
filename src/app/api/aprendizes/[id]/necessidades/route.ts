import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createNeedSchema = z.object({
  specialty: z.enum(["AT", "TO", "FONO", "PSICO", "FISIO", "OTHER"]),
  sessionsPerWeek: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const needs = await prisma.aprendizNeed.findMany({
    where: { aprendizId: id, active: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(needs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createNeedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const aprendiz = await prisma.aprendiz.findUnique({ where: { id } });
    if (!aprendiz) return NextResponse.json({ error: "Aprendiz não encontrado" }, { status: 404 });

    const need = await prisma.aprendizNeed.create({
      data: {
        aprendizId: id,
        specialty: parsed.data.specialty,
        sessionsPerWeek: parsed.data.sessionsPerWeek,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json(need, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
