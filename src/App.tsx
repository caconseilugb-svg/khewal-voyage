import { Route, Routes } from 'react-router-dom'
import Accueil from './pages/Accueil'
import Resultats from './pages/Resultats'
import Reserver from './pages/Reserver'
import Suivi from './pages/Suivi'
import NonTrouvee from './pages/NonTrouvee'
import Connexion from './admin/Connexion'
import Admin from './admin/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/resultats" element={<Resultats />} />
      <Route path="/reserver/:id" element={<Reserver />} />
      <Route path="/suivi" element={<Suivi />} />
      <Route path="/admin/connexion" element={<Connexion />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NonTrouvee />} />
    </Routes>
  )
}
