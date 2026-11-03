import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-nuit text-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-extrabold">KHEWAL<span className="text-or">-VOYAGE</span></Link>
          <div className="flex gap-5 text-sm"><Link to="/">Accueil</Link><Link to="/suivi">Ma réservation</Link></div>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="bg-nuit-800 py-6 text-center text-sm text-slate-300">
        © KHEWAL-VOYAGE · Voyagez simplement, réservez en toute confiance. · <Link to="/admin" className="underline">Admin</Link>
      </footer>
    </div>
  )
}
