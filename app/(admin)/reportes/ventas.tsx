import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import SelectField from '@/components/admin/SelectField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import AlertModal from '@/components/AlertModal';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { ADMIN } from '@/constants/adminTheme';
import { FontSize, FontWeight } from '@/constants/theme';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useProducts } from '@/context/ProductsContext';
import { useSales } from '@/context/SalesContext';
import { useUsers } from '@/context/UsersContext';
import { exportCsv } from '@/lib/export';

interface ReportRow {
  producto: string;
  pares: number;
  importe: number;
}

const parseDate = (value: string) => {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day, 23, 59, 59);
};

export default function ReporteVentasScreen() {
  const { isDesktop, isMobile } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { sales, saleDetails } = useSales();
  const { products, variants } = useProducts();
  const { employees } = useUsers();
  const [from, setFrom] = useState('01/11/2026');
  const [to, setTo] = useState('16/11/2026');
  const [product, setProduct] = useState<string>('');
  const [seller, setSeller] = useState<string>('');

  const productOptions = [
    { label: 'Todos los productos', value: '' },
    ...products.map(item => ({ label: item.nombre, value: String(item.id) })),
  ];
  const sellerOptions = [
    { label: 'Todos los vendedores', value: '' },
    ...employees.map(item => ({
      label: `${item.nombres} ${item.apellidos}`,
      value: String(item.id),
    })),
  ];

  const report = useMemo(() => {
    const start = parseDate(from);
    const end = parseDate(to);
    const salesById = new Map(sales.map(sale => [sale.id, sale]));
    const matchedSales = new Set<number>();
    const rowsMap = new Map<string, ReportRow>();
    let total = 0;
    let pairs = 0;

    for (const detail of saleDetails) {
      const sale = salesById.get(detail.id_venta);
      if (!sale) continue;
      if (seller && String(sale.id_empleado) !== seller) continue;
      const saleDate = new Date(sale.fecha);
      if (start && saleDate < new Date(from.split('/').reverse().join('-') + 'T00:00:00')) continue;
      if (end && saleDate > end) continue;

      const variant = variants.find(item => item.id === detail.id_variante);
      const productItem = products.find(item => item.id === variant?.id_producto);
      if (!productItem) continue;
      if (product && String(productItem.id) !== product) continue;

      matchedSales.add(sale.id);
      total += detail.subtotal * 1.18;
      pairs += detail.cantidad;
      const current = rowsMap.get(productItem.nombre) ?? {
        producto: productItem.nombre,
        pares: 0,
        importe: 0,
      };
      current.pares += detail.cantidad;
      current.importe += detail.subtotal;
      rowsMap.set(productItem.nombre, current);
    }

    const bars = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const value = saleDetails.reduce((sum, detail) => {
        const sale = salesById.get(detail.id_venta);
        if (!sale) return sum;
        if (seller && String(sale.id_empleado) !== seller) return sum;
        if (product) {
          const variant = variants.find(item => item.id === detail.id_variante);
          const productItem = products.find(item => item.id === variant?.id_producto);
          if (!productItem || String(productItem.id) !== product) return sum;
        }
        const saleDate = new Date(sale.fecha);
        if (saleDate < date || saleDate >= next) return sum;
        return sum + detail.subtotal * 1.18;
      }, 0);
      return {
        label: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()],
        value,
      };
    });

    return {
      total,
      boletas: matchedSales.size,
      pairs,
      ticket: matchedSales.size > 0 ? total / matchedSales.size : 0,
      rows: Array.from(rowsMap.values()),
      bars,
    };
  }, [sales, saleDetails, products, variants, from, to, product, seller]);

  const maxBar = Math.max(1, ...report.bars.map(bar => bar.value));

  const columns: DataTableColumn<ReportRow>[] = [
    {
      key: 'producto',
      label: 'Producto',
      flex: 2.4,
      render: row => <Text style={S.textBold}>{row.producto}</Text>,
    },
    {
      key: 'pares',
      label: 'Pares',
      flex: 0.8,
      align: 'center',
      render: row => <Text style={S.text}>{row.pares}</Text>,
    },
    {
      key: 'importe',
      label: 'Importe',
      flex: 1.2,
      align: 'right',
      render: row => <Text style={S.textBold}>S/ {row.importe.toFixed(2)}</Text>,
    },
  ];

  const kpis = [
    { label: 'Ventas del periodo', value: `S/ ${report.total.toFixed(2)}` },
    { label: 'Boletas emitidas', value: String(report.boletas) },
    { label: 'Pares vendidos', value: String(report.pairs) },
    { label: 'Ticket promedio', value: `S/ ${report.ticket.toFixed(2)}` },
  ];

  return (
    <AdminPage
      active="Reportes"
      title="Reporte de ventas"
      subtitle="Filtra el periodo y revisa el comportamiento de las ventas."
    >
      <View style={S.stack}>
        <AdminCard title="Filtros del reporte">
          <View style={S.row}>
            <TextField label="Desde" value={from} onChangeText={setFrom} style={S.field} />
            <TextField label="Hasta" value={to} onChangeText={setTo} style={S.field} />
            <SelectField
              label="Producto"
              value={product}
              options={productOptions}
              onChange={setProduct}
              style={S.fieldWide}
            />
            <SelectField
              label="Vendedor"
              value={seller}
              options={sellerOptions}
              onChange={setSeller}
              style={S.field}
            />
            <AdminButton
              label="Generar reporte"
              onPress={() => showAlert('success', 'Reporte generado', 'Indicadores actualizados.')}
            />
            <AdminButton
              label="Exportar"
              variant="secondary"
              icon="download-outline"
              onPress={async () => {
                try {
                  await exportCsv(
                    `reporte-ventas-${new Date().toISOString().slice(0, 10)}.csv`,
                    [
                      ['Producto', 'Pares', 'Importe'],
                      ...report.rows.map(row => [row.producto, row.pares, row.importe.toFixed(2)]),
                    ],
                  );
                  showAlert('success', 'Exportación completa', 'El CSV del reporte fue generado.');
                } catch (error) {
                  showAlert(
                    'error',
                    'No se pudo exportar',
                    error instanceof Error ? error.message : 'Error al generar el CSV.',
                  );
                }
              }}
            />
          </View>
        </AdminCard>

        <View style={S.kpiGrid}>
          {kpis.map(kpi => (
            <AdminCard key={kpi.label} style={S.kpiCard}>
              <Text style={S.kpiLabel}>{kpi.label}</Text>
              <Text style={[S.kpiValue, isMobile && styles.kpiValueMobile]}>{kpi.value}</Text>
            </AdminCard>
          ))}
        </View>

        <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
          <View style={S.col50}>
            <AdminCard title="Hoja · Ventas por producto">
              <DataTable
                columns={columns}
                rows={report.rows}
                keyExtractor={row => row.producto}
                minWidth={420}
                emptyText="Sin ventas en el periodo."
              />
            </AdminCard>
          </View>

          <View style={S.col50}>
            <AdminCard title="Ventas por día">
              <View style={styles.chart}>
                {report.bars.map((bar, index) => (
                  <View key={`${bar.label}-${index}`} style={styles.barItem}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height: Math.max(4, (bar.value / maxBar) * 130) },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </AdminCard>
          </View>
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
  kpiValueMobile: {
    fontSize: 22,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    height: 180,
    paddingTop: 10,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '62%',
    minWidth: 14,
    borderRadius: 6,
    backgroundColor: ADMIN.active,
  },
  barLabel: {
    color: ADMIN.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
