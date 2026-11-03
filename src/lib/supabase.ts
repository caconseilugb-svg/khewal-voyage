import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigure = Boolean(url && anonKey)

if (!supabaseConfigure) {
  console.warn(
    "[KHEWAL-VOYAGE] Supabase n'est pas configuré. Copiez .env.example vers .env et renseignez vos valeurs.",
  )
}

// Seule la clé publique (anon) est utilisée ici.
// Ne mettez JAMAIS la clé secrète (service_role) dans le frontend.
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'anon-key-non-configuree',
)
