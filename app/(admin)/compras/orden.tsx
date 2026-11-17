import React, { useEffect, useMemo, useState } from 'react';
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
import { exportPdf, escapeHtml } from '@/lib/export';
import { OrdenCompra } from '@/types';

interface OrderDetail {
  producto: string;
  talla: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

const STATUS_TONES: Record<string, BadgeTone> = {
  Emitida: 'info',
  Recibida: 'success',
};

export default function OrdenCompraScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { quotes, quoteDetails, orders, createOrderFromQuote } = usePurchases();
  const { suppliers } = useSuppliers();
  const { products, variants } = useProducts();
  const { tallas } = useCatalogs();

  const nextOrder = `OC-${String(
    Math.max(
      0,
      ...orders.map(order => Number(order.numero.replace(/\D/g, '')) || 0),
    ) + 1,
  ).padStart(4, '0')}`;
  const [orderNumber, setOrderNumber] = useState(nextOrder);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quoteId, setQuoteId] = useState('');

  useEffect(() => {
    setOrderNumber(nextOrder);
  }, [nextOrder]);

  const selectedQuote = quotes.find(quote => String(quote.id) === quoteId) ?? quotes[0];
  const details = quoteDetails.filter(detail => detail.id_cotizacion === selectedQuote?.id);
  const quoteOptions = quotes.map(quote => ({
    label: `${quote.numero} · ${quote.estado}`,
    value: String(quote.id),
  }));
  const provider = suppliers.find(item => item.id === selectedQuote?.id_proveedor);

  const rows: OrderDetail[] = details.map(detail => {
    const variant = variants.find(item => item.id === detail.id_variante);
    const product = products.find(item => item.id === variant?.id_producto);
    return {
      producto: product?.nombre ?? 'Producto',
      talla: tallas.find(talla => talla.id === variant?.id_talla)?.numero_talla ?? '—',
      cantidad: detail.cantidad,
      precio: detail.precio_unitario,
      subtotal: detail.subtotal,
    };
  });

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
    const igv = subtotal * 0.18;
    return { subtotal, igv, total: subtotal + igv };
  }, [rows]);

  const handleDownloadPdf = async () => {
    const rowsHtml = rows
      .map(
        row => `
          <tr>
            <td>${escapeHtml(row.producto)}</td>
            <td style="text-align:center">${escapeHtml(row.talla)}</td>
            <td style="text-align:center">${row.cantidad}</td>
            <td style="text-align:right">S/ ${row.precio.toFixed(2)}</td>
            <td style="text-align:right">S/ ${row.subtotal.toFixed(2)}</td>
          </tr>
        `,
      )
      .join('');

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Helvetica, Arial, sans-serif; color: #0B2545; padding: 32px; }
            h1 { margin: 0 0 4px; font-size: 24px; }
            .muted { color: #64748b; font-size: 12px; }
            .header { border-bottom: 2px solid #255bb3; padding-bottom: 16px; margin-bottom: 20px; }
            .meta { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #EEF4FB; color: #334155; font-size: 11px; text-align: left; padding: 10px; border-bottom: 1px solid #D5DCE6; }
            td { padding: 10px; border-bottom: 1px solid #E8EDF3; font-size: 12px; }
            .totals { margin-left: auto; width: 260px; margin-top: 20px; }
            .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
            .total { border-top: 2px solid #D5DCE6; margin-top: 8px; padding-top: 12px; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FIMAZA</h1>
            <div class="muted">Orden de compra</div>
          </div>
          <div class="meta">
            <div>
              <strong>${escapeHtml(orderNumber)}</strong><br />
              <span class="muted">Fecha: ${escapeHtml(date)}</span>
            </div>
            <div>
              <strong>${escapeHtml(provider?.razon_social ?? 'Sin proveedor')}</strong><br />
              <span class="muted">${escapeHtml(selectedQuote?.numero ?? '')}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align:center">Talla</th>
                <th style="text-align:center">Cant.</th>
                <th style="text-align:right">Precio</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><strong>S/ ${totals.subtotal.toFixed(2)}</strong></div>
            <div><span>IGV 18%</span><strong>S/ ${totals.igv.toFixed(2)}</strong></div>
            <div class="total"><span>Total</span><span>S/ ${totals.total.toFixed(2)}</span></div>
          </div>
        </body>
      </html>`;

    try {
      await exportPdf(html);
      showAlert('success', 'PDF generado', 'La orden se abrió para imprimir o guardar.');
    } catch (error) {
      showAlert(
        'error',
        'No se pudo generar el PDF',
        error instanceof Error ? error.message : 'Error al generar el PDF.',
      );
    }
  };

  const detailColumns: DataTableColumn<OrderDetail>[] = [
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
      key: 'cantidad',
      label: 'Cant.',
      flex: 0.7,
      align: 'center',
      render: row => <Text style={S.text}>{row.cantidad}</Text>,
    },
    {
      key: 'precio',
      label: 'Precio',
      flex: 0.9,
      align: 'right',
      render: row => <Text style={S.text}>S/ {row.precio.toFixed(2)}</Text>,
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      flex: 1,
      align: 'right',
      render: row => <Text style={S.textBold}>S/ {row.subtotal.toFixed(2)}</Text>,
    },
  ];

  const historyColumns: DataTableColumn<OrdenCompra>[] = [
    {
      key: 'numero',
      label: 'Orden',
      flex: 1,
      render: row => <Text style={S.textBold}>{row.numero}</Text>,
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      flex: 2.4,
      render: row => (
        <Text style={S.text}>
          {suppliers.find(item => item.id === row.id_proveedor)?.razon_social ?? '—'}
        </Text>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      flex: 1,
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
  ];

  return (
    <AdminPage
      active="Compras"
      title="Orden de compra"
      subtitle="Emite la orden y controla su recepción."
      tabs={comprasTabs('orden')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={[S.col70, styles.stack]}>
          <AdminCard title="Cabecera">
            <View style={S.row}>
              <TextField
                label="N° de orden"
                value={orderNumber}
                onChangeText={setOrderNumber}
                style={S.field}
              />
              <TextField label="Fecha" value={date} onChangeText={setDate} style={S.field} />
              <SelectField
                label="Cotización base"
                value={quoteId || (selectedQuote ? String(selectedQuote.id) : '')}
                options={quoteOptions}
                onChange={setQuoteId}
                placeholder="Selecciona cotización"
                style={S.fieldWide}
              />
            </View>
            <TextField
              label="Proveedor"
              value={provider?.razon_social ?? 'Sin proveedor'}
              editable={false}
            />
          </AdminCard>

          <AdminCard title="Detalle de la orden">
            <DataTable
              columns={detailColumns}
              rows={rows}
              keyExtractor={row => `${row.producto}-${row.talla}`}
              minWidth={560}
              emptyText="Selecciona una cotización con detalle."
            />
          </AdminCard>

          <AdminCard title="Hoja · Órdenes emitidas">
            <DataTable
              columns={historyColumns}
              rows={orders}
              keyExtractor={row => row.numero}
              minWidth={560}
            />
          </AdminCard>
        </View>

        <View style={S.col30}>
          <AdminCard title="Totales">
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Subtotal</Text>
              <Text style={S.summaryValue}>S/ {totals.subtotal.toFixed(2)}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>IGV 18%</Text>
              <Text style={S.summaryValue}>S/ {totals.igv.toFixed(2)}</Text>
            </View>
            <View style={S.dividerStrong} />
            <View style={S.summaryRow}>
              <Text style={S.totalLabel}>Total</Text>
              <Text style={S.totalValue}>S/ {totals.total.toFixed(2)}</Text>
            </View>
            <AdminButton
              label="Emitir orden"
              icon="checkmark-circle-outline"
              fullWidth
              onPress={async () => {
                if (!selectedQuote) {
                  showAlert('warning', 'Sin cotización', 'Selecciona una cotización.');
                  return;
                }
                const result = await createOrderFromQuote({
                  quoteId: selectedQuote.id,
                  numero: orderNumber,
                  fecha: date,
                });
                if (!result.success) {
                  showAlert('error', 'No se pudo emitir', result.error ?? 'Error al guardar.');
                  return;
                }
                showAlert('success', 'Orden emitida', `${orderNumber} · S/ ${totals.total.toFixed(2)}.`);
              }}
            />
            <AdminButton
              label="Descargar PDF"
              variant="secondary"
              icon="download-outline"
              fullWidth
              onPress={handleDownloadPdf}
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
