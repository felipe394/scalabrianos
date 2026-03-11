import React, { useState, useMemo } from 'react';
import { Eye, Save, X } from 'lucide-react';
import '../styles/CasasReligiosas.css';

interface ReligiousHouse {
  id: number;
  name: string;
  address: string;
  status: 'ATIVO' | 'INATIVO';
}

const CasasReligiosas: React.FC = () => {
  const [houses, setHouses] = useState<ReligiousHouse[]>([
    { id: 1, name: 'Casa Scalabriniana São Paulo', address: 'Rua das Missões, 123, São Paulo - SP', status: 'ATIVO' },
    { id: 2, name: 'Seminário João XXIII', address: 'Av. Brasil, 456, Passo Fundo - RS', status: 'ATIVO' },
    { id: 3, name: 'Centro de Apoio ao Migrante', address: 'Rua da Paz, 789, Curitiba - PR', status: 'INATIVO' },
  ]);

  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [editingHouse, setEditingHouse] = useState<ReligiousHouse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      const matchesName = house.name.toLowerCase().includes(filterName.toLowerCase());
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

  const handleSaveHouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHouse) {
      if (editingHouse.id === 0) {
        // New house
        setHouses([...houses, { ...editingHouse, id: houses.length + 1 }]);
      } else {
        setHouses(houses.map(h => h.id === editingHouse.id ? editingHouse : h));
      }
      setIsModalOpen(false);
      setEditingHouse(null);
    }
  };

  const handleNewHouse = () => {
    setEditingHouse({ id: 0, name: '', address: '', status: 'ATIVO' });
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
                <td>{house.name}</td>
                <td>{house.address}</td>
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
                  value={editingHouse.name}
                  onChange={(e) => setEditingHouse({ ...editingHouse, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input
                  type="text"
                  value={editingHouse.address}
                  onChange={(e) => setEditingHouse({ ...editingHouse, address: e.target.value })}
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
                <button type="submit" className="btn-save">
                  <Save size={18} />
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
