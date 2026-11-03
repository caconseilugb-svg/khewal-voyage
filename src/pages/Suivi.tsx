import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { dateHeure, fcfa, libelle } from '../utils/format'
import { normalizePhone } from '../utils/phone'
import { lienWhatsApp, numerosPaiement } from '../utils/paiement'

type Res = Record<string, any>

export default function Suivi() {
  const [sp] = useSearchParams()
  const [ref, setRef] = useState(sp.get('ref') ?? '')
  const [tel, setTel] = useState(sp.get('tel') ?? '')
  const [res, setRes] = useState<Res | null>(null)
  const [msg, setMsg] = useState('')
  const [copie, setCopie] = useState(false)

  const chercher = async (r = ref, t = tel) => {
    setMsg('')
    const { data, error } = await supabase.rpc('lookup_reservation', { p_ref: r, p_phone: normalizePhone(t) })
    setRes(data ?? null)
    if (error) setMsg(error.message)
    else if (!data) setMsg('Aucune réservation trouvée. Vérifiez la référence et le téléphone.')
  }
  useEffect(() => { if (ref && tel) chercher() }, []) // eslint-disable-line

  const copier = async (texte: string) => {
    try { await navigator.clipboard.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000) } catch { /* presse-papiers indisponible */ }
  }

  return (
    <Layout>
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Retrouver ma réservation</h1>
        <form onSubmit={(e) => { e.preventDefault(); chercher() }} className="carte grid gap-3">
          <input className="champ" placeholder="Référence (KV-XXXXXXXX)" value={ref} onChange={(e) => setRef(e.target.value)} />
          <input className="champ" placeholder="Téléphone" value={tel} onChange={(e) => setTel(e.target.value)} />
          <button className="btn-primary">Rechercher</button>
        </form>
        {msg && <p className="mt-4 text-sm text-red-700">{msg}</p>}
        {res && (
          <div className="carte mt-6 space-y-1 text-sm">
            <p className="text-lg font-extrabold text-vert">{res.reference}</p>
            <p>{res.name} · {res.departure} → {res.arrival}</p>
            <p>Départ : {dateHeure(res.departure_time)} · {res.seats} place(s)</p>
            <p>Montant : <b>{fcfa(res.total)}</b> ({libelle[res.payment_method]})</p>
            <p>Réservation : <b>{libelle[res.status]}</b> · Paiement : <b>{libelle[res.payment_status]}</b></p>
            {res.status === 'en_attente' && <p className="text-slate-600">Place gardée jusqu'au {dateHeure(res.expires_at)}.</p>}
          </div>
        )}
        {res && res.status === 'en_attente' && res.payment_status === 'en_attente' && <Paiement res={res} copie={copie} copier={copier} />}
      </main>
    </Layout>
  )
}

function Paiement({ res, copie, copier }: { res: Res; copie: boolean; copier: (t: string) => void }) {
  const numero = numerosPaiement[res.payment_method]
  const wa = lienWhatsApp(`Bonjour, j'ai payé la réservation ${res.reference} (${fcfa(res.total)}) via ${libelle[res.payment_method]}. Référence de la transaction : `)
  return (
    <div className="carte mt-4 border-2 border-or text-sm">
      <h2 className="text-base font-bold">Comment payer ?</h2>
      {numero ? (
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>Ouvrez {libelle[res.payment_method]} et envoyez exactement <b>{fcfa(res.total)}</b> au numéro <b className="text-lg">{numero}</b>.</li>
          <li>Notez la <b>référence de la transaction</b> reçue par SMS.</li>
          <li>Envoyez-nous cette référence{wa ? ' sur WhatsApp' : ''} avec votre référence de réservation <b>{res.reference}</b>.</li>
        </ol>
      ) : (
        <p className="mt-2 text-slate-600">Les coordonnées de paiement ne sont pas encore configurées. Contactez-nous avec la référence <b>{res.reference}</b>.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {numero && <button type="button" className="btn-primary" onClick={() => copier(numero)}>{copie ? 'Numéro copié ✓' : 'Copier le numéro'}</button>}
        {wa && <a className="btn-vert" href={wa} target="_blank" rel="noreferrer">J'ai payé : prévenir sur WhatsApp</a>}
      </div>
      <p className="mt-3 text-xs text-slate-500">Votre réservation est confirmée après vérification du paiement. Passé le délai indiqué, la place est libérée.</p>
    </div>
  )
}
