# API ERP Tienda

Prefijo global: `/api`  
Formato de respuesta (excepto autenticación directa):

```json
{ "ok": true, "mensaje": "...", "datos": { } }
```

Autenticación: header `Authorization: Bearer <token>` (salvo login).

---

## Salud

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/salud` | No |

---

## Autenticación

| Método | Ruta | Body |
|--------|------|------|
| POST | `/autenticacion/inicio-sesion` | `{ nombreUsuario, contrasena }` |
| GET | `/autenticacion/sesion-actual` | — |
| POST | `/autenticacion/cierre-sesion` | — |

Respuesta login: `{ accessToken, usuario: { id, nombreUsuario, rol } }`

---

## Categorías

| Método | Ruta |
|--------|------|
| GET | `/categorias` |
| POST | `/categorias` |
| PATCH | `/categorias/:id` |
| DELETE | `/categorias/:id` |

---

## Catálogo

| Método | Ruta |
|--------|------|
| GET | `/catalogo/productos` |
| GET | `/catalogo/productos/:id` |
| POST | `/catalogo/productos` |
| PATCH | `/catalogo/productos/:id` |
| DELETE | `/catalogo/productos/:id` |
| GET | `/catalogo/variantes?productoId=` |
| POST | `/catalogo/variantes` |
| PATCH | `/catalogo/variantes/:id` |
| DELETE | `/catalogo/variantes/:id` |

---

## Clientes

| Método | Ruta |
|--------|------|
| GET | `/clientes` |
| GET | `/clientes/:id` |
| POST | `/clientes` |
| PATCH | `/clientes/:id` |
| PATCH | `/clientes/:id/habilitado` |

### Cuenta corriente

| Método | Ruta |
|--------|------|
| GET | `/clientes/:clienteId/cuenta-corriente/saldo` |
| GET | `/clientes/:clienteId/cuenta-corriente/movimientos` |
| POST | `/clientes/:clienteId/cuenta-corriente/pago` |

---

## Proveedores

| Método | Ruta |
|--------|------|
| GET | `/proveedores` |
| GET | `/proveedores/:id` |
| POST | `/proveedores` |
| PATCH | `/proveedores/:id` |
| PATCH | `/proveedores/:id/habilitado` |

---

## Stock

| Método | Ruta |
|--------|------|
| GET | `/stock/resumen` |
| GET | `/stock/cantidad/:varianteId` |
| GET | `/stock/movimientos` |
| POST | `/stock/ajuste-conteo` |
| POST | `/stock/entrada-manual` |

---

## Compras

| Método | Ruta |
|--------|------|
| GET | `/compras` |
| GET | `/compras/:id` |
| POST | `/compras` |

---

## Ventas

| Método | Ruta |
|--------|------|
| GET | `/ventas` |
| GET | `/ventas/:id` |
| POST | `/ventas` |

Al registrar venta: valida stock, descuenta existencias, registra movimientos. Si `formaPago` es `CUENTA_CORRIENTE` y hay `clienteId`, genera cargo en cuenta corriente.

---

## Usuarios

| Método | Ruta |
|--------|------|
| GET | `/usuarios` |
| GET | `/usuarios/:id` |
| POST | `/usuarios` |
| PATCH | `/usuarios/:id` |
| PATCH | `/usuarios/:id/permisos` |
| PATCH | `/usuarios/:id/habilitado` |
| POST | `/usuarios/:id/blanquear-contrasena` |
| DELETE | `/usuarios/:id` |

Reglas de negocio: Dueño no gestiona ADMIN; siempre al menos un ADMIN o Dueño habilitado.
