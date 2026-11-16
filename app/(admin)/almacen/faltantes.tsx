import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import SelectField from '@/components/admin/SelectField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import Checkbox from '@/components/admin/Checkbox';
import AlertModal from '@/components/AlertModal';
import { almacenTabs } from '@/constants/adminTabs';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useSuppliers } from '@/context/SuppliersContext';

interface ShortageRow {
  id: string;
  variantId: number;
  producto: string;
  talla: string;
  stock: number;
  minimo: number;
  proveedor: string;
  reponer: number;
  selected: boolean;
}

export default function FaltantesScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { inventory, variants, products } = useProducts();
  const { tallas } = useCatalogs();
  const { suppliers } = useSuppliers();
  const { createPurchaseOrder } = usePurchases();
  const [rows, setRows] = useState<ShortageRow[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const supplierOptions = suppliers.map(supplier => ({
    label: supplier.razon_social,
    value: String(supplier.id),
  }));
  const defaultSupplier = suppliers[0] ? String(suppliers[0].id) : '';

  const buildRows = useCallback(
    (): ShortageRow[] =>
      inventory.flatMap(item => {
        if (item.stock_actual > item.stock_minimo) return [];
        const variant = variants.find(current => current.id === item.id_variante);
        const product = products.find(current => current.id === variant?.id_producto);
        if (!variant || !product) return [];
        return [
          {
            id: String(item.id_variante),
            variantId: item.id_variante,
            producto: product.nombre,
            talla: tallas.find(talla => talla.id === variant.id_talla)?.numero_talla ?? '—',
            stock: item.stock_actual,
            minimo: item.stock_minimo,
            proveedor: defaultSupplier,
            reponer: Math.max(item.stock_minimo - item.stock_actual, 0),
            selected: true,
          },
        ];
      }),
    [inventory, variants, products, tallas, defaultSupplier],
  );

  useEffect(() => {
    setRows(buildRows());
  }, [buildRows]);

  const summary = useMemo(() => {
    const selected = rows.filter(row => row.selected);
    return {
      products: selected.length,
      pairs: selected.reduce((sum, row) => sum + row.reponer, 0),
    };
  }, [rows]);

  const updateRow = (id: string, updates: Partial<ShortageRow>) => {
    setRows(previous => previous.map(row => (row.id === id ? { ...row, ...updates } : row)));
  };

  const columns: DataTableColumn<ShortageRow>[] = [
    {
      key: 'selected',
      label: '',
      flex: 0.4,
      align: 'center',
      render: row => (
        <Checkbox
          checked={row.selected}
          onToggle={() => updateRow(row.id, { selected: !row.selected })}
        />
      ),
    },
    {
      key: 'producto',
      label: 'Producto',
      flex: 2,
      render: row => <Text style={S.textBold}>{row.producto}</Text>,
    },
    {
      key: 'talla',
      label: 'Talla',
      flex: 0.6,
      align: 'center',
      render: row => <Text style={S.text}>{row.talla}</Text>,
    },
    {
      key: 'stock',
      label: 'Stock',
      flex: 0.7,
      align: 'center',
      render: row => (
        <View style={[styles.stockBadge, row.stock <= 3 && styles.stockBadgeCritical]}>
          <Text style={[styles.stockText, row.stock <= 3 && styles.stockTextCritical]}>
            {row.stock}
          </Text>
        </View>
      ),
    },
    {
      key: 'minimo',
      label: 'Mínimo',
      flex: 0.7,
      align: 'center',
      render: row => <Text style={S.text}>{row.minimo}</Text>,
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      flex: 1.7,
      render: row => (
        <SelectField
          value={row.proveedor}
          options={supplierOptions}
          onChange={value => updateRow(row.id, { proveedor: value })}
          placeholder="Proveedor"
          compact
        />
      ),
    },
    {
      key: 'reponer',
      label: 'A reponer',
      flex: 0.9,
      align: 'center',
      render: row => (
        <TextField
          value={String(row.reponer)}
          onChangeText={value =>
            updateRow(row.id, { reponer: Number(value.replace(/\D/g, '')) || 0 })
          }
          keyboardType="number-pad"
          compact
          style={{ width: 62 }}
        />
      ),
    },
  ];

  return (
    <AdminPage
      active="Almacén"
      title="Pedido de productos faltantes"
      subtitle="Selecciona los productos bajo el mínimo y calcula el pedido."
      tabs={almacenTabs('faltantes')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={S.col65}>
          <AdminCard title="Productos bajo el mínimo">
            <DataTable
              columns={columns}
              rows={rows}
              keyExtractor={row => row.id}
              minWidth={860}
              emptyText="No hay productos bajo el mínimo."
            />
          </AdminCard>
        </View>

        <View style={S.col35}>
          <AdminCard title="Resumen del pedido">
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Productos</Text>
              <Text style={S.summaryValue}>{summary.products}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Pares a reponer</Text>
              <Text style={S.summaryValue}>{summary.pairs}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Fecha</Text>
              <Text style={S.textBold}>{date}</Text>
            </View>
            <View style={S.divider} />
            <TextField label="Fecha requerida" value={date} onChangeText={setDate} />
            <Text style={S.helpText}>
              El pedido agrupa los productos seleccionados por proveedor.
            </Text>
            <AdminButton
              label="Generar pedido"
              icon="cart-outline"
              fullWidth
              onPress={async () => {
                const selected = rows.filter(row => row.selected && row.reponer > 0);
                if (selected.length === 0) {
                  showAlert('warning', 'Sin productos', 'Selecciona al menos un producto.');
                  return;
                }

                const groups = new Map<string, ShortageRow[]>();
                for (const row of selected) {
                  if (!row.proveedor) {
                    showAlert('warning', 'Proveedor requerido', 'Asigna un proveedor a cada fila.');
                    return;
                  }
                  groups.set(row.proveedor, [...(groups.get(row.proveedor) ?? []), row]);
                }

                let created = 0;
                for (const [providerId, group] of groups) {
                  const result = await createPurchaseOrder({
                    providerId: Number(providerId),
                    requiredDate: date,
                    lines: group.map(row => {
                      const variant = variants.find(item => item.id === row.variantId);
                      return {
                        variantId: row.variantId,
                        cantidad: row.reponer,
                        precioUnitario: variant?.precio_compra ?? 0,
                      };
                    }),
                  });
                  if (!result.success) {
                    showAlert('error', 'No se pudo generar', result.error ?? 'Error al guardar.');
                    return;
                  }
                  created += 1;
                }

                showAlert(
                  'success',
                  'Pedido generado',
                  `${created} pedido(s) · ${summary.products} productos · ${summary.pairs} pares.`,
                );
              }}
            />
            <AdminButton
              label="Cancelar"
              variant="secondary"
              fullWidth
              onPress={() => setRows(buildRows())}
            />
          </AdminCard>
        </View>
      </View>

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={closeAlert}
      />
    </AdminPage>
  );
}

const styles = StyleSheet.create({
  stockBadge: {
    minWidth: 30,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: ADMIN.graySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stockBadgeCritical: {
    backgroundColor: ADMIN.warningSoft,
  },
  stockText: {
    color: ADMIN.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  stockTextCritical: {
    color: ADMIN.warning,
  },
});
