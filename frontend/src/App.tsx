import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import CasasReligiosas from './pages/CasasReligiosas';
import ItinerarioFormativo from './pages/ItinerarioFormativo';
import Seminario from './pages/Seminario';
import Propedeutico from './pages/Propedeutico';
import Filosofia from './pages/Filosofia';
import Postulado from './pages/Postulado';
import Perfis from './pages/Perfis';
import Administradores from './pages/Administradores';
import Missionarios from './pages/Missionarios';
import PerfilMissionario from './pages/PerfilMissionario';
import Logs from './pages/Logs';
import Relatorios from './pages/Relatorios';
import ForgotPassword from './pages/ForgotPassword';
import MainLayout from './components/Layout/MainLayout';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
          <Route path="/casas-religiosas" element={<MainLayout><CasasReligiosas /></MainLayout>} />

          {/* Admin routes — keep old /perfis for backwards compatibility */}
          <Route path="/perfis" element={<MainLayout><Perfis /></MainLayout>} />
          <Route path="/administradores" element={<MainLayout><Administradores /></MainLayout>} />

          {/* Missionary routes */}
          <Route path="/missionarios" element={<MainLayout><Missionarios /></MainLayout>} />
          <Route path="/missionarios/:id" element={<MainLayout><PerfilMissionario /></MainLayout>} />

          {/* System logs */}
          <Route path="/logs" element={<MainLayout><Logs /></MainLayout>} />

          {/* Itinerary subroutes */}
          <Route path="/itinerario-formativo" element={<MainLayout><ItinerarioFormativo /></MainLayout>} />
          <Route path="/itinerario/seminarios" element={<MainLayout><Seminario /></MainLayout>} />
          <Route path="/itinerario/propedeutico" element={<MainLayout><Propedeutico /></MainLayout>} />
          <Route path="/itinerario/filosofia" element={<MainLayout><Filosofia /></MainLayout>} />
          <Route path="/itinerario/postulado" element={<MainLayout><Postulado /></MainLayout>} />

          <Route path="/relatorios" element={<MainLayout><Relatorios /></MainLayout>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
