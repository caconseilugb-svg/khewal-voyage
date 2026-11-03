// Les types métier complets seront ajoutés en Phase 2 (après création des tables).
export type StatutReservation = 'en_attente' | 'confirmee' | 'refusee' | 'annulee' | 'terminee'
export type StatutPaiement = 'en_attente' | 'paye' | 'echoue' | 'rembourse'
export type MoyenPaiement = 'wave' | 'orange_money'
