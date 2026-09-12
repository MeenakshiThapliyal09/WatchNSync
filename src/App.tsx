import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { CreateRoomPage } from './pages/CreateRoomPage'
import { HomePage } from './pages/HomePage'
import { JoinRoomPage } from './pages/JoinRoomPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { RoomPage } from './pages/RoomPage'
import { TermsPage } from './pages/TermsPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="create" element={<CreateRoomPage />} />
        <Route path="join" element={<JoinRoomPage />} />
        <Route path="room/:roomId" element={<RoomPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
      </Route>
    </Routes>
  )
}

export default App
