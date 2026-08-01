import type { NavItem } from '@/components/Sidebar';

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', route: '/(admin)', icon: 'grid-outline' },
  { label: 'Productos', route: '/(admin)/productos', icon: 'cube-outline' },
  { label: 'Inventario', route: '/(admin)/inventario', icon: 'layers-outline' },
  { label: 'Ventas', route: '/(admin)/ventas', icon: 'cart-outline' },
  { label: 'Usuarios', route: '/(admin)/usuarios', icon: 'people-outline' },
  { label: 'Actividad', route: '/(admin)/actividad', icon: 'time-outline' },
  { label: 'Configuracion', route: '/(admin)/config', icon: 'settings-outline' },
];

export const collaboratorNavItems: NavItem[] = [
  { label: 'Dashboard', route: '/(collaborator)', icon: 'grid-outline' },
  { label: 'Productos', route: '/(collaborator)/productos', icon: 'cube-outline' },
  { label: 'Ventas', route: '/(collaborator)/ventas', icon: 'cart-outline' },
  { label: 'Stock', route: '/(collaborator)/stock', icon: 'layers-outline' },
];
