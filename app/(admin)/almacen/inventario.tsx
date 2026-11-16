import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AlertModal from '@/components/AlertModal';
import { almacenTabs } from '@/constants/adminTabs';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { ADMIN } from '@/constants/adminTheme';
import { FontWeight } from '@/constants/theme';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { useWarehouse } from '@/context/WarehouseContext';

interface InventoryRow {
  producto: string;
  talla: string;
  inicial: number;
  entradas: number;
  salidas: number;
  final: number;
  estado: string;
}

const FREQUENCIES = ['Diario', 'Semanal', 'Quincenal', 'Mensual', 'Anual'];

export default function InventarioScreen() {
  const { isMobile } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { inventory, variants, products } = useProducts();
  const { tallas } = useCatalogs();
  const { movements } = useWarehouse();
  const [frequency, setFrequency] = useState('Mensual');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const rows = useMemo<InventoryRow[]>(() => {
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59`) : null;

    return inventory.flatMap(item => {
      const variant = variants.find(current => current.id === item.id_variante);
      const product = products.find(current => current.id === variant?.id_producto);
      if (!variant || !product) return [];

      const filtered = movements.filter(movement => {
        if (movement.id_variante !== item.id_variante) return false;
        const date = new Date(movement.fecha);
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      });
      const entradas = filtered
        .filter(movement => movement.tipo === 'entrada')
        .reduce((sum, movement) => sum + movement.cantidad, 0);
      const salidas = filtered
        .filter(movement => movement.tipo === 'salida')
        .reduce((sum, movement) => sum + movement.cantidad, 0);
      const inicial = item.stock_actual - entradas + salidas;

      return [
        {
          producto: product.nombre,
          talla: tallas.find(talla => talla.id === variant.id_talla)?.numero_talla ?? '—',
          inicial,
          entradas,
          salidas,
          final: item.stock_actual,
          estado: item.stock_actual <= item.stock_minimo ? 'Stock bajo' : 'Normal',
        },
      ];
    });
  }, [inventory, variants, products, tallas, movements, from, to]);

  const columns: DataTableColumn<InventoryRow>[] = [
    {
      key: 'producto',
      label: 'Producto',
      flex: 2.2,
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
      key: 'inicial',
      label: 'Stock inicial',
      flex: 0.9,
      align: 'center',
      render: row => <Text style={S.text}>{row.inicial}</Text>,
    },
    {
      key: 'entradas',
      label: 'Entradas',
      flex: 0.8,
      align: 'center',
      render: row => <Text style={[S.text, styles.entry]}>{row.entradas}</Text>,
    },
    {
      key: 'salidas',
      label: 'Salidas',
      flex: 0.8,
      align: 'center',
      render: row => <Text style={[S.text, styles.exit]}>{row.salidas}</Text>,
    },
    {
      key: 'final',
      label: 'Stock final',
      flex: 0.9,
      align: 'center',
      render: row => <Text style={S.textBold}>{row.final}</Text>,
    },
    {
      key: 'estado',
      label: 'Estado',
      flex: 1,
      align: 'center',
      render: row => (
        <StatusBadge
          label={row.estado}
          tone={row.estado === 'Stock bajo' ? 'warning' : 'success'}
        />
      ),
    },
  ];

  return (
    <AdminPage
      active="Almacén"
      title="Generar inventario"
      subtitle="Consulta movimientos y stock final por periodo."
      tabs={almacenTabs('inventario')}
    >
      <View style={S.stack}>
        <AdminCard title="Filtros del inventario">
          <View style={styles.filters}>
            <View style={[S.segmented, isMobile && styles.segmentedMobile]}>
              {FREQUENCIES.map(item => (
                <TouchableOpacity
                  key={item}
                  style={[S.segment, frequency === item && S.segmentActive]}
                  onPress={() => setFrequency(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[S.segmentText, frequency === item && S.segmentTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.dateRow}>
              <TextField
                label="Desde"
                value={from}
                onChangeText={setFrom}
                placeholder="AAAA-MM-DD"
                style={S.field}
              />
              <TextField
                label="Hasta"
                value={to}
                onChangeText={setTo}
                placeholder="AAAA-MM-DD"
                style={S.field}
              />
              <AdminButton
                label="Generar"
                onPress={() => showAlert('success', 'Inventario generado', `${rows.length} variantes.`)}
              />
              <AdminButton
                label="Exportar"
                variant="secondary"
                icon="download-outline"
                onPress={() => showAlert('info', 'Exportación', 'El inventario se preparó para descarga.')}
              />
            </View>
          </View>
        </AdminCard>

        <AdminCard title="Hoja · Inventario">
          <DataTable
            columns={columns}
            rows={rows}
            keyExtractor={row => `${row.producto}-${row.talla}`}
            minWidth={760}
          />
        </AdminCard>
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
  filters: {
    gap: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  segmentedMobile: {
    alignSelf: 'stretch',
  },
  entry: {
    color: ADMIN.success,
    fontWeight: FontWeight.semibold,
  },
  exit: {
    color: ADMIN.danger,
    fontWeight: FontWeight.semibold,
  },
});
