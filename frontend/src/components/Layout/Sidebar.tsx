import React, { useState } from 'react';
import {
  Settings, LogOut, Home as HomeIcon, ChevronDown, ChevronRight,
  User, MapPin, BookOpen, Milestone, PieChart, FileText, GraduationCap,
  Briefcase, School, Lock
} from 'lucide-react';
import { useLayout } from '../../context/LayoutContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Administração': true,
    'Itinerário Formativo': false
  });

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const menuItems: MenuItem[] = [
    { icon: <HomeIcon size={20} />, label: 'Home', path: '/home' },
    {
      label: 'Administração',
      icon: <Settings size={20} />,
      subItems: [
        { icon: <Lock size={18} />, label: 'Perfis', path: '/perfis' },
        { icon: <User size={18} />, label: 'Dados Civis', path: '/dados-civis' },
        { icon: <MapPin size={18} />, label: 'Endereço e Telefones', path: '/endereco-telefones' },
        { icon: <BookOpen size={18} />, label: 'Dados Religiosos', path: '/dados-religiosos' },
        {
          icon: <Milestone size={18} />,
          label: 'Itinerário Formativo',
          path: '/itinerario-formativo',
          subItems: [
            { icon: <School size={16} />, label: 'Seminários', path: '/itinerario/seminarios' },
            { icon: <Briefcase size={16} />, label: 'Propedêutico', path: '/itinerario/propedeutico' },
            { icon: <GraduationCap size={16} />, label: 'Filosofia', path: '/itinerario/filosofia' },
            { icon: <FileText size={16} />, label: 'Postulado', path: '/itinerario/postulado' },
          ]
        },
      ]
    },
    { icon: <HomeIcon size={20} />, label: 'Casas Religiosas', path: '/casas-religiosas' },
    { icon: <PieChart size={20} />, label: 'Relatórios', path: '/relatorios' },
  ];

  if (!isSidebarOpen) return null;

  const renderMenuItems = (items: (MenuItem | SubItem)[], level = 0) => {
    return items.map((item, index) => {
      const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
      const isOpen = openSections[item.label];
      const isActive = item.path ? location.pathname === item.path : false;

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
          <span className="item-label">Sair</span>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;
