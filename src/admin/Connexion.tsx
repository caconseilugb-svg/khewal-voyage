import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Connexion() {
  const nav = useNavigate()
  const [email, setEmail] = useState(''), [pwd, setPwd] = useState(''), [vu, setVu] = useState(false), [msg, setMsg] = useState('')

  const entrer = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd })
    if (error) return setMsg('Identifiants incorrects.')
    nav('/admin')
  }
  const oublie = async () => {
    if (!email) return setMsg("Saisissez d'abord votre e-mail.")
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin/connexion' })
    setMsg('Si le compte existe, un e-mail a été envoyé.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-nuit p-6">
      <form onSubmit={entrer} className="carte grid w-full max-w-sm gap-4">
        <h1 className="text-xl font-bold">Administration</h1>
        <input type="email" required className="champ" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <input type={vu ? 'text' : 'password'} required className="champ pr-10" placeholder="Mot de passe" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <button type="button" className="absolute right-3 top-3" onClick={() => setVu(!vu)}>{vu ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {msg && <p className="text-sm text-red-700">{msg}</p>}
        <button className="btn-primary">Se connecter</button>
        <button type="button" onClick={oublie} className="text-sm underline">Mot de passe oublié</button>
      </form>
    </main>
  )
}
