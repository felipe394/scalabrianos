import React, { useState, useEffect } from 'react';
import { Search, Filter, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';
import '../styles/Relatorios.css';

interface ReportData {
  id: number;
  nome: string;
  login: string;
  status: string;
  data_nascimento?: string;
  cidade_estado?: string;
}

const Relatorios: React.FC = () => {
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // For a full report, we might need a specialized endpoint or combine data.
      // For now, let's fetch basic user info.
      const response = await api.get('usuarios');
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Erro ao carregar dados do relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
    XLSX.writeFile(workbook, "Relatorio_Scalabrianos.xlsx");
  };

  const filteredData = data.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Relatórios</h2>
        <div className="header-actions">
          <button className="btn-export-excel" onClick={handleExportExcel} disabled={isLoading || data.length === 0}>
            <FileSpreadsheet size={20} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>BUSCAR POR NOME OU E-MAIL</label>
          <div className="search-input">
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>FILTRAR POR STATUS</label>
          <select>
            <option>Todos</option>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </div>
        <button className="btn-filter" onClick={fetchReportData}>
          <Filter size={18} /> Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Gerando relatório...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button onClick={fetchReportData} className="btn-retry">Tentar novamente</button>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td className="bold">{item.nome}</td>
                  <td>{item.login}</td>
                  <td>
                    <span className={`status-tag ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>---</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
