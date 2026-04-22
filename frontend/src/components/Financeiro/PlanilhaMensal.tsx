import React, { useState, useEffect } from 'react';
import {
  Save, Loader2, CheckCircle, XCircle,
  Calendar, FileText, Download, TrendingUp, TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

interface Categoria {
  id: number;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoria_pai: 'PESSOAL' | 'CASA';
}

interface PlanilhaItem {
  categoria_id: number;
  valor: number;
}

interface PlanilhaData {
  id?: number;
  usuario_id: number;
  casa_id: number;
  mes_referencia: string;
  status: 'PENDENTE' | 'VALIDADO' | 'DEVOLVIDO';
  total_credito: number;
  total_debito: number;
  apontamentos: string;
  itens: PlanilhaItem[];
}

interface Props {
  casas: { id: number; nome: string }[];
  categorias: Categoria[];
}

interface ConsolidatedRow {
  usuario_id: number;
  usuario_nome: string;
  mes_referencia: string;
  status: string;
  total_credito: number;
  total_debito: number;
  id?: number;
  apontamentos: string;
}

interface ConsolidatedStatus {
  status: 'PENDENTE_ECONOMO' | 'PENDENTE_SUPERIOR' | 'APROVADO' | 'DEVOLVIDO_SUPERIOR';
  apontamentos_economo: string;
  apontamentos_superior: string;
}

const PlanilhaMensal: React.FC<Props> = ({ casas, categorias }) => {
  const { user } = useAuth();
  const [selectedMes, setSelectedMes] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCasa, setSelectedCasa] = useState('');
  const [planilha, setPlanilha] = useState<PlanilhaData | null>(null);
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [editValues, setEditValues] = useState<Record<number, number>>({});
  const [apontamentos, setApontamentos] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  // Consolidated view state
  const [viewMode, setViewMode] = useState<'individual' | 'consolidado'>('individual');
  const [consolidadoData, setConsolidadoData] = useState<ConsolidatedRow[]>([]);
  const [isConsolidadoLoading, setIsConsolidadoLoading] = useState(false);
  const [consolidadoStatus, setConsolidadoStatus] = useState<ConsolidatedStatus | null>(null);
  const [isSavingConsolidado, setIsSavingConsolidado] = useState(false);

  const canValidate = user?.role === 'ADMIN_GERAL' || user?.is_oconomo;
  const isSuperior = user?.role === 'ADMIN_GERAL' || user?.is_superior;

  useEffect(() => {
    if (user?.role === 'PADRE' && user?.casa_id && !selectedCasa) {
      setSelectedCasa(user.casa_id.toString());
    }
  }, [user, selectedCasa]);

  useEffect(() => {
    if (selectedMes && user) {
      if (viewMode === 'individual') loadPlanilha();
      else {
        loadConsolidado();
        loadConsolidadoStatus();
      }
    }
  }, [selectedMes, user, viewMode, selectedCasa]);

  const loadPlanilha = async (targetUserId?: number) => {
    const uid = targetUserId || user?.id;
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/financas-mensais/usuario/${uid}/mes/${selectedMes}`);
      if (res.data) {
        setPlanilha(res.data);
        const vals: Record<number, number> = {};
        res.data.itens.forEach((it: any) => {
          vals[it.categoria_id] = parseFloat(it.valor);
        });
        setEditValues(vals);
        setApontamentos(res.data.apontamentos || '');
        setSelectedCasa(res.data.casa_id.toString());
      } else {
        setPlanilha(null);
        setEditValues({});
        setApontamentos('');
      }
    } catch (err) {
      console.error('Erro ao carregar planilha:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConsolidado = async () => {
    if (!selectedCasa) {
      setConsolidadoData([]);
      return;
    }
    setIsConsolidadoLoading(true);
    try {
      const res = await api.get(`/financas-mensais/consolidado/casa/${selectedCasa}/mes/${selectedMes}`);
      setConsolidadoData(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar consolidado:', err);
    } finally {
      setIsConsolidadoLoading(false);
    }
  };

  const loadConsolidadoStatus = async () => {
    if (!selectedCasa) return;
    try {
      const res = await api.get(`/financas-casa/consolidado/status/${selectedCasa}/${selectedMes}`);
      setConsolidadoStatus(res.data);
    } catch (err) {
      console.error('Erro ao carregar status consolidado:', err);
    }
  };

  const calculateTotals = () => {
    let cre = 0;
    let deb = 0;
    categorias.forEach(cat => {
      const val = editValues[cat.id] || 0;
      if (cat.tipo === 'CREDITO') cre += val;
      else deb += val;
    });
    return { credito: cre, debito: deb, saldo: cre - deb };
  };

  const handleSave = async () => {
    if (!user || !selectedCasa) {
      alert('Selecione uma casa religiosa.');
      return;
    }
    setIsSaving(true);
    const totals = calculateTotals();
    const payload = {
      usuario_id: user.id,
      casa_id: parseInt(selectedCasa),
      mes_referencia: selectedMes,
      total_credito: totals.credito,
      total_debito: totals.debito,
      status: 'PENDENTE', // Returns to pending if saved again
      itens: Object.entries(editValues).map(([id, val]) => ({
        categoria_id: parseInt(id),
        valor: val
      }))
    };

    try {
      await api.post('/financas-mensais', payload);
      alert('Planilha salva com sucesso!');
      loadPlanilha();
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidar = async (status: 'VALIDADO' | 'PENDENTE' | 'DEVOLVIDO') => {
    if (!planilha?.id) return;
    setIsValidating(true);
    try {
      await api.put(`/financas-mensais/${planilha.id}/validar`, { status, apontamentos });
      alert(`Planilha ${status === 'VALIDADO' ? 'validada' : 'marcada para revisão'}!`);
      loadPlanilha();
    } catch (err) {
      alert('Erro ao validar');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdateConsolidadoStatus = async (newStatus: string) => {
    if (!selectedCasa) return;
    setIsSavingConsolidado(true);
    try {
      await api.put(`/financas-casa/consolidado/status/${selectedCasa}/${selectedMes}`, {
        status: newStatus,
        apontamentos_economo: consolidadoStatus?.apontamentos_economo,
        apontamentos_superior: consolidadoStatus?.apontamentos_superior
      });
      alert('Status consolidado atualizado!');
      loadConsolidadoStatus();
    } catch (err) {
      alert('Erro ao atualizar status consolidado');
    } finally {
      setIsSavingConsolidado(false);
    }
  };

  const totals = calculateTotals();

  const exportConsolidadoToExcel = () => {
    if (consolidadoData.length === 0) return;

    const casaNome = casas.find(c => String(c.id) === selectedCasa)?.nome || 'Casa';
    const data = consolidadoData.map(r => ({
      'Missionário': r.usuario_nome,
      'Mês': r.mes_referencia,
      'Status': r.status,
      'Total Créditos (R$)': r.total_credito,
      'Total Débitos (R$)': r.total_debito,
      'Saldo (R$)': r.total_credito - r.total_debito
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidado');
    XLSX.writeFile(wb, `Consolidado_${casaNome}_${selectedMes}.xlsx`);
  };

  return (
    <div className="planilha-mensal-content">
      <div className="filters-card" style={{ marginBottom: '20px', display: 'block' }}>
        <div className="filters-grid-premium" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="filter-item">
            <label><Calendar size={14} /> Mês de Referência</label>
            <input type="month" value={selectedMes} onChange={e => setSelectedMes(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Casa Religiosa</label>
            <select value={selectedCasa} onChange={e => setSelectedCasa(e.target.value)} disabled={!!planilha}>
              <option value="">Selecione...</option>
              {casas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <label>Status</label>
            {viewMode === 'individual' ? (
              planilha ? (
                <span className={`status-tag ${planilha.status.toLowerCase()}`} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', gap: '6px', width: '100%' }}>
                  {planilha.status === 'VALIDADO' ? <CheckCircle size={14} /> : (planilha.status === 'DEVOLVIDO' ? <AlertCircle size={14} /> : <Loader2 size={14} className="animate-spin" />)}
                  {planilha.status === 'DEVOLVIDO' ? 'DEVOLVIDO PARA REVISÃO' : planilha.status}
                </span>
              ) : (
                <span className="status-tag inativo" style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', width: '100%' }}>NÃO INICIADO</span>
              )
            ) : (
              <button className="btn-export-small" onClick={exportConsolidadoToExcel} disabled={consolidadoData.length === 0} style={{ height: '40px', width: '100%', justifyContent: 'center' }}>
                <Download size={14} /> Exportar Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {(canValidate || isSuperior) && (
        <div className="view-mode-tabs">
          <button
            className={`mode-btn ${viewMode === 'individual' && !selectedUserId ? 'active' : ''}`}
            onClick={() => {
              setViewMode('individual');
              setSelectedUserId(null);
              setSelectedUserName('');
              loadPlanilha();
            }}
          >
            Minha Planilha
          </button>
          <button
            className={`mode-btn ${viewMode === 'consolidado' ? 'active' : ''}`}
            onClick={() => setViewMode('consolidado')}
          >
            Relatório Consolidado
          </button>
          {selectedUserId && (
            <button className="mode-btn active" style={{ marginLeft: 'auto' }}>
              Revisando: {selectedUserName}
            </button>
          )}
        </div>
      )}

      {viewMode === 'consolidado' ? (
        <div className="consolidado-container">
          <div className="consolidado-approval-card card-lite" style={{ marginBottom: '20px', borderTop: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Gestão de Fechamento Mensal</h3>
                <p style={{ margin: '5px 0 0', opacity: 0.7 }}>Aprovação geral da casa para o mês selecionado.</p>
              </div>
              <span className={`status-tag ${(consolidadoStatus?.status || '').toLowerCase()}`}>
                {consolidadoStatus?.status?.replace('_', ' ') || 'PENDENTE ECONOMO'}
              </span>
            </div>

            <div className="approval-workflow" style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
              {user?.is_oconomo && consolidadoStatus?.status === 'PENDENTE_ECONOMO' && (
                <button
                  className="btn-approve"
                  onClick={() => handleUpdateConsolidadoStatus('PENDENTE_SUPERIOR')}
                  disabled={isSavingConsolidado || !consolidadoData.every(r => r.status === 'VALIDADO')}
                  title={!consolidadoData.every(r => r.status === 'VALIDADO') ? "Todas as planilhas devem estar validadas." : ""}
                >
                  <CheckCircle size={18} /> Enviar para o Superior
                </button>
              )}

              {isSuperior && consolidadoStatus?.status === 'PENDENTE_SUPERIOR' && (
                <>
                  <button className="btn-approve" onClick={() => handleUpdateConsolidadoStatus('APROVADO')} disabled={isSavingConsolidado}>
                    <CheckCircle size={18} /> Aprovar Consolidado
                  </button>
                  <button className="btn-reject" onClick={() => handleUpdateConsolidadoStatus('DEVOLVIDO_SUPERIOR')} disabled={isSavingConsolidado}>
                    <XCircle size={18} /> Devolver para o Ecônomo
                  </button>
                </>
              )}
            </div>

            {(consolidadoStatus?.apontamentos_economo || consolidadoStatus?.apontamentos_superior) && (
              <div className="comments-area" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                {consolidadoStatus.apontamentos_economo && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Notas do Ecônomo:</strong>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>{consolidadoStatus.apontamentos_economo}</p>
                  </div>
                )}
                {consolidadoStatus.apontamentos_superior && (
                  <div>
                    <strong>Notas do Superior:</strong>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>{consolidadoStatus.apontamentos_superior}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="data-table card-lite">
            <table>
              <thead>
                <tr>
                  <th>Missionário</th>
                  <th>Status</th>
                  <th className="right">Crédito</th>
                  <th className="right">Débito</th>
                  <th className="right">Saldo</th>
                  <th className="center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {consolidadoData.map(row => (
                  <tr key={row.usuario_id}>
                    <td className="bold">{row.usuario_nome}</td>
                    <td><span className={`status-tag ${row.status.toLowerCase()}`}>{row.status}</span></td>
                    <td className="right val-credit">R$ {parseFloat(row.total_credito.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="right val-debit">R$ {parseFloat(row.total_debito.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`right bold ${row.total_credito - row.total_debito >= 0 ? 'val-credit' : 'val-debit'}`}>
                      R$ {(row.total_credito - row.total_debito).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="center">
                      <button
                        className="btn-icon-view"
                        title="Ver Detalhes"
                        onClick={() => {
                          setSelectedUserId(row.usuario_id);
                          setSelectedUserName(row.usuario_nome);
                          setViewMode('individual');
                          loadPlanilha(row.usuario_id);
                        }}
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {consolidadoData.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    {!selectedCasa ? 'Selecione uma casa para ver o consolidado.' : 'Nenhuma planilha encontrada para este mês nesta casa.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="spreedsheet-container card-lite">
            <div className="spreedsheet-header">
              <div className="header-info">
                <h3>Detalhamento Mensal</h3>
                <p>Preencha os valores para cada categoria abaixo.</p>
              </div>
              {(!planilha || planilha.status === 'PENDENTE' || planilha.status === 'DEVOLVIDO') && (
                <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {planilha?.status === 'DEVOLVIDO' ? 'Reenviar Planilha Corrigida' : 'Salvar Planilha'}
                </button>
              )}
            </div>

            <div className="spreadsheet-grid">
              {/* CRÉDITOS */}
              <div className="spreadsheet-column">
                <h4 className="column-title credito"><TrendingUp size={16} /> Créditos (Entradas)</h4>
                {categorias.filter(c => c.tipo === 'CREDITO').map(cat => (
                  <div key={cat.id} className="spreadsheet-row">
                    <label>{cat.nome}</label>
                    <div className="input-money">
                      <span>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editValues[cat.id] || ''}
                        onChange={e => setEditValues({ ...editValues, [cat.id]: parseFloat(e.target.value) || 0 })}
                        disabled={planilha?.status === 'VALIDADO'}
                      />
                    </div>
                  </div>
                ))}
                <div className="column-footer">
                  <span>Total Créditos</span>
                  <strong>R$ {totals.credito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* DÉBITOS */}
              <div className="spreadsheet-column">
                <h4 className="column-title debito"><TrendingDown size={16} /> Débitos (Saídas)</h4>
                <div className="category-group-label">Despesas da Casa</div>
                {categorias.filter(c => c.tipo === 'DEBITO' && c.categoria_pai === 'CASA').map(cat => (
                  <div key={cat.id} className="spreadsheet-row">
                    <label>{cat.nome}</label>
                    <div className="input-money">
                      <span>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editValues[cat.id] || ''}
                        onChange={e => setEditValues({ ...editValues, [cat.id]: parseFloat(e.target.value) || 0 })}
                        disabled={planilha?.status === 'VALIDADO'}
                      />
                    </div>
                  </div>
                ))}

                <div className="category-group-label" style={{ marginTop: '15px' }}>Despesas Pessoais</div>
                {categorias.filter(c => c.tipo === 'DEBITO' && c.categoria_pai === 'PESSOAL').map(cat => (
                  <div key={cat.id} className="spreadsheet-row">
                    <label>{cat.nome}</label>
                    <div className="input-money">
                      <span>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editValues[cat.id] || ''}
                        onChange={e => setEditValues({ ...editValues, [cat.id]: parseFloat(e.target.value) || 0 })}
                        disabled={planilha?.status === 'VALIDADO'}
                      />
                    </div>
                  </div>
                ))}

                <div className="column-footer">
                  <span>Total Débitos</span>
                  <strong>R$ {totals.debito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            {(canValidate || isSuperior) && viewMode === 'individual' && planilha && (
              <div className="management-controls card-lite" style={{ marginTop: '30px', borderTop: '4px solid #013375' }}>
                <h3 style={{ marginBottom: '15px' }}>Revisão de Planilha: {selectedUserName || user?.nome}</h3>
                <div className="comment-box" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Comentários / Apontamentos:</label>
                  <textarea
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px', fontSize: '14px', fontFamily: 'inherit' }}
                    value={apontamentos}
                    onChange={(e) => setApontamentos(e.target.value)}
                    placeholder="Descreva aqui o motivo da devolução ou observações de aprovação..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn-approve"
                    onClick={() => handleValidar('VALIDADO')}
                    disabled={isValidating}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <CheckCircle size={18} /> Validar Planilha
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => {
                      if (!apontamentos) {
                        alert('Por favor, adicione um comentário explicando o motivo da devolução.');
                        return;
                      }
                      handleValidar('DEVOLVIDO');
                    }}
                    disabled={isValidating}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <AlertCircle size={18} /> Devolver para Revisão
                  </button>
                </div>
              </div>
            )}

            <div className="spreadsheet-summary" style={{ marginTop: '30px', padding: '20px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Saldo do Mês</label>
              <h2 style={{ color: totals.saldo >= 0 ? '#10b981' : '#ef4444' }}>
                R$ {totals.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          {/* Missionary Comments View - only when returned */}
          {!canValidate && !isSuperior && planilha?.status === 'DEVOLVIDO' && planilha.apontamentos && (
            <div className="validation-card card-lite" style={{ marginTop: '20px', borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ fontSize: '16px', color: '#ef4444', marginBottom: '10px' }}>
                <AlertCircle size={18} /> Notas de Revisão do Ecônomo
              </h3>
              <p style={{ padding: '12px', background: '#fff1f2', borderRadius: '8px', fontSize: '14px', border: '1px solid #fecaca' }}>
                {planilha.apontamentos}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlanilhaMensal;
