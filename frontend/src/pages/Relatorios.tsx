import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, FileSpreadsheet, Loader2, AlertCircle, 
  TrendingUp, TrendingDown, Wallet, Home as HomeIcon,
  ChevronRight, Calendar, Download, RefreshCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/Relatorios.css';

interface Lancamento {
  id: number;
  casa_id: number;
  casa_nome: string;
  descricao: string;
  valor: number;
  tipo_transacao: 'CREDITO' | 'DEBITO';
  data: string;
  status: string;
  registrado_por: number;
  registrado_por_nome: string;
  apontamento_texto?: string;
}

interface Summary {
  credito: number;
  debito: number;
  saldo: number;
}

interface Casa {
  id: number;
  nome: string;
}

const Relatorios: React.FC = () => {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [summary, setSummary] = useState<Summary>({ credito: 0, debito: 0, saldo: 0 });
  const [casas, setCasas] = useState<Casa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCasa, setSelectedCasa] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const housesRes = await api.post(`${API_URL}/casas-religiosas/get`);
      setCasas(housesRes.data);
      loadReport();
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados iniciais.');
    }
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const params = {
        casa_id: selectedCasa || undefined,
        status: selectedStatus || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined
      };

      const [relatorioRes, summaryRes] = await Promise.all([
        api.get(`${API_URL}/financas-casa/relatorio`, { params }),
        api.get(`${API_URL}/financas-casa/sumario`, { params })
      ]);

      setLancamentos(relatorioRes.data);
      setSummary(summaryRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar relatório financeiro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = lancamentos.map(l => ({
      ID: l.id,
      Data: new Date(l.data).toLocaleDateString('pt-BR'),
      Casa: l.casa_nome,
      Descrição: l.descricao,
      Tipo: l.tipo_transacao === 'CREDITO' ? 'Entrada (+)' : 'Saída (-)',
      Valor: Number(l.valor),
      Status: l.status,
      RegistradoPor: l.registrado_por_nome,
      Observações: l.apontamento_texto || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    XLSX.writeFile(workbook, `Relatorio_Financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const dashboardData = lancamentos.filter(l => 
    l.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.casa_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="module-container">
      <div className="page-header">
        <div className="title-with-badge">
          <FileSpreadsheet size={24} color="#4a90e2" />
          <h2>Painel de Relatórios Financeiros</h2>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadReport} disabled={isLoading}>
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} /> Atualizar
          </button>
          <button className="btn-export-excel" onClick={handleExportExcel} disabled={isLoading || lancamentos.length === 0}>
            <Download size={18} /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><Wallet size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Saldo Consolidado</span>
            <h3 className={`stat-value ${summary.saldo >= 0 ? 'positive' : 'negative'}`}>
              R$ {Number(summary.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Entradas (Crédito)</span>
            <h3 className="stat-value">
              R$ {Number(summary.credito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><TrendingDown size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Saídas (Débito)</span>
            <h3 className="stat-value">
              R$ {Number(summary.debito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card reports-filters">
        <div className="filter-group">
          <label><Search size={14} /> BUSCAR</label>
          <input 
            type="text" 
            placeholder="Descriçao ou casa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label><HomeIcon size={14} /> CASA</label>
          <select value={selectedCasa} onChange={(e) => setSelectedCasa(e.target.value)}>
            <option value="">Todas as casas</option>
            {casas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label><Calendar size={14} /> PERÍODO INÍCIO</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div className="filter-group">
          <label><Calendar size={14} /> PERÍODO FIM</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <div className="filter-group">
          <label><Filter size={14} /> STATUS</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="VERIFICADO">Verificado</option>
            <option value="APONTAMENTO">Apontamento</option>
          </select>
        </div>
        <button className="btn-filter" onClick={loadReport} disabled={isLoading}>
          <Filter size={18} /> Filtrar
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={32} />
          <p>Consolidando dados financeiros...</p>
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
                <th>Data</th>
                <th>Casa</th>
                <th>Descrição</th>
                <th className="right">Valor</th>
                <th className="center">Status</th>
                <th>Registrado Por</th>
                <th className="center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.map((item) => (
                <tr key={item.id} className={item.tipo_transacao === 'CREDITO' ? 'row-credit' : 'row-debit'}>
                  <td>{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                  <td><span className="casa-tag-small">{item.casa_nome}</span></td>
                  <td className="bold">{item.descricao}</td>
                  <td className={`right bold ${item.tipo_transacao === 'CREDITO' ? 'text-green' : 'text-red'}`}>
                    {item.tipo_transacao === 'CREDITO' ? '+' : '-'} R$ {Number(item.valor).toFixed(2)}
                  </td>
                  <td className="center">
                    <span className={`status-tag status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.registrado_por_nome}</td>
                  <td className="center">
                    <button className="btn-icon-view" title="Ver detalhes" onClick={() => navigate(`/missionarios/${item.registrado_por}`)}>
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {dashboardData.length === 0 && (
                <tr><td colSpan={7} className="empty-row">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
