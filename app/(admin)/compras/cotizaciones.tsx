import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useSuppliers } from '@/context/SuppliersContext';
import { CotizacionCompra } from '@/types';

const STATUS_TONES: Record<string, BadgeTone> = {
  Aceptada: 'success',
  Pendiente: 'warning',
  Rechazada: 'danger',
};

export default function CotizacionesScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { suppliers } = useSuppliers();
  const { products, variants } = useProducts();
  const { tallas } = useCatalogs();
  const { quotes, createQuote, createOrderFromQuote } = usePurchases();
  const [provider, setProvider] = useState('');
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('0.00');
  const [validUntil, setValidUntil] = useState('2026-11-30');

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

  const columns: DataTableColumn<CotizacionCompra>[] = [
    {
      key: 'numero',
      label: 'Cotización',
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
      key: 'total',
      label: 'Total',
      flex: 0.9,
      align: 'right',
      render: row => <Text style={S.textBold}>S/ {row.total.toFixed(2)}</Text>,
    },
    {
      key: 'valida',
      label: 'Válida hasta',
      flex: 0.9,
      align: 'center',
      render: row => <Text style={S.textMuted}>{row.valida_hasta ?? '—'}</Text>,
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
      flex: 1.3,
      align: 'center',
      render: row => (
        <View style={styles.actions}>
          <AdminButton
            label="Ver"
            variant="secondary"
            size="sm"
            onPress={() =>
              showAlert('info', `Cotización ${row.numero}`, `Total S/ ${row.total.toFixed(2)}`)
            }
          />
          <AdminButton
            label="Generar orden"
            variant="dark"
            size="sm"
            onPress={async () => {
              const result = await createOrderFromQuote({ quoteId: row.id });
              if (!result.success) {
                showAlert('error', 'No se pudo generar', result.error ?? 'Error al guardar.');
                return;
              }
              showAlert('success', 'Orden generada', `Se generó una orden desde ${row.numero}.`);
            }}
          />
        </View>
      ),
    },
  ];

  return (
    <AdminPage
      active="Compras"
      title="Cotizaciones de compra"
      subtitle="Compara precios y convierte una cotización en orden de compra."
      tabs={comprasTabs('cotizaciones')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={S.col40}>
          <AdminCard title="Nueva cotización">
            <SelectField
              label="Proveedor"
              value={provider}
              options={providerOptions}
              onChange={setProvider}
              placeholder="Selecciona proveedor"
            />
            <SelectField
              label="Producto"
              value={productId}
              options={productOptions}
              onChange={value => {
                setProductId(value);
                setVariantId('');
              }}
              placeholder="Selecciona producto"
            />
            <SelectField
              label="Talla"
              value={variantId}
              options={sizeOptions}
              onChange={setVariantId}
              placeholder="Selecciona talla"
            />
            <View style={S.row}>
              <TextField
                label="Cantidad"
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
                style={S.field}
              />
              <TextField
                label="Precio unitario"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="decimal-pad"
                prefix="S/"
                style={S.field}
              />
            </View>
            <TextField label="Válida hasta" value={validUntil} onChangeText={setValidUntil} />
            <View style={S.actionsRow}>
              <AdminButton
                label="Guardar cotización"
                style={S.actionFlex}
                onPress={async () => {
                  const variant = variants.find(item => String(item.id) === variantId);
                  const quantity = Number(qty) || 0;
                  const price = Number(unitPrice.replace(',', '.')) || 0;
                  if (!provider || !variant || quantity <= 0 || price <= 0) {
                    showAlert('warning', 'Datos incompletos', 'Completa proveedor, producto, cantidad y precio.');
                    return;
                  }
                  const result = await createQuote({
                    providerId: Number(provider),
                    validUntil,
                    lines: [
                      {
                        variantId: variant.id,
                        cantidad: quantity,
                        precioUnitario: price,
                      },
                    ],
                  });
                  if (!result.success) {
                    showAlert('error', 'No se pudo guardar', result.error ?? 'Error al guardar.');
                    return;
                  }
                  showAlert('success', 'Cotización guardada', 'La cotización quedó pendiente.');
                }}
              />
              <AdminButton
                label="Limpiar"
                variant="secondary"
                style={S.actionFlex}
                onPress={() => {
                  setQty('1');
                  setUnitPrice('0.00');
                }}
              />
            </View>
          </AdminCard>
        </View>

        <View style={S.col60}>
          <AdminCard title="Cotizaciones registradas">
            <DataTable
              columns={columns}
              rows={quotes}
              keyExtractor={row => row.numero}
              minWidth={760}
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
});
