import { StyleSheet } from 'react-native';
import { ADMIN } from '@/constants/adminTheme';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';

export const adminScreenStyles = StyleSheet.create({
  stack: {
    gap: 20,
  },
  twoColumn: {
    flexDirection: 'column',
    gap: 20,
  },
  twoColumnDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col65: {
    flex: 13,
    width: '100%',
    minWidth: 0,
  },
  col35: {
    flex: 7,
    width: '100%',
    minWidth: 0,
  },
  col70: {
    flex: 7,
    width: '100%',
    minWidth: 0,
  },
  col30: {
    flex: 3,
    width: '100%',
    minWidth: 0,
  },
  col60: {
    flex: 6,
    width: '100%',
    minWidth: 0,
  },
  col40: {
    flex: 4,
    width: '100%',
    minWidth: 0,
  },
  col50: {
    flex: 1,
    width: '100%',
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  field: {
    flex: 1,
    minWidth: 140,
  },
  fieldSmall: {
    flex: 0.6,
    minWidth: 90,
  },
  fieldWide: {
    flex: 1.4,
    minWidth: 180,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  actionsRowEnd: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionFlex: {
    flex: 1,
    minWidth: 140,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: ADMIN.rowBorder,
    marginVertical: 14,
  },
  dividerStrong: {
    borderTopWidth: 2,
    borderTopColor: ADMIN.border,
    marginVertical: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  summaryLabel: {
    color: ADMIN.textMuted,
    fontSize: FontSize.sm,
  },
  summaryValue: {
    color: ADMIN.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  totalLabel: {
    color: ADMIN.heading,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  totalValue: {
    color: ADMIN.heading,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: FontWeight.extrabold,
  },
  helpText: {
    color: ADMIN.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  text: {
    color: ADMIN.text,
    fontSize: FontSize.sm,
  },
  textBold: {
    color: ADMIN.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  textMuted: {
    color: ADMIN.textMuted,
    fontSize: FontSize.sm,
  },
  textSmall: {
    color: ADMIN.textMuted,
    fontSize: 11,
  },
  linkDanger: {
    color: ADMIN.danger,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    textDecorationLine: 'underline',
  },
  clientBox: {
    backgroundColor: ADMIN.graySoft,
    borderRadius: 8,
    padding: 14,
    gap: 3,
  },
  clientName: {
    color: ADMIN.heading,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  clientMeta: {
    color: ADMIN.textMuted,
    fontSize: 12,
  },
  segmented: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ADMIN.border,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: ADMIN.card,
  },
  segmentActive: {
    backgroundColor: ADMIN.active,
  },
  segmentText: {
    color: ADMIN.textMuted,
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  segmentTextActive: {
    color: ADMIN.white,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
  },
  kpiLabel: {
    color: ADMIN.textMuted,
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  kpiValue: {
    color: ADMIN.heading,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: FontWeight.extrabold,
    marginTop: 8,
  },
});
