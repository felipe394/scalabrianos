import React, { useState, useEffect } from 'react';
import { 
  Search, DollarSign, Loader2, 
  TrendingUp, TrendingDown, Wallet, Home as HomeIcon,
  Calendar, Download, Plus, Check, X, Edit2, Trash2,
  RefreshCcw, User, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import PlanilhaMensal from '../components/Financeiro/PlanilhaMensal';
import '../styles/Relatorios.css';
import '../styles/FinanceiroSpreadsheet.css';

interface Lancamento {
  id: number;
  casa_id: number;
  casa_nome: string;
  descricao: string;
  valor: number;
  tipo_transacao: 'CREDITO' | 'DEBITO';
  tipo_despesa: 'PESSOAL' | 'CASA';
  categoria_id?: number;
  categoria_nome?: string;
  data: string;
  status: string;
  registrado_por: number;
  registrado_por_nome: string;
  apontamento_texto?: string;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoria_pai: 'PESSOAL' | 'CASA';
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

const Financeiro: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [summary, setSummary] = useState<Summary>({ credito: 0, debito: 0, saldo: 0 });
  const [casas, setCasas] = useState<Casa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCasa, setSelectedCasa] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTipoDespesa, setSelectedTipoDespesa] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegistradoPor, setFilterRegistradoPor] = useState('');
  const [filterRegiaoPais, setFilterRegiaoPais] = useState('');

  const [activeModule, setActiveModule] = useState<'movimentos' | 'planilha'>('planilha');
  const { user } = useAuth();

  // New/Edit Entry State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<Lancamento>>({
    tipo_transacao: 'DEBITO',
    tipo_despesa: 'CASA',
    data: new Date().toISOString().split('T')[0],
    valor: 0,
    descricao: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [housesRes, catsRes] = await Promise.all([
        api.post('/casas-religiosas/get'),
        api.get('/categorias-financas')
      ]);
      setCasas(housesRes.data);
      setCategorias(catsRes.data);
      
      if (location.state?.house_id) {
        setSelectedCasa(location.state.house_id.toString());
      }
      
      loadReport();
    } catch (err) {
      console.error(err);
      setError(t('missionaries.error_loading'));
    }
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const filters = {
        casa_id: selectedCasa || null,
        status: selectedStatus || null,
        tipo_despesa: selectedTipoDespesa || null,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        search: searchTerm || null,
        registrado_por: filterRegistradoPor || null,
        regiao_pais: filterRegiaoPais || null
      };

      const [dataRes, sumRes] = await Promise.all([
        api.get('/financas-casa/relatorio', { params: filters }),
        api.get('/financas-casa/sumario', { params: filters })
      ]);

      setLancamentos(dataRes.data);
      setSummary(sumRes.data);
      setError(null);
    } catch (err) {
      setError(t('missionaries.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = lancamentos.map(l => ({
      [t('logs.table.date')]: new Date(l.data).toLocaleDateString(),
      [t('financeiro.table.description')]: l.descricao,
      [t('financeiro.table.value')]: l.valor,
      [t('logs.table.type')]: l.tipo_transacao,
      [t('financeiro.table.expense_type')]: l.tipo_despesa,
      [t('financeiro.table.category')]: l.categoria_nome,
      [t('casas.title')]: l.casa_nome,
      [t('financeiro.table.registered_by')]: l.registrado_por_nome,
      'Status': l.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    XLSX.writeFile(wb, `Financeiro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleCreateEntry = async () => {
    if (!newEntry.casa_id || !newEntry.descricao || !newEntry.valor) {
      alert('Preencha os campos obrigatórios (Casa, Descrição, Valor)');
      return;
    }
    try {
      await api.post('/financas-casa', newEntry);
      setIsAddingNew(false);
      setNewEntry({
        tipo_transacao: 'DEBITO',
        tipo_despesa: 'CASA',
        data: new Date().toISOString().split('T')[0],
        valor: 0,
        descricao: ''
      });
      loadReport();
    } catch (err: any) {
      alert(t('common.error') + ': ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateEntry = async (id: number) => {
    try {
      await api.put(`/financas-casa/${id}`, newEntry);
      setEditingId(null);
      loadReport();
    } catch (err: any) {
      alert(t('common.error') + ': ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirm_delete') || 'Deseja excluir?')) return;
    try {
      await api.delete(`/financas-casa/${id}`);
      loadReport();
    } catch (err: any) {
      alert(t('common.error') + ': ' + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (l: Lancamento) => {
    setEditingId(l.id);
    setNewEntry(l);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <DollarSign size={24} />
          <h2>{t('financeiro.title')}</h2>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportToExcel}>
            <Download size={18} /> {t('financeiro.actions.export')}
          </button>
          {/* <button className="btn-new" onClick={() => setIsAddingNew(true)}>
            <Plus size={18} /> {t('financeiro.actions.new_entry')}
          </button> */}
        </div>
      </div>
      <div className="filters-card" style={{ marginBottom: '20px', display: 'block' }}>
        <div className="filters-grid-premium">
          <div className="filter-item">
            <label>{t('financeiro.filters.house')}</label>
            <select value={selectedCasa} onChange={(e) => setSelectedCasa(e.target.value)}>
              <option value="">{t('missionaries.filters.all')}</option>
              {casas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="filter-item">
            <label>{t('financeiro.filters.status')}</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">{t('missionaries.filters.all')}</option>
              <option value="EFETIVADO">Efetivado</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Tipo Despesa</label>
            <select value={selectedTipoDespesa} onChange={(e) => setSelectedTipoDespesa(e.target.value)}>
              <option value="">{t('missionaries.filters.all')}</option>
              <option value="PESSOAL">Pessoal</option>
              <option value="CASA">Casa</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Data Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>

          <div className="filter-item">
            <label>Data Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>

          <div className="filter-item">
            <label>Registrado Por</label>
            <input type="text" placeholder="Nome..." value={filterRegistradoPor} onChange={(e) => setFilterRegistradoPor(e.target.value)} />
          </div>

          <div className="filter-item">
            <label>Região/País</label>
            <input type="text" placeholder="Região..." value={filterRegiaoPais} onChange={(e) => setFilterRegiaoPais(e.target.value)} />
          </div>

          <div className="filter-item">
            <label>Busca</label>
            <input type="text" placeholder="Descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <PlanilhaMensal casas={casas} categorias={categorias} />

      {/* 
        A tela de Movimentações Diárias foi ocultada a pedido do usuário 
        mas o código permanece comentado abaixo para futuras necessidades.
      */}
      {/* 
      {activeModule === 'movimentos' && (
         ... 
      )}
      */}
    </div>
  );
};

export default Financeiro;
