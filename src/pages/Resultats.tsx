import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { dateHeure, fcfa } from '../utils/format'

type Row = Record<string, any>

export default function Resultats() {
  const [sp] = useSearchParams()
  const [rows, setRows] = useState<Row[] | null>(null)
  const from = sp.get('from') ?? '', to = sp.get('to') ?? '', date = sp.get('date') ?? '', n = Number(sp.get('n') ?? 1)

  useEffect(() => {
    ;(async () => {
      await supabase.rpc('expire_reservations')
      const debut = new Date(date + 'T00:00:00Z'), fin = new Date(debut.getTime() + 864e5)
      const { data } = await supabase
        .from('trips')
        .select('id,departure_time,arrival_time,price,available_seats,routes!inner(departure_city,arrival_city),vehicles(brand,model,type)')
        .eq('status', 'programme').gte('available_seats', n).gt('departure_time', new Date().toISOString())
        .eq('routes.departure_city', from).eq('routes.arrival_city', to)
        .gte('departure_time', debut.toISOString()).lt('departure_time', fin.toISOString())
        .order('departure_time')
      setRows((data as Row[]) ?? [])
    })()
  }, [from, to, date, n])

  return (
    <Layout>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">{from} → {to}</h1>
        {rows === null && <p>Chargement…</p>}
        {rows?.length === 0 && <p className="carte">Aucun voyage disponible pour cette recherche. <Link to="/" className="underline">Modifier</Link></p>}
        <div className="grid gap-4">
          {rows?.map((t) => (
            <div key={t.id} className="carte flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold">{t.routes.departure_city} → {t.routes.arrival_city}</p>
                <p className="text-sm text-slate-600">Départ {dateHeure(t.departure_time)} · Arrivée est. {dateHeure(t.arrival_time)}</p>
                <p className="text-sm text-slate-600">{t.vehicles ? `${t.vehicles.type ?? ''} ${t.vehicles.brand ?? ''}` : 'Véhicule à confirmer'} · {t.available_seats} places</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-vert">{fcfa(t.price)}<span className="text-xs font-normal"> /pers.</span></p>
                <Link to={`/reserver/${t.id}?n=${n}`} className="btn-primary mt-2">Réserver maintenant</Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  )
}
