import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MetodoPago } from '@/types';
import { Spacing, BorderRadius, FontSize, FontWeight, TouchTarget } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PaymentModalProps {
  visible: boolean;
  total: number;
  onSelect: (metodo: MetodoPago, montoPagado?: number) => void;
  onCancel: () => void;
}

type TarjetaTipo = 'visa' | 'mastercard' | 'amex';

export default function PaymentModal({ visible, total, onSelect, onCancel }: PaymentModalProps) {
  const C = useThemeColors();
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [montoPagado, setMontoPagado] = useState('');
  const [tarjetaTipo, setTarjetaTipo] = useState<TarjetaTipo>('visa');
  const [processing, setProcessing] = useState(false);

  const vuelto = metodo === 'efectivo' && montoPagado
    ? Math.max(0, parseFloat(montoPagado) - total)
    : 0;

  const isValid = () => {
    if (!metodo) return false;
    if (metodo === 'efectivo') {
      const monto = parseFloat(montoPagado) || 0;
      return monto >= total;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!metodo || !isValid()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (metodo === 'tarjeta') {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        onSelect(metodo);
      }, 2000);
    } else if (metodo === 'yape') {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        onSelect(metodo);
      }, 2500);
    } else {
      onSelect(metodo, parseFloat(montoPagado) || 0);
    }
  };

  const handleClose = () => {
    setMetodo(null);
    setMontoPagado('');
    setTarjetaTipo('visa');
    setProcessing(false);
    onCancel();
  };

  const getMetodoIcon = (m: MetodoPago) => {
    switch (m) {
      case 'efectivo': return 'cash-outline';
      case 'tarjeta': return 'card-outline';
      case 'yape': return 'phone-portrait-outline';
    }
  };

  const getMetodoLabel = (m: MetodoPago) => {
    switch (m) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'yape': return 'Yape';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: C.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: C.text }]}>Método de Pago</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.totalLabel, { color: C.textMuted }]}>Total a pagar</Text>
          <Text style={[styles.totalValue, { color: C.accent }]}>S/ {total.toFixed(2)}</Text>

          <View style={styles.methodRow}>
            {(['efectivo', 'tarjeta', 'yape'] as MetodoPago[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, {
                  backgroundColor: metodo === m ? C.accent : C.background,
                  borderColor: metodo === m ? C.accent : C.border,
                }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMetodo(m);
                  setMontoPagado('');
                }}
              >
                <Ionicons name={getMetodoIcon(m)} size={24} color={metodo === m ? '#fff' : C.text} />
                <Text style={[styles.methodText, { color: metodo === m ? '#fff' : C.text }]}>
                  {getMetodoLabel(m)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {metodo === 'efectivo' && !processing && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Monto recibido</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: C.background, borderColor: C.border, color: C.text }]}
                  value={montoPagado}
                  onChangeText={setMontoPagado}
                  placeholder="0.00"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  autoFocus
                />
                {montoPagado && (
                  <View style={[styles.vueltoBox, { backgroundColor: vuelto >= 0 ? C.successLight : C.dangerLight }]}>
                    <Ionicons name={vuelto >= 0 ? 'checkmark-circle' : 'alert-circle'} size={20} color={vuelto >= 0 ? C.success : C.danger} />
                    <Text style={[styles.vueltoText, { color: vuelto >= 0 ? C.success : C.danger }]}>
                      Vuelto: S/ {vuelto.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {metodo === 'tarjeta' && !processing && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Tipo de tarjeta</Text>
                <View style={styles.tarjetaRow}>
                  {(['visa', 'mastercard', 'amex'] as TarjetaTipo[]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tarjetaBtn, {
                        backgroundColor: tarjetaTipo === t ? C.accent : C.background,
                        borderColor: tarjetaTipo === t ? C.accent : C.border,
                      }]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setTarjetaTipo(t);
                      }}
                    >
                      <Ionicons name="card" size={20} color={tarjetaTipo === t ? '#fff' : C.text} />
                      <Text style={[styles.tarjetaText, { color: tarjetaTipo === t ? '#fff' : C.text }]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {metodo === 'yape' && !processing && (
              <View style={styles.section}>
                <View style={[styles.yapeBox, { backgroundColor: C.accentLight }]}>
                  <Ionicons name="qr-code" size={80} color={C.accent} />
                  <Text style={[styles.yapeAmount, { color: C.accent }]}>S/ {total.toFixed(2)}</Text>
                  <Text style={[styles.yapeHint, { color: C.textMuted }]}>Escanea el código QR para pagar</Text>
                </View>
              </View>
            )}

            {processing && (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={[styles.processingText, { color: C.text }]}>
                  {metodo === 'tarjeta' ? 'Procesando tarjeta...' : 'Esperando pago Yape...'}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: isValid() && !processing ? C.success : C.textMuted }]}
              onPress={handleConfirm}
              disabled={!isValid() || processing}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmText}>
                {processing ? 'Procesando...' : `Confirmar S/ ${total.toFixed(2)}`}
              </Text>
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
    width: '90%', maxWidth: 400, maxHeight: '85%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  closeBtn: { width: TouchTarget.minimum, height: TouchTarget.minimum, justifyContent: 'center', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.sm, textAlign: 'center' },
  totalValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, textAlign: 'center', marginBottom: Spacing.lg },
  methodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  methodBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  methodText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  content: { maxHeight: 250 },
  section: { marginBottom: Spacing.md },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center',
  },
  vueltoBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.sm, marginTop: Spacing.sm,
  },
  vueltoText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  tarjetaRow: { flexDirection: 'row', gap: Spacing.sm },
  tarjetaBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  tarjetaText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  yapeBox: {
    alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg,
  },
  yapeAmount: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.md },
  yapeHint: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  processingBox: { alignItems: 'center', paddingVertical: Spacing.xxl },
  processingText: { fontSize: FontSize.md, marginTop: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center',
    minHeight: TouchTarget.minimum,
  },
  cancelText: { fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    minHeight: TouchTarget.minimum,
  },
  confirmText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
