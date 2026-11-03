# KHEWAL-VOYAGE

Plateforme de réservation de transport interurbain au Sénégal.
*Voyagez simplement, réservez en toute confiance.*

## Démarrage

```bash
npm install
Copy-Item .env.example .env  # PowerShell : renseigner les valeurs Supabase en Phase 2
npm run dev
```

Ouvrir http://localhost:5173

## Build de production

```bash
npm run build
```

## Structure

- `src/components` composants réutilisables
- `src/pages` pages publiques
- `src/admin` pages administratives
- `src/services` communication avec Supabase
- `src/hooks` hooks personnalisés
- `src/types` types TypeScript
- `src/utils` fonctions utilitaires
- `supabase/migrations` scripts SQL
- `supabase/functions` fonctions serveur

## Avancement

- [x] Phase 1 : préparation du projet
- [ ] Phase 2 : Supabase et tables SQL
# khewal-voyage
