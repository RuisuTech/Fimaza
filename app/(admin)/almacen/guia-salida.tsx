import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import AdminPage from '@/components/admin/AdminPage';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import TextField from '@/components/admin/TextField';
import SelectField from '@/components/admin/SelectField';
import DataTable, { DataTableColumn } from '@/components/admin/DataTable';
import AlertModal from '@/components/AlertModal';
import { almacenTabs } from '@/constants/adminTabs';
import { adminScreenStyles as S } from '@/constants/adminStyles';
import { useAdminLayout } from '@/hooks/useAdminLayout';
import { useAdminAlert } from '@/hooks/useAdminAlert';
import { useAuth } from '@/context/AuthContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useProducts } from '@/context/ProductsContext';
import { useWarehouse } from '@/context/WarehouseContext';

interface ExitLine {
  id: string;
  variantId: number;
  producto: string;
  talla: string;
  cantidad: number;
}

export default function GuiaSalidaScreen() {
  const { isDesktop } = useAdminLayout();
  const { alert, showAlert, closeAlert } = useAdminAlert();
  const { user } = useAuth();
  const { exitGuides, createExitGuide } = useWarehouse();
  const { products, variants, inventory } = useProducts();
  const { tallas } = useCatalogs();

  const nextGuide = `GS-${String(exitGuides.length + 1).padStart(4, '0')}`;
  const [guide, setGuide] = useState(nextGuide);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Venta');
  const [reference, setReference] = useState('');
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [lines, setLines] = useState<ExitLine[]>([]);

  useEffect(() => {
    setGuide(nextGuide);
  }, [nextGuide]);

  const selectedProduct = products.find(product => String(product.id) === productId);
  const productVariants = variants.filter(variant => variant.id_producto === selectedProduct?.id);
  const selectedVariant = variants.find(variant => String(variant.id) === variantId);
  const selectedInventory = inventory.find(item => item.id_variante === selectedVariant?.id);

  const productOptions = products.map(product => ({
    label: `${product.nombre}`,
    value: String(product.id),
  }));
  const sizeOptions = productVariants.map(variant => ({
    label: tallas.find(talla => talla.id === variant.id_talla)?.numero_talla ?? '—',
    value: String(variant.id),
  }));

  const totalPairs = useMemo(
    () => lines.reduce((sum, line) => sum + line.cantidad, 0),
    [lines],
  );

  const addLine = () => {
    const quantity = Number(qty);
    if (!selectedProduct || !selectedVariant || !Number.isInteger(quantity) || quantity <= 0) {
      showAlert('warning', 'Datos incompletos', 'Selecciona producto, talla y cantidad.');
      return;
    }
    if (!selectedInventory || selectedInventory.stock_actual < quantity) {
      showAlert('warning', 'Stock insuficiente', `Disponible: ${selectedInventory?.stock_actual ?? 0}.`);
      return;
    }
    Haptics.selectionAsync();
    setLines(previous => [
      ...previous,
      {
        id: `e-${Date.now()}`,
        variantId: selectedVariant.id,
        producto: selectedProduct.nombre,
        talla: tallas.find(talla => talla.id === selectedVariant.id_talla)?.numero_talla ?? '—',
        cantidad: quantity,
      },
    ]);
    setQty('1');
  };

  const columns: DataTableColumn<ExitLine>[] = [
    {
      key: 'producto',
      label: 'Producto',
      flex: 2.4,
      render: line => <Text style={S.textBold}>{line.producto}</Text>,
    },
    {
      key: 'talla',
      label: 'Talla',
      flex: 0.8,
      align: 'center',
      render: line => <Text style={S.text}>{line.talla}</Text>,
    },
    {
      key: 'cantidad',
      label: 'Cant.',
      flex: 0.8,
      align: 'center',
      render: line => <Text style={S.text}>{line.cantidad}</Text>,
    },
    {
      key: 'action',
      label: 'Acción',
      flex: 0.8,
      align: 'center',
      render: line => (
        <TouchableOpacity
          onPress={() => setLines(previous => previous.filter(item => item.id !== line.id))}
          activeOpacity={0.8}
        >
          <Text style={S.linkDanger}>Quitar</Text>
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <AdminPage
      active="Almacén"
      title="Guía de salida"
      subtitle="Registra la mercadería que sale del almacén."
      tabs={almacenTabs('guia-salida')}
    >
      <View style={[S.twoColumn, isDesktop && S.twoColumnDesktop]}>
        <View style={[S.col70, styles.stack]}>
          <AdminCard title="Cabecera de la guía">
            <View style={S.row}>
              <TextField label="N° de guía" value={guide} onChangeText={setGuide} style={S.field} />
              <TextField label="Fecha" value={date} onChangeText={setDate} style={S.field} />
              <SelectField
                label="Motivo"
                value={reason}
                options={[
                  { label: 'Venta', value: 'Venta' },
                  { label: 'Transferencia', value: 'Transferencia' },
                  { label: 'Ajuste', value: 'Ajuste' },
                ]}
                onChange={setReason}
                style={S.field}
              />
            </View>
            <TextField
              label="Referencia o destino"
              value={reference}
              onChangeText={setReference}
              placeholder="Boleta, cliente o destino"
            />
          </AdminCard>

          <AdminCard title="Productos que salen">
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
              <AdminButton label="Agregar" icon="add" onPress={addLine} style={styles.addButton} />
            </View>
            <Text style={S.helpText}>Stock disponible: {selectedInventory?.stock_actual ?? 0}.</Text>
            <DataTable
              columns={columns}
              rows={lines}
              keyExtractor={line => line.id}
              minWidth={520}
              emptyText="Aún no hay productos en la guía."
            />
          </AdminCard>
        </View>

        <View style={S.col30}>
          <AdminCard title="Resumen">
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Líneas</Text>
              <Text style={S.summaryValue}>{lines.length}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Pares que salen</Text>
              <Text style={S.summaryValue}>{totalPairs}</Text>
            </View>
            <View style={S.divider} />
            <Text style={S.helpText}>
              La guía descuenta stock cuando se emite. Revisa las tallas antes de confirmar.
            </Text>
            <AdminButton
              label="Emitir guía de salida"
              icon="arrow-up-circle-outline"
              fullWidth
              onPress={async () => {
                if (lines.length === 0) {
                  showAlert('warning', 'Guía vacía', 'Agrega al menos un producto.');
                  return;
                }
                if (!user?.employeeId) {
                  showAlert('error', 'Sesión inválida', 'Vuelve a iniciar sesión.');
                  return;
                }
                const result = await createExitGuide({
                  numero: guide,
                  fecha: date,
                  motivo: reason,
                  referencia: reference || undefined,
                  employeeId: user.employeeId,
                  lines: lines.map(line => ({
                    variantId: line.variantId,
                    cantidad: line.cantidad,
                  })),
                });
                if (!result.success) {
                  showAlert('error', 'No se pudo emitir', result.error ?? 'Error al guardar.');
                  return;
                }
                setLines([]);
                showAlert('success', 'Guía emitida', `${guide} · ${totalPairs} pares.`);
              }}
            />
            <AdminButton
              label="Cancelar"
              variant="secondary"
              fullWidth
              onPress={() => setLines([])}
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
  addButton: {
    minWidth: 110,
    height: 44,
  },
});
