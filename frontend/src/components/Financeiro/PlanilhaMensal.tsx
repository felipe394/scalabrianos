import React, { useState, useEffect } from 'react';
import {
  Save, Loader2, CheckCircle, XCircle, AlertCircle,
  Calendar, FileText, Download, TrendingUp, TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface Categoria {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoria_pai: 'PESSOAL' | 'CASA';
  perfil: 'PERFIL_1' | 'PERFIL_2' | 'ANUAL' | 'PLANEJAMENTO';
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
  num_missas_superior: number;
  anexo_path: string | null;
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
  const { t } = useTranslation();
  const { user, isAdminGeral } = useAuth();
  const blacklist = ['Congregação', 'Saúde/Medicamentos', 'Transporte', 'Vestuário', 'Água', 'Supermercado', 'Aluguel', 'Energia Elétrica', 'Internet'];
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
  const [numMissas, setNumMissas] = useState(0);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [anexoUrl, setAnexoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Consolidated view state
  const [viewMode, setViewMode] = useState<'individual' | 'consolidado'>('individual');
  const [consolidadoData, setConsolidadoData] = useState<ConsolidatedRow[]>([]);
  const [_isConsolidadoLoading, setIsConsolidadoLoading] = useState(false);
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
        setNumMissas(res.data.num_missas_superior || 0);
        setAnexoUrl(res.data.anexo_path || null);
        if (res.data.casa_id) {
          setSelectedCasa(res.data.casa_id.toString());
        }
      } else {
        setPlanilha(null);
        setEditValues({});
        setApontamentos('');
        setNumMissas(0);
        setAnexoUrl(null);
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

    let finalAnexoPath = anexoUrl;

    // 1. Upload file if exists
    if (anexoFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('arquivo', anexoFile);
      formData.append('descricao', `Recibo ${selectedMes} - ${user.nome}`);
      try {
        const upRes = await api.post(`/usuarios/${user.id}/documentos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalAnexoPath = upRes.data.arquivo_path;
      } catch (err) {
        alert('Erro ao enviar anexo. A planilha será salva sem o anexo.');
      } finally {
        setIsUploading(false);
      }
    }

    const totals = calculateTotals();
    const payload = {
      usuario_id: user.id,
      casa_id: parseInt(selectedCasa),
      mes_referencia: selectedMes,
      total_credito: totals.credito,
      total_debito: totals.debito,
      num_missas_superior: numMissas,
      anexo_path: finalAnexoPath,
      status: 'PENDENTE',
      itens: Object.entries(editValues).map(([id, val]) => ({
        categoria_id: parseInt(id),
        valor: val
      }))
    };

    try {
      await api.post('/financas-mensais', payload);
      alert('Planilha salva como rascunho!');
      loadPlanilha();
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!user || !selectedCasa) {
      alert('Selecione uma casa religiosa.');
      return;
    }

    const isSuperiorSelf = isSuperior && (!selectedUserId || selectedUserId === user.id);
    const confirmMsg = isSuperiorSelf 
      ? 'Deseja finalizar sua planilha? Ela será considerada validada automaticamente.' 
      : 'Deseja finalizar e enviar esta planilha para o ecônomo? Após enviar, você não poderá mais editá-la.';

    if (!window.confirm(confirmMsg)) {
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
      num_missas_superior: numMissas,
      anexo_path: anexoUrl,
      status: isSuperiorSelf ? 'VALIDADO' : 'EM_VALIDACAO',
      itens: Object.entries(editValues).map(([id, val]) => ({
        categoria_id: parseInt(id),
        valor: val
      }))
    };

    try {
      await api.post('/financas-mensais', payload);
      alert(isSuperiorSelf ? 'Sua planilha foi finalizada e validada!' : 'Planilha enviada para validação com sucesso!');
      loadPlanilha();
    } catch (err: any) {
      alert('Erro ao enviar: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidar = async (status: 'VALIDADO' | 'PENDENTE' | 'DEVOLVIDO') => {
    if (!planilha?.id) return;
    setIsValidating(true);
    try {
      await api.put(`/financas-mensais/${planilha.id}/validar`, { status, apontamentos });
      alert(`Planilha ${status === 'VALIDADO' ? 'validada com sucesso' : 'devolvida para revisão'}!`);
      loadPlanilha();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro desconhecido';
      alert('Erro ao validar planilha: ' + msg);
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

  const exportIndividualToExcel = () => {
    if (!user || !planilha) return;

    const casaNome = casas.find(c => String(c.id) === selectedCasa)?.nome || 'Casa';
    const userName = selectedUserName || user.nome;

    // Build the sheet data
    const rows: any[] = [];
    rows.push(['RELATÓRIO FINANCEIRO INDIVIDUAL']);
    rows.push([`Missionário: ${userName}`]);
    rows.push([`Casa: ${casaNome}`]);
    rows.push([`Mês: ${selectedMes}`]);
    rows.push([]);

    // Headers
    rows.push(['CÓDIGO', 'CATEGORIA', 'RECEITA (R$)', '', 'CÓDIGO', 'CATEGORIA', 'DESPESA (R$)']);

    const receitas = categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_1');
    const despesas = categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_1');
    const maxLength = Math.max(receitas.length, despesas.length + 2); // +2 for totals/missas

    for (let i = 0; i < maxLength; i++) {
      const rec = receitas[i];
      const dep = despesas[i];
      
      const row = [
        rec ? String(rec.codigo || '') : '',
        rec ? String(rec.nome || '') : '',
        rec ? (editValues[rec.id] || 0) : '',
        '',
        dep ? String(dep.codigo || '') : '',
        dep ? String(dep.nome || '') : '',
        dep ? (editValues[dep.id] || 0) : ''
      ];

      // Add extra rows for totals/missas at the end of despesas column
      if (i === despesas.length) {
        row[4] = '50';
        row[5] = 'EXCEDENTE RETIDO';
        row[6] = totals.saldo;
      } else if (i === despesas.length + 1) {
        row[4] = '70';
        row[5] = 'MISSAS CELEBRADAS';
        row[6] = numMissas;
      }

      rows.push(row);
    }

    rows.push([]);
    rows.push(['', 'TOTAL RECEITAS:', totals.credito, '', '', 'TOTAL DESPESAS:', totals.debito]);
    rows.push(['', '', '', '', '', 'SALDO:', totals.saldo]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 5 }, { wch: 10 }, { wch: 30 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    XLSX.writeFile(wb, `Financeiro_${userName.replace(' ', '_')}_${selectedMes}.xlsx`);
  };

  return (
    <div className="planilha-mensal-content">
      <div className="filters-card" style={{ marginBottom: '20px', display: 'block' }}>
        <div className="filters-grid-premium" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="filter-item">
            <label><Calendar size={14} /> {t('financeiro.filters.start_date')}</label>
            <input type="month" value={selectedMes} onChange={e => setSelectedMes(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Casa Religiosa</label>
            <select value={selectedCasa} onChange={e => setSelectedCasa(e.target.value)} disabled={!!planilha}>
              <option value="">{t('common.loading')}</option>
              {casas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          {isAdminGeral && (
            <div className="filter-item">
              <label>Ações</label>
              <button className="btn-export-small" onClick={exportConsolidadoToExcel} disabled={consolidadoData.length === 0} style={{ height: '40px', width: '100%', justifyContent: 'center' }}>
                <Download size={14} /> {t('financeiro.actions.export')}
              </button>
            </div>
          )}
        </div>
      </div>

      {(canValidate || isSuperior) && selectedUserId && (
        <div className="view-mode-tabs">
          <button className="mode-btn active" style={{ marginLeft: 'auto' }}>
            {t('planilha.reviewing')}: {selectedUserName}
          </button>
        </div>
      )}

      {viewMode === 'consolidado' ? (
        <div className="consolidado-container">
          <div className="consolidado-approval-card card-lite" style={{ marginBottom: '20px', borderTop: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{t('planilha.consolidado_title')}</h3>
                <p style={{ margin: '5px 0 0', opacity: 0.7 }}>{t('planilha.consolidado_desc')}</p>
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
                <h3>{t('planilha.individual_title')}</h3>
                <p>{t('planilha.instruction_individual')}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {planilha && (
                  <button className="btn-export-small" onClick={exportIndividualToExcel} style={{ background: '#10b981', color: 'white' }}>
                    <Download size={18} /> {t('financeiro.actions.export')}
                  </button>
                )}
                {(!planilha || planilha.status === 'PENDENTE' || planilha.status === 'DEVOLVIDO') && (
                    <button className="btn-save" onClick={handleSave} disabled={isSaving} style={{ background: '#64748b', height: '42px', padding: '0 20px' }}>
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      {t('planilha.save_draft')}
                    </button>
                )}
                {planilha?.status === 'EM_VALIDACAO' && (
                  <div className="status-tag em_validacao" style={{ padding: '10px 20px', fontSize: '14px' }}>
                     <Loader2 className="animate-spin" size={18} style={{ marginRight: '10px' }} />
                     {t('planilha.status_validating')}
                  </div>
                )}
                {planilha?.status === 'DEVOLVIDO' && (
                  <div className="status-tag devolvido" style={{ padding: '10px 20px', fontSize: '14px' }}>
                     <AlertCircle size={18} style={{ marginRight: '10px' }} />
                     {t('planilha.status_returned')}
                  </div>
                )}
                {planilha?.status === 'VALIDADO' && (
                  <div className="status-tag validado" style={{ padding: '10px 20px', fontSize: '14px' }}>
                     <CheckCircle size={18} style={{ marginRight: '10px' }} />
                     {t('planilha.status_validated')}
                  </div>
                )}
              </div>
            </div>

            <div className="spreadsheet-grid">
              {/* CRÉDITOS */}
              <div className="spreadsheet-column">
                <h4 className="column-title credito" style={{ background: '#dcfce7', color: '#166534' }}><TrendingUp size={16} /> {t('planilha.receitas')}</h4>
                {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_1' && !blacklist.includes(c.nome)).map(cat => (
                  <div key={cat.id} className="spreadsheet-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      {cat.codigo && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>{cat.codigo}</span>}
                      <label>{cat.nome}</label>
                    </div>
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
                  <span>{t('planilha.total_receitas')}</span>
                  <strong>R$ {totals.credito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* DÉBITOS */}
              <div className="spreadsheet-column">
                <h4 className="column-title debito" style={{ background: '#ffedd5', color: '#9a3412' }}><TrendingDown size={16} /> {t('planilha.despesas')}</h4>
                {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_1' && !blacklist.includes(c.nome)).map(cat => (
                  <div key={cat.id} className="spreadsheet-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      {cat.codigo && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>{cat.codigo}</span>}
                      <label>{cat.nome}</label>
                    </div>
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
                  <span>{t('planilha.total_despesas')}</span>
                  <strong>R$ {totals.debito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className="spreadsheet-row" style={{ marginTop: '10px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      {isAdminGeral && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>50</span>}
                      <label style={{ fontWeight: 700 }}>{t('planilha.excedente')}</label>
                   </div>
                   <div className="input-money">
                      <span>R$</span>
                      <input type="text" value={totals.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })} disabled style={{ background: '#f8fafc' }} />
                   </div>
                </div>

                <div className="spreadsheet-row" style={{ marginTop: '5px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      {isAdminGeral && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>70</span>}
                      <label style={{ fontWeight: 600 }}>{t('planilha.missas_individual')}</label>
                   </div>
                   <div className="input-money" style={{ border: 'none' }}>
                      <input 
                        type="number" 
                        value={numMissas} 
                        onChange={e => setNumMissas(parseInt(e.target.value) || 0)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'right', background: 'white' }}
                        disabled={planilha?.status === 'VALIDADO'}
                      />
                   </div>
                </div>
              </div>
            </div>

            <div className="spreadsheet-summary" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    id="anexo-input"
                    style={{ display: 'none' }}
                    onChange={e => setAnexoFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="anexo-input" className="btn-save" style={{ cursor: 'pointer', background: '#013375', color: 'white', border: 'none', height: '38px', padding: '0 20px', margin: 0 }}>
                    <FileText size={16} /> {anexoFile ? anexoFile.name : (anexoUrl ? t('planilha.replace_files') : t('planilha.attach_files'))}
                  </label>
                  {anexoUrl && (
                    <a href={`${api.defaults.baseURL}${anexoUrl}`} target="_blank" rel="noreferrer" className="btn-icon-view" title="Ver Anexo">
                       <FileText size={20} />
                    </a>
                  )}
                </div>

                {(!planilha || planilha.status === 'PENDENTE' || planilha.status === 'DEVOLVIDO') && (
                  <button className="btn-save" onClick={handleFinalize} disabled={isSaving} style={{ background: '#013375', height: '42px', padding: '0 30px' }}>
                    <CheckCircle size={18} /> {isSuperior && (!selectedUserId || selectedUserId === user?.id) ? t('planilha.finalize_self') : t('planilha.finalize_send')}
                  </button>
                )}
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
              <label>{t('planilha.saldo_mes')}</label>
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
