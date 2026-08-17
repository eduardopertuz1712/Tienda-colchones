# Roles y permisos

Este documento explica **qué puede hacer cada tipo de usuario**. Es la
referencia funcional; la implementación vive en
[`src/lib/permissions.ts`](../src/lib/permissions.ts).

---

## Los cuatro roles

| Rol | Alcance | Para quién es |
|---|---|---|
| **Super Admin** | Toda la plataforma | El dueño del sistema (tú) |
| **Propietario** (Owner) | Una tienda | El dueño de cada negocio |
| **Administrador** (Admin) | Una tienda | Encargado de confianza, lo asigna el Super Admin |
| **Empleado** (Staff) | Una tienda | Personal de bodega o atención |

Aparte están los **clientes** (compradores), que no son usuarios del
panel: viven en una tabla distinta y solo acceden a la tienda pública.

---

## Qué puede hacer cada uno

Leyenda: **T** = todo (ver, crear, editar, eliminar) · **V** = solo ver ·
**V+E** = ver y editar · **—** = sin acceso

| Módulo | Super Admin | Propietario | Administrador | Empleado |
|---|:---:|:---:|:---:|:---:|
| Productos | T | T | T | V |
| Categorías | T | T | T | V |
| Pedidos | T | T | T | V+E |
| Clientes | T | T | T | V |
| Ventas | V | V | V | — |
| Configuración de la tienda | V+E | — | — | — |
| Equipo (usuarios) | T | T | — | — |
| Tiendas | T | — | — | — |

---

## Super Admin

Es el administrador de la plataforma completa. Su diferencia con los
demás no es *qué* puede hacer, sino **sobre cuántas tiendas**.

- **Crea las tiendas** desde `/super-admin/tiendas`, junto con la cuenta
  de su propietario, y las suspende o reactiva cuando hace falta.
- **Configura cada tienda**: nombre, descripción, color, moneda,
  contacto, redes y costos de envío. Esto no lo hace el Propietario a
  propósito (ver más abajo).
- Ve y administra los productos de **todas** las tiendas desde
  `/super-admin/products`, con filtro por tienda y búsqueda.
- Puede corregir información que un Propietario introdujo mal, sin
  entrar a la base de datos.
- No tiene tienda propia: elige sobre cuál trabajar desde
  **Cambiar de tienda**, o entra directo desde la ficha de la tienda.

**Suspender no borra.** Una tienda suspendida deja de verse para los
compradores, pero conserva productos, pedidos y clientes intactos. Es
reversible.

**Detalle importante de diseño:** cuando el Super Admin edita un
producto, pasa exactamente por las mismas validaciones que un
Propietario. Amplía el alcance, no relaja las reglas. Por eso tampoco él
puede asignarle a un producto una categoría de otra tienda.

---

## Propietario

El dueño de un negocio. Administra **su tienda y solo la suya**.

Puede hacer toda la operación diaria sin depender del Super Admin:
productos, categorías, pedidos, clientes y ventas. Además gestiona su
equipo: da de alta Empleados y los desactiva.

**Lo que NO puede:**

- Ver o tocar datos de otra tienda.
- Cambiar la configuración de su tienda (identidad, contacto, envío).
- Dar de alta Administradores ni usuarios Super Admin.
- Crear o eliminar tiendas.

**Por qué no configura su propia tienda.** La configuración toca cosas
que cuestan dinero si se equivocan —el costo de envío, el umbral de
envío gratis, la moneda— y en la práctica la mayoría de propietarios
pide que se la dejen lista. La ajusta el Super Admin desde la ficha de
la tienda, y así hay un solo responsable de esos números.

**Por qué no crea Administradores.** Si cada Propietario puede repartir
el rol de Administrador, en poco tiempo nadie sabe quién puede qué
dentro de la tienda. El Propietario da de alta Empleados; si de verdad
hace falta un Administrador, lo asigna el Super Admin.

---

## Administrador

Un encargado de confianza. Opera la tienda igual que el Propietario,
pero **sin gestionar personas ni cambiar las reglas del negocio**:

- No da de alta ni desactiva usuarios.
- No accede a la configuración de la tienda.

Sirve para delegar la operación sin ceder el control. Este rol lo asigna
el Super Admin, no el Propietario.

---

## Empleado

Personal de bodega o atención al cliente. Trabaja con lo que ya existe:

- **Puede**: consultar productos y clientes, y mover pedidos de estado
  (confirmar, preparar, marcar como enviado).
- **No puede**: crear ni eliminar productos, ver ventas, ver la
  configuración ni gestionar usuarios.

Es el rol por defecto: si algo falla al asignar un rol, la persona queda
con los permisos más limitados, no con los más amplios.

---

## Clientes (compradores)

No son usuarios del panel. Tienen su propia tabla, su propia sesión y
solo existen dentro de una tienda.

Pueden ver el catálogo, añadir al carrito, comprar (con cuenta o como
invitados), consultar sus pedidos y ver su comprobante de compra.

**Están aislados por tienda.** El mismo correo puede tener cuenta en dos
tiendas distintas de la plataforma y son personas diferentes, con
historiales separados. Iniciar sesión en una tienda no da acceso a otra.

---

## Cómo se aplican estos permisos

Tres capas, y las tres importan:

1. **El menú** oculta lo que el rol no puede usar. Es solo comodidad
   visual, no seguridad.
2. **Cada página** vuelve a comprobar el permiso antes de mostrar nada.
3. **Cada operación de escritura** lo comprueba otra vez en el servidor,
   antes de tocar la base de datos.

La razón de la tercera capa: ocultar un botón no impide que alguien
llame directamente al servidor. Un Empleado que manipule el formulario
para intentar borrar un producto recibe un error, porque la comprobación
real no está en la pantalla.

Encima de todo esto, **cada consulta filtra por tienda**. Un Propietario
que pida un producto por su identificador no lo obtiene si pertenece a
otra tienda: no es que se le oculte, es que la consulta no lo devuelve.

---

## Preguntas frecuentes

**¿Puedo cambiar qué puede hacer cada rol?**
Sí. Todo está en la tabla `MATRIX` de
[`src/lib/permissions.ts`](../src/lib/permissions.ts). Cambiar ahí se
refleja automáticamente en el menú, las páginas y las operaciones.

**¿Qué pasa si desactivo a alguien?**
No puede iniciar sesión, y si tenía la sesión abierta deja de valer en
los siguientes minutos. Se desactiva en vez de borrar para conservar el
rastro de quién hizo qué.

**¿Puede un Propietario ascender a alguien a Propietario?**
No. El único rol que puede asignar es Empleado. Una tienda tiene un
único responsable.

**¿Cómo cambio el costo de envío de una tienda?**
Como Super Admin, en **Tiendas → la tienda → Configuración**. El
Propietario no tiene esa pantalla.

**Un empleado olvidó su contraseña, ¿qué hago?**
En **Equipo**, genera un enlace de recuperación y pásaselo. Caduca en
1 hora y solo sirve una vez.
