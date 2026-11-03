import { Link } from 'react-router-dom'

export default function NonTrouvee() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-5xl font-extrabold text-nuit">404</h1>
      <p className="text-slate-600">Cette page est introuvable.</p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </main>
  )
}
