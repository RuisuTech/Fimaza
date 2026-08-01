import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { VentaCabecera, MetodoPago } from '@/types';
import { Settings } from '@/context/SettingsContext';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ReceiptModalProps {
  visible: boolean;
  venta: VentaCabecera | null;
  settings: Settings;
  onClose: () => void;
}

export default function ReceiptModal({ visible, venta, settings, onClose }: ReceiptModalProps) {
  const C = useThemeColors();

  if (!venta) return null;

  const fecha = new Date(venta.fecha_venta);
  const fechaStr = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const ventaId = venta.id.toString().padStart(5, '0');

  const getMetodoLabel = (m: MetodoPago) => {
    switch (m) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'yape': return 'Yape';
    }
  };

  const getMetodoIcon = (m: MetodoPago) => {
    switch (m) {
      case 'efectivo': return 'cash-outline';
      case 'tarjeta': return 'card-outline';
      case 'yape': return 'phone-portrait-outline';
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handlePrint = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const html = generateHTML();
      await Print.printAsync({ html });
    } catch (error) {
      console.log('Error printing:', error);
    }
  };

  const generateHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: monospace; font-size: 12px; padding: 20px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .total { font-size: 16px; font-weight: bold; }
          table { width: 100%; }
          td { padding: 2px 0; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="center bold">${settings.businessName}</div>
        <div class="center">${settings.businessAddress}</div>
        <div class="center">Tel: ${settings.businessPhone}</div>
        <div class="line"></div>
        <div>Comprobante: #${ventaId}</div>
        <div>Fecha: ${fechaStr} ${horaStr}</div>
        <div class="line"></div>
        <table>
          ${venta.detalles?.map(d => `
            <tr>
              <td>${d.cantidad}x variante #${d.id_variante}</td>
              <td class="right">S/ ${d.subtotal.toFixed(2)}</td>
            </tr>
          `).join('') || ''}
        </table>
        <div class="line"></div>
        <table>
          <tr><td>Subtotal:</td><td class="right">S/ ${venta.subtotal.toFixed(2)}</td></tr>
          <tr><td>IGV (${settings.igvRate}%):</td><td class="right">S/ ${venta.igv.toFixed(2)}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">TOTAL:</td><td class="right bold total">S/ ${venta.total_venta.toFixed(2)}</td></tr>
        </table>
        <div class="line"></div>
        <div>Pago: ${getMetodoLabel(venta.metodo_pago)}</div>
        ${venta.metodo_pago === 'efectivo' && venta.monto_pagado ? `
          <div>Recibido: S/ ${venta.monto_pagado.toFixed(2)}</div>
          <div>Vuelto: S/ ${(venta.vuelto || 0).toFixed(2)}</div>
        ` : ''}
        ${venta.metodo_pago === 'yape' ? `
          <div class="center">Yape: ${settings.yapeNumber}</div>
        ` : ''}
        <div class="line"></div>
        <div class="center bold">¡Gracias por su compra!</div>
      </body>
      </html>
    `;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: C.surface }]}>
          <View style={[styles.successIcon, { backgroundColor: C.successLight }]}>
            <Ionicons name="checkmark-circle" size={48} color={C.success} />
          </View>

          <Text style={[styles.title, { color: C.text }]}>Venta Registrada</Text>

          <ScrollView style={styles.receiptScroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.receipt, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.receiptBusiness, { color: C.text }]}>{settings.businessName}</Text>
              <Text style={[styles.receiptAddress, { color: C.textMuted }]}>{settings.businessAddress}</Text>
              <Text style={[styles.receiptPhone, { color: C.textMuted }]}>Tel: {settings.businessPhone}</Text>

              <View style={[styles.receiptLine, { borderTopColor: C.border }]} />

              <Text style={[styles.receiptLabel, { color: C.textMuted }]}>Comprobante: #{ventaId}</Text>
              <Text style={[styles.receiptLabel, { color: C.textMuted }]}>Fecha: {fechaStr} {horaStr}</Text>

              <View style={[styles.receiptLine, { borderTopColor: C.border }]} />

              {venta.detalles?.map(d => (
                <View key={d.id} style={styles.receiptItem}>
                  <Text style={[styles.receiptItemText, { color: C.text }]}>{d.cantidad}x variante #{d.id_variante}</Text>
                  <Text style={[styles.receiptItemPrice, { color: C.text }]}>S/ {d.subtotal.toFixed(2)}</Text>
                </View>
              ))}

              <View style={[styles.receiptLine, { borderTopColor: C.border }]} />

              <View style={styles.receiptItem}>
                <Text style={[styles.receiptLabel, { color: C.textMuted }]}>Subtotal:</Text>
                <Text style={[styles.receiptValue, { color: C.text }]}>S/ {venta.subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptItem}>
                <Text style={[styles.receiptLabel, { color: C.textMuted }]}>IGV ({settings.igvRate}%):</Text>
                <Text style={[styles.receiptValue, { color: C.text }]}>S/ {venta.igv.toFixed(2)}</Text>
              </View>

              <View style={[styles.receiptLine, { borderTopColor: C.border }]} />

              <View style={styles.receiptItem}>
                <Text style={[styles.receiptTotalLabel, { color: C.text }]}>TOTAL:</Text>
                <Text style={[styles.receiptTotalValue, { color: C.accent }]}>S/ {venta.total_venta.toFixed(2)}</Text>
              </View>

              <View style={[styles.receiptLine, { borderTopColor: C.border }]} />

              <View style={styles.receiptItem}>
                <Text style={[styles.receiptLabel, { color: C.textMuted }]}>Pago:</Text>
                <View style={styles.receiptMethod}>
                  <Ionicons name={getMetodoIcon(venta.metodo_pago)} size={14} color={C.accent} />
                  <Text style={[styles.receiptMethodText, { color: C.accent }]}>{getMetodoLabel(venta.metodo_pago)}</Text>
                </View>
              </View>

              {venta.metodo_pago === 'efectivo' && venta.monto_pagado && (
                <>
                  <View style={styles.receiptItem}>
                    <Text style={[styles.receiptLabel, { color: C.textMuted }]}>Recibido:</Text>
                    <Text style={[styles.receiptValue, { color: C.text }]}>S/ {venta.monto_pagado.toFixed(2)}</Text>
                  </View>
                  <View style={styles.receiptItem}>
                    <Text style={[styles.receiptLabel, { color: C.textMuted }]}>Vuelto:</Text>
                    <Text style={[styles.receiptValue, { color: C.success }]}>S/ {(venta.vuelto || 0).toFixed(2)}</Text>
                  </View>
                </>
              )}

              {venta.metodo_pago === 'yape' && (
                <View style={[styles.yapeBox, { backgroundColor: C.accentLight }]}>
                  <Ionicons name="qr-code" size={60} color={C.accent} />
                  <Text style={[styles.yapeNumber, { color: C.accent }]}>{settings.yapeNumber}</Text>
                </View>
              )}

              <View style={[styles.receiptLine, { borderTopColor: C.border }]} />
              <Text style={[styles.receiptThanks, { color: C.text }]}>¡Gracias por su compra!</Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.accentLight }]} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color={C.accent} />
              <Text style={[styles.actionText, { color: C.accent }]}>Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.successLight }]} onPress={handlePrint}>
              <Ionicons name="print-outline" size={20} color={C.success} />
              <Text style={[styles.actionText, { color: C.success }]}>Imprimir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: C.background, borderColor: C.border, borderWidth: 1 }]} onPress={onClose}>
              <Ionicons name="close-outline" size={20} color={C.textSecondary} />
              <Text style={[styles.actionText, { color: C.textSecondary }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modal: {
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    width: '90%', maxWidth: 400, maxHeight: '90%',
  },
  successIcon: { alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.md },
  receiptScroll: { maxHeight: 350 },
  receipt: {
    borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md,
  },
  receiptBusiness: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'center' },
  receiptAddress: { fontSize: FontSize.xs, textAlign: 'center', marginTop: 2 },
  receiptPhone: { fontSize: FontSize.xs, textAlign: 'center', marginTop: 2 },
  receiptLine: { borderTopWidth: 1, marginVertical: Spacing.sm, borderStyle: 'dashed' },
  receiptLabel: { fontSize: FontSize.xs },
  receiptValue: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  receiptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  receiptItemText: { fontSize: FontSize.xs, flex: 1 },
  receiptItemPrice: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  receiptTotalLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  receiptTotalValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  receiptMethod: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  receiptMethodText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  yapeBox: { alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.sm, marginVertical: Spacing.sm },
  yapeNumber: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: Spacing.xs },
  receiptThanks: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
  },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
});
