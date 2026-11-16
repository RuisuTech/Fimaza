import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import SelectField from '@/components/admin/SelectField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AlertModal from '@/components/AlertModal';
import { almacenTabs } from '@/constants/adminTabs';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useSuppliers } from '@/context/SuppliersContext';
import { useWarehouse } from '@/context/WarehouseContext';

interface EntryLine {
  id: string;
  variantId: number;
  producto: string;
  talla: string;
  esperado: number;
  recibido: number;
}

export default function GuiaEntradaScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { orders, orderDetails } = usePurchases();
  const { entryGuides, createEntryGuide } = useWarehouse();
  const { products, variants } = useProducts();
  const { tallas } = useCatalogs();
  const { suppliers } = useSuppliers();

  const nextGuide = `GE-${String(entryGuides.length + 1).padStart(4, '0')}`;
  const [guide, setGuide] = useState(nextGuide);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderId, setOrderId] = useState('');
  const [observations, setObservations] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([]);

  useEffect(() => {
    setGuide(nextGuide);
  }, [nextGuide]);

  const selectedOrder =
    orders.find(order => String(order.id) === orderId) ??
    orders.find(order => orderDetails.some(detail => detail.id_orden === order.id)) ??
    orders[0];
  const provider = suppliers.find(item => item.id === selectedOrder?.id_proveedor);
  const orderOptions = orders.map(order => ({
    label: `${order.numero} · ${suppliers.find(item => item.id === order.id_proveedor)?.razon_social ?? 'Proveedor'}`,
    value: String(order.id),
  }));

  useEffect(() => {
    if (!selectedOrder) {
      setLines([]);
      return;
    }
    const details = orderDetails.filter(item => item.id_orden === selectedOrder.id);
    setLines(
      details.map(detail => {
        const variant = variants.find(item => item.id === detail.id_variante);
        const product = products.find(item => item.id === variant?.id_producto);
        return {
          id: `entry-${detail.id}`,
          variantId: detail.id_variante,
          producto: product?.nombre ?? 'Producto',
          talla: tallas.find(talla => talla.id === variant?.id_talla)?.numero_talla ?? '—',
          esperado: detail.cantidad,
          recibido: detail.cantidad,
        };
      }),
    );
  }, [selectedOrder, orderDetails, products, variants, tallas]);

  const summary = useMemo(() => {
    const expected = lines.reduce((sum, line) => sum + line.esperado, 0);
    const received = lines.reduce((sum, line) => sum + line.recibido, 0);
    const incomplete = lines.filter(line => line.recibido < line.esperado).length;
    return { expected, received, incomplete };
  }, [lines]);

  const updateReceived = (id: string, value: string) => {
    const quantity = Number(value.replace(/\D/g, '')) || 0;
    setLines(previous =>
      previous.map(line => (line.id === id ? { ...line, recibido: quantity } : line)),
    );
  };

  const columns: DataTableColumn<EntryLine>[] = [
    {
      key: 'producto',
      label: 'Producto',
      flex: 2.2,
      render: line => <Text style={S.textBold}>{line.producto}</Text>,
    },
    {
      key: 'talla',
      label: 'Talla',
      flex: 0.7,
      align: 'center',
      render: line => <Text style={S.text}>{line.talla}</Text>,
    },
    {
      key: 'esperado',
      label: 'Esperado',
      flex: 0.8,
      align: 'center',
      render: line => <Text style={S.text}>{line.esperado}</Text>,
    },
    {
      key: 'recibido',
      label: 'Recibido',
      flex: 1,
      align: 'center',
      render: line => (
        <TextField
          value={String(line.recibido)}
          onChangeText={value => updateReceived(line.id, value)}
          keyboardType="number-pad"
          compact
          style={{ width: 64 }}
        />
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      flex: 1,
      align: 'center',
      render: line =>
        line.recibido >= line.esperado ? (
          <StatusBadge label="Completo" tone="success" />
        ) : (
          <StatusBadge label="Incompleto" tone="warning" />
        ),
    },
  ];

  return (
    <AdminPage
      active="Almacén"
      title="Guía de entrada"
      subtitle="Confirma la mercadería recibida y registra diferencias."
      tabs={almacenTabs('guia-entrada')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={[S.col70, styles.stack]}>
          <AdminCard title="Cabecera">
            <View style={S.row}>
              <TextField label="N° de guía" value={guide} onChangeText={setGuide} style={S.field} />
              <TextField
                label="Fecha de recepción"
                value={date}
                onChangeText={setDate}
                style={S.field}
              />
              <SelectField
                label="Orden de compra"
                value={orderId || (selectedOrder ? String(selectedOrder.id) : '')}
                options={orderOptions}
                onChange={setOrderId}
                placeholder="Selecciona orden"
                style={S.fieldWide}
              />
            </View>
            <TextField
              label="Proveedor"
              value={provider?.razon_social ?? 'Sin proveedor'}
              editable={false}
            />
          </AdminCard>

          <AdminCard title="Mercadería recibida">
            <DataTable
              columns={columns}
              rows={lines}
              keyExtractor={line => line.id}
              minWidth={600}
              emptyText="Selecciona una orden con detalle."
            />
          </AdminCard>
        </View>

        <View style={S.col30}>
          <AdminCard title="Confirmar recepción">
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Pares esperados</Text>
              <Text style={S.summaryValue}>{summary.expected}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Pares recibidos</Text>
              <Text style={S.summaryValue}>{summary.received}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Líneas incompletas</Text>
              <StatusBadge
                label={String(summary.incomplete)}
                tone={summary.incomplete > 0 ? 'warning' : 'success'}
              />
            </View>
            <View style={S.divider} />
            <TextField
              label="Observaciones"
              value={observations}
              onChangeText={setObservations}
              placeholder="Diferencias, faltantes o incidencias"
              multiline
            />
            <AdminButton
              label="Registrar entrada"
              icon="arrow-down-circle-outline"
              fullWidth
              onPress={async () => {
                if (!selectedOrder) {
                  showAlert('warning', 'Sin orden', 'No hay una orden de compra seleccionada.');
                  return;
                }
                if (lines.length === 0) {
                  showAlert('warning', 'Sin mercadería', 'La orden no tiene detalle.');
                  return;
                }
                const result = await createEntryGuide({
                  numero: guide,
                  fecha: date,
                  orderId: selectedOrder.id,
                  providerId: selectedOrder.id_proveedor,
                  observaciones: observations || undefined,
                  lines: lines.map(line => ({
                    variantId: line.variantId,
                    cantidadEsperada: line.esperado,
                    cantidadRecibida: line.recibido,
                  })),
                });
                if (!result.success) {
                  showAlert('error', 'No se pudo registrar', result.error ?? 'Error al guardar.');
                  return;
                }
                showAlert(
                  summary.incomplete > 0 ? 'warning' : 'success',
                  summary.incomplete > 0 ? 'Entrada con diferencias' : 'Entrada registrada',
                  `${summary.received} de ${summary.expected} pares registrados.`,
                );
              }}
            />
            <AdminButton
              label="Cancelar"
              variant="secondary"
              fullWidth
              onPress={() => setLines(previous => previous.map(line => ({ ...line, recibido: 0 })))}
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
  stack: {
    gap: 20,
  },
});
