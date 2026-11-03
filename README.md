# KHEWAL-VOYAGE

Plateforme de réservation de transport interurbain au Sénégal.
*Voyagez simplement, réservez en toute confiance.*

## Démarrage

```bash
npm install
cp .env.example .env     # puis renseigner les valeurs Supabase (Phase 2)
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
- [x] Base SQL, réservation, suivi, admin de base
- [ ] Paiements automatiques Wave/Orange, export Excel/PDF, véhicules, clients

## Mise en route Supabase
1. Créez un projet Supabase, puis copiez l'URL et la clé anon dans `.env`.
2. SQL Editor : exécutez `supabase/migrations/001_init.sql`, puis `002_securite_et_telephone.sql` (téléphones normalisés, anti-abus, correctif paiement).
3. Authentication > Users : créez l'administrateur (désactivez l'inscription publique dans Auth > Providers > Email).
4. Rendez-le admin : `insert into admin_users(id,email) select id,email from auth.users where email='VOTRE_EMAIL';`
5. Connexion sur /admin/connexion, ajoutez un trajet puis un voyage.

## Paiement manuel
Renseignez dans `.env` (et dans les variables Netlify) `VITE_WAVE_NUMBER`, `VITE_ORANGE_NUMBER` et `VITE_WHATSAPP_NUMBER` : ils sont affichés au client sur la page de suivi.

## À faire ensuite (sécurité)
- Ajouter un captcha (Cloudflare Turnstile) via une Edge Function devant `create_reservation`.
- Planifier `expire_reservations()` avec `pg_cron` toutes les 5 minutes.
