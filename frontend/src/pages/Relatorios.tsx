import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, Activity, Home as HomeIcon,
  Loader2, AlertCircle, RefreshCcw
} from 'lucide-react';
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
  const [houseTotals, setHouseTotals] = useState<StatItem[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<LargeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`${API_URL}/financas-casa/estatisticas`);
      setHouseTotals(res.data.houseTotals);
      setMonthlyStats(res.data.monthlyStats);
      setLargeTransactions(res.data.largeTransactions);
      setError(null);
    } catch {
      setError('Erro ao carregar estatísticas financeiras.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to aggregate data for visual bars
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

  return (
    <div className="module-container">
      <div className="page-header">
        <div className="title-with-badge">
          <BarChart3 size={24} color="#4a90e2" />
          <h2>Dashboard Analítico Financeiro</h2>
        </div>
        <button className="btn-refresh" onClick={loadStats} disabled={isLoading}>
          <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>Gerando insights...</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon"><Wallet size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Saldo em caixa (Total)</span>
                <h3 className={`stat-value ${totalCredito - totalDebito >= 0 ? 'positive' : 'negative'}`}>
                  R$ {(totalCredito - totalDebito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon"><TrendingUp size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Entradas</span>
                <h3 className="stat-value">R$ {totalCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <ArrowUpRight className="trend-icon" size={20} color="#10b981" />
            </div>
            <div className="stat-card red">
              <div className="stat-icon"><TrendingDown size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Saídas</span>
                <h3 className="stat-value">R$ {totalDebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <ArrowDownRight className="trend-icon" size={20} color="#ef4444" />
            </div>
          </div>

          <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* Top Expenses by House - Custom CSS Bars */}
            <div className="card-panel">
              <h3><HomeIcon size={18} /> Maiores Gastos por Casa (Top 5)</h3>
              <div className="bar-chart-container" style={{ marginTop: '20px' }}>
                {sortedHouses.map((house: any) => (
                  <div key={house.nome} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className="bold">{house.nome}</span>
                      <span className="text-red">R$ {house.debito.toLocaleString('pt-BR')}</span>
                    </div>
                    <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #ef4444, #f87171)', 
                        width: `${(house.debito / maxExpense) * 100}%`,
                        transition: 'width 0.5s ease-out'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Large Transactions */}
            <div className="card-panel">
              <h3><Activity size={18} /> Lançamentos de Maior Valor</h3>
              <div className="mini-table" style={{ marginTop: '16px' }}>
                {largeTransactions.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div>
                      <div className="bold">{t.descricao}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{t.casa_nome} • {new Date(t.data).toLocaleDateString()}</div>
                    </div>
                    <div className={`bold ${t.tipo_transacao === 'CREDITO' ? 'text-green' : 'text-red'}`}>
                      {t.tipo_transacao === 'CREDITO' ? '+' : '-'} R$ {Number(t.valor).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trend Section */}
          <div className="card-panel" style={{ marginTop: '24px' }}>
            <h3>Tendência Mensal (Últimos 6 Meses)</h3>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '16px 0' }}>
              {monthlyStats.filter(s => s.tipo_transacao === 'DEBITO').map(stat => (
                <div key={stat.mes} style={{ minWidth: '120px', background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{stat.mes}</div>
                  <div className="bold text-red" style={{ marginTop: '4px' }}>
                    -R$ {Number(stat.total).toLocaleString()}
                  </div>
                </div>
              ))}
              {monthlyStats.length === 0 && <p style={{ color: '#888' }}>Sem dados suficientes para tendência mensal.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Relatorios;
