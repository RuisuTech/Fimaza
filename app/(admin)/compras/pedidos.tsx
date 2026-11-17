import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import SelectField from '@/components/admin/SelectField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import StatusBadge, { BadgeTone } from '@/components/admin/StatusBadge';
import AlertModal from '@/components/AlertModal';
import { comprasTabs } from '@/constants/adminTabs';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { ADMIN } from '@/constants/adminTheme';
import { BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useSuppliers } from '@/context/SuppliersContext';
import { PedidoCompra } from '@/types';

interface PendingLine {
  id: string;
  variantId: number;
  producto: string;
  talla: string;
  cantidad: number;
  precio: number;
  total: number;
}

const STATUS_TONES: Record<string, BadgeTone> = {
  Atendido: 'success',
  Enviado: 'info',
  Borrador: 'muted',
};

export default function PedidosCompraScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { suppliers } = useSuppliers();
  const { products, variants } = useProducts();
  const { tallas } = useCatalogs();
  const {
    purchaseOrders,
    purchaseOrderDetails,
    createPurchaseOrder,
    createQuote,
    updatePurchaseOrderStatus,
  } = usePurchases();
  const [provider, setProvider] = useState('');
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [requiredDate, setRequiredDate] = useState('2026-11-30');
  const [lines, setLines] = useState<PendingLine[]>([]);

  const providerOptions = suppliers.map(item => ({
    label: item.razon_social,
    value: String(item.id),
  }));
  const productOptions = products.map(product => ({
    label: product.nombre,
    value: String(product.id),
  }));
  const selectedProduct = products.find(product => String(product.id) === productId);
  const productVariants = variants.filter(variant => variant.id_producto === selectedProduct?.id);
  const sizeOptions = productVariants.map(variant => ({
    label: tallas.find(talla => talla.id === variant.id_talla)?.numero_talla ?? '—',
    value: String(variant.id),
  }));

  const pendingTotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.total, 0),
    [lines],
  );

  const addLine = () => {
    const quantity = Number(qty);
    const variant = variants.find(item => String(item.id) === variantId);
    if (!selectedProduct || !variant || !Number.isInteger(quantity) || quantity <= 0) {
      showAlert('warning', 'Datos incompletos', 'Selecciona producto, talla y cantidad.');
      return;
    }
    Haptics.selectionAsync();
    setLines(previous => [
      ...previous,
      {
        id: `pl-${Date.now()}`,
        variantId: variant.id,
        producto: selectedProduct.nombre,
        talla: tallas.find(talla => talla.id === variant.id_talla)?.numero_talla ?? '—',
        cantidad: quantity,
        precio: variant.precio_compra,
        total: quantity * variant.precio_compra,
      },
    ]);
    setQty('1');
  };

  const columns: DataTableColumn<PedidoCompra>[] = [
    {
      key: 'numero',
      label: 'Pedido',
      flex: 1,
      render: row => <Text style={S.textBold}>{row.numero}</Text>,
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      flex: 2.3,
      render: row => (
        <Text style={S.text}>
          {suppliers.find(item => item.id === row.id_proveedor)?.razon_social ?? '—'}
        </Text>
      ),
    },
    {
      key: 'fecha',
      label: 'Fecha',
      flex: 0.9,
      render: row => <Text style={S.textMuted}>{row.fecha}</Text>,
    },
    {
      key: 'total',
      label: 'Total',
      flex: 0.9,
      align: 'right',
      render: row => <Text style={S.textBold}>S/ {row.total.toFixed(2)}</Text>,
    },
    {
      key: 'estado',
      label: 'Estado',
      flex: 1,
      align: 'center',
      render: row => (
        <StatusBadge label={row.estado} tone={STATUS_TONES[row.estado] ?? 'muted'} />
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      flex: 2.1,
      align: 'center',
      render: row => {
        const details = purchaseOrderDetails.filter(detail => detail.id_pedido === row.id);
        const providerName =
          suppliers.find(item => item.id === row.id_proveedor)?.razon_social ?? '—';
        const detailText = details
          .map(detail => {
            const variant = variants.find(item => item.id === detail.id_variante);
            const product = products.find(item => item.id === variant?.id_producto);
            const size = tallas.find(talla => talla.id === variant?.id_talla)?.numero_talla;
            return `• ${product?.nombre ?? 'Producto'} · T${size ?? '—'} · ${detail.cantidad} un.`;
          })
          .join('\n');

        return (
          <View style={styles.actions}>
            <AdminButton
              label="Ver"
              variant="secondary"
              size="sm"
              onPress={() =>
                showAlert(
                  'info',
                  `Pedido ${row.numero}`,
                  `${providerName}\nFecha: ${row.fecha}\nEstado: ${row.estado}\nTotal: S/ ${row.total.toFixed(2)}\n\n${detailText || 'Sin líneas registradas.'}`,
                )
              }
            />
            <AdminButton
              label="Cotizar"
              variant="dark"
              size="sm"
              onPress={async () => {
                if (details.length === 0) {
                  showAlert('warning', 'Sin líneas', 'El pedido no tiene detalle para cotizar.');
                  return;
                }
                const result = await createQuote({
                  providerId: row.id_proveedor,
                  validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  lines: details.map(detail => ({
                    variantId: detail.id_variante,
                    cantidad: detail.cantidad,
                    precioUnitario: detail.precio_unitario,
                  })),
                });
                if (!result.success) {
                  showAlert('error', 'No se pudo cotizar', result.error ?? 'Error al guardar.');
                  return;
                }
                showAlert('success', 'Cotización creada', `Se generó desde ${row.numero}.`);
              }}
            />
            {row.estado === 'Borrador' ? (
              <AdminButton
                label="Enviar"
                size="sm"
                onPress={async () => {
                  const result = await updatePurchaseOrderStatus(row.id, 'Enviado');
                  if (!result.success) {
                    showAlert('error', 'No se pudo enviar', result.error ?? 'Error al guardar.');
                    return;
                  }
                  showAlert('success', 'Pedido enviado', `${row.numero} pasó a Enviado.`);
                }}
              />
            ) : null}
            {row.estado === 'Enviado' ? (
              <AdminButton
                label="Atendido"
                size="sm"
                onPress={async () => {
                  const result = await updatePurchaseOrderStatus(row.id, 'Atendido');
                  if (!result.success) {
                    showAlert('error', 'No se pudo actualizar', result.error ?? 'Error al guardar.');
                    return;
                  }
                  showAlert('success', 'Pedido atendido', `${row.numero} pasó a Atendido.`);
                }}
              />
            ) : null}
          </View>
        );
      },
    },
  ];

  return (
    <AdminPage
      active="Compras"
      title="Pedidos de compra"
      subtitle="Registra pedidos y da seguimiento a su estado."
      tabs={comprasTabs('pedidos')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={S.col40}>
          <AdminCard title="Nuevo pedido">
            <SelectField
              label="Proveedor"
              value={provider}
              options={providerOptions}
              onChange={setProvider}
              placeholder="Selecciona proveedor"
            />
            <View style={S.row}>
              <SelectField
                label="Producto"
                value={productId}
                options={productOptions}
                onChange={value => {
                  setProductId(value);
                  setVariantId('');
                }}
                placeholder="Producto"
                style={S.fieldWide}
              />
              <SelectField
                label="Talla"
                value={variantId}
                options={sizeOptions}
                onChange={setVariantId}
                placeholder="Talla"
                style={S.fieldSmall}
              />
              <TextField
                label="Cantidad"
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
                style={S.fieldSmall}
              />
            </View>
            <AdminButton
              label="+ Agregar otra línea"
              variant="secondary"
              fullWidth
              onPress={addLine}
            />
            {lines.length > 0 ? (
              <View style={styles.pendingList}>
                <Text style={styles.pendingTitle}>Líneas agregadas ({lines.length})</Text>
                {lines.map(line => (
                  <View key={line.id} style={styles.pendingRow}>
                    <Text style={S.text}>
                      {line.producto} · T{line.talla} · {line.cantidad}
                    </Text>
                    <Text style={S.textBold}>S/ {line.total.toFixed(2)}</Text>
                  </View>
                ))}
                <View style={S.summaryRow}>
                  <Text style={S.summaryLabel}>Total pendiente</Text>
                  <Text style={S.summaryValue}>S/ {pendingTotal.toFixed(2)}</Text>
                </View>
              </View>
            ) : null}
            <TextField
              label="Fecha requerida"
              value={requiredDate}
              onChangeText={setRequiredDate}
              placeholder="AAAA-MM-DD"
            />
            <View style={S.actionsRow}>
              <AdminButton
                label="Registrar pedido"
                style={S.actionFlex}
                onPress={async () => {
                  if (!provider) {
                    showAlert('warning', 'Proveedor requerido', 'Selecciona un proveedor.');
                    return;
                  }
                  if (lines.length === 0) {
                    showAlert('warning', 'Pedido vacío', 'Agrega al menos una línea.');
                    return;
                  }
                  const result = await createPurchaseOrder({
                    providerId: Number(provider),
                    requiredDate,
                    lines: lines.map(line => ({
                      variantId: line.variantId,
                      cantidad: line.cantidad,
                      precioUnitario: line.precio,
                    })),
                  });
                  if (!result.success) {
                    showAlert('error', 'No se pudo registrar', result.error ?? 'Error al guardar.');
                    return;
                  }
                  setLines([]);
                  showAlert('success', 'Pedido registrado', 'El pedido se guardó como borrador.');
                }}
              />
              <AdminButton
                label="Limpiar"
                variant="secondary"
                style={S.actionFlex}
                onPress={() => setLines([])}
              />
            </View>
          </AdminCard>
        </View>

        <View style={S.col60}>
          <AdminCard title="Pedidos registrados">
            <DataTable
              columns={columns}
              rows={purchaseOrders}
              keyExtractor={row => row.numero}
              minWidth={860}
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
  actions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pendingList: {
    backgroundColor: ADMIN.graySoft,
    borderRadius: BorderRadius.sm,
    padding: 12,
    gap: 6,
  },
  pendingTitle: {
    color: ADMIN.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
});
