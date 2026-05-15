import React, { useState } from 'react';
import {
  Settings, LogOut, Home as HomeIcon, ChevronDown, ChevronRight,
  Users, Lock, ClipboardList, DollarSign, ShieldCheck, TrendingUp, MapPin, Globe, Milestone
} from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Sidebar.css';

interface SubItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  subItems?: SubItem[];
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  subItems?: SubItem[];
}

const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useLayout();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminGeral, canEdit, isOconomo, isSuperior, isRegional } = useAuth();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [t('menu.admin')]: true,
    'Itinerário Formativo': false
  });

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems: MenuItem[] = [];

  // 1. Missionários / Seminaristas
  if (isAdminGeral || canEdit || isRegional) {
    menuItems.push({ icon: <Users size={20} />, label: t('menu.missionaries'), path: '/missionarios' });
  }

  // 2. Presença Missionária
  if (isAdminGeral || canEdit || isRegional) {
    menuItems.push({ icon: <HomeIcon size={20} />, label: t('menu.houses'), path: '/casas-religiosas' });
  }

  // 3. Prestação de Contas
  menuItems.push({ icon: <DollarSign size={20} />, label: t('menu.finance'), path: '/financeiro' });

  // 4. Mapa RNSMM
  menuItems.push({ icon: <Globe size={20} />, label: t('menu.map'), path: '/mapa' });




  // 5. Gestão da Plataforma
  if (isAdminGeral || canEdit || isRegional) {
    menuItems.push({
      label: t('menu.admin'),
      icon: <Settings size={20} />,
      subItems: [
        { icon: <Lock size={18} />, label: t('menu.profiles'), path: '/administradores' },
        { icon: <ClipboardList size={18} />, label: t('menu.system_logs'), path: '/logs' },
        { icon: <ShieldCheck size={18} />, label: t('menu.access_logs'), path: '/logs-acesso' },
      ]
    });
  }



  if (!isSidebarOpen) return null;

  const renderMenuItems = (items: (MenuItem | SubItem)[], level = 0) => {
    return items.map((item, index) => {
      const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
      const isOpen = openSections[item.label];
      const isActive = item.path ? location.pathname === item.path || location.pathname.startsWith(item.path + '/') : false;

      return (
        <div key={index} className="menu-node">
          <div
            className={`sidebar-item level-${level} ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (hasSubItems) {
                toggleSection(item.label);
              } else if (item.path) {
                navigate(item.path);
              }
            }}
          >
            <span className="item-icon">{item.icon}</span>
            <span className="item-label">{item.label}</span>
            {hasSubItems && (
              <span className="chevron">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            )}
          </div>
          {hasSubItems && isOpen && (
            <div className="sub-menu-container">
              {renderMenuItems(item.subItems!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-items">
        {renderMenuItems(menuItems)}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-item logout" onClick={() => navigate('/login')}>
          <span className="item-icon"><LogOut size={20} /></span>
          <span className="item-label">{t('menu.logout')}</span>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;
