import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import SelectField from '@/components/admin/SelectField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import AlertModal from '@/components/AlertModal';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { ADMIN } from '@/constants/adminTheme';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useAuth } from '@/context/AuthContext';
import { useClients } from '@/context/ClientsContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { useSales } from '@/context/SalesContext';
import { exportPdf } from '@/lib/export';
import { buildSaleReceiptHtml, SaleReceiptData } from '@/lib/saleReceipt';

interface CartLine {
  id: string;
  variantId: number;
  productName: string;
  size: string;
  qty: number;
  price: number;
}

export default function CarritoScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { user } = useAuth();
  const { clients } = useClients();
  const { products, variants, inventory } = useProducts();
  const { tallas } = useCatalogs();
  const { createSale } = useSales();

  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clientQuery, setClientQuery] = useState('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [lastSale, setLastSale] = useState<SaleReceiptData | null>(null);

  const selectedProduct = products.find(product => String(product.id) === productId);
  const productVariants = variants.filter(variant => variant.id_producto === selectedProduct?.id);
  const selectedVariant = variants.find(variant => String(variant.id) === variantId);
  const selectedInventory = inventory.find(item => item.id_variante === selectedVariant?.id);
  const selectedClient = clients.find(client => client.id === clientId) ?? clients[0];

  const productOptions = products.map(product => ({
    label: product.nombre,
    value: String(product.id),
  }));
  const sizeOptions = productVariants.map(variant => ({
    label: tallas.find(talla => talla.id === variant.id_talla)?.numero_talla ?? '—',
    value: String(variant.id),
  }));
  const filteredClients = clients.filter(client => {
    const query = clientQuery.trim().toLowerCase();
    if (!query) return false;
    return (
      client.nombres_razon_social.toLowerCase().includes(query) ||
      client.numero_documento.includes(query)
    );
  });

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + line.qty * line.price, 0);
    const igv = subtotal * 0.18;
    return { subtotal, igv, total: subtotal + igv };
  }, [cart]);

  const formatMoney = (value: number) => `S/ ${value.toFixed(2)}`;

  const handleAdd = () => {
    const quantity = Number(qty);
    if (!selectedProduct || !selectedVariant || !Number.isInteger(quantity) || quantity <= 0) {
      showAlert('warning', 'Datos incompletos', 'Selecciona producto, talla y una cantidad válida.');
      return;
    }
    if (!selectedInventory || selectedInventory.stock_actual < quantity) {
      showAlert('warning', 'Stock insuficiente', `Solo hay ${selectedInventory?.stock_actual ?? 0} unidades.`);
      return;
    }

    Haptics.selectionAsync();
    const sizeName =
      tallas.find(talla => talla.id === selectedVariant.id_talla)?.numero_talla ?? '—';
    setCart(previous => {
      const existing = previous.find(line => line.variantId === selectedVariant.id);
      if (existing) {
        return previous.map(line =>
          line.id === existing.id ? { ...line, qty: line.qty + quantity } : line,
        );
      }
      return [
        ...previous,
        {
          id: `line-${Date.now()}`,
          variantId: selectedVariant.id,
          productName: selectedProduct.nombre,
          size: sizeName,
          qty: quantity,
          price: selectedVariant.precio_venta,
        },
      ];
    });
    setQty('1');
  };

  const columns: DataTableColumn<CartLine>[] = [
    {
      key: 'product',
      label: 'Producto',
      flex: 2.2,
      render: line => <Text style={S.textBold}>{line.productName}</Text>,
    },
    {
      key: 'size',
      label: 'Talla',
      flex: 0.7,
      align: 'center',
      render: line => <Text style={S.text}>{line.size}</Text>,
    },
    {
      key: 'qty',
      label: 'Cant.',
      flex: 0.7,
      align: 'center',
      render: line => <Text style={S.text}>{line.qty}</Text>,
    },
    {
      key: 'price',
      label: 'Precio',
      flex: 1,
      align: 'right',
      render: line => <Text style={S.text}>{formatMoney(line.price)}</Text>,
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      flex: 1.2,
      align: 'right',
      render: line => <Text style={S.textBold}>{formatMoney(line.qty * line.price)}</Text>,
    },
    {
      key: 'action',
      label: 'Acción',
      flex: 0.8,
      align: 'center',
      render: line => (
        <TouchableOpacity
          onPress={() => setCart(previous => previous.filter(item => item.id !== line.id))}
          activeOpacity={0.8}
        >
          <Text style={S.linkDanger}>Quitar</Text>
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <AdminPage
      active="Ventas"
      title="Carrito de compras"
      subtitle="Arma la venta, selecciona al cliente y genera la boleta."
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={[S.col65, styles.stack]}>
          <AdminCard title="Agregar producto">
            <View style={S.row}>
              <SelectField
                label="Producto"
                value={productId}
                options={productOptions}
                onChange={value => {
                  setProductId(value);
                  setVariantId('');
                }}
                placeholder="Selecciona producto"
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
              <AdminButton
                label="Agregar"
                icon="add"
                onPress={handleAdd}
                style={styles.addButton}
              />
            </View>
            <Text style={S.helpText}>
              Stock disponible: {selectedInventory?.stock_actual ?? 0} unidades.
            </Text>
          </AdminCard>

          <AdminCard title="Detalle del carrito">
            <DataTable
              columns={columns}
              rows={cart}
              keyExtractor={line => line.id}
              minWidth={640}
              emptyText="El carrito está vacío."
            />
          </AdminCard>
        </View>

        <View style={[S.col35, styles.stack]}>
          <AdminCard title="Cliente">
            <TextField
              label="Buscar cliente"
              value={clientQuery}
              onChangeText={setClientQuery}
              placeholder="DNI o nombre"
              autoCapitalize="none"
            />
            <View style={S.clientBox}>
              <Text style={S.clientName}>
                {selectedClient?.nombres_razon_social ?? 'Sin clientes registrados'}
              </Text>
              <Text style={S.clientMeta}>
                {selectedClient ? `${selectedClient.tipo_documento} ${selectedClient.numero_documento}` : '—'}
              </Text>
              <Text style={S.clientMeta}>{selectedClient?.correo ?? '—'}</Text>
            </View>
            {filteredClients.length > 0 ? (
              <View style={styles.clientResults}>
                {filteredClients.map(client => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientResult}
                    onPress={() => {
                      setClientId(client.id);
                      setClientQuery('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={S.clientName}>{client.nombres_razon_social}</Text>
                    <Text style={S.clientMeta}>
                      {client.tipo_documento} {client.numero_documento}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </AdminCard>

          <AdminCard title="Resumen de la venta">
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Subtotal</Text>
              <Text style={S.summaryValue}>{formatMoney(totals.subtotal)}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>IGV 18%</Text>
              <Text style={S.summaryValue}>{formatMoney(totals.igv)}</Text>
            </View>
            <View style={S.dividerStrong} />
            <View style={S.summaryRow}>
              <Text style={S.totalLabel}>Total</Text>
              <Text style={S.totalValue}>{formatMoney(totals.total)}</Text>
            </View>
            <AdminButton
              label="Generar boleta"
              icon="receipt-outline"
              fullWidth
              onPress={async () => {
                if (cart.length === 0) {
                  showAlert('warning', 'Carrito vacío', 'Agrega al menos un producto.');
                  return;
                }
                if (!selectedClient) {
                  showAlert('warning', 'Cliente requerido', 'Registra un cliente antes de vender.');
                  return;
                }
                if (!user?.employeeId) {
                  showAlert('error', 'Sesión inválida', 'Vuelve a iniciar sesión.');
                  return;
                }
                const result = await createSale({
                  clientId: selectedClient.id,
                  employeeId: user.employeeId,
                  items: cart.map(line => ({
                    variantId: line.variantId,
                    cantidad: line.qty,
                    precioUnitario: line.price,
                  })),
                });
                if (!result.success || !result.venta) {
                  showAlert('error', 'No se pudo generar', result.error ?? 'Error al guardar.');
                  return;
                }
                setLastSale({
                  comprobante: result.venta.comprobante ?? '',
                  fecha: new Date(result.venta.fecha).toLocaleString('es-PE'),
                  cliente: selectedClient.nombres_razon_social,
                  documentoCliente: `${selectedClient.tipo_documento} ${selectedClient.numero_documento}`,
                  items: cart.map(line => ({
                    producto: line.productName,
                    talla: line.size,
                    cantidad: line.qty,
                    precio: line.price,
                    subtotal: line.qty * line.price,
                  })),
                  subtotal: result.venta.subtotal,
                  igv: result.venta.igv,
                  total: result.venta.total,
                });
                setCart([]);
                showAlert(
                  'success',
                  'Boleta generada',
                  `${result.venta.comprobante} · Total ${formatMoney(result.venta.total)}`,
                );
              }}
            />
            <AdminButton
              label="Vaciar carrito"
              variant="secondary"
              fullWidth
              onPress={() => setCart([])}
            />
          </AdminCard>

          {lastSale ? (
            <AdminCard title="Última boleta">
              <View style={S.summaryRow}>
                <Text style={S.summaryLabel}>Comprobante</Text>
                <Text style={S.summaryValue}>{lastSale.comprobante}</Text>
              </View>
              <View style={S.summaryRow}>
                <Text style={S.summaryLabel}>Cliente</Text>
                <Text style={S.summaryValue}>{lastSale.cliente}</Text>
              </View>
              <View style={S.summaryRow}>
                <Text style={S.summaryLabel}>Total</Text>
                <Text style={S.summaryValue}>{formatMoney(lastSale.total)}</Text>
              </View>
              <AdminButton
                label="Descargar boleta PDF"
                icon="download-outline"
                fullWidth
                onPress={async () => {
                  try {
                    await exportPdf(buildSaleReceiptHtml(lastSale));
                    showAlert(
                      'success',
                      'Boleta generada',
                      'La boleta se abrió para imprimir o guardar.',
                    );
                  } catch (error) {
                    showAlert(
                      'error',
                      'No se pudo generar la boleta',
                      error instanceof Error ? error.message : 'Error al generar el PDF.',
                    );
                  }
                }}
              />
            </AdminCard>
          ) : null}
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
  addButton: {
    minWidth: 110,
    height: 44,
  },
  clientResults: {
    gap: 6,
  },
  clientResult: {
    borderWidth: 1,
    borderColor: ADMIN.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: ADMIN.card,
  },
});
