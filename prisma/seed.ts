import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin12345!", 12);
  const ownerPasswordHash = await bcrypt.hash("Owner12345!", 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@ecommerce.local",
    },
    update: {
      role: "SUPER_ADMIN",
      tenantId: null,
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "Administrador",
      email: "admin@ecommerce.local",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: {
      slug: "tienda-demo",
    },
    update: {
      name: "Tienda Demo",
    },
    create: {
      name: "Tienda Demo",
      slug: "tienda-demo",
    },
  });

  const owner = await prisma.user.upsert({
    where: {
      email: "owner@tienda-demo.local",
    },
    update: {
      name: "Propietario Demo",
      role: "OWNER",
      tenantId: tenant.id,
      passwordHash: ownerPasswordHash,
    },
    create: {
      name: "Propietario Demo",
      email: "owner@tienda-demo.local",
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      tenantId: tenant.id,
    },
  });

  console.log("Seed completado.");
  console.log("");
  console.log("SUPER ADMIN:");
  console.log(`  ${admin.email}`);
  console.log("");
  console.log("TENANT:");
  console.log(`  ${tenant.name} (${tenant.slug})`);
  console.log("");
  console.log("OWNER:");
  console.log(`  ${owner.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });