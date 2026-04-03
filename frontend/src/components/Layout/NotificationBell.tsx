import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import '../../styles/NotificationBell.css';

interface Notificacao {
  id: number;
  usuario_id: number;
  mensagem: string;
  tipo: 'INFO' | 'ALERTA' | 'SUCESSO';
  lida: boolean;
  link_path?: string;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  const fetchNotificacoes = async () => {
    try {
      const res = await api.get(`${API_URL}/notificacoes`);
      setNotificacoes(res.data);
    } catch (err) { console.error('Error fetching notifications:', err); }
  };

  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const markAsRead = async (id: number) => {
    try {
      await api.put(`${API_URL}/notificacoes/${id}/lida`);
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`${API_URL}/notificacoes/ler-todas`);
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) { console.error(err); }
  };

  const handleNotificationClick = (n: Notificacao) => {
    if (!n.lida) markAsRead(n.id);
    if (n.link_path) {
      navigate(n.link_path);
      setIsOpen(false);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="bell-button" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={22} />
        {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notif-header">
            <h3>Notificações</h3>
            {unreadCount > 0 && <button onClick={markAllAsRead}>Marcar todas como lidas</button>}
          </div>

          <div className="notif-list">
            {notificacoes.length === 0 ? (
              <div className="notif-empty">Nenhuma notificação por enquanto.</div>
            ) : (
              notificacoes.map(n => (
                <div 
                  key={n.id} 
                  className={`notif-item ${!n.lida ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`notif-icon ${n.tipo.toLowerCase()}`}>
                    {n.tipo === 'ALERTA' ? <AlertCircle size={16} /> : 
                     n.tipo === 'SUCESSO' ? <CheckCircle size={16} /> : 
                     <Info size={16} />}
                  </div>
                  <div className="notif-content">
                    <p className="notif-msg">{n.mensagem}</p>
                    <span className="notif-time">{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {!n.lida && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
