import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function ensureAdminExists() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("⚠️  DATABASE_URL is not set — skipping admin user check.");
    return;
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.user.findUnique({
      where: { email: "admin@clicouagendou.com.br" },
    });

    if (!existing) {
      const rawPassword = process.env.ADMIN_INITIAL_PASSWORD ?? "Admin@123456";
      const password = await bcrypt.hash(rawPassword, 12);
      await prisma.user.create({
        data: {
          email: "admin@clicouagendou.com.br",
          password,
          name: "Administrador",
          role: "ADMIN",
        },
      });
      console.log("✅ Admin user created: admin@clicouagendou.com.br");
    }
  } catch (err) {
    console.error("⚠️  Could not ensure admin user exists:", err);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdminExists();
