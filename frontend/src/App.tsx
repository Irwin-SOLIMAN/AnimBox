import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GamesPage from './pages/GamesPage'
import FamilyFeudQuestionsPage from './pages/FamilyFeudQuestionsPage'
import GameSetsPage from './pages/GameSetsPage'
import ControlPanelPage from './pages/ControlPanelPage'
import DisplayPage from './pages/DisplayPage'
import SessionLobbyPage from './pages/SessionLobbyPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Display public — pas besoin d'être connecté sur la TV */}
      <Route path="/game-sessions/:id/display" element={<DisplayPage />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/family-feud/questions" element={<FamilyFeudQuestionsPage />} />
        <Route path="/games/family-feud/game-sets" element={<GameSetsPage />} />
        <Route path="/game-sessions/:id/lobby" element={<SessionLobbyPage />} />
        <Route path="/game-sessions/:id/control" element={<ControlPanelPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
