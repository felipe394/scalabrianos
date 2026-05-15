import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, MapPin, Users, Calendar, 
  ArrowLeft, Loader2, AlertCircle, Phone, 
  Mail, Globe, Building2, User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/CasasReligiosas.css';

interface Missionary {
  id: number;
  nome: string;
  login: string;
  situacao: string;
}

interface ReligiousHouse {
  id: number;
  nome: string;
  endereco: string;
  status: 'ATIVO' | 'INATIVO';
  regional?: string;
  paroco?: string;
  vigario_paroquial?: string;
  tipo?: string;
  pm_code?: string;
  missionarios?: Missionary[];
}

const PerfilCasa: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [house, setHouse] = useState<ReligiousHouse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHouseDetails();
  }, [id]);

  const fetchHouseDetails = async () => {
    setIsLoading(true);
    try {
      // Assuming there's an endpoint to get single house details
      const response = await api.get(`/casas-religiosas/${id}`);
      setHouse(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching house details:', err);
      setError(t('casas.error_loading') || 'Erro ao carregar detalhes da presença.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state" style={{ height: '80vh' }}>
        <Loader2 className="animate-spin" size={48} />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="error-state" style={{ height: '80vh' }}>
        <AlertCircle size={48} />
        <p>{error || 'Presença não encontrada.'}</p>
        <button className="btn-back" onClick={() => navigate('/casas-religiosas')}>
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <button className="btn-icon-back" onClick={() => navigate('/casas-religiosas')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0 }}>{house.nome}</h2>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>{house.pm_code} | {house.tipo}</span>
          </div>
        </div>
        <div className="header-actions">
          <span className={`status-tag ${house.status.toLowerCase()}`}>
            {house.status}
          </span>
        </div>
      </div>

      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1.5rem' }}>
        {/* Left Column: Info Cards */}
        <div className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card-lite" style={{ padding: '1.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <Building2 size={18} /> Informações Gerais
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="info-item">
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Endereço</label>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500, display: 'flex', gap: '8px' }}>
                  <MapPin size={16} className="text-primary" /> {house.endereco}
                </p>
              </div>
              
              <div className="info-item">
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>País / Regional</label>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 500, display: 'flex', gap: '8px' }}>
                  <Globe size={16} className="text-primary" /> {house.regional || '---'}
                </p>
              </div>

              <div className="info-item">
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Responsáveis</label>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '13px', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: 'var(--primary)' }}>Pároco:</strong> {house.paroco || '---'}
                    </div>
                    <div style={{ fontSize: '13px', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: 'var(--primary)' }}>Vigário:</strong> {house.vigario_paroquial || '---'}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Missionaries List */}
        <div className="profile-main">
          <div className="card-lite" style={{ padding: '1.5rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              <Users size={18} /> Missionários Vinculados
            </h4>
            
            <div className="data-table" style={{ boxShadow: 'none', border: '1px solid #f1f5f9' }}>
              <table style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th className="center">Status</th>
                    <th className="center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {(house.missionarios || []).length > 0 ? (
                    house.missionarios?.map(m => (
                      <tr key={m.id}>
                        <td className="bold">{m.nome}</td>
                        <td>{m.login}</td>
                        <td className="center">
                          <span className={`status-tag ${m.situacao?.toLowerCase()}`}>
                            {m.situacao}
                          </span>
                        </td>
                        <td className="center">
                          <button 
                            className="btn-action-lite" 
                            onClick={() => navigate(`/missionarios/${m.id}`)}
                          >
                            <User size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Nenhum missionário vinculado a esta presença no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilCasa;
