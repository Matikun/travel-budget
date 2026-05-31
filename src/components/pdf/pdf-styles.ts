import { StyleSheet } from '@react-pdf/renderer'

/**
 * Option A — clean list layout: typography + hairline dividers, no card borders.
 */
export const pdfColors = {
  heading: '#111827',
  text: '#374151',
  textSecondary: '#4b5563',
  label: '#525252',
  divider: '#e5e7eb',
  surfaceMuted: '#f3f4f6',
} as const

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: pdfColors.text,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.55,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.divider,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: pdfColors.heading,
    marginBottom: 10,
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 10,
    color: pdfColors.textSecondary,
    lineHeight: 1.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  logo: {
    height: 48,
    maxWidth: 120,
    objectFit: 'contain' as const,
  },
  headerText: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.divider,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: pdfColors.label,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
    color: pdfColors.heading,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: pdfColors.heading,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.divider,
    lineHeight: 1.35,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: pdfColors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: pdfColors.heading,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  itemDetail: {
    fontSize: 10,
    color: pdfColors.textSecondary,
    marginBottom: 3,
    lineHeight: 1.55,
  },
  itemDetailLabel: {
    fontWeight: 600,
    color: pdfColors.heading,
  },
  itemPrice: {
    fontSize: 10,
    fontWeight: 700,
    color: pdfColors.heading,
    minWidth: 76,
    textAlign: 'right',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    backgroundColor: pdfColors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: pdfColors.divider,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: pdfColors.textSecondary,
    lineHeight: 1.4,
  },
  footerTotal: {
    fontSize: 16,
    fontWeight: 700,
    color: pdfColors.heading,
    lineHeight: 1.25,
  },
  additionalInfoBlock: {
    marginBottom: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.divider,
  },
  additionalInfoLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: pdfColors.label,
    marginBottom: 6,
    lineHeight: 1.3,
  },
  additionalInfoText: {
    fontSize: 10,
    color: pdfColors.textSecondary,
    lineHeight: 1.55,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 8,
    color: pdfColors.label,
    lineHeight: 1.5,
  },
})
