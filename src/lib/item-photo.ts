import { resolveFileMimeType } from '@/lib/agency-logo'

export const ITEM_PHOTO_ERRORS = {
  wrongMime: 'Solo se permiten imágenes PNG o JPG.',
  fileTooLarge: 'El archivo supera el tamaño máximo de 2 MB.',
  stillTooLarge:
    'La imagen sigue siendo demasiado grande. Probá con un archivo más chico o con menos detalle.',
  processFailed: 'No se pudo procesar la imagen. Intentá con otro archivo.',
} as const

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
export const MAX_ITEM_PHOTO_DATA_URL_LENGTH = 150 * 1024
export const ITEM_PHOTO_MAX_STORED_KB = 150
const MAX_DIMENSION = 480
const JPEG_QUALITY = 0.82

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error(ITEM_PHOTO_ERRORS.processFailed))
      }
    }
    reader.onerror = () => reject(new Error(ITEM_PHOTO_ERRORS.processFailed))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(ITEM_PHOTO_ERRORS.processFailed))
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
  mimeType: 'image/png' | 'image/jpeg',
): Promise<string> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error(ITEM_PHOTO_ERRORS.processFailed))
  }

  return loadImage(dataUrl).then((image) => {
    const target = computeTargetSize(image.width, image.height)
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error(ITEM_PHOTO_ERRORS.processFailed)
    }

    context.drawImage(image, 0, 0, target.width, target.height)

    const hasTransparency =
      mimeType === 'image/png' &&
      imageHasTransparency(context, target.width, target.height)

    const outputMimeType = hasTransparency ? 'image/png' : 'image/jpeg'
    return canvas.toDataURL(
      outputMimeType,
      outputMimeType === 'image/jpeg' ? JPEG_QUALITY : undefined,
    )
  })
}

export function isValidItemPhotoDataUrl(value: string | undefined): boolean {
  if (!value?.trim()) {
    return false
  }

  return (
    value.startsWith('data:image/') &&
    value.length <= MAX_ITEM_PHOTO_DATA_URL_LENGTH
  )
}

export async function processItemPhotoFile(file: File): Promise<string> {
  const sourceMimeType = resolveFileMimeType(file)
  if (!sourceMimeType) {
    throw new Error(ITEM_PHOTO_ERRORS.wrongMime)
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(ITEM_PHOTO_ERRORS.fileTooLarge)
  }

  const initialDataUrl = await readFileAsDataUrl(file)
  const dataUrl = await resizeImageDataUrl(initialDataUrl, sourceMimeType)

  if (dataUrl.length > MAX_ITEM_PHOTO_DATA_URL_LENGTH) {
    throw new Error(ITEM_PHOTO_ERRORS.stillTooLarge)
  }

  return dataUrl
}
