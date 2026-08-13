import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Admin12345!", 12);

  const user = await prisma.user.upsert({
    where: {
      email: "admin@ecommerce.local",
    },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@ecommerce.local",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Usuario creado:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });