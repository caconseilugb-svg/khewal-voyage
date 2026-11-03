import { Bus, ShieldCheck, Wallet } from 'lucide-react'

export default function Accueil() {
  return (
    <main className="min-h-screen">
      <section className="bg-nuit text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-or text-nuit">
            <Bus size={34} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            KHEWAL<span className="text-or">-VOYAGE</span>
          </h1>
          <p className="mt-4 text-lg text-slate-200">
            Voyagez simplement, réservez en toute confiance.
          </p>
          <span className="mt-8 rounded-full bg-vert px-4 py-1 text-sm font-semibold">
            Phase 1 : le projet fonctionne ✔
          </span>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
        <div className="carte">
          <Bus className="mb-3 text-or" />
          <h2 className="font-bold">Transport interurbain</h2>
          <p className="mt-1 text-sm text-slate-600">Dakar, Saint-Louis, Louga et bien d'autres destinations.</p>
        </div>
        <div className="carte">
          <Wallet className="mb-3 text-or" />
          <h2 className="font-bold">Paiement mobile</h2>
          <p className="mt-1 text-sm text-slate-600">Wave et Orange Money (Phase 7).</p>
        </div>
        <div className="carte">
          <ShieldCheck className="mb-3 text-or" />
          <h2 className="font-bold">Sans compte</h2>
          <p className="mt-1 text-sm text-slate-600">Réservez en quelques clics, sans inscription.</p>
        </div>
      </section>
    </main>
  )
}
