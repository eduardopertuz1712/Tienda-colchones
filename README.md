# Plataforma E-commerce Multi-Tienda

Una sola aplicación que aloja **varias tiendas independientes**. Cada
negocio tiene su catálogo, su inventario, sus clientes y sus pedidos, y
los datos de una tienda nunca se mezclan con los de otra.

```
                    PLATAFORMA
                         │
          ┌──────────────┴──────────────┐
      SUPER ADMIN                    CLIENTES
    administra todo                  compran
          │                             │
    ┌─────┴─────┐                   Productos
 Tienda A   Tienda B                 Carrito
    │           │                   Checkout
 Productos  Productos                Pedido
 Pedidos    Pedidos
 Clientes   Clientes
```

## Stack

Next.js 16 · TypeScript · Tailwind CSS 4 · Prisma 7 · PostgreSQL · Auth.js v5

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Base de datos (Arch/CachyOS)
sudo systemctl enable --now postgresql

# 3. Variables de entorno
cp .env.example .env    # y edita DATABASE_URL y AUTH_SECRET

# 4. Esquema y datos de ejemplo
npx prisma migrate deploy
npm run db:seed

# 5. Arrancar
npm run dev
```

| Dónde | URL |
|---|---|
| Tienda pública | http://localhost:3000/tienda/tienda-demo |
| Panel | http://localhost:3000/login |

Usuarios del seed:

| Rol | Correo | Contraseña |
|---|---|---|
| Super Admin | `admin@ecommerce.local` | `Admin12345!` |
| Propietario | `owner@tienda-demo.local` | `Owner12345!` |

> Los productos del seed vienen con stock 0. Cárgales existencias desde
> **Inventario → Movimientos** para poder comprarlos.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # compilar para producción
npm start          # servir lo compilado
npm test           # suite de pruebas (46)
npm run lint       # revisar el código
npm run db:seed    # datos de ejemplo
```

## Qué hace

**Para el comprador**

Catálogo con búsqueda y filtro por categoría, ficha de producto, carrito
que funciona sin cuenta, checkout con dirección y método de pago,
comprobante de compra por correo y en pantalla, y una zona de cuenta con
su historial de pedidos.

**Para el dueño de la tienda**

Panel con ventas del día y del mes, gráfica de los últimos 14 días,
últimos pedidos y aviso de stock bajo. Gestión completa de productos con
imágenes, categorías anidadas, inventario con histórico de movimientos,
pedidos con su ciclo de estados, clientes, y configuración de identidad,
contacto y envío. También administra su equipo.

**Para el administrador de la plataforma**

Vista global de los productos de todas las tiendas, con filtro por
tienda, y capacidad de corregir información de cualquiera de ellas sin
entrar a la base de datos.

## Roles

Cuatro roles con alcances distintos: **Super Admin** (toda la
plataforma), **Propietario** (su tienda), **Administrador** (su tienda,
sin usuarios ni configuración) y **Empleado** (consulta, inventario y
pedidos). Los compradores son una entidad aparte, aislada por tienda.

→ **[docs/ROLES.md](docs/ROLES.md)** explica en detalle qué puede hacer
cada uno y cómo se aplican los permisos.

## Decisiones de arquitectura

Las que conviene conocer antes de tocar el código:

**El aislamiento entre tiendas se comprueba en el servidor.** Cada
consulta filtra por tienda, y todo identificador que llega del navegador
se vuelve a validar contra la tienda de quien lo envía. Ocultar un botón
no es seguridad: un usuario puede llamar al servidor directamente.

**El stock se descuenta con `UPDATE ... WHERE stock >= cantidad`.** La
condición la evalúa PostgreSQL, no la aplicación. Si dos personas
compran la última unidad a la vez, una falla en la base de datos en
lugar de dejar el stock en negativo.

**El checkout es una única transacción.** Vuelve a leer el precio, lo
congela en la línea del pedido y descuenta el stock. Si algo falla, se
deshace todo: no queda ni pedido a medias ni stock descontado.

**Los pedidos guardan una copia de lo comprado.** Nombre, SKU y precio
quedan escritos en el pedido, así que un pedido antiguo sigue siendo
legible aunque el producto cambie de precio o se elimine.

**El stock nunca se edita a mano.** Solo cambia mediante movimientos,
cada uno con su motivo, de forma que el histórico siempre explica el
saldo actual.

**El envío lo calcula el servidor** a partir de la configuración de la
tienda, nunca desde el formulario del comprador.

## Estructura

```
src/
├── app/
│   ├── (raíz)          catálogo de tiendas
│   ├── login/          acceso al panel y recuperación
│   ├── dashboard/      panel de la tienda
│   ├── super-admin/    panel de la plataforma
│   ├── tienda/[slug]/  tienda pública
│   └── uploads/        servicio de imágenes
├── components/
├── lib/                lógica de negocio
│   ├── permissions.ts  quién puede hacer qué
│   ├── catalog.ts      productos
│   ├── inventory.ts    stock y movimientos
│   ├── orders.ts       checkout y pedidos
│   └── ...
└── generated/prisma/   cliente generado (no se edita)

prisma/migrations/      historial del esquema
tests/                  pruebas automáticas
docs/                   documentación
```

## Correo

El envío de comprobantes funciona si hay SMTP configurado. Sin él, los
mensajes se escriben en la consola del servidor, de modo que el proyecto
funciona en desarrollo sin montar un servidor de correo.

```env
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=tu-usuario
SMTP_PASSWORD=tu-contraseña
MAIL_FROM="Mi Tienda <no-reply@mitienda.com>"
```

## Antes de producción

- **Las imágenes se guardan en el disco local** (`uploads/`). Eso no
  sobrevive a un despliegue en la nube: hay que moverlas a S3, Cloudflare
  R2 o similar.
- **No hay pasarela de pago.** Los métodos actuales son contra entrega y
  transferencia, sin cobro automático.
- **El comprobante no es una factura electrónica.** En Colombia, una
  factura con validez fiscal debe estar autorizada y numerada por la
  DIAN, lo que exige integrar un proveedor autorizado.
- Faltan copias de seguridad, HTTPS y monitorización.

## Licencia

Proyecto privado.
