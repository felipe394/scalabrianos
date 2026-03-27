import React, { useState, useMemo, useEffect } from 'react';
import { Eye, Save, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';
import '../styles/CasasReligiosas.css';

interface ReligiousHouse {
  id: number;
  nome: string;
  endereco: string;
  status: 'ATIVO' | 'INATIVO';
}

const CasasReligiosas: React.FC = () => {
  const [houses, setHouses] = useState<ReligiousHouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [editingHouse, setEditingHouse] = useState<ReligiousHouse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`${API_URL}/casas-religiosas/get`);
      setHouses(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching houses:', err);
      setError('Erro ao carregar casas religiosas');
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
        await api.post(`${API_URL}/casas-religiosas`, editingHouse);
      } else {
        await api.put(`${API_URL}/casas-religiosas/${editingHouse.id}`, editingHouse);
      }
      await fetchHouses();
      setIsModalOpen(false);
      setEditingHouse(null);
    } catch (err) {
      console.error('Error saving house:', err);
      alert('Erro ao salvar casa religiosa');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNewHouse = () => {
    setEditingHouse({ id: 0, nome: '', endereco: '', status: 'ATIVO' });
    setIsModalOpen(true);
  };

  return (
    <div className="casas-container">
      <div className="page-header">
        <h2>Casas Religiosas</h2>
        <div className="header-actions">
          <button className="btn-export">Exportar Excel</button>
          <button className="btn-new" onClick={handleNewHouse}>+ Nova Casa</button>
        </div>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>NOME DA CASA</label>
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>STATUS</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="ATIVO">ATIVO</option>
            <option value="INATIVO">INATIVO</option>
          </select>
        </div>
        <button className="btn-clear" onClick={handleClearFilters}>Limpar Filtros</button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Carregando casas...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button onClick={fetchHouses} className="btn-retry">Tentar novamente</button>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHouses.map((house) => (
                <tr key={house.id}>
                  <td className="id-cell">
                    {house.id}
                    <button className="view-btn" onClick={() => handleOpenEdit(house)}>
                      <Eye size={16} />
                    </button>
                  </td>
                  <td>{house.nome}</td>
                  <td>{house.endereco}</td>
                  <td>
                    <span className={`status-tag ${house.status.toLowerCase()}`}>
                      {house.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && editingHouse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingHouse.id === 0 ? 'Nova Casa Religiosa' : 'Dados da Casa'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveHouse}>
              <div className="form-group">
                <label>Nome da Casa</label>
                <input
                  type="text"
                  value={editingHouse.nome}
                  onChange={(e) => setEditingHouse({ ...editingHouse, nome: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input
                  type="text"
                  value={editingHouse.endereco}
                  onChange={(e) => setEditingHouse({ ...editingHouse, endereco: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editingHouse.status}
                  onChange={(e) => setEditingHouse({ ...editingHouse, status: e.target.value as 'ATIVO' | 'INATIVO' })}
                  required
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingHouse.id === 0 ? 'Criar Casa' : 'Salvar Alterações'}
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
