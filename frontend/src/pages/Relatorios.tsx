import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, Activity, Home as HomeIcon,
  Loader2, AlertCircle, RefreshCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Relatorios.css';

interface StatItem {
  nome: string;
  total: number;
  tipo_transacao: 'CREDITO' | 'DEBITO';
}

interface MonthlyStat {
  mes: string;
  tipo_transacao: 'CREDITO' | 'DEBITO';
  total: number;
}

interface LargeTransaction {
  id: number;
  casa_nome: string;
  descricao: string;
  valor: number;
  tipo_transacao: 'CREDITO' | 'DEBITO';
  data: string;
}

const Relatorios: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [houseTotals, setHouseTotals] = useState<StatItem[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<LargeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/financas-casa/estatisticas');
      setHouseTotals(res.data.houseTotals || []);
      setMonthlyStats(res.data.monthlyStats || []);
      setLargeTransactions(res.data.largeTransactions || []);
      setError(null);
    } catch {
      setError(t('missionaries.error_loading'));
    } finally {
      setIsLoading(false);
    }
  };

  const houseAggregated = houseTotals.reduce((acc: any, curr) => {
    if (!acc[curr.nome]) acc[curr.nome] = { nome: curr.nome, credito: 0, debito: 0 };
    if (curr.tipo_transacao === 'CREDITO') acc[curr.nome].credito += Number(curr.total);
    else acc[curr.nome].debito += Number(curr.total);
    return acc;
  }, {});

  const sortedHouses = Object.values(houseAggregated)
    .sort((a: any, b: any) => b.debito - a.debito)
    .slice(0, 5);

  const maxExpense = Math.max(...sortedHouses.map((h: any) => h.debito), 1);

  const totalCredito = houseTotals.filter(h => h.tipo_transacao === 'CREDITO').reduce((a, b) => a + Number(b.total), 0);
  const totalDebito = houseTotals.filter(h => h.tipo_transacao === 'DEBITO').reduce((a, b) => a + Number(b.total), 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(i18n.language === 'es' ? 'es-ES' : 'pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <BarChart3 size={64} color="#ccc" style={{ marginBottom: '20px' }} />
      <h2 style={{ color: '#666' }}>Módulo em Manutenção</h2>
      <p style={{ color: '#888', maxWidth: '400px' }}>
        A tela de relatórios está temporariamente indisponível. Por favor, utilize as planilhas financeiras para consulta de dados.
      </p>
    </div>
  );
};

export default Relatorios;
