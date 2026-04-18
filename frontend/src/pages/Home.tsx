import React, { useState, useEffect } from 'react';
import {
  Users, Home as HouseIcon, FileText, Activity,
  UserCheck, UserMinus, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Home.css';

interface DashboardStats {
  totalUsers: number;
  totalHouses: number;
  totalItineraries: number;
  recentActivities: Array<{ id: number, user: string, activity: string, time: string }>;
}

const Home: React.FC = () => {
  const { t } = useTranslation();
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

  const stats = [
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
            <button className="quick-btn">
              <UserCheck size={20} />
              <span>{t('dashboard.quick_access.validate_profiles')}</span>
            </button>
            <button className="quick-btn">
              <FileText size={20} />
              <span>{t('dashboard.quick_access.new_reports')}</span>
            </button>
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
