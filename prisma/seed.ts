import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@clicouagendou.com.br" },
    update: {},
    create: {
      email: "admin@clicouagendou.com.br",
      password: hashedPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  console.log("✅ Admin user:", admin.email);
  console.log("🔑 Password: Admin@123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
