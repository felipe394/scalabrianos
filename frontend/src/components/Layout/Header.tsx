import { Menu, LogOut } from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

const Header: React.FC = () => {
  const { toggleSidebar } = useLayout();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="logo-container">
          <img src={logo} alt="Scalabrianos Logo" className="header-logo" />
        </div>
      </div>

      <div className="header-center">
        <h1>Scalabrianos Portal</h1>
      </div>

      <div className="header-right">
        <div className="user-info" onClick={() => navigate('/login')}>
          <span>Admin</span>
          <LogOut size={20} className="logout-icon" />
        </div>
      </div>

      <style>{`
        .header {
          height: 70px;
          background-color: var(--header-bg);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .menu-toggle {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-logo {
          width: 550px;
          max-width: 180px;
          object-fit: contain;
        }

        .header-center h1 {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .user-info:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .logout-icon {
          opacity: 0.8;
        }
      `}</style>
    </header>
  );
};

export default Header;
