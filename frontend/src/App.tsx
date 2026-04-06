import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import GamesPage from './pages/GamesPage'
import FamilyFeudQuestionsPage from './pages/FamilyFeudQuestionsPage'
import GameSetsPage from './pages/GameSetsPage'
import ControlPanelPage from './pages/ControlPanelPage'
import DisplayPage from './pages/DisplayPage'
import SessionLobbyPage from './pages/SessionLobbyPage'
import BlindTestGameSetsPage from './pages/BlindTestGameSetsPage'
import BlindTestControlPage from './pages/BlindTestControlPage'
import BlindTestDisplayPage from './pages/BlindTestDisplayPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Family Feud — display + control publics */}
      <Route path="/game-sessions/:id/display" element={<DisplayPage />} />
      <Route path="/game-sessions/:id/control" element={<ControlPanelPage />} />
      {/* Blind Test — display + control publics */}
      <Route path="/blind-test/:id/display" element={<BlindTestDisplayPage />} />
      <Route path="/blind-test/:id/control" element={<BlindTestControlPage />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/family-feud/questions" element={<FamilyFeudQuestionsPage />} />
        <Route path="/games/family-feud/game-sets" element={<GameSetsPage />} />
        <Route path="/games/blind-test/game-sets" element={<BlindTestGameSetsPage />} />
        <Route path="/game-sessions/:id/lobby" element={<SessionLobbyPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
