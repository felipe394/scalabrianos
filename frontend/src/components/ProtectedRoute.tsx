import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN_GERAL' | 'ADMINISTRADOR' | 'PADRE' | 'COLABORADOR';
  requireAdmin?: boolean;
  requireManagement?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  requireAdmin,
  requireManagement 
}) => {
  const { user, isAdminGeral, canEdit, isOconomo, isSuperior, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin check (ADMIN_GERAL or ADMINISTRADOR)
  if (requireAdmin && !isAdminGeral && !canEdit) {
    return <Navigate to="/home" replace />;
  }

  // Management check (Admin, Oconomo or Superior)
  if (requireManagement && !isAdminGeral && !canEdit && !isOconomo && !isSuperior) {
    return <Navigate to="/home" replace />;
  }

  // Specific role check
  if (requiredRole && user?.role !== requiredRole && !isAdminGeral) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
