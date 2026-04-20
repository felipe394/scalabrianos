import React, { useState, useMemo, useEffect } from 'react';
import { Edit2, X, Loader2, AlertCircle, Plus, DollarSign, Trash2, Download, Home as HomeIcon, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/CasasReligiosas.css';

interface ReligiousHouse {
  id: number;
  nome: string;
  endereco: string;
  status: 'ATIVO' | 'INATIVO';
  missionarios_count: number;
  regional?: string;
  data_referencia_casa?: string;
}

const CasasReligiosas: React.FC = () => {
  const { t } = useTranslation();
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [houses, setHouses] = useState<ReligiousHouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [editingHouse, setEditingHouse] = useState<ReligiousHouse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/casas-religiosas/get');
      setHouses(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      setError(t('casas.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      const matchesName = house.nome.toLowerCase().includes(filterName.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || house.status === filterStatus;
      return matchesName && matchesStatus;
    });
  }, [houses, filterName, filterStatus]);

  const handleClearFilters = () => {
    setFilterName('');
    setFilterStatus('Todos');
  };

  const handleOpenEdit = (house: ReligiousHouse) => {
    setEditingHouse({ ...house });
    setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouse) return;

    setSaveLoading(true);
    try {
      if (editingHouse.id === 0) {
        await api.post('/casas-religiosas', editingHouse);
      } else {
        await api.put(`/casas-religiosas/${editingHouse.id}`, editingHouse);
      }
      await fetchHouses();
      setIsModalOpen(false);
      setEditingHouse(null);
    } catch (err) {
      console.error('Error saving house:', err);
      alert(t('common.error'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNewHouse = () => {
    setEditingHouse({ id: 0, nome: '', endereco: '', status: 'ATIVO', missionarios_count: 0 });
    setIsModalOpen(true);
  };

  const handleDeleteHouse = async (id: number) => {
    if (!window.confirm(t('common.confirm_delete') || 'Deseja excluir?')) return;
    try {
      await api.delete(`/casas-religiosas/${id}`);
      await fetchHouses();
    } catch (err) {
      console.error('Error deleting house:', err);
      alert(t('common.error'));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <HomeIcon size={24} />
          <h2>{t('casas.title')}</h2>
        </div>
        <div className="header-actions">
          <button className="btn-export">
            <Download size={18} /> {t('financeiro.actions.export')}
          </button>
          {canEdit && (
            <button className="btn-new" onClick={handleNewHouse}>
              <Plus size={18} /> {t('casas.new_house')}
            </button>
          )}
        </div>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>{t('casas.name').toUpperCase()}</label>
          <input
            type="text"
            placeholder={t('missionaries.search_placeholder') + "..."}
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>{t('casas.status').toUpperCase()}</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos">{t('missionaries.filters.all')}</option>
            <option value="ATIVO">ATIVO</option>
            <option value="INATIVO">INATIVO</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn-clear" onClick={handleClearFilters}>
            {t('common.cancel')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>{t('missionaries.table.id')}</th>
                <th>{t('casas.name')}</th>
                <th>{t('casas.address')}</th>
                <th>{t('casas.regional')}</th>
                <th>{t('casas.reference_date')}</th>
                <th className="center">{t('casas.missionaries')}</th>
                <th className="center">{t('casas.status')}</th>
                <th className="center">{t('missionaries.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHouses.map((house) => (
                <tr key={house.id}>
                  <td>#{house.id}</td>
                  <td className="bold">{house.nome}</td>
                  <td>{house.endereco}</td>
                  <td>{house.regional}</td>
                  <td>{house.data_referencia_casa}</td>
                  <td className="center">
                    <span className="count-badge">{house.missionarios_count}</span>
                  </td>
                  <td className="center">
                    <span className={`status-tag ${house.status.toLowerCase()}`}>
                      {house.status}
                    </span>
                  </td>
                  <td className="center">
                    <div className="house-actions">
                      <button 
                        className="btn-finance-lite" 
                        title={t('casas.cost_registration')}
                        onClick={() => navigate('/financeiro', { state: { house_id: house.id } })}
                      >
                        <DollarSign size={16} />
                      </button>
                      {canEdit && (
                        <>
                          <button 
                            className="btn-icon-edit btn-edit-lite" 
                            title={t('common.edit')}
                            onClick={() => handleOpenEdit(house)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon-delete btn-delete-lite" 
                            title={t('common.delete')}
                            onClick={() => handleDeleteHouse(house.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHouses.length === 0 && (
            <div className="empty-state">
              <p>{t('missionaries.empty')}</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && editingHouse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingHouse.id === 0 ? t('casas.new_house') : t('casas.edit_house')}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveHouse}>
              <div className="form-group">
                <label>{t('casas.name')}</label>
                <input
                  type="text"
                  value={editingHouse.nome}
                  onChange={(e) => setEditingHouse({ ...editingHouse, nome: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('casas.address')}</label>
                <input
                  type="text"
                  value={editingHouse.endereco}
                  onChange={(e) => setEditingHouse({ ...editingHouse, endereco: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('casas.regional')}</label>
                  <input
                    type="text"
                    value={editingHouse.regional || ''}
                    onChange={(e) => setEditingHouse({ ...editingHouse, regional: e.target.value })}
                    placeholder={t('casas.regional_placeholder')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('casas.reference_date')}</label>
                  <input
                    type="date"
                    value={editingHouse.data_referencia_casa || ''}
                    onChange={(e) => setEditingHouse({ ...editingHouse, data_referencia_casa: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('casas.status')}</label>
                <select
                  value={editingHouse.status}
                  onChange={(e) => setEditingHouse({ ...editingHouse, status: e.target.value as any })}
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-save" disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasasReligiosas;
