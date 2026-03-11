import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import CasasReligiosas from './pages/CasasReligiosas';
import DadosCivis from './pages/DadosCivis';
import EnderecoTelefone from './pages/EnderecoTelefone';
import DadosReligiosos from './pages/DadosReligiosos';
import ItinerarioFormativo from './pages/ItinerarioFormativo';
import Seminario from './pages/Seminario';
import Propedeutico from './pages/Propedeutico';
import Filosofia from './pages/Filosofia';
import Postulado from './pages/Postulado';
import Perfis from './pages/Perfis';
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
          <Route
            path="/home"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />
          <Route
            path="/casas-religiosas"
            element={
              <MainLayout>
                <CasasReligiosas />
              </MainLayout>
            }
          />
          <Route
            path="/perfis"
            element={
              <MainLayout>
                <Perfis />
              </MainLayout>
            }
          />
          <Route
            path="/dados-civis"
            element={
              <MainLayout>
                <DadosCivis />
              </MainLayout>
            }
          />
          <Route
            path="/endereco-telefones"
            element={
              <MainLayout>
                <EnderecoTelefone />
              </MainLayout>
            }
          />
          <Route
            path="/dados-religiosos"
            element={
              <MainLayout>
                <DadosReligiosos />
              </MainLayout>
            }
          />
          <Route
            path="/itinerario-formativo"
            element={
              <MainLayout>
                <ItinerarioFormativo />
              </MainLayout>
            }
          />
          <Route
            path="/itinerario/seminarios"
            element={
              <MainLayout>
                <Seminario />
              </MainLayout>
            }
          />
          <Route
            path="/itinerario/propedeutico"
            element={
              <MainLayout>
                <Propedeutico />
              </MainLayout>
            }
          />
          <Route
            path="/itinerario/filosofia"
            element={
              <MainLayout>
                <Filosofia />
              </MainLayout>
            }
          />
          <Route
            path="/itinerario/postulado"
            element={
              <MainLayout>
                <Postulado />
              </MainLayout>
            }
          />
          <Route path="/relatorios" element={<MainLayout><Relatorios /></MainLayout>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
