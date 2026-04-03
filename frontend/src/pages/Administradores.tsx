import React, { useState, useEffect } from 'react';
import { Search, Filter, Lock, Eye, EyeOff, X, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAuth, type UserRole } from '../context/AuthContext';
import api from '../api';
import '../styles/Perfis.css';

interface AdminProfile {
  id: number;
  nome: string;
  login: string;
  password?: string;
  role: UserRole;
  status: 'ATIVO' | 'INATIVO';
  situacao: 'ATIVO' | 'FALECIDO' | 'EGRESSO' | 'EXCLAUSTRADO';
}

const ADMIN_ROLES: UserRole[] = ['ADMIN_GERAL', 'ADMINISTRADOR', 'COLABORADOR', 'INTERMITENTE'];

const Administradores: React.FC = () => {
  const { canEdit } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AdminProfile | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`${API_URL}/usuarios/get`);
      const adminOnly = response.data.filter((u: AdminProfile) => ADMIN_ROLES.includes(u.role));
      setProfiles(adminOnly);
      setError(null);
    } catch (err: any) {
      setError('Erro ao carregar administradores');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN_GERAL': return 'Administrador Geral';
      case 'ADMINISTRADOR': return 'Administrador';
      case 'COLABORADOR': return 'Colaborador';
      case 'INTERMITENTE': return 'Intermitente';
      default: return role;
    }
  };

  const handleOpenEdit = (profile: AdminProfile) => {
    setEditingProfile({ ...profile });
    setIsModalOpen(true);
  };

  const handleNewProfile = () => {
    setEditingProfile({ id: 0, nome: '', login: '', password: '', role: 'COLABORADOR', status: 'ATIVO', situacao: 'ATIVO' });
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSaveLoading(true);
    try {
      if (editingProfile.id === 0) {
        await api.post(`${API_URL}/usuarios`, editingProfile);
      } else {
        await api.put(`${API_URL}/usuarios/${editingProfile.id}`, editingProfile);
      }
      await fetchProfiles();
      setIsModalOpen(false);
    } catch {
      alert('Erro ao salvar perfil');
    } finally {
      setSaveLoading(false);
    }
  };

  const filtered = profiles.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.login.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? p.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="module-container">
      <div className="page-header">
        <div className="title-with-badge">
          <Lock size={24} />
          <h2>Gestão de Administradores</h2>
        </div>
        {canEdit && (
          <button className="btn-new" onClick={handleNewProfile}>+ Novo Administrador</button>
        )}
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>BUSCAR POR NOME / LOGIN</label>
          <div className="search-input">
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>PERFIL / CARGO</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="ADMIN_GERAL">Administrador Geral</option>
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="COLABORADOR">Colaborador</option>
            <option value="INTERMITENTE">Intermitente</option>
          </select>
        </div>
        <button className="btn-filter"><Filter size={18} /> Filtrar</button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>Carregando...</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button onClick={fetchProfiles} className="btn-retry">Tentar novamente</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nome</th><th>Login (E-mail)</th>
                <th className="center">Cargo</th><th className="center">Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(profile => (
                <tr key={profile.id}>
                  <td>#{profile.id}</td>
                  <td className="bold">{profile.nome}</td>
                  <td>{profile.login}</td>
                  <td className="center"><span className={`role-tag ${profile.role.toLowerCase()}`}>{getRoleLabel(profile.role)}</span></td>
                  <td className="center"><span className={`status-tag ${profile.status.toLowerCase()}`}>{profile.status}</span></td>
                  <td><button className="btn-icon-view" onClick={() => handleOpenEdit(profile)}><Eye size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && editingProfile && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProfile.id === 0 ? 'Novo Administrador' : 'Editar Administrador'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input type="text" value={editingProfile.nome} onChange={e => setEditingProfile({ ...editingProfile, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Login (E-mail)</label>
                <input type="email" value={editingProfile.login} onChange={e => setEditingProfile({ ...editingProfile, login: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{editingProfile.id === 0 ? 'Senha' : 'Nova Senha (deixe em branco para manter)'}</label>
                <div className="password-group">
                  <input type={showPassword ? 'text' : 'password'} value={editingProfile.password || ''} onChange={e => setEditingProfile({ ...editingProfile, password: e.target.value })} required={editingProfile.id === 0} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Cargo</label>
                <select value={editingProfile.role} onChange={e => setEditingProfile({ ...editingProfile, role: e.target.value as UserRole })}>
                  <option value="ADMIN_GERAL">Administrador Geral</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="INTERMITENTE">Intermitente</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editingProfile.status} onChange={e => setEditingProfile({ ...editingProfile, status: e.target.value as 'ATIVO' | 'INATIVO' })}>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingProfile.id === 0 ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administradores;
