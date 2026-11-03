import { Route, Routes } from 'react-router-dom'
import Accueil from './pages/Accueil'
import NonTrouvee from './pages/NonTrouvee'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="*" element={<NonTrouvee />} />
    </Routes>
  )
}
