export const AGENCY_LOGO_STORAGE_KEY = 'travel-budget-agency-logo-v1'

export type AgencyLogo = {
  dataUrl: string
  mimeType: 'image/png' | 'image/jpeg'
  updatedAt: string
}

const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg'] as const
type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number]

export const AGENCY_LOGO_ERRORS = {
  wrongMime: 'Solo se permiten imágenes PNG o JPG.',
  fileTooLarge: 'El archivo supera el tamaño máximo de 2 MB.',
  stillTooLarge:
    'La imagen sigue siendo demasiado grande. Probá con un archivo más pequeño o con menos detalle.',
  processFailed: 'No se pudo procesar la imagen. Intentá con otro archivo.',
  storageFailed:
    'No se pudo guardar el logo. Liberá espacio en el navegador o quitá datos antiguos.',
} as const

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
export const MAX_STORED_DATA_URL_LENGTH = 400 * 1024
/** Shown in form help text (matches encoded data URL cap). */
export const AGENCY_LOGO_MAX_STORED_KB = 400
const MAX_DIMENSION = 600
const JPEG_QUALITY = 0.85

function getBrowserStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage
}

function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(value)
}

function inferMimeTypeFromFileName(fileName: string): AcceptedMimeType | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.png')) {
    return 'image/png'
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  return null
}

export function resolveFileMimeType(file: File): AcceptedMimeType | null {
  if (isAcceptedMimeType(file.type)) {
    return file.type
  }
  return inferMimeTypeFromFileName(file.name)
}

function parseStoredLogo(raw: string): AgencyLogo | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const logo = parsed as Partial<AgencyLogo>

  if (
    typeof logo.dataUrl !== 'string' ||
    !logo.dataUrl.startsWith('data:image/') ||
    (logo.mimeType !== 'image/png' && logo.mimeType !== 'image/jpeg') ||
    typeof logo.updatedAt !== 'string' ||
    logo.dataUrl.length > MAX_STORED_DATA_URL_LENGTH
  ) {
    return null
  }

  return {
    dataUrl: logo.dataUrl,
    mimeType: logo.mimeType,
    updatedAt: logo.updatedAt,
  }
}

export function readStoredAgencyLogo(storage?: Storage): AgencyLogo | null {
  const store = storage ?? getBrowserStorage()
  if (!store) {
    return null
  }

  const raw = store.getItem(AGENCY_LOGO_STORAGE_KEY)
  if (!raw) {
    return null
  }

  return parseStoredLogo(raw)
}

export function writeStoredAgencyLogo(
  logo: AgencyLogo,
  storage?: Storage,
): void {
  const store = storage ?? getBrowserStorage()
  if (!store) {
    throw new Error(AGENCY_LOGO_ERRORS.storageFailed)
  }

  try {
    store.setItem(AGENCY_LOGO_STORAGE_KEY, JSON.stringify(logo))
  } catch {
    throw new Error(AGENCY_LOGO_ERRORS.storageFailed)
  }
}

export function clearStoredAgencyLogo(storage?: Storage): void {
  const store = storage ?? getBrowserStorage()
  store?.removeItem(AGENCY_LOGO_STORAGE_KEY)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error(AGENCY_LOGO_ERRORS.processFailed))
      }
    }
    reader.onerror = () => reject(new Error(AGENCY_LOGO_ERRORS.processFailed))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(AGENCY_LOGO_ERRORS.processFailed))
    image.src = dataUrl
  })
}

function imageHasTransparency(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean {
  const { data } = context.getImageData(0, 0, width, height)
  for (let index = 3; index < data.length; index += 4) {
    if (data[index]! < 255) {
      return true
    }
  }
  return false
}

function computeTargetSize(
  width: number,
  height: number,
): { width: number; height: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height }
  }

  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function resizeImageDataUrl(
  dataUrl: string,
  mimeType: AcceptedMimeType,
): Promise<{ dataUrl: string; mimeType: 'image/png' | 'image/jpeg' }> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error(AGENCY_LOGO_ERRORS.processFailed))
  }

  return loadImage(dataUrl).then((image) => {
    const target = computeTargetSize(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error(AGENCY_LOGO_ERRORS.processFailed)
    }

    context.drawImage(image, 0, 0, target.width, target.height)

    const hasTransparency =
      mimeType === 'image/png' &&
      imageHasTransparency(context, target.width, target.height)

    const outputMimeType = hasTransparency ? 'image/png' : 'image/jpeg'
    const outputDataUrl = canvas.toDataURL(
      outputMimeType,
      outputMimeType === 'image/jpeg' ? JPEG_QUALITY : undefined,
    )

    return {
      dataUrl: outputDataUrl,
      mimeType: outputMimeType,
    }
  })
}

export async function processLogoFile(file: File): Promise<AgencyLogo> {
  const sourceMimeType = resolveFileMimeType(file)
  if (!sourceMimeType) {
    throw new Error(AGENCY_LOGO_ERRORS.wrongMime)
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(AGENCY_LOGO_ERRORS.fileTooLarge)
  }

  const initialDataUrl = await readFileAsDataUrl(file)
  const { dataUrl, mimeType } = await resizeImageDataUrl(
    initialDataUrl,
    sourceMimeType,
  )

  if (dataUrl.length > MAX_STORED_DATA_URL_LENGTH) {
    throw new Error(AGENCY_LOGO_ERRORS.stillTooLarge)
  }

  return {
    dataUrl,
    mimeType,
    updatedAt: new Date().toISOString(),
  }
}
