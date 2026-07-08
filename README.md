# FimazaSys - Sistema de Inventario de Zapatillas

Aplicación multiplataforma para gestión de inventario de zapatillas, diseñada para negocios de calzado. Funciona en **iOS**, **Android** y **Web**.

---

## Características

### Panel de Administrador
- **Dashboard**: KPIs (total productos, unidades, ventas del día, ingresos totales) y activity feed en tiempo real.
- **Productos**: CRUD completo con campos: nombre, SKU, marca, talla, color, cantidad, stock mínimo, categoría y ubicación. Búsqueda y filtrado por categoría.
- **Ventas**: Registro de ventas con validación de stock, historial y cálculo de ingresos.
- **Usuarios**: Gestión de colaboradores (crear, editar, eliminar). Roles: `admin` y `colaborador`.
- **Configuración**: Modo oscuro y nombre del sistema personalizable.

### Panel de Colaborador
- **Inventario**: Vista de solo lectura del stock con estadísticas.
- **Movimientos**: Registro de entradas y salidas de stock con búsqueda.
- **Búsqueda**: Búsqueda full-text por nombre, SKU, categoría y ubicación.

### General
- **Modo oscuro** completo (persistente).
- **Haptic feedback** en todos los elementos interactivos.
- **Diseño responsive**: sidebar en desktop, bottom tabs en móvil.
- **Componentes optimizados**: `React.memo`, `useMemo`, `useCallback`, FlatList optimizado.

---

## Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | Expo SDK 54 (React Native 0.81.5) |
| Router | expo-router v6 |
| Lenguaje | TypeScript 5.9.2 |
| Estilos | NativeWind v4 + Tailwind CSS 3.3.2 |
| Navegación | @react-navigation/bottom-tabs v7 |
| Estado | React Context (5 contextos) |
| Almacenamiento | @react-native-async-storage/async-storage |
| Iconos | @expo/vector-icons (Ionicons) |
| Haptics | expo-haptics |
| Animaciones | react-native-reanimated v4 |
| Imágenes | expo-image v3 |

---

## Estructura del Proyecto

```
NextInventory/
├── app/                    # Enrutamiento basado en archivos
│   ├── _layout.tsx         # Layout raíz (providers + redirect auth)
│   ├── index.tsx           # Pantalla de bienvenida
│   ├── login.tsx           # Login
│   ├── (admin)/            # Rutas de administrador
│   │   ├── index.tsx       # Dashboard admin
│   │   ├── productos.tsx   # Gestión de productos
│   │   ├── ventas.tsx      # Registro de ventas
│   │   ├── usuarios.tsx    # Gestión de usuarios
│   │   └── config.tsx      # Configuración
│   └── (collaborator)/     # Rutas de colaborador
│       ├── index.tsx       # Inventario (lectura)
│       ├── movimientos.tsx # Entradas/salidas
│       └── buscar.tsx      # Búsqueda
├── components/             # Componentes reutilizables
│   ├── AlertModal.tsx      # Modal de alerta/confirmación
│   ├── BottomTabBar.tsx    # Navegación inferior móvil
│   ├── DashboardLayout.tsx # Layout responsive
│   ├── Sidebar.tsx         # Sidebar desktop
│   └── ui/                 # Componentes UI base
├── context/                # React Context
│   ├── AuthContext.tsx     # Autenticación
│   ├── ProductsContext.tsx # Productos
│   ├── SalesContext.tsx    # Ventas
│   ├── ActivityContext.tsx # Activity log
│   └── SettingsContext.tsx # Configuración
├── hooks/                  # Custom hooks
├── constants/              # Constantes (nav, theme, traducciones)
├── types/                  # Interfaces TypeScript
└── assets/                 # Imágenes, iconos, splash
```

---

## Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) 18+
- npm o yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
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
npx expo start
```

Esto abrirá el Expo DevTools en el navegador. Desde ahí puedes:

- **Expo Go** (iOS/Android): Escanea el código QR con la app Expo Go.
- **Simulador iOS**: Presiona `i` en la terminal.
- **Emulador Android**: Presiona `a` en la terminal.
- **Web**: Presiona `w` en la terminal.

### Credenciales por defecto

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@inventario.com` | `admin123` |
| Colaborador | `user@inventario.com` | `user123` |

---

## Variables de Entorno

No se requieren variables de entorno. La aplicación no utiliza servicios externos, APIs ni bases de datos remotas. Todos los datos se almacenan localmente en el dispositivo mediante AsyncStorage.

---

## Scripts Disponibles

| Script | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo Expo |
| `npm run android` | Abre en emulador Android |
| `npm run ios` | Abre en simulador iOS |
| `npm run web` | Abre la versión web |
| `npm run lint` | Ejecuta ESLint |
| `npm run reset-project` | Resetea el proyecto a estado inicial |

---

## Plataformas Soportadas

- **iOS** (con soporte para iPad)
- **Android** (icono adaptativo, edge-to-edge)
- **Web** (modo output estático)

---

## Licencia

Proyecto privado.
