import type { NavItem } from '@/components/Sidebar';

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', route: '/(admin)', icon: 'grid-outline' },
  { label: 'Productos', route: '/(admin)/productos', icon: 'cube-outline' },
  { label: 'Ventas', route: '/(admin)/ventas', icon: 'cart-outline' },
  { label: 'Usuarios', route: '/(admin)/usuarios', icon: 'people-outline' },
  { label: 'Configuracion', route: '/(admin)/config', icon: 'settings-outline' },
];

export const collaboratorNavItems: NavItem[] = [
  { label: 'Inventario', route: '/(collaborator)', icon: 'cube-outline' },
  { label: 'Movimientos', route: '/(collaborator)/movimientos', icon: 'swap-horizontal-outline' },
  { label: 'Buscar', route: '/(collaborator)/buscar', icon: 'search-outline' },
];
