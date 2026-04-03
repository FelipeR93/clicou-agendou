import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { role, id: userId } = session.user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  let profile = null;
  if (role === "PROFESSIONAL") {
    profile = await prisma.professional.findUnique({ where: { userId } });
  } else if (role === "RESPONSIBLE") {
    profile = await prisma.responsible.findUnique({ where: { userId } });
  }

  return NextResponse.json({ ...user, profile });
}
