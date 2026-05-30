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
    expect(restored.hotels[0]?.dateFrom?.toISOString()).toBe(
      sample.hotels[0]?.dateFrom?.toISOString(),
    )
  })

  it('serializeDraft includes version key in JSON', () => {
    const raw = serializeDraft(sample)
    const parsed = JSON.parse(raw) as { version: number; savedAt: string }

    expect(parsed.version).toBe(1)
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
        travelAssistance: { enabled: false, description: '' },
        showTotalInPdf: true,
        hideIndividualPricesInPdf: false,
        includeLogoInPdf: false,
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
        travelAssistance: { enabled: false, description: '' },
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
        travelAssistance: { enabled: false, description: '' },
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
        travelAssistance: { enabled: false, description: '' },
        showTotalInPdf: true,
        hideIndividualPricesInPdf: false,
        includeLogoInPdf: false,
      },
      mockStorage,
    )
    expect(storage.has(DRAFT_STORAGE_KEY)).toBe(false)
  })
})
