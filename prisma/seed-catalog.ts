import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "tienda-demo",
    },
  });

  if (!tenant) {
    throw new Error("No existe el tenant tienda-demo.");
  }

  const ropa = await prisma.category.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: "ropa",
      },
    },
    update: {
      name: "Ropa",
      description: "Prendas de vestir",
    },
    create: {
      tenantId: tenant.id,
      name: "Ropa",
      slug: "ropa",
      description: "Prendas de vestir",
    },
  });

  const accesorios = await prisma.category.upsert({
    where: {
      tenantId_slug: {
        tenantId: tenant.id,
        slug: "accesorios",
      },
    },
    update: {
      name: "Accesorios",
      description: "Accesorios y complementos",
    },
    create: {
      tenantId: tenant.id,
      name: "Accesorios",
      slug: "accesorios",
      description: "Accesorios y complementos",
    },
  });

  await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: "CAM-001",
      },
    },
    update: {
      name: "Camiseta básica",
      slug: "camiseta-basica",
      categoryId: ropa.id,
      price: 45000,
      active: true,
    },
    create: {
      tenantId: tenant.id,
      categoryId: ropa.id,
      name: "Camiseta básica",
      slug: "camiseta-basica",
      description: "Camiseta básica de algodón",
      sku: "CAM-001",
      price: 45000,
      active: true,
    },
  });

  await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: "PAN-001",
      },
    },
    update: {
      name: "Pantalón clásico",
      slug: "pantalon-clasico",
      categoryId: ropa.id,
      price: 85000,
      active: true,
    },
    create: {
      tenantId: tenant.id,
      categoryId: ropa.id,
      name: "Pantalón clásico",
      slug: "pantalon-clasico",
      description: "Pantalón clásico para uso diario",
      sku: "PAN-001",
      price: 85000,
      active: true,
    },
  });

  await prisma.product.upsert({
    where: {
      tenantId_sku: {
        tenantId: tenant.id,
        sku: "GOR-001",
      },
    },
    update: {
      name: "Gorra",
      slug: "gorra",
      categoryId: accesorios.id,
      price: 35000,
      active: true,
    },
    create: {
      tenantId: tenant.id,
      categoryId: accesorios.id,
      name: "Gorra",
      slug: "gorra",
      description: "Gorra casual",
      sku: "GOR-001",
      price: 35000,
      active: true,
    },
  });

  console.log("Catálogo creado correctamente.");
  console.log("Tenant: Tienda Demo");
  console.log("Categorías: 2");
  console.log("Productos: 3");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });