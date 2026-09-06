# FimazaSys - Sistema de Inventario de Zapatillas

Aplicación multiplataforma para gestión de inventario de zapatillas, diseñada para negocios de calzado. Funciona en **iOS**, **Android** y **Web**.

---

## Inicio Rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) 18+
- npm o yarn
- Para iOS: [CocoaPods](https://cocoapods.org/) + Xcode
- Para Android: Android Studio + Android SDK

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/NextInventory.git
cd NextInventory
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar la aplicación

```bash
npx expo start --web
```

Esto abrirá el Expo DevTools en el navegador. Desde ahí puedes:

- **Expo Go** (iOS/Android): Escanea el código QR con la app Expo Go.
- **Web**: Presiona `w` en la terminal.
- **Simulador iOS**: Presiona `i` en la terminal.
- **Emulador Android**: Presiona `a` en la terminal.

### Credenciales por defecto

| Rol           | Email                  | Contraseña |
| ------------- | ---------------------- | ---------- |
| Administrador | `admin@inventario.com` | `admin123` |
| Colaborador   | `user@inventario.com`  | `user123`  |

### Scripts Disponibles

| Script                  | Descripción                           |
| ----------------------- | ------------------------------------- |
| `npm start`             | Inicia el servidor de desarrollo Expo |
| `npm run android`       | Abre en emulador Android              |
| `npm run ios`           | Abre en simulador iOS                 |
| `npm run web`           | Abre la versión web                   |
| `npm run lint`          | Ejecuta ESLint                        |
| `npm run reset-project` | Resetea el proyecto a estado inicial  |

---

## Stack Tecnológico

| Categoría      | Tecnología                                         |
| -------------- | -------------------------------------------------- |
| Framework      | Expo SDK 54 (React Native 0.81.5)                 |
| Router         | expo-router v6                                     |
| Lenguaje       | TypeScript 5.9.2                                   |
| Estilos        | NativeWind v4 + TailwindCSS + tema personalizado   |
| Navegación     | @react-navigation/bottom-tabs v7                   |
| Estado         | React Context (8 contextos)                        |
| Almacenamiento | @react-native-async-storage/async-storage          |
| Iconos         | @expo/vector-icons (Ionicons)                      |
| Haptics        | expo-haptics                                       |
| Animaciones    | react-native-reanimated v4                         |
| Imágenes       | expo-image v3                                      |
| Compartir      | expo-print + expo-sharing                          |
| Trabajo        | react-native-worklets                              |

---

## Base de Datos (DB_FIMAZA)

Motor: **Microsoft SQL Server (T-SQL)**. El script completo se encuentra en [`database/SQLQuery1-BD -FIMAZA -Releasse1.sql`](database/SQLQuery1-BD%20-FIMAZA%20-Releasse1.sql).

> **Nota:** La aplicación actualmente usa AsyncStorage como almacenamiento local con datos semilla en memoria. La estructura de datos en código es 1:1 con la BD SQL Server, permitiendo migración futura a backend.

### Diagrama de Relaciones

```
cargo ─────────────────────┐
                           │
empleado ──→ cargo         │
    │                      │
    ├──→ auditoria_sesion  │
    ├──→ actividad_log     │
    │                      │
    ├──→ historial_movimiento
    │         │            │
    │         ├──→ tipo_movimiento
    │         └──→ inventario
    │                  │   │
    │                  │   └──→ producto_variante
    │                  │            │
    │                  │            ├──→ producto ──→ marca
    │                  │            │       │   ──→ categoria
    │                  │            │       └──→ genero
    │                  │            │
    │                  │            ├──→ talla
    │                  │            └──→ color
    │                  │
    │                  └──→ venta_detalle ──→ venta_cabecera
    │                                          │
    │                                          └──→ cliente
    │
    └──→ compra_cabecera ──→ compra_detalle ──→ producto_variante
              │
              └──→ proveedor
```

### 1. Tablas Maestras (Catálogos)

| Tabla             | Campos Clave                                                                | Descripción                                    |
| ----------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| `cargo`           | id, nombre_cargo, descripcion, estado                                       | Roles: Administrador, Vendedor, Almacenero     |
| `marca`           | id, nombre_marca, estado                                                    | Marcas de zapatillas (Nike, Adidas, etc.)      |
| `categoria`       | id, nombre_categoria, descripcion                                           | Categorías (Running, Casual, Basketball, etc.) |
| `genero`          | id, nombre_genero, estado                                                   | Géneros (Hombre, Mujer, Unisex, Niño, Niña)    |
| `talla`           | id, numero_talla                                                            | Tallas (35-45)                                 |
| `color`           | id, nombre_color                                                            | Colores (Negro, Blanco, Rojo, etc.)            |
| `tipo_movimiento` | id, nombre_movimiento, naturaleza                                           | Tipos de movimiento de stock                   |
| `cliente`         | id, tipo_documento, numero_documento, nombres_razon_social, telefono        | Clientes (DNI, RUC, CE)                        |
| `proveedor`       | id, ruc, razon_social, telefono, direccion, email                           | Proveedores                                    |
| `promocion`       | id, nombre_promocion, porcentaje_descuento, fecha_inicio, fecha_fin, estado | Promociones con vigencia                       |

### 2. Tablas de Productos

| Tabla               | Campos Clave                                                                    | Descripción                           |
| ------------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| `producto`          | id, id_marca, id_categoria, id_genero, nombre, descripcion, estado              | Producto base (ej: "Nike Air Max 90") |
| `producto_variante` | id, id_producto, id_talla, id_color, codigo_barras, precio_compra, precio_venta | Variante específica con precios       |
| `inventario`        | id, id_variante, stock_actual, stock_minimo                                     | Stock por variante (1:1 con variante) |

**Relación Producto → Variante → Inventario:**

- Un `producto` tiene muchas `producto_variante` (cada talla/color es una variante)
- Cada `producto_variante` tiene exactamente un registro en `inventario`
- Los precios (`precio_compra`, `precio_venta`) viven a nivel de variante
- El `precio_venta` debe ser >= `precio_compra` (CHECK constraint)

### 3. Tablas de Movimientos

| Tabla                  | Campos Clave                                                                                  | Descripción                              |
| ---------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `historial_movimiento` | id, id_inventario, id_tipo_movimiento, id_empleado, cantidad, fecha_movimiento, observaciones | Registro de cada entrada/salida de stock |

**Tipos de Movimiento (4 tipos actuales):**

| ID  | Nombre          | Naturaleza | Uso                                          |
| --- | --------------- | ---------- | -------------------------------------------- |
| 1   | Compra          | Entrada    | Ingreso de mercadería por compra a proveedor |
| 2   | Ajuste positivo | Entrada    | Corrección manual de stock al alza           |
| 3   | Ajuste negativo | Salida     | Corrección manual de stock a la baja         |
| 4   | Merma           | Salida     | Pérdida, daño o vencimiento de mercadería    |

> **Nota:** Anteriormente existían 7 tipos (incluyendo Venta y Devoluciones). Se simplificaron a 4 porque las ventas registran su propio movimiento como `ajuste negativo` (tipo 3) automáticamente al completarse.

### 4. Tablas de Ventas

| Tabla            | Campos Clave                                                                                                   | Descripción                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `venta_cabecera` | id, id_cliente, id_empleado_vendedor, fecha_venta, total_venta, igv, metodo_pago, monto_pagado, vuelto, estado | Cabecera de venta con datos de pago |
| `venta_detalle`  | id, id_venta, id_variante, cantidad, precio_unitario, descuento_aplicado, subtotal                             | Línea de venta con precio unitario  |
| `comprobante`    | id, id_venta, tipo_comprobante, serie, numero_correlativo, fecha_emision                                       | Boleta o Factura electrónica        |

**Flujo de venta:**

1. Se crea `venta_cabecera` con totales y método de pago
2. Por cada item del carrito se crea un `venta_detalle` con `precio_unitario = variante.precio_venta`
3. Se decrementa el stock: `inventario.stock_actual -= cantidad`
4. Se registra movimiento tipo 3 (Ajuste negativo) en `historial_movimiento`

### 5. Tablas de Compras

| Tabla             | Campos Clave                                                                      | Descripción                    |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| `compra_cabecera` | id, id_proveedor, id_empleado, numero_factura, fecha_compra, total_compra, estado | Cabecera de compra a proveedor |
| `compra_detalle`  | id, id_compra, id_variante, cantidad, costo_unitario, subtotal                    | Línea de compra                |

### 6. Tablas de Seguridad y Auditoría

| Tabla              | Campos Clave                                                                        | Descripción                              |
| ------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| `empleado`         | id, id_cargo, nombres, apellidos, documento_identidad, email, password_hash, estado | Usuarios del sistema                     |
| `auditoria_sesion` | id, id_empleado, fecha_ingreso, fecha_salida, direccion_ip                          | Sesiones de login/logout                 |
| `actividad_log`    | id, id_empleado, tipo_accion, detalle, fecha                                        | Log de acciones realizadas en el sistema |

### 7. Tabla de Alertas

| Tabla          | Campos Clave                                       | Descripción                                               |
| -------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `alerta_stock` | id, id_inventario, fecha_generacion, estado_alerta | Alertas automáticas cuando `stock_actual <= stock_minimo` |

### 8. Índices de Optimización

```sql
CREATE NONCLUSTERED INDEX IX_producto_variante_codigo ON producto_variante(codigo_barras);
CREATE NONCLUSTERED INDEX IX_venta_cabecera_fecha ON venta_cabecera(fecha_venta);
CREATE NONCLUSTERED INDEX IX_compra_cabecera_fecha ON compra_cabecera(fecha_compra);
CREATE NONCLUSTERED INDEX IX_historial_movimiento_fecha ON historial_movimiento(fecha_movimiento);
```

---

## Sistema de Auditoría y Actividad

### Tabla `auditoria_sesion` (BD SQL Server)

Registra **sesiones de login/logout** de empleados:

```sql
CREATE TABLE auditoria_sesion (
    id_sesion INT IDENTITY(1,1),
    id_empleado INT NOT NULL,
    fecha_ingreso DATETIME DEFAULT GETDATE(),
    fecha_salida DATETIME NULL,
    direccion_ip VARCHAR(50) NULL,
);
```

**Uso en la BD:** Tracking de quién inició sesión, cuándo, y desde qué IP.

### Tabla `actividad_log` (BD SQL Server)

Registra **acciones realizadas** en el sistema (crear, editar, vender, etc.):

```sql
CREATE TABLE actividad_log (
    id_actividad INT IDENTITY(1,1),
    id_empleado INT NOT NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    detalle VARCHAR(500) NOT NULL,
    fecha DATETIME DEFAULT GETDATE() NOT NULL,
    CONSTRAINT FK_actividad_empleado FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado)
);

CREATE NONCLUSTERED INDEX IX_actividad_log_fecha ON actividad_log(fecha);
CREATE NONCLUSTERED INDEX IX_actividad_log_empleado ON actividad_log(id_empleado);
```

**Uso en la BD:** Audit trail completo de todas las acciones del sistema. Cuando se migre a backend, cada `log()` debería INSERT en esta tabla.

### Contexto `ActivityContext.tsx` (Aplicación actual)

Implementación local de **log de actividad** en la app, almacenado en AsyncStorage (key `@audit_log`). Es un espejo de `actividad_log` pero sin backend. Cuando se conecte a la BD, este contexto debería hacer llamadas a la API en vez de escribir a AsyncStorage.

**Estructura del registro (`AuditoriaSesion`):**

```typescript
interface AuditoriaSesion {
  id: number; // Date.now()
  id_empleado: number; // ID del empleado que realizó la acción
  tipo_accion: TipoAccion; // Tipo de acción (ver abajo)
  detalle: string; // Descripción legible de la acción
  fecha: string; // ISO timestamp
}
```

**Tipos de acción registrados (`TipoAccion`):**

| Acción             | Descripción                   | Pantalla que la registra             |
| ------------------ | ----------------------------- | ------------------------------------ |
| `LOGIN`            | Inicio de sesión              | `login.tsx`                          |
| `LOGOUT`           | Cierre de sesión              | `Sidebar.tsx`, `DashboardLayout.tsx` |
| `STOCK_UPDATE`     | Entrada/salida de stock       | `inventario.tsx`                     |
| `SALE_COMPLETED`   | Venta completada              | `ventas.tsx` (admin + collaborator)  |
| `PRODUCT_CREATED`  | Producto creado               | `productos.tsx`                      |
| `PRODUCT_UPDATED`  | Producto editado              | `productos.tsx`                      |
| `PRODUCT_TOGGLED`  | Producto activado/desactivado | `productos.tsx`                      |
| `VARIANT_CREATED`  | Variante creada               | `productos.tsx`                      |
| `VARIANT_DELETED`  | Variante eliminada            | `productos.tsx`                      |
| `EMPLOYEE_CREATED` | Empleado creado               | `usuarios.tsx`                       |
| `EMPLOYEE_UPDATED` | Empleado editado              | `usuarios.tsx`                       |
| `EMPLOYEE_TOGGLED` | Empleado activado/desactivado | `usuarios.tsx`                       |
| `SETTINGS_CHANGED` | Configuración modificada      | `config.tsx`                         |

**Pantalla de actividad:** `app/(admin)/actividad.tsx` muestra el historial de acciones con filtros por empleado y rango de fechas.

**Limitaciones actuales:**

- Almacena máximo 500 registros (los más viejos se eliminan)
- Solo disponible para rol Admin
- No sincroniza con la BD SQL Server (es solo local)
- **Migración a producción:** `ActivityContext.log()` debería hacer `POST /api/actividad` y la pantalla debería hacer `GET /api/actividad` desde `actividad_log`

---

## Estructura de Código

### Pantallas (`app/`)

| Archivo       | Descripción                | Tablas BD                               |
| ------------- | -------------------------- | --------------------------------------- |
| `_layout.tsx` | Layout raíz con providers  | —                                       |
| `index.tsx`   | Landing page               | —                                       |
| `login.tsx`   | Login + registro de sesión | `empleado`, `cargo`, `auditoria_sesion` |

#### Admin (`app/(admin)/`)

| Archivo          | Descripción                          | Tablas BD                                                                                    |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `index.tsx`      | Dashboard con KPIs + ganancias       | `venta_cabecera`, `venta_detalle`, `historial_movimiento`, `inventario`                      |
| `productos.tsx`  | CRUD productos + variantes + precios | `producto`, `producto_variante`, `marca`, `categoria`, `genero`, `talla`, `color`            |
| `inventario.tsx` | Stock + movimientos + costos         | `inventario`, `historial_movimiento`, `tipo_movimiento`, `producto_variante`                 |
| `ventas.tsx`     | POS + historial + ganancias          | `venta_cabecera`, `venta_detalle`, `producto_variante`, `inventario`, `historial_movimiento` |
| `usuarios.tsx`   | CRUD empleados                       | `empleado`, `cargo`                                                                          |
| `actividad.tsx`  | Log de auditoría                     | `actividad_log`                                                                              |
| `config.tsx`     | Configuración del negocio            | —                                                                                            |

#### Collaborator (`app/(collaborator)/`)

| Archivo           | Descripción                    | Tablas BD                                                            |
| ----------------- | ------------------------------ | -------------------------------------------------------------------- |
| `index.tsx`       | Dashboard con KPIs + ganancias | `venta_cabecera`, `venta_detalle`, `inventario`                      |
| `productos.tsx`   | Solo lectura productos         | `producto`, `producto_variante`, `marca`, `categoria`, `genero`      |
| `ventas.tsx`      | POS colaborador                | `venta_cabecera`, `venta_detalle`, `producto_variante`, `inventario` |
| `buscar.tsx`      | Búsqueda de productos          | `producto`, `producto_variante`                                      |
| `stock.tsx`       | Solo lectura stock             | `inventario`, `producto_variante`, `producto`                        |
| `movimientos.tsx` | Movimientos (legacy)           | `producto`                                                           |

### Contextos (`context/`)

| Archivo                | Descripción                          | Tablas BD                                                                                    |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `AuthContext.tsx`      | Autenticación y sesión               | `empleado`, `cargo`                                                                          |
| `UsersContext.tsx`     | CRUD empleados                       | `empleado`, `cargo`                                                                          |
| `CatalogsContext.tsx`  | Catálogos (marcas, categorías, etc.) | `marca`, `categoria`, `genero`, `talla`, `color`, `tipo_movimiento`, `cargo`                 |
| `ProductsContext.tsx`  | Productos + variantes + inventario   | `producto`, `producto_variante`, `inventario`                                                |
| `InventoryContext.tsx` | Historial de movimientos             | `historial_movimiento`                                                                       |
| `SalesContext.tsx`     | Ventas + carrito                     | `venta_cabecera`, `venta_detalle`, `producto_variante`, `inventario`, `historial_movimiento` |
| `SettingsContext.tsx`  | Configuración                        | —                                                                                            |
| `ActivityContext.tsx`  | Log de actividad (custom)            | `actividad_log`                                                                              |

### Componentes (`components/`)

| Archivo               | Descripción                                     |
| --------------------- | ----------------------------------------------- |
| `AlertModal.tsx`      | Modal de alerta/confirmación                    |
| `BottomTabBar.tsx`    | Navegación inferior móvil                       |
| `DashboardLayout.tsx` | Layout responsive (sidebar desktop, tabs móvil) |
| `DashboardShell.tsx`  | Shell del dashboard                             |
| `PaymentModal.tsx`    | Modal de selección de método de pago            |
| `ReceiptModal.tsx`    | Modal de comprobante de venta                   |
| `Sidebar.tsx`         | Sidebar desktop                                 |

#### UI Components (`components/ui/`)

| Archivo               | Descripción                    |
| --------------------- | ------------------------------ |
| `HapticButton.tsx`    | Botón con feedback háptico     |
| `ActivityItem.tsx`    | Item de historial de actividad |
| `Card.tsx`            | Componente card reutilizable   |
| `KPICard.tsx`         | Tarjeta KPI del dashboard      |
| `ProductList.tsx`     | Lista de productos             |
| `index.ts`            | Barrel export de UI components |

### Hooks (`hooks/`)

| Archivo               | Descripción                              |
| --------------------- | ---------------------------------------- |
| `useTranslation.ts`   | Hook para traducciones español/inglés    |
| `useThemeColors.ts`   | Hook para colores del tema               |

### Tipos (`types/`)

| Archivo       | Descripción                                       |
| ------------- | ------------------------------------------------- |
| `database.ts` | Interfaces TypeScript basadas en la BD SQL Server |
| `index.ts`    | Re-exporta tipos + tipos de auth                  |

### Constantes (`constants/`)

| Archivo           | Descripción                                             |
| ----------------- | ------------------------------------------------------- |
| `navigation.ts`   | Items de navegación (admin + colaborador)               |
| `translations.ts` | Traducciones español/inglés                             |
| `theme.ts`        | Colores, espaciados, bordes, sombras, tamaños de fuente |

---

## Flujo de Datos

### Inventario (Entrada/Salida)

```
┌─────────────────────────────────────────────────────────┐
│                    ENTRADA                              │
├─────────────────────────────────────────────────────────┤
│ 1. Usuario presiona "Entrada" en tarjeta de stock      │
│ 2. Se abre modal con:                                  │
│    - Stock actual + precios (compra/venta/margen)       │
│    - Tipo: Compra (1) o Ajuste positivo (2)            │
│    - Cantidad + costo total calculado                   │
│    - Notas (opcional)                                   │
│ 3. Al guardar:                                          │
│    ├─ increaseStock(varianteId, cantidad)               │
│    │   └─ inventario.stock_actual += cantidad           │
│    └─ addMovement({ tipo: 1 o 2, cantidad })           │
│        └─ historial_movimiento (registro)               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    SALIDA                               │
├─────────────────────────────────────────────────────────┤
│ 1. Usuario presiona "Salida" en tarjeta de stock       │
│ 2. Se abre modal con:                                  │
│    - Stock actual + precios                             │
│    - Tipo: Ajuste negativo (3) o Merma (4)             │
│    - Cantidad + pérdida calculada                       │
│    - Notas (opcional)                                   │
│ 3. Al guardar:                                          │
│    ├─ Validación: stock_actual >= cantidad              │
│    ├─ decreaseStock(varianteId, cantidad)               │
│    │   └─ inventario.stock_actual -= cantidad           │
│    └─ addMovement({ tipo: 3 o 4, cantidad })           │
│        └─ historial_movimiento (registro)               │
└─────────────────────────────────────────────────────────┘
```

### Ventas (POS)

```
┌─────────────────────────────────────────────────────────┐
│                    VENTA                                │
├─────────────────────────────────────────────────────────┤
│ 1. Usuario selecciona producto en POS                   │
│ 2. Se abre modal de variante (talla/color/precio)      │
│ 3. Se agrega al carrito (muestra ganancia estimada)     │
│ 4. Al completar venta:                                  │
│    ├─ Crea venta_cabecera (fecha, total, IGV, método)   │
│    ├─ Por cada item del carrito:                        │
│    │   ├─ Crea venta_detalle (variante, cantidad,       │
│    │   │   precio_unitario = variante.precio_venta)     │
│    │   ├─ decreaseStock(varianteId, cantidad)           │
│    │   └─ addMovement({ tipo: 3 (ajuste negativo) })   │
│    └─ Registra log de actividad                         │
└─────────────────────────────────────────────────────────┘
```

### Cálculo de Ganancias

```
Ganancia por venta = Σ (precio_venta - precio_compra) × cantidad

Dashboard:
- Ganancia hoy: Σ ganancias de ventas de hoy
- Ganancia total: Σ ganancias de todas las ventas

POS (carrito):
- Muestra ganancia estimada en tiempo real

Historial de ventas:
- Cada venta muestra +S/ X.XX de ganancia
- Cada línea de detalle muestra ganancia individual
```

### Productos

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTO                             │
├─────────────────────────────────────────────────────────┤
│ Tablas: producto, producto_variante, inventario         │
│                                                         │
│ - CRUD de producto base (marca, categoría, género)      │
│ - CRUD de variantes (talla, color, precios, código)     │
│ - Validación: precio_venta >= precio_compra             │
│ - Cada variante crea automáticamente registro           │
│   en inventario (stock_actual=0, stock_minimo=5)        │
│ - Stock inicial crea movimiento tipo 1 (Compra)         │
│ - Activar/desactivar producto                           │
└─────────────────────────────────────────────────────────┘
```

### Usuarios

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIOS                             │
├─────────────────────────────────────────────────────────┤
│ Tablas: empleado, cargo                                 │
│                                                         │
│ - CRUD de empleados (nombres, apellidos, documento)     │
│ - Asignación de cargo (Administrador, Vendedor, etc.)   │
│ - Activar/desactivar empleado                           │
│ - Credenciales por defecto:                             │
│   Admin: admin@inventario.com / admin123                │
│   User: user@inventario.com / user123                   │
└─────────────────────────────────────────────────────────┘
```

---

## Variables de Entorno

No se requieren variables de entorno. La aplicación no utiliza servicios externos, APIs ni bases de datos remotas. Todos los datos se almacenan localmente en el dispositivo mediante AsyncStorage.

---

## Plataformas Soportadas

- **iOS** (con soporte para iPad)
- **Android** (icono adaptativo, edge-to-edge)
- **Web** (modo output estático)

---

## Licencia

Proyecto privado.
