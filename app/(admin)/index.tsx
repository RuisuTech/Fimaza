import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AdminTopNav from '@/components/AdminTopNav';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadows } from '@/constants/theme';

const PALETTE = {
  page: '#f4f5f7',
  card: '#ffffff',
  cardBorder: '#D5DCE6',
  cardHeader: '#f8fafc',
  cardHeaderText: '#64748b',
  cardNumber: '#94a3b8',
  heading: '#0B2545',
  textMuted: '#6b7280',
  active: '#255bb3',
  white: '#ffffff',
};

const CARD_SHADOW = Platform.OS === 'web'
  ? { boxShadow: '0 2px 8px rgba(15, 43, 78, 0.06)' }
  : Shadows.sm;

interface ModuleDef {
  id: string;
  section: string;
  title: string;
  description: string;
  route: string;
}

const MODULES: ModuleDef[] = [
  {
    id: '01',
    section: 'GESTIÓN DEL SISTEMA',
    title: 'Usuarios',
    description: 'Quién entra al sistema y con qué rol.',
    route: '/(admin)/usuarios',
  },
  {
    id: '02',
    section: 'GESTIONAR VENTAS',
    title: 'Clientes',
    description: 'Datos de tus compradores para la boleta.',
    route: '/(admin)/clientes',
  },
  {
    id: '03',
    section: 'GESTIONAR VENTAS',
    title: 'Productos',
    description: 'Modelos, tallas, precios y stock mínimo.',
    route: '/(admin)/productos',
  },
  {
    id: '04',
    section: 'GESTIONAR COMPRAS',
    title: 'Proveedores',
    description: 'Directorio de proveedores de calzado.',
    route: '/(admin)/proveedores',
  },
];

interface ModuleCardProps {
  module: ModuleDef;
  isMobile: boolean;
  isTablet?: boolean;
  onOpen: (module: ModuleDef) => void;
}

function ModuleCard({ module, isMobile, isTablet, onOpen }: ModuleCardProps) {
  return (
    <View
      style={[
        styles.card,
        isMobile ? styles.cardMobile : isTablet ? styles.cardTablet : styles.cardFlex,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardSection}>{module.section}</Text>
        <Text style={styles.cardNumber}>{module.id}</Text>
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text style={styles.cardTitle}>{module.title}</Text>
          <Text style={styles.cardDescription}>{module.description}</Text>
        </View>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => onOpen(module)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${module.title}`}
        >
          <Text style={styles.cardButtonText}>Abrir →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TicketCard() {
  return (
    <View style={styles.ticket}>
      <Text style={styles.ticketBrand}>FIMAZA</Text>
      <Text style={styles.ticketType}>BOLETA ELECTRÓNICA</Text>
      <Text style={styles.ticketNumber}>B001-00000000</Text>

      <View style={styles.ticketDashed} />

      <View style={styles.ticketItems}>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketItem}>ZAPATILLA A · T40</Text>
          <Text style={styles.ticketPrice}>S/ 000.00</Text>
        </View>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketItem}>ZAPATILLA B · T38</Text>
          <Text style={styles.ticketPrice}>S/ 000.00</Text>
        </View>
      </View>

      <View style={styles.ticketSolid} />

      <View style={styles.ticketRow}>
        <Text style={styles.ticketTotal}>TOTAL</Text>
        <Text style={styles.ticketTotal}>S/ 000.00</Text>
      </View>

      <Text style={styles.ticketFooter}>GRACIAS POR SU COMPRA</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 700;

  const handleOpen = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={styles.page}>
      <AdminTopNav active="Inicio" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Panel principal</Text>
          <Text style={styles.subtitle}>
            Elige un módulo para empezar. Verás solo lo que tu rol permite.
          </Text>

          <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
            <View style={[styles.modulesColumn, isDesktop && styles.modulesColumnDesktop]}>
              {isDesktop ? (
                <>
                  <View style={styles.cardsRow}>
                    {MODULES.slice(0, 3).map(module => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        isMobile={false}
                        onOpen={item => handleOpen(item.route)}
                      />
                    ))}
                  </View>
                  <ModuleCard
                    module={MODULES[3]}
                    isMobile
                    onOpen={item => handleOpen(item.route)}
                  />
                </>
              ) : (
                <View
                  style={[
                    styles.cardsRow,
                    isMobile ? styles.cardsRowMobile : styles.cardsRowTablet,
                  ]}
                >
                  {MODULES.map(module => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      isMobile={isMobile}
                      isTablet={!isMobile}
                      onOpen={item => handleOpen(item.route)}
                    />
                  ))}
                </View>
              )}
            </View>

            <View
              style={[
                styles.ticketColumn,
                isDesktop ? styles.ticketColumnDesktop : styles.ticketColumnBelow,
              ]}
            >
              <TicketCard />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: PALETTE.page,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
  },
  scrollContentMobile: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 1200,
  },
  title: {
    color: PALETTE.heading,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  titleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  mainLayout: {
    flexDirection: 'column',
    gap: Spacing.xl,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  modulesColumn: {
    gap: Spacing.lg,
    width: '100%',
  },
  modulesColumnDesktop: {
    flex: 1,
    width: 'auto',
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.lg,
  },
  cardsRowMobile: {
    flexDirection: 'column',
  },
  cardsRowTablet: {
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    ...CARD_SHADOW,
  },
  cardFlex: {
    flex: 1,
  },
  cardMobile: {
    width: '100%',
  },
  cardTablet: {
    width: '48%',
    flexGrow: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardHeader,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopLeftRadius: BorderRadius.md - 1,
    borderTopRightRadius: BorderRadius.md - 1,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    gap: Spacing.sm,
  },
  cardSection: {
    color: PALETTE.cardHeaderText,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  cardNumber: {
    color: PALETTE.cardNumber,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  cardTitle: {
    color: PALETTE.heading,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  cardDescription: {
    color: PALETTE.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  cardButton: {
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.active,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardButtonText: {
    color: PALETTE.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  ticketColumn: {
    width: '100%',
  },
  ticketColumnDesktop: {
    width: 320,
    flexGrow: 0,
    flexShrink: 0,
  },
  ticketColumnBelow: {
    maxWidth: 420,
    alignSelf: 'center',
  },
  ticket: {
    backgroundColor: PALETTE.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    padding: Spacing.xxl,
    ...CARD_SHADOW,
  },
  ticketBrand: {
    color: PALETTE.heading,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  ticketType: {
    color: PALETTE.cardHeaderText,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 4,
  },
  ticketNumber: {
    color: PALETTE.cardNumber,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  ticketDashed: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    marginVertical: Spacing.lg,
  },
  ticketItems: {
    gap: 10,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  ticketItem: {
    color: '#334155',
    fontSize: FontSize.sm,
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  ticketPrice: {
    color: '#334155',
    fontSize: FontSize.sm,
  },
  ticketSolid: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: Spacing.lg,
  },
  ticketTotal: {
    color: PALETTE.heading,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  ticketFooter: {
    color: PALETTE.cardHeaderText,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
