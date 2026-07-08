export type Language = 'es' | 'en';

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventario',
    'nav.sales': 'Ventas',
    'nav.users': 'Usuarios',
    'nav.settings': 'Configuracion',
    'nav.movements': 'Movimientos',
    'nav.search': 'Buscar',
    'role.admin': 'Administrador',
    'role.collaborator': 'Colaborador',

    // Dashboard
    'dashboard.greeting': 'Hola',
    'dashboard.summary': 'Resumen de tu inventario',
    'dashboard.products': 'Productos',
    'dashboard.units': 'Unidades',
    'dashboard.salesToday': 'Ventas Hoy',
    'dashboard.revenue': 'Ingresos',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.registers': 'registros',

    // Products
    'products.title': 'Zapatillas',
    'products.count': 'modelos en inventario',
    'products.new': 'Nueva',
    'products.edit': 'Editar Zapatilla',
    'products.create': 'Nueva Zapatilla',
    'products.name': 'Nombre',
    'products.brand': 'Marca',
    'products.sku': 'SKU',
    'products.size': 'Talla',
    'products.color': 'Color',
    'products.quantity': 'Cantidad (pares)',
    'products.minStock': 'Stock Minimo',
    'products.category': 'Categoria',
    'products.location': 'Ubicacion',
    'products.pairs': 'pares',
    'products.lowStock': 'Stock bajo',
    'products.empty': 'Sin zapatillas en inventario',
    'products.noResults': 'No se encontraron zapatillas',
    'products.search': 'Buscar por nombre, marca o SKU...',
    'products.nameRequired': 'Nombre y SKU son obligatorios',

    // Sales
    'sales.title': 'Ventas',
    'sales.new': 'Nueva',
    'sales.totalSales': 'Total ventas',
    'sales.selectProduct': 'Seleccionar producto',
    'sales.sell': 'Vender',
    'sales.quantity': 'Cantidad',
    'sales.unitPrice': 'Precio unitario',
    'sales.buyer': 'Comprador',
    'sales.confirm': 'Confirmar Venta',
    'sales.empty': 'Sin ventas registradas',
    'sales.emptyHint': 'Toca Nueva para registrar una venta',
    'sales.stockAvailable': 'Stock disponible',
    'sales.total': 'Total',
    'sales.units': 'uds',

    // Inventory
    'inventory.title': 'Inventario',
    'inventory.models': 'modelos de zapatillas',
    'inventory.pairs': 'Pares',

    // Users
    'users.title': 'Usuarios',
    'users.new': 'Nuevo',
    'users.admin': 'Admin',
    'users.user': 'Usuario',
    'users.active': 'Activo',
    'users.inactive': 'Inactivo',

    // Settings
    'settings.title': 'Configuracion',
    'settings.subtitle': 'Personaliza tu sistema',
    'settings.company': 'Empresa',
    'settings.companyName': 'Nombre',
    'settings.address': 'Direccion',
    'settings.phone': 'Telefono',
    'settings.rif': 'RIF / NIT',
    'settings.save': 'Guardar',
    'settings.currency': 'Moneda',
    'settings.appearance': 'Apariencia',
    'settings.darkMode': 'Modo oscuro',
    'settings.language': 'Idioma',
    'settings.saved': 'Guardado',
    'settings.savedMessage': 'Datos actualizados correctamente',

    // Common
    'common.cancel': 'Cancelar',
    'common.confirm': 'Aceptar',
    'common.delete': 'Eliminar',
    'common.error': 'Error',
    'common.loading': 'Cargando...',
  },
  en: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.sales': 'Sales',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.movements': 'Movements',
    'nav.search': 'Search',
    'role.admin': 'Administrator',
    'role.collaborator': 'Collaborator',

    // Dashboard
    'dashboard.greeting': 'Hello',
    'dashboard.summary': 'Your inventory summary',
    'dashboard.products': 'Products',
    'dashboard.units': 'Units',
    'dashboard.salesToday': 'Sales Today',
    'dashboard.revenue': 'Revenue',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.registers': 'records',

    // Products
    'products.title': 'Sneakers',
    'products.count': 'models in inventory',
    'products.new': 'New',
    'products.edit': 'Edit Sneaker',
    'products.create': 'New Sneaker',
    'products.name': 'Name',
    'products.brand': 'Brand',
    'products.sku': 'SKU',
    'products.size': 'Size',
    'products.color': 'Color',
    'products.quantity': 'Quantity (pairs)',
    'products.minStock': 'Min Stock',
    'products.category': 'Category',
    'products.location': 'Location',
    'products.pairs': 'pairs',
    'products.lowStock': 'Low stock',
    'products.empty': 'No sneakers in inventory',
    'products.noResults': 'No sneakers found',
    'products.search': 'Search by name, brand or SKU...',
    'products.nameRequired': 'Name and SKU are required',

    // Sales
    'sales.title': 'Sales',
    'sales.new': 'New',
    'sales.totalSales': 'Total sales',
    'sales.selectProduct': 'Select product',
    'sales.sell': 'Sell',
    'sales.quantity': 'Quantity',
    'sales.unitPrice': 'Unit price',
    'sales.buyer': 'Buyer',
    'sales.confirm': 'Confirm Sale',
    'sales.empty': 'No sales recorded',
    'sales.emptyHint': 'Tap New to record a sale',
    'sales.stockAvailable': 'Available stock',
    'sales.total': 'Total',
    'sales.units': 'pcs',

    // Inventory
    'inventory.title': 'Inventory',
    'inventory.models': 'sneaker models',
    'inventory.pairs': 'Pairs',

    // Users
    'users.title': 'Users',
    'users.new': 'New',
    'users.admin': 'Admin',
    'users.user': 'User',
    'users.active': 'Active',
    'users.inactive': 'Inactive',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize your system',
    'settings.company': 'Company',
    'settings.companyName': 'Name',
    'settings.address': 'Address',
    'settings.phone': 'Phone',
    'settings.rif': 'RIF / NIT',
    'settings.save': 'Save',
    'settings.currency': 'Currency',
    'settings.appearance': 'Appearance',
    'settings.darkMode': 'Dark mode',
    'settings.language': 'Language',
    'settings.saved': 'Saved',
    'settings.savedMessage': 'Settings updated successfully',

    // Common
    'common.cancel': 'Cancel',
    'common.confirm': 'OK',
    'common.delete': 'Delete',
    'common.error': 'Error',
    'common.loading': 'Loading...',
  },
};

export function t(key: string, lang: Language): string {
  return translations[lang]?.[key] ?? translations.es[key] ?? key;
}
