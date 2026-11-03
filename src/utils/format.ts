export const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
export const dateHeure = (s?: string | null) =>
  s ? new Date(s).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
export const libelle: Record<string, string> = {
  en_attente: 'En attente', confirmee: 'Confirmée', refusee: 'Refusée', annulee: 'Annulée', terminee: 'Terminée',
  paye: 'Payé', echoue: 'Échoué', rembourse: 'Remboursé', wave: 'Wave', orange_money: 'Orange Money',
}
