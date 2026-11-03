import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { supabase } from '../lib/supabase'
import { dateHeure, fcfa, libelle } from '../utils/format'

type Row = Record<string, any>

export default function Admin() {
  const nav = useNavigate()
  const [ok, setOk] = useState(false)
  const [res, setRes] = useState<Row[]>([])
  const [routes, setRoutes] = useState<Row[]>([])
  const [q, setQ] = useState(''), [filtre, setFiltre] = useState(''), [msg, setMsg] = useState('')
  const [nr, setNr] = useState({ from: '', to: '', duree: '' })
  const [nt, setNt] = useState({ route: '', dep: '', arr: '', prix: 5000, places: 18 })

  const charger = useCallback(async () => {
    await supabase.rpc('expire_reservations')
    const r = await supabase.from('reservations')
      .select('*,customers(first_name,last_name,phone),trips(departure_time,routes(departure_city,arrival_city)),payments(payment_method,payment_status,transaction_reference)')
      .order('created_at', { ascending: false })
    setRes((r.data as Row[]) ?? [])
    const ro = await supabase.from('routes').select('*').order('departure_city')
    setRoutes((ro.data as Row[]) ?? [])
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const a = user ? await supabase.from('admin_users').select('id').eq('id', user.id).maybeSingle() : null
      if (!a?.data) return nav('/admin/connexion')
      setOk(true); charger()
    })()
  }, [nav, charger])

  const act = async (p: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await p
    setMsg(error ? error.message : 'Opération réussie.')
    charger()
  }
  const pay = (r: Row) => r.payments?.[0] ?? r.payments ?? {}
  const total = res.reduce((s, r) => s + (pay(r).payment_status === 'paye' ? r.total_amount : 0), 0)
  const compte = (s: string) => res.filter((r) => r.reservation_status === s).length
  const parJour: Record<string, number> = {}
  res.forEach((r) => { const j = r.created_at.slice(5, 10); parJour[j] = (parJour[j] ?? 0) + 1 })
  const liste = res.filter((r) => (!filtre || r.reservation_status === filtre) &&
    (`${r.booking_reference} ${r.customers?.first_name} ${r.customers?.last_name} ${r.customers?.phone}`).toLowerCase().includes(q.toLowerCase()))

  if (!ok) return <p className="p-10">Chargement…</p>
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
        <button className="btn-primary" onClick={async () => { await supabase.auth.signOut(); nav('/admin/connexion') }}>Déconnexion</button>
      </header>
      {msg && <p className="rounded bg-or-100 p-3 text-sm">{msg}</p>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[['Réservations', res.length], ['En attente', compte('en_attente')], ['Confirmées', compte('confirmee')], ['Annulées', compte('annulee')], ['Voyageurs', res.reduce((s, r) => s + r.seats, 0)], ['Recettes', fcfa(total)]].map(([l, v]) => (
          <div key={l as string} className="carte"><p className="text-xs text-slate-500">{l}</p><p className="text-xl font-extrabold">{v}</p></div>
        ))}
      </section>
      <section className="carte h-56"><ResponsiveContainer><BarChart data={Object.entries(parJour).map(([j, n]) => ({ j, n }))}><XAxis dataKey="j" /><Tooltip /><Bar dataKey="n" fill="#D6A84F" /></BarChart></ResponsiveContainer></section>

      <section className="carte overflow-x-auto">
        <div className="mb-3 flex flex-wrap gap-3">
          <input className="champ max-w-xs" placeholder="Nom, téléphone, référence" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="champ max-w-[11rem]" value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">Tous statuts</option>{['en_attente', 'confirmee', 'refusee', 'annulee', 'terminee'].map((s) => <option key={s} value={s}>{libelle[s]}</option>)}
          </select>
          <button className="btn-or" onClick={() => window.print()}>Imprimer</button>
        </div>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-slate-500"><th>Réf.</th><th>Client</th><th>Trajet</th><th>Places</th><th>Montant</th><th>Statut</th><th>Paiement</th><th>Actions</th></tr></thead>
          <tbody>
            {liste.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2 font-semibold">{r.booking_reference}</td>
                <td>{r.customers?.first_name} {r.customers?.last_name}<br />{r.customers?.phone}</td>
                <td>{r.trips?.routes?.departure_city} → {r.trips?.routes?.arrival_city}<br />{dateHeure(r.trips?.departure_time)}</td>
                <td>{r.seats}</td><td>{fcfa(r.total_amount)}</td><td>{libelle[r.reservation_status]}</td>
                <td>{libelle[pay(r).payment_method]} · {libelle[pay(r).payment_status]}<br />{pay(r).transaction_reference}</td>
                <td className="space-x-1 space-y-1">
                  <button className="text-vert underline" onClick={() => { const t = prompt('Référence de transaction ?'); if (t) act(supabase.rpc('admin_set_payment', { p_reservation: r.id, p_status: 'paye', p_tx: t })) }}>Marquer payé</button>
                  <button className="underline" onClick={() => act(supabase.rpc('admin_set_status', { p_id: r.id, p_status: 'confirmee' }))}>Confirmer</button>
                  <button className="underline" onClick={() => act(supabase.rpc('admin_set_status', { p_id: r.id, p_status: 'refusee' }))}>Refuser</button>
                  <button className="text-red-700 underline" onClick={() => act(supabase.rpc('admin_set_status', { p_id: r.id, p_status: 'annulee' }))}>Annuler</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <form className="carte grid gap-3" onSubmit={(e) => { e.preventDefault(); act(supabase.from('routes').insert({ departure_city: nr.from, arrival_city: nr.to, estimated_duration: nr.duree })) }}>
          <h2 className="font-bold">Ajouter un trajet</h2>
          <input required className="champ" placeholder="Ville de départ" value={nr.from} onChange={(e) => setNr({ ...nr, from: e.target.value })} />
          <input required className="champ" placeholder="Ville d'arrivée" value={nr.to} onChange={(e) => setNr({ ...nr, to: e.target.value })} />
          <input className="champ" placeholder="Durée estimée (ex. 4h)" value={nr.duree} onChange={(e) => setNr({ ...nr, duree: e.target.value })} />
          <button className="btn-primary">Ajouter</button>
        </form>
        <form className="carte grid gap-3" onSubmit={(e) => { e.preventDefault(); act(supabase.from('trips').insert({ route_id: nt.route, departure_time: nt.dep, arrival_time: nt.arr || null, price: nt.prix, total_seats: nt.places, available_seats: nt.places })) }}>
          <h2 className="font-bold">Programmer un voyage</h2>
          <select required className="champ" value={nt.route} onChange={(e) => setNt({ ...nt, route: e.target.value })}><option value="">Trajet</option>{routes.map((r) => <option key={r.id} value={r.id}>{r.departure_city} → {r.arrival_city}</option>)}</select>
          <input required type="datetime-local" className="champ" value={nt.dep} onChange={(e) => setNt({ ...nt, dep: e.target.value })} />
          <input type="datetime-local" className="champ" value={nt.arr} onChange={(e) => setNt({ ...nt, arr: e.target.value })} />
          <input type="number" min={0} className="champ" placeholder="Prix FCFA" value={nt.prix} onChange={(e) => setNt({ ...nt, prix: Number(e.target.value) })} />
          <input type="number" min={1} className="champ" placeholder="Places" value={nt.places} onChange={(e) => setNt({ ...nt, places: Number(e.target.value) })} />
          <button className="btn-primary">Programmer</button>
        </form>
      </section>
    </main>
  )
}
