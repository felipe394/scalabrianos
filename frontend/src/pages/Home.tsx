import React from 'react';
import {
  Users, Home as HouseIcon, FileText, Activity,
  UserCheck, UserMinus, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home: React.FC = () => {
  const { userRole } = useAuth();

  const stats = [
    { label: 'Total de Membros', value: '142', icon: <Users size={24} />, color: '#013375' },
    { label: 'Casas Religiosas', value: '12', icon: <HouseIcon size={24} />, color: '#013375' },
    { label: 'Documentos Anexados', value: '458', icon: <FileText size={24} />, color: '#013375' },
    { label: 'Em Formação', value: '28', icon: <Activity size={24} />, color: '#013375' },
  ];

  const recentActivities = [
    { id: 1, user: 'Roberto Kalili', activity: 'Atualizou dados civis', time: 'Há 10 minutos', status: 'check' },
    { id: 2, user: 'Elias Bernardo', activity: 'Adicionou novo documento', time: 'Há 25 minutos', status: 'plus' },
    { id: 3, user: 'Felipe Sousa', activity: 'Alterou status de residência', time: 'Há 1 hora', status: 'edit' },
  ];

  return (
    <div className="home-container">
      <div className="page-header">
        <div className="title-with-badge">
          <h2>Dashboard Overview</h2>
          <span className={`role-badge ${userRole.toLowerCase()}`}>
            <ShieldCheck size={14} /> {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

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
            <h3>Atividades Recentes</h3>
          </div>
          <div className="activity-list">
            {recentActivities.map((act) => (
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
            <h3>Acesso Rápido</h3>
          </div>
          <div className="quick-grid">
            <button className="quick-btn">
              <UserCheck size={20} />
              <span>Validar Perfis</span>
            </button>
            <button className="quick-btn">
              <FileText size={20} />
              <span>Novos Relatórios</span>
            </button>
            <button className="quick-btn warning">
              <UserMinus size={20} />
              <span>Pendências</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
