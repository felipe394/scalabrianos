import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';

interface MainLayoutContentProps {
  children: React.ReactNode;
}

const MainLayoutContent: React.FC<MainLayoutContentProps> = ({ children }) => {
  const { isSidebarOpen } = useLayout();

  return (
    <div className="layout-container">
      <Header />
      <div className="layout-body">
        <Sidebar />
        <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
          {children}
        </main>
      </div>

      <style>{`
        .layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .layout-body {
          display: flex;
          flex: 1;
          margin-top: 70px; /* Header height */
        }

        .main-content {
          flex: 1;
          margin-left: 240px; /* Sidebar width */
          padding: 2rem;
          background-color: var(--bg-color);
          min-height: calc(100vh - 70px);
          transition: margin-left 0.3s ease;
        }

        .main-content.expanded {
          margin-left: 0;
        }
      `}</style>
    </div>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LayoutProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LayoutProvider>
  );
};

export default MainLayout;
