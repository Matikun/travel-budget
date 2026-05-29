/**
 * CSP for @react-pdf/renderer (Yoga WASM). In-browser PDF generation requires
 * `'unsafe-eval'` in many browsers — `wasm-unsafe-eval` alone is not enough.
 * @see https://github.com/diegomura/react-pdf/issues/2596
 */
export const productionCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' data: blob:",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
].join('; ')

/** Dev: no CSP header — avoids conflicting with Vite HMR and strict embed previews. */
export const developmentCsp: string | undefined = undefined
