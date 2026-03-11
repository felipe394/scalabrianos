import React, { useState } from 'react';
import { Download, Search, Filter, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/Relatorios.css';

const Relatorios: React.FC = () => {
  const [data] = useState([
    { id: 1, nome: 'Roberto Kalili', login: 'roberto.kalili@connectortech.com.br', status: 'ATIVO', nascimento: '15/05/1985', cidade: 'São Paulo/SP' },
    { id: 2, nome: 'Elias Bernardo', login: 'elias.bernardo@beltis.com.br', status: 'ATIVO', nascimento: '20/10/1990', cidade: 'Curitiba/PR' },
    { id: 3, nome: 'Felipe Sousa', login: 'felipe.sousa@connectortech.com.br', status: 'ATIVO', nascimento: '05/12/1988', cidade: 'Porto Alegre/RS' },
  ]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
    XLSX.writeFile(workbook, "Relatorio_Scalabrianos.xlsx");
  };

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Relatórios</h2>
        <div className="header-actions">
          <button className="btn-export-excel" onClick={handleExportExcel}>
            <FileSpreadsheet size={20} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>BUSCAR POR NOME</label>
          <div className="search-input">
            <input type="text" placeholder="Pesquisar..." />
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
        <button className="btn-filter">
          <Filter size={18} /> Filtrar
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Nascimento</th>
              <th>Cidade/Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td className="bold">{item.nome}</td>
                <td>{item.login}</td>
                <td>
                  <span className={`status-tag ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.nascimento}</td>
                <td>{item.cidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Relatorios;
