import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bus, ShieldCheck, Wallet } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Accueil() {
  const nav = useNavigate()
  const [villes, setVilles] = useState<string[]>([])
  const [f, setF] = useState({ from: '', to: '', date: '', n: 1 })

  useEffect(() => {
    supabase.from('routes').select('departure_city,arrival_city').then(({ data }) => {
      setVilles([...new Set((data ?? []).flatMap((r) => [r.departure_city, r.arrival_city]))].sort())
    })
  }, [])

  const chercher = (e: React.FormEvent) => {
    e.preventDefault()
    nav(`/resultats?${new URLSearchParams({ from: f.from, to: f.to, date: f.date, n: String(f.n) })}`)
  }

  return (
    <Layout>
      <section className="bg-nuit text-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-4xl font-extrabold md:text-5xl">Voyagez simplement, <span className="text-or">réservez en toute confiance.</span></h1>
          <p className="mt-3 text-slate-200">Transport interurbain au Sénégal, sans création de compte.</p>
          <form onSubmit={chercher} className="mx-auto mt-8 grid gap-3 rounded-2xl bg-white p-5 text-left text-nuit md:grid-cols-5">
            <select required className="champ" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })}>
              <option value="">Départ</option>{villes.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select required className="champ" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>
              <option value="">Arrivée</option>{villes.map((v) => <option key={v}>{v}</option>)}
            </select>
            <input type="date" required className="champ" min={new Date().toISOString().slice(0, 10)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            <input type="number" min={1} max={10} className="champ" value={f.n} onChange={(e) => setF({ ...f, n: Number(e.target.value) })} />
            <button className="btn-or">Rechercher</button>
          </form>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-14 md:grid-cols-3">
        {[[Bus, 'Comment réserver ?', '1. Cherchez · 2. Remplissez vos infos · 3. Payez avec Wave ou Orange Money.'],
          [Wallet, 'Paiement mobile', 'Wave et Orange Money. Votre place est gardée le temps du paiement.'],
          [ShieldCheck, 'Sans compte', 'Gardez votre référence et votre téléphone pour retrouver votre billet.']].map(([I, t, d]) => {
          const Icon = I as typeof Bus
          return <div key={t as string} className="carte"><Icon className="mb-3 text-or" /><h2 className="font-bold">{t as string}</h2><p className="mt-1 text-sm text-slate-600">{d as string}</p></div>
        })}
      </section>
    </Layout>
  )
}
