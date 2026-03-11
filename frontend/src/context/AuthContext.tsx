import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'ADMIN_GERAL' | 'ADMINISTRADOR' | 'COLABORADOR' | 'INTERMITENTE';

interface AuthContextType {
    userRole: UserRole;
    setRole: (role: UserRole) => void;
    canEdit: boolean;
    isAdminGeral: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Defaulting to ADMIN_GERAL for development
    const [userRole, setUserRole] = useState<UserRole>('ADMIN_GERAL');

    const setRole = (role: UserRole) => setUserRole(role);
    const isAdminGeral = userRole === 'ADMIN_GERAL';
    const canEdit = isAdminGeral || userRole === 'ADMINISTRADOR'; // Admins can also edit some things now

    return (
        <AuthContext.Provider value={{ userRole, setRole, canEdit, isAdminGeral }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
