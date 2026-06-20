import { describe, expect, it, beforeEach } from 'vitest'

import {
  DRAFT_STORAGE_KEY,
  clearStoredDraft,
  createDraftEnvelope,
  deserializeBudgetValues,
  draftHasContent,
  exportDraftJson,
  importDraftJson,
  parseDraftJson,
  readStoredDraft,
  serializeBudgetValues,
  serializeDraft,
  writeStoredDraft,
} from './draft'
import { sampleBudgetValues } from './schema'

describe('draft serialization', () => {
  const sample = sampleBudgetValues()

  it('round-trips budget values through serialize/deserialize', () => {
    const serialized = serializeBudgetValues(sample)
    const restored = deserializeBudgetValues(serialized)

    expect(restored.destination).toBe(sample.destination)
    expect(restored.dateFrom?.toISOString()).toBe(sample.dateFrom?.toISOString())
    expect(restored.dateTo?.toISOString()).toBe(sample.dateTo?.toISOString())
    expect(restored.flights).toHaveLength(sample.flights.length)
    expect(restored.flights[0]?.dateFrom?.toISOString()).toBe(
      sample.flights[0]?.dateFrom?.toISOString(),
    )
    expect(restored.flights[0]?.timeFrom).toBe(sample.flights[0]?.timeFrom)
    expect(restored.hotels[0]?.dateFrom?.toISOString()).toBe(
      sample.hotels[0]?.dateFrom?.toISOString(),
    )
    expect(restored.excursions[0]?.date?.toISOString()).toBe(
      sample.excursions[0]?.date?.toISOString(),
    )
    expect(restored.pdfLayout).toBe(sample.pdfLayout)
  })

  it('serializeDraft includes version key in JSON', () => {
    const raw = serializeDraft(sample)
    const parsed = JSON.parse(raw) as { version: number; savedAt: string }

    expect(parsed.version).toBe(2)
    expect(typeof parsed.savedAt).toBe('string')
  })

  it('parseDraftJson restores valid draft', () => {
    const raw = serializeDraft(sample)
    const result = parseDraftJson(raw)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.destination).toBe('Bariloche')
      expect(result.values.flights).toHaveLength(2)
    }
  })

  it('parseDraftJson migrates legacy v1 drafts', () => {
    const legacyEnvelope = {
      version: 1,
      savedAt: new Date().toISOString(),
      values: serializeBudgetValues({
        ...sample,
        pdfLayout: undefined as unknown as typeof sample.pdfLayout,
      }),
    }
    delete (legacyEnvelope.values as { pdfLayout?: string }).pdfLayout
    legacyEnvelope.values.excursions = legacyEnvelope.values.excursions.map(
      (excursion) => {
        const copy = { ...excursion } as Record<string, unknown>
        delete copy.date
        return copy as typeof excursion
      },
    )
    legacyEnvelope.values.transfers = legacyEnvelope.values.transfers.map(
      (transfer) => {
        const copy = { ...transfer } as Record<string, unknown>
        delete copy.date
        return copy as typeof transfer
      },
    )

    const result = parseDraftJson(JSON.stringify(legacyEnvelope))

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.pdfLayout).toBe('budget')
      expect(result.values.excursions[0]?.date).toBeUndefined()
    }
  })

  it('parseDraftJson rejects incompatible version', () => {
    const envelope = createDraftEnvelope(sample)
    const incompatible = { ...envelope, version: 99 }
    const result = parseDraftJson(JSON.stringify(incompatible))

    expect(result.status).toBe('incompatible')
  })

  it('parseDraftJson rejects invalid JSON', () => {
    expect(parseDraftJson('{not json')).toEqual({ status: 'invalid' })
  })

  it('exportDraftJson and importDraftJson round-trip', () => {
    const exported = exportDraftJson(sample)
    const imported = importDraftJson(exported)

    expect(imported.status).toBe('ok')
    if (imported.status === 'ok') {
      expect(imported.values.passengers).toBe(sample.passengers)
    }
  })

  it('draftHasContent detects empty vs filled budgets', () => {
    expect(draftHasContent(sample)).toBe(true)
    expect(
      draftHasContent({
        ...sample,
        destination: '',
        dateFrom: undefined,
        dateTo: undefined,
        passengers: 1,
        flights: [],
        hotels: [],
        excursions: [],
        transfers: [],
        carRentals: [],
        travelAssistance: { enabled: false, description: '', showPriceInPdf: true },
        showTotalInPdf: true,
        hideIndividualPricesInPdf: false,
        includeLogoInPdf: false,
        pdfLayout: 'budget',
      }),
    ).toBe(false)
  })

  it('draftHasContent is true when hideIndividualPricesInPdf is on', () => {
    expect(
      draftHasContent({
        ...sample,
        destination: '',
        dateFrom: undefined,
        dateTo: undefined,
        passengers: 1,
        flights: [],
        hotels: [],
        excursions: [],
        transfers: [],
        carRentals: [],
        travelAssistance: { enabled: false, description: '', showPriceInPdf: true },
        showTotalInPdf: true,
        hideIndividualPricesInPdf: true,
        includeLogoInPdf: false,
      }),
    ).toBe(true)
  })

  it('draftHasContent is true when includeLogoInPdf is on', () => {
    expect(
      draftHasContent({
        ...sample,
        destination: '',
        dateFrom: undefined,
        dateTo: undefined,
        passengers: 1,
        flights: [],
        hotels: [],
        excursions: [],
        transfers: [],
        carRentals: [],
        travelAssistance: { enabled: false, description: '', showPriceInPdf: true },
        showTotalInPdf: true,
        hideIndividualPricesInPdf: false,
        includeLogoInPdf: true,
      }),
    ).toBe(true)
  })

  it('parseDraftJson applies default includeLogoInPdf for old drafts', () => {
    const envelope = createDraftEnvelope(sample)
    const values = { ...envelope.values }
    delete (values as { includeLogoInPdf?: boolean }).includeLogoInPdf
    const raw = JSON.stringify({ ...envelope, values })
    const result = parseDraftJson(raw)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.includeLogoInPdf).toBe(false)
    }
  })

  it('parseDraftJson applies default hideIndividualPricesInPdf for old drafts', () => {
    const envelope = createDraftEnvelope(sample)
    const values = { ...envelope.values }
    delete (values as { hideIndividualPricesInPdf?: boolean })
      .hideIndividualPricesInPdf
    const raw = JSON.stringify({ ...envelope, values })
    const result = parseDraftJson(raw)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.hideIndividualPricesInPdf).toBe(false)
    }
  })

  it('parseDraftJson applies default showPriceInPdf for old line items', () => {
    const envelope = createDraftEnvelope(sample)
    const values = {
      ...envelope.values,
      flights: envelope.values.flights.map((flight) => {
        const copy = { ...flight }
        delete (copy as { showPriceInPdf?: boolean }).showPriceInPdf
        return copy
      }),
    }
    const raw = JSON.stringify({ ...envelope, values })
    const result = parseDraftJson(raw)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.flights[0]?.showPriceInPdf).toBe(true)
    }
  })

  it('parseDraftJson defaults missing carRentals to empty array', () => {
    const envelope = createDraftEnvelope(sample)
    const values = { ...envelope.values }
    delete (values as { carRentals?: unknown }).carRentals
    const raw = JSON.stringify({ ...envelope, values })
    const result = parseDraftJson(raw)

    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.carRentals).toEqual([])
    }
  })
})

describe('draft localStorage', () => {
  const storage = new Map<string, string>()

  const mockStorage: Storage = {
    get length() {
      return storage.size
    },
    clear() {
      storage.clear()
    },
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
  }

  beforeEach(() => {
    storage.clear()
  })

  it('writes and reads draft with versioned key', () => {
    const sample = sampleBudgetValues()
    writeStoredDraft(sample, mockStorage)

    expect(storage.has(DRAFT_STORAGE_KEY)).toBe(true)
    const result = readStoredDraft(mockStorage)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.values.destination).toBe('Bariloche')
    }
  })

  it('clearStoredDraft removes saved draft', () => {
    writeStoredDraft(sampleBudgetValues(), mockStorage)
    clearStoredDraft(mockStorage)
    expect(readStoredDraft(mockStorage).status).toBe('missing')
  })

  it('does not persist empty drafts', () => {
    writeStoredDraft(
      {
        ...sampleBudgetValues(),
        destination: '',
        dateFrom: undefined,
        dateTo: undefined,
        passengers: 1,
        flights: [],
        hotels: [],
        excursions: [],
        transfers: [],
        carRentals: [],
        travelAssistance: { enabled: false, description: '', showPriceInPdf: true },
        showTotalInPdf: true,
        hideIndividualPricesInPdf: false,
        includeLogoInPdf: false,
        pdfLayout: 'budget',
      },
      mockStorage,
    )
    expect(storage.has(DRAFT_STORAGE_KEY)).toBe(false)
  })
})
