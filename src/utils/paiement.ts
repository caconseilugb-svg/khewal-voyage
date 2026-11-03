// Numéros marchands affichés au client (configurés dans .env, jamais en dur dans le code).
const env = import.meta.env

export const numerosPaiement: Record<string, string> = {
  wave: env.VITE_WAVE_NUMBER ?? '',
  orange_money: env.VITE_ORANGE_NUMBER ?? '',
}

const whatsapp = (env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')

/** Lien WhatsApp pré-rempli pour signaler un paiement (vide si le numéro n'est pas configuré). */
export function lienWhatsApp(message: string): string {
  return whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : ''
}
