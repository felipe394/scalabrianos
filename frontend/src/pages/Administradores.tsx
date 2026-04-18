import React, { useState, useEffect } from 'react';
import { Search, Filter, Lock, Eye, EyeOff, X, Save, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('missionaries.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN_GERAL': return t('admins.roles.admin_geral');
      case 'ADMINISTRADOR': return t('admins.roles.admin');
      case 'COLABORADOR': return t('admins.roles.colaborador');
      case 'INTERMITENTE': return t('admins.roles.intermitente');
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
      alert(t('common.error'));
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
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <Lock size={24} />
          <h2>{t('admins.title')}</h2>
        </div>
        {canEdit && (
          <button className="btn-new" onClick={handleNewProfile}>{t('admins.new_btn')}</button>
        )}
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>{t('admins.filters.search')}</label>
          <div className="search-input">
            <input type="text" placeholder={t('common.loading').replace('...', '') + "..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>{t('admins.filters.role')}</label>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">{t('missionaries.filters.all')}</option>
            <option value="ADMIN_GERAL">{t('admins.roles.admin_geral')}</option>
            <option value="ADMINISTRADOR">{t('admins.roles.admin')}</option>
            <option value="COLABORADOR">{t('admins.roles.colaborador')}</option>
            <option value="INTERMITENTE">{t('admins.roles.intermitente')}</option>
          </select>
        </div>
        <button className="btn-filter"><Filter size={18} /> {t('missionaries.filters.filter_btn')}</button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>{t('common.loading')}</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button onClick={fetchProfiles} className="btn-retry">{t('common.retry')}</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>{t('missionaries.table.id')}</th>
                <th>{t('missionaries.table.name')}</th>
                <th>{t('missionaries.table.login')}</th>
                <th className="center">{t('admins.filters.role')}</th>
                <th className="center">{t('missionaries.table.status')}</th>
                <th>{t('missionaries.table.actions')}</th>
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
              <h3>{editingProfile.id === 0 ? t('admins.modal_new') : t('admins.modal_edit')}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>{t('missionaries.wizard.civil.full_name')}</label>
                <input type="text" value={editingProfile.nome} onChange={e => setEditingProfile({ ...editingProfile, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('missionaries.wizard.access.email')}</label>
                <input type="email" value={editingProfile.login} onChange={e => setEditingProfile({ ...editingProfile, login: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{editingProfile.id === 0 ? t('missionaries.wizard.access.password') : 'Nova Senha (deixe em branco para manter)'}</label>
                <div className="password-group">
                  <input type={showPassword ? 'text' : 'password'} value={editingProfile.password || ''} onChange={e => setEditingProfile({ ...editingProfile, password: e.target.value })} required={editingProfile.id === 0} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{t('admins.filters.role')}</label>
                <select value={editingProfile.role} onChange={e => setEditingProfile({ ...editingProfile, role: e.target.value as UserRole })}>
                  <option value="ADMIN_GERAL">{t('admins.roles.admin_geral')}</option>
                  <option value="ADMINISTRADOR">{t('admins.roles.admin')}</option>
                  <option value="COLABORADOR">{t('admins.roles.colaborador')}</option>
                  <option value="INTERMITENTE">{t('admins.roles.intermitente')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('missionaries.table.status')}</label>
                <select value={editingProfile.status} onChange={e => setEditingProfile({ ...editingProfile, status: e.target.value as 'ATIVO' | 'INATIVO' })}>
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn-save" disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingProfile.id === 0 ? t('missionaries.wizard.civil.add_btn') : t('common.save')}
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
