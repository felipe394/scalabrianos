import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useLayout();
  const navigate = useNavigate();

  const menuItems = [
    { icon: <Settings size={20} />, label: 'Administração', active: true, path: '/home' },
  ];

  if (!isSidebarOpen) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-items">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`sidebar-item ${item.active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-item logout" onClick={() => navigate('/login')}>
          <span className="item-icon"><LogOut size={20} /></span>
          <span className="item-label">Sair</span>
        </div>
      </div>

      <style>{`
        .sidebar {
          width: 240px;
          height: 100vh;
          background-color: var(--sidebar-bg);
          color: white;
          display: flex;
          flex-direction: column;
          padding: 1rem 0;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 90;
          transition: transform 0.3s ease;
        }

        .sidebar-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-top: 70px; /* Ensure items start below header */
          padding-top: 1rem;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
          gap: 1rem;
          color: #ffffff; /* Explicit white for visibility */
          opacity: 0.9;
        }

        .sidebar-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
          opacity: 1;
        }

        .sidebar-item.active {
          background-color: rgba(255, 255, 255, 0.2);
          opacity: 1;
          border-left: 4px solid white;
        }

        .item-icon {
          display: flex;
          align-items: center;
          color: white;
        }

        .item-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: white;
        }

        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 0.5rem;
          margin-bottom: 2rem;
        }

        .logout {
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
