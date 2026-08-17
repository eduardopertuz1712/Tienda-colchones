# Plataforma E-commerce Multi-Tienda

Una sola aplicación que aloja **varias tiendas independientes**. Cada
negocio tiene su catálogo, sus clientes y sus pedidos, y los datos de
una tienda nunca se mezclan con los de otra.

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

> El seed crea la tienda demo y sus dos usuarios, sin productos. Entra
> como Propietario y crea el catálogo, o como Super Admin y crea otra
> tienda desde **Tiendas → Nueva tienda**.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # compilar para producción
npm start          # servir lo compilado
npm test           # suite de pruebas
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

Panel con ventas del día y del mes, gráfica de los últimos 14 días y
últimos pedidos. Gestión completa de productos con imágenes, categorías
anidadas, pedidos con su ciclo de estados, clientes y ventas. También
administra su equipo, dando de alta empleados.

**Para el administrador de la plataforma**

Alta de tiendas con su propietario, suspensión y reactivación, y la
configuración de cada una: identidad, color, moneda, contacto, redes y
costos de envío. Cambia de una tienda a otra sin cerrar sesión. Además,
vista global de los productos de todas las tiendas, con filtro por
tienda, y capacidad de corregir información de cualquiera de ellas sin
entrar a la base de datos.

## Roles

Cuatro roles con alcances distintos: **Super Admin** (toda la
plataforma, incluida la configuración de cada tienda), **Propietario**
(su tienda), **Administrador** (su tienda, sin usuarios ni
configuración) y **Empleado** (consulta y pedidos). Los compradores son
una entidad aparte, aislada por tienda.

→ **[docs/ROLES.md](docs/ROLES.md)** explica en detalle qué puede hacer
cada uno y cómo se aplican los permisos.

## Decisiones de arquitectura

Las que conviene conocer antes de tocar el código:

**El aislamiento entre tiendas se comprueba en el servidor.** Cada
consulta filtra por tienda, y todo identificador que llega del navegador
se vuelve a validar contra la tienda de quien lo envía. Ocultar un botón
no es seguridad: un usuario puede llamar al servidor directamente.

**El checkout es una única transacción.** Vuelve a leer el precio y lo
congela en la línea del pedido. Si algo falla, se deshace todo: no queda
ningún pedido a medias.

**No hay control de existencias.** El catálogo no lleva stock: se vende
lo que esté publicado. Es deliberado, porque los negocios a los que
apunta la plataforma no llevan inventario formal y un contador de
existencias mal mantenido estorba más de lo que ayuda.

**Los pedidos guardan una copia de lo comprado.** Nombre, SKU y precio
quedan escritos en el pedido, así que un pedido antiguo sigue siendo
legible aunque el producto cambie de precio o se elimine.

**El envío lo calcula el servidor** a partir de la configuración de la
tienda, nunca desde el formulario del comprador.

**La configuración de cada tienda la lleva el Super Admin.** Los números
que cuestan dinero —costo de envío, umbral de envío gratis, moneda— no
están en el panel del Propietario, para que haya un solo responsable de
ellos.

**El Propietario da de alta Empleados, no Administradores.** Si cada
Propietario puede repartir el rol de Administrador, en poco tiempo nadie
sabe quién puede qué dentro de la tienda. Cuando de verdad hace falta un
Administrador, lo asigna el Super Admin.

**Suspender una tienda no borra nada.** Deja de verse para los
compradores y conserva productos, pedidos y clientes intactos. Es
reversible, y por eso se prefiere a eliminar.

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
│   ├── tenants.ts      alta y estado de las tiendas
│   ├── settings.ts     configuración de cada tienda
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
