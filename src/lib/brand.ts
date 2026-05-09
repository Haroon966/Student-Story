/** Public-folder brand assets — place `Student-Story-logo*.png` in `/public`. */
const base = import.meta.env.BASE_URL

/** Main logo for in-app UI (header, empty states). */
export const LOGO_PNG = `${base}Student-Story-logo.png`

/** 192×192 — favicon, Apple touch icon, PWA small icon. */
export const LOGO_192_PNG = `${base}Student-Story-logo-192.png`

/** 512×512 — PWA install / splash. */
export const LOGO_512_PNG = `${base}Student-Story-logo-512.png`
