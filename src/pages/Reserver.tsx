import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { isSenegalMobile, normalizePhone } from '../utils/phone'

const schema = z.object({
  first: z.string().min(1, 'Prénom requis'), last: z.string().min(1, 'Nom requis'),
  phone: z.string().refine((v) => isSenegalMobile(normalizePhone(v)), 'Numéro invalide (ex. 77 123 45 67)'),
  email: z.string().email('E-mail invalide').or(z.literal('')),
  seats: z.coerce.number().int().min(1).max(10),
  method: z.enum(['wave', 'orange_money']), note: z.string().max(500).optional(),
})
type Form = z.infer<typeof schema>

export default function Reserver() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: { seats: Number(sp.get('n') ?? 1), method: 'wave', email: '' },
  })

  const envoyer = async (v: Form) => {
    setErr('')
    const phone = normalizePhone(v.phone)
    const { data, error } = await supabase.rpc('create_reservation', {
      p_trip: id, p_first: v.first, p_last: v.last, p_phone: phone, p_email: v.email,
      p_seats: v.seats, p_note: v.note ?? '', p_method: v.method,
    })
    if (error) return setErr(error.message)
    nav(`/suivi?ref=${data}&tel=${encodeURIComponent(phone)}`)
  }

  return (
    <Layout>
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Votre réservation</h1>
        <form onSubmit={handleSubmit(envoyer)} className="carte grid gap-4">
          <input className="champ" placeholder="Prénom" {...register('first')} /><p className="text-xs text-red-600">{errors.first?.message}</p>
          <input className="champ" placeholder="Nom" {...register('last')} /><p className="text-xs text-red-600">{errors.last?.message}</p>
          <input className="champ" placeholder="Téléphone (ex. 77 123 45 67)" inputMode="tel" {...register('phone')} /><p className="text-xs text-red-600">{errors.phone?.message}</p>
          <input className="champ" placeholder="E-mail (facultatif)" {...register('email')} /><p className="text-xs text-red-600">{errors.email?.message}</p>
          <input type="number" min={1} max={10} className="champ" {...register('seats')} />
          <select className="champ" {...register('method')}><option value="wave">Wave</option><option value="orange_money">Orange Money</option></select>
          <textarea className="champ" placeholder="Remarque (facultatif)" {...register('note')} />
          {err && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button disabled={isSubmitting} className="btn-vert">Confirmer la demande</button>
        </form>
      </main>
    </Layout>
  )
}
