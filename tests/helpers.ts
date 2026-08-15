import "dotenv/config";
import crypto from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Utilidades compartidas por las pruebas.
 *
 * Cada test crea sus propios tenants con un sufijo aleatorio y los borra
 * al terminar, así se pueden ejecutar sobre la base de desarrollo sin
 * pisar los datos existentes ni depender del orden de ejecución.
 */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

const created: string[] = [];

export async function makeTenant(prefix = "test") {
  const slug = `${prefix}-${crypto.randomBytes(4).toString("hex")}`;

  const tenant = await prisma.tenant.create({
    data: { name: `Tienda ${slug}`, slug },
  });

  created.push(tenant.id);

  return tenant;
}

export async function cleanup() {
  if (created.length > 0) {
    await prisma.tenant.deleteMany({ where: { id: { in: created } } });
    created.length = 0;
  }

  await prisma.$disconnect();
}
