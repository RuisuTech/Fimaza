import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
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
import { usePurchases } from '@/context/PurchasesContext';
import { useSuppliers } from '@/context/SuppliersContext';
import { FacturaCompra } from '@/types';

const STATUS_TONES: Record<string, BadgeTone> = {
  Pendiente: 'warning',
  Pagada: 'success',
  Vencida: 'danger',
};

export default function FacturasCompraScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { orders, invoices, createInvoice } = usePurchases();
  const { suppliers } = useSuppliers();
  const [serie, setSerie] = useState('F001');
  const [number, setNumber] = useState('000046');
  const [orderId, setOrderId] = useState('');
  const [emission, setEmission] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [amount, setAmount] = useState('0.00');
  const [paymentStatus, setPaymentStatus] = useState('Pendiente');

  const selectedOrder = orders.find(order => String(order.id) === orderId) ?? orders[0];
  const provider = suppliers.find(item => item.id === selectedOrder?.id_proveedor);
  const orderOptions = orders.map(order => ({
    label: `${order.numero} · ${suppliers.find(item => item.id === order.id_proveedor)?.razon_social ?? 'Proveedor'}`,
    value: String(order.id),
  }));

  useEffect(() => {
    if (selectedOrder) {
      setAmount(selectedOrder.total.toFixed(2));
    }
  }, [selectedOrder]);

  const columns: DataTableColumn<FacturaCompra>[] = [
    {
      key: 'factura',
      label: 'Factura',
      flex: 1.2,
      render: row => <Text style={S.textBold}>{`${row.serie}-${row.numero}`}</Text>,
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      flex: 2.2,
      render: row => (
        <Text style={S.text}>
          {suppliers.find(item => item.id === row.id_proveedor)?.razon_social ?? '—'}
        </Text>
      ),
    },
    {
      key: 'orden',
      label: 'Orden vinculada',
      flex: 1,
      align: 'center',
      render: row => (
        <Text style={S.textMuted}>
          {orders.find(order => order.id === row.id_orden_compra)?.numero ?? '—'}
        </Text>
      ),
    },
    {
      key: 'monto',
      label: 'Monto',
      flex: 1,
      align: 'right',
      render: row => <Text style={S.textBold}>S/ {row.monto.toFixed(2)}</Text>,
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
      flex: 0.8,
      align: 'center',
      render: row => (
        <AdminButton
          label="Ver"
          variant="secondary"
          size="sm"
          onPress={() =>
            showAlert('info', `Factura ${row.serie}-${row.numero}`, `Total S/ ${row.monto.toFixed(2)}`)
          }
        />
      ),
    },
  ];

  return (
    <AdminPage
      active="Compras"
      title="Facturas de compra"
      subtitle="Registra facturas y controla su estado de pago."
      tabs={comprasTabs('facturas')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={S.col40}>
          <AdminCard title="Nueva factura">
            <View style={S.row}>
              <TextField
                label="Serie"
                value={serie}
                onChangeText={setSerie}
                style={S.field}
                maxLength={4}
              />
              <TextField
                label="Número"
                value={number}
                onChangeText={setNumber}
                style={S.field}
                maxLength={8}
              />
            </View>
            <SelectField
              label="Orden de compra"
              value={orderId || (selectedOrder ? String(selectedOrder.id) : '')}
              options={orderOptions}
              onChange={setOrderId}
              placeholder="Selecciona orden"
            />
            <TextField
              label="Proveedor"
              value={provider?.razon_social ?? 'Sin proveedor'}
              editable={false}
            />
            <View style={S.row}>
              <TextField
                label="Emisión"
                value={emission}
                onChangeText={setEmission}
                style={S.field}
              />
              <TextField
                label="Vencimiento"
                value={dueDate}
                onChangeText={setDueDate}
                style={S.field}
              />
            </View>
            <View style={S.row}>
              <TextField
                label="Monto total"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                prefix="S/"
                style={S.field}
              />
              <SelectField
                label="Estado de pago"
                value={paymentStatus}
                options={[
                  { label: 'Pendiente', value: 'Pendiente' },
                  { label: 'Pagada', value: 'Pagada' },
                ]}
                onChange={setPaymentStatus}
                style={S.field}
              />
            </View>
            <View style={S.actionsRow}>
              <AdminButton
                label="Guardar factura"
                style={S.actionFlex}
                onPress={async () => {
                  const total = Number(amount.replace(',', '.')) || 0;
                  if (!selectedOrder || !provider) {
                    showAlert('warning', 'Sin orden', 'Selecciona una orden de compra.');
                    return;
                  }
                  if (!serie.trim() || !number.trim() || total <= 0) {
                    showAlert('warning', 'Datos incompletos', 'Completa serie, número y monto.');
                    return;
                  }
                  const result = await createInvoice({
                    serie: serie.trim(),
                    numero: number.trim(),
                    orderId: selectedOrder.id,
                    providerId: provider.id,
                    emission,
                    dueDate,
                    amount: total,
                    status: paymentStatus,
                  });
                  if (!result.success) {
                    showAlert('error', 'No se pudo guardar', result.error ?? 'Error al guardar.');
                    return;
                  }
                  setNumber(String(Number(number) + 1).padStart(6, '0'));
                  showAlert('success', 'Factura guardada', `${serie}-${number} registrada.`);
                }}
              />
              <AdminButton
                label="Limpiar"
                variant="secondary"
                style={S.actionFlex}
                onPress={() => {
                  setAmount('0.00');
                  setPaymentStatus('Pendiente');
                }}
              />
            </View>
          </AdminCard>
        </View>

        <View style={S.col60}>
          <AdminCard title="Facturas registradas">
            <DataTable
              columns={columns}
              rows={invoices}
              keyExtractor={row => `${row.serie}-${row.numero}`}
              minWidth={780}
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

