import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  heading: '#1e3a5f',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  accent: '#2563eb',
} as const

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: pdfColors.text,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    lineHeight: 1.45,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: pdfColors.heading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: pdfColors.muted,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  metaItem: {
    minWidth: 120,
  },
  metaLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: pdfColors.muted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
    color: pdfColors.heading,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: pdfColors.heading,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  item: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: pdfColors.border,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: pdfColors.text,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 9,
    color: pdfColors.muted,
    marginBottom: 1,
  },
  itemPrice: {
    fontSize: 10,
    fontWeight: 600,
    color: pdfColors.heading,
    minWidth: 72,
    textAlign: 'right',
  },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: pdfColors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: pdfColors.muted,
    marginRight: 8,
  },
  footerTotal: {
    fontSize: 14,
    fontWeight: 700,
    color: pdfColors.heading,
  },
})
