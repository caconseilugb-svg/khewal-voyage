/**
 * Normalise un numéro sénégalais au format +221XXXXXXXXX.
 * Accepte : "77 123 45 67", "771234567", "+221 77 123 45 67", "00221771234567", "221771234567".
 * Les numéros étrangers (autre indicatif explicite) sont conservés en +chiffres.
 * Doit rester cohérent avec la fonction SQL normalize_phone (migration 002).
 */
export function normalizePhone(input: string): string {
  let d = input.replace(/[^\d+]/g, '')
  if (d.startsWith('00')) d = '+' + d.slice(2)
  if (d.startsWith('+')) return '+' + d.slice(1).replace(/\D/g, '')
  d = d.replace(/\D/g, '')
  if (d.startsWith('221') && d.length === 12) return '+' + d
  if (d.length === 9) return '+221' + d
  return d
}

/** Numéro mobile sénégalais valide : +221 7X XXX XX XX (70, 75, 76, 77, 78). */
export const isSenegalMobile = (p: string) => /^\+2217[05678]\d{7}$/.test(p)
