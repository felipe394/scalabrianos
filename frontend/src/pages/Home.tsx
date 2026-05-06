import React, { useState, useEffect } from 'react';
import {
  Users, Home as HouseIcon, FileText, Activity,
  UserCheck, UserMinus, Loader2, DollarSign, AlertCircle, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/Home.css';

interface DashboardStats {
  totalUsers?: number;
  totalHouses?: number;
  totalItineraries?: number;
  isMissionary?: boolean;
  houseName?: string;
  regional?: string;
  spreadsheetStatus?: string;
  recentActivities: Array<{ id: number, user: string, activity: string, time: string }>;
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.post('/stats');
      setStatsData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = statsData?.isMissionary 
    ? [
        { label: 'Sua Casa Atual', value: statsData.houseName || '---', icon: <HouseIcon size={24} />, color: '#013375' },
        { label: 'Status Financeiro (Mês)', value: statsData.spreadsheetStatus || 'N/A', icon: <FileText size={24} />, color: statsData.spreadsheetStatus === 'VALIDADO' ? '#10b981' : '#f59e0b' },
        { label: 'Notificações', value: (statsData.recentActivities?.length || 0).toString(), icon: <Activity size={24} />, color: '#013375' },
      ]
    : [
        { label: t('dashboard.stats.total_members'), value: statsData?.totalUsers?.toString() || '0', icon: <Users size={24} />, color: '#013375' },
        { label: t('dashboard.stats.houses'), value: statsData?.totalHouses?.toString() || '0', icon: <HouseIcon size={24} />, color: '#013375' },
        { label: t('dashboard.stats.docs'), value: '458', icon: <FileText size={24} />, color: '#013375' },
        { label: t('dashboard.stats.stages'), value: statsData?.totalItineraries?.toString() || '0', icon: <Activity size={24} />, color: '#013375' },
      ];

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <h2>{t('dashboard.overview')}</h2>
        </div>
      </div>

      {statsData?.isMissionary && statsData?.spreadsheetStatus === 'DEVOLVIDO' && (
        <div className="alert-banner-returned" style={{ 
          background: '#fee2e2', 
          border: '1px solid #ef4444', 
          padding: '16px', 
          borderRadius: '12px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#b91c1c'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={24} />
            <div>
              <h4 style={{ margin: 0, fontWeight: 700 }}>Planilha Devolvida para Revisão</h4>
              <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
                O ecônomo solicitou alterações na sua planilha do mês atual. Por favor, revise os comentários e re-submeta.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/financeiro')}
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Corrigir Agora <ArrowRight size={18} />
          </button>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="activity-section">
          <div className="section-header">
            <h3>{t('dashboard.recent_activity')}</h3>
          </div>
          <div className="activity-list">
            {(statsData?.recentActivities || []).map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-avatar">
                  {act.user.charAt(0)}
                </div>
                <div className="activity-details">
                  <p><strong>{act.user}</strong> {act.activity}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-access">
          <div className="section-header">
            <h3>{t('dashboard.quick_access.title')}</h3>
          </div>
          <div className="quick-grid">
            {statsData?.isMissionary ? (
               <>
                 <button className="quick-btn" onClick={() => navigate('/financeiro')}>
                   <DollarSign size={20} />
                   <span>Preencher Planilha</span>
                 </button>
               </>
            ) : (
              <>
                <button className="quick-btn" onClick={() => navigate('/missionarios')}>
                  <UserCheck size={20} />
                  <span>{t('dashboard.quick_access.validate_profiles')}</span>
                </button>
                <button className="quick-btn" onClick={() => navigate('/financeiro')}>
                  <FileText size={20} />
                  <span>{t('dashboard.quick_access.new_reports')}</span>
                </button>
              </>
            )}
            <button className="quick-btn warning">
              <UserMinus size={20} />
              <span>{t('dashboard.quick_access.pendencies')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
