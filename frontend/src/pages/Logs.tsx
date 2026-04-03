import React, { useState, useEffect } from 'react';
import { ClipboardList, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';
import '../styles/Perfis.css';

interface LogEntry {
  id: number;
  usuario_nome: string;
  acao: string;
  entidade: string;
  detalhes: string;
  created_at: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`${API_URL}/logs`);
      setLogs(res.data);
      setError(null);
    } catch {
      setError('Erro ao carregar logs do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString('pt-BR');
  };

  const getAcaoClass = (acao: string) => {
    if (acao.includes('CRIO') || acao.includes('ADICIONO') || acao.includes('LANCAMENTO')) return 'acao-criar';
    if (acao.includes('EDITOU') || acao.includes('ATUALIZAR')) return 'acao-editar';
    if (acao.includes('REMOVER') || acao.includes('DELETE')) return 'acao-remover';
    return 'acao-default';
  };

  return (
    <div className="module-container">
      <div className="page-header">
        <div className="title-with-badge">
          <ClipboardList size={24} />
          <h2>Logs do Sistema</h2>
        </div>
        <button className="btn-filter" onClick={fetchLogs}>Atualizar</button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>Carregando logs...</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button className="btn-retry" onClick={fetchLogs}>Tentar novamente</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                  <td className="bold">{log.usuario_nome || 'Sistema'}</td>
                  <td><span className={`role-tag ${getAcaoClass(log.acao)}`}>{log.acao}</span></td>
                  <td>{log.entidade}</td>
                  <td style={{ maxWidth: '300px', wordBreak: 'break-word' }}>{log.detalhes}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Nenhum log registrado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Logs;
