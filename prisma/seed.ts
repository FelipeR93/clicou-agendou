import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPass = await bcrypt.hash("Admin@123456", 12);
  const profPass = await bcrypt.hash("Prof@123456", 12);
  const respPass = await bcrypt.hash("Resp@123456", 12);

  // ── Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@clicouagendou.com.br" },
    update: {},
    create: {
      email: "admin@clicouagendou.com.br",
      password: adminPass,
      name: "Administrador",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", admin.email, "/ senha: Admin@123456");

  // ── Profissionais ─────────────────────────────────────────────────────────
  const profData = [
    {
      email: "ana.silva@clicouagendou.com.br",
      name: "Ana Silva",
      specialty: "AT" as const,
      phone: "(11) 91111-0001",
      bio: "Acompanhante Terapêutica com 5 anos de experiência.",
    },
    {
      email: "carlos.terapia@clicouagendou.com.br",
      name: "Carlos Oliveira",
      specialty: "TO" as const,
      phone: "(11) 91111-0002",
      bio: "Terapeuta Ocupacional especializado em autismo.",
    },
    {
      email: "julia.fono@clicouagendou.com.br",
      name: "Júlia Santos",
      specialty: "FONO" as const,
      phone: "(11) 91111-0003",
      bio: "Fonoaudióloga com foco em comunicação alternativa.",
    },
    {
      email: "marcos.psico@clicouagendou.com.br",
      name: "Marcos Lima",
      specialty: "PSICO" as const,
      phone: "(11) 91111-0004",
      bio: "Psicólogo clínico infantil.",
    },
    {
      email: "fernanda.fisio@clicouagendou.com.br",
      name: "Fernanda Costa",
      specialty: "FISIO" as const,
      phone: "(11) 91111-0005",
      bio: "Fisioterapeuta pediátrica.",
    },
  ];

  for (const pd of profData) {
    const user = await prisma.user.upsert({
      where: { email: pd.email },
      update: {},
      create: {
        email: pd.email,
        password: profPass,
        name: pd.name,
        role: "PROFESSIONAL",
      },
    });

    const prof = await prisma.professional.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialty: pd.specialty,
        phone: pd.phone,
        bio: pd.bio,
      },
    });

    // Disponibilidade padrão: segunda a sexta, 08h–17h
    const days = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ] as const;
    for (const day of days) {
      await prisma.availability.upsert({
        where: {
          professionalId_dayOfWeek_startTime: {
            professionalId: prof.id,
            dayOfWeek: day,
            startTime: "08:00",
          },
        },
        update: {},
        create: {
          professionalId: prof.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "17:00",
        },
      });
    }

    console.log("✅ Profissional:", user.email, "/ senha: Prof@123456");
  }

  // ── Responsáveis ──────────────────────────────────────────────────────────
  const respData = [
    {
      email: "maria.resp@clicouagendou.com.br",
      name: "Maria Fernandes",
      phone: "(11) 92222-0001",
      aprendizes: [
        {
          name: "Lucas Fernandes",
          dateOfBirth: new Date("2015-03-10"),
          diagnosis: "TEA nível 2",
          notes: "Gosta de música e rotinas estruturadas.",
        },
      ],
    },
    {
      email: "joao.resp@clicouagendou.com.br",
      name: "João Pereira",
      phone: "(11) 92222-0002",
      aprendizes: [
        {
          name: "Sofia Pereira",
          dateOfBirth: new Date("2018-07-22"),
          diagnosis: "Síndrome de Down",
          notes: "Muito comunicativa e sociável.",
        },
        {
          name: "Miguel Pereira",
          dateOfBirth: new Date("2016-11-05"),
          diagnosis: "TDAH",
          notes: "Precisa de suporte em foco e atenção.",
        },
      ],
    },
  ];

  for (const rd of respData) {
    const user = await prisma.user.upsert({
      where: { email: rd.email },
      update: {},
      create: {
        email: rd.email,
        password: respPass,
        name: rd.name,
        role: "RESPONSIBLE",
      },
    });

    const resp = await prisma.responsible.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        phone: rd.phone,
      },
    });

    for (const ap of rd.aprendizes) {
      const existing = await prisma.aprendiz.findFirst({
        where: { name: ap.name, responsibleId: resp.id },
      });
      if (!existing) {
        await prisma.aprendiz.create({
          data: {
            name: ap.name,
            dateOfBirth: ap.dateOfBirth,
            diagnosis: ap.diagnosis,
            notes: ap.notes,
            responsibleId: resp.id,
          },
        });
      }
    }

    console.log("✅ Responsável:", user.email, "/ senha: Resp@123456");
  }

  // ── Salas ─────────────────────────────────────────────────────────────────
  const rooms = [
    { name: "Sala 01", description: "Atendimento individual" },
    { name: "Sala 02", description: "Fisioterapia e TO" },
    { name: "Sala 03", description: "Fonoaudiologia" },
  ];

  for (const r of rooms) {
    const existing = await prisma.room.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.room.create({ data: r });
      console.log("✅ Sala criada:", r.name);
    }
  }

  console.log("\n🔑 Credenciais de acesso:");
  console.log("   Admin      → admin@clicouagendou.com.br  / Admin@123456");
  console.log("   Profissional→ ana.silva@...              / Prof@123456");
  console.log("   Responsável → maria.resp@...             / Resp@123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
