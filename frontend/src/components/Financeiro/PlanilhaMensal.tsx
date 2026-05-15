import React, { useState, useEffect } from 'react';
import {
  Save, Loader2, CheckCircle, XCircle, AlertCircle,
  Calendar, FileText, Download, TrendingUp, TrendingDown, Plus
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
  status: 'PENDENTE' | 'VALIDADO' | 'DEVOLVIDO' | 'EM_VALIDACAO';
  total_credito: number;
  total_debito: number;
  num_missas_superior: number;
  anexo_path: string | null;
  apontamentos: string;
  obs_receita: string;
  obs_despesa: string;
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
  const [obsReceita, setObsReceita] = useState('');
  const [obsDespesa, setObsDespesa] = useState('');
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [anexoUrl, setAnexoUrl] = useState<string | null>(null);
  const [_isUploading, setIsUploading] = useState(false);

  // Consolidated view state
  const [viewMode, setViewMode] = useState<'individual' | 'consolidado'>('individual');
  const [consolidadoData, setConsolidadoData] = useState<ConsolidatedRow[]>([]);
  const [_isConsolidadoLoading, setIsConsolidadoLoading] = useState(false);
  const [consolidadoStatus, setConsolidadoStatus] = useState<ConsolidatedStatus | null>(null);
  const [isSavingConsolidado, setIsSavingConsolidado] = useState(false);

  // Insertion form state
  const [tempReceitaCat, setTempReceitaCat] = useState('');
  const [tempReceitaVal, setTempReceitaVal] = useState('');
  const [tempDespesaCat, setTempDespesaCat] = useState('');
  const [tempDespesaVal, setTempDespesaVal] = useState('');

  const handleAddItem = (tipo: 'CREDITO' | 'DEBITO') => {
    const catId = tipo === 'CREDITO' ? tempReceitaCat : tempDespesaCat;
    const valStr = tipo === 'CREDITO' ? tempReceitaVal : tempDespesaVal;

    if (!catId) { alert('Selecione uma categoria.'); return; }
    const num = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num) || num <= 0) { alert('Informe um valor válido.'); return; }

    const id = parseInt(catId);
    setEditValues(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + num
    }));

    // Clear
    if (tipo === 'CREDITO') { setTempReceitaCat(''); setTempReceitaVal(''); }
    else { setTempDespesaCat(''); setTempDespesaVal(''); }
  };

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
        setObsReceita(res.data.obs_receita || '');
        setObsDespesa(res.data.obs_despesa || '');
        setAnexoUrl(res.data.anexo_path || null);
        if (res.data.casa_id) {
          setSelectedCasa(res.data.casa_id.toString());
        }
      } else {
        setPlanilha(null);
        setEditValues({});
        setApontamentos('');
        setNumMissas(0);
        setObsReceita('');
        setObsDespesa('');
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
      obs_receita: obsReceita,
      obs_despesa: obsDespesa,
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
      obs_receita: obsReceita,
      obs_despesa: obsDespesa,
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
          <div className="spreedsheet-container card-lite" style={{ padding: '30px' }}>
            <div className="spreedsheet-header" style={{ marginBottom: '30px', borderBottom: '2px solid #013375', paddingBottom: '15px' }}>
              <div className="header-info">
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#013375', margin: 0 }}>Prestação de Contas Mensal - Missionário</h3>
                <div style={{ display: 'flex', gap: '30px', marginTop: '10px', fontSize: '0.95rem' }}>
                  <p style={{ margin: 0 }}>Missionário: <strong style={{ borderBottom: '1px dotted #000' }}>{selectedUserName || user?.nome}</strong></p>
                  <p style={{ margin: 0 }}>Data: <strong style={{ borderBottom: '1px dotted #000' }}>{selectedMes}</strong></p>
                </div>
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
              </div>
            </div>

            {/* INSERTION FORM AREA */}
            <div className="insertion-fields-card" style={{ marginBottom: '20px', padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* RECEITA COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontWeight: 800, color: '#166534', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} /> Receita
            </span>
            <select
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}
              value={tempReceitaCat}
              onChange={e => setTempReceitaCat(e.target.value)}
            >
              <option value="">Selecione a categoria...</option>
              {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_1').map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '0 0 120px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>R$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                  value={tempReceitaVal}
                  onChange={e => setTempReceitaVal(e.target.value)}
                />
              </div>
              <input
                type="text"
                placeholder="Observação da receita..."
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                value={obsReceita}
                onChange={e => setObsReceita(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleAddItem('CREDITO')}
              style={{ width: '100%', padding: '12px', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Adicionar Receita
            </button>
          </div>

          {/* DESPESA COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingDown size={14} /> Despesa
            </span>
            <select
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff', outline: 'none' }}
              value={tempDespesaCat}
              onChange={e => setTempDespesaCat(e.target.value)}
            >
              <option value="">Selecione a categoria...</option>
              {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_1').map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '0 0 120px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>R$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, outline: 'none' }}
                  value={tempDespesaVal}
                  onChange={e => setTempDespesaVal(e.target.value)}
                />
              </div>
              <input
                type="text"
                placeholder="Observação da despesa..."
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                value={obsDespesa}
                onChange={e => setObsDespesa(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleAddItem('DEBITO')}
              style={{ width: '100%', padding: '12px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Adicionar Despesa
            </button>
          </div>
        </div>
      </div>

            <div className="spreadsheet-grid" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              {/* RECEITAS */}
              <div className="spreadsheet-column" style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <h4 className="column-title credito" style={{ background: '#dcfce7', color: '#166534', padding: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                  <TrendingUp size={18} /> {t('planilha.receitas')}
                </h4>
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                      <div style={{ width: '40px' }}>CÓD.</div>
                      <div style={{ flex: 1 }}>DESCRIÇÃO</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>VALOR (R$)</div>
                   </div>
                </div>
                <div style={{ padding: '2px 0' }}>
                  {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_1' && !blacklist.includes(c.nome)).map(cat => (
                    <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', alignItems: 'center', padding: '4px 12px' }}>
                      <div style={{ width: '40px', fontWeight: 700, color: '#166534' }}>{cat.codigo}</div>
                      <div style={{ flex: 1, color: '#334155' }}>{cat.nome}</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', width: '100px' }}>
                          <input
                            type="text"
                            value={(editValues[cat.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={e => {
                              const val = e.target.value.replace(/\./g, '').replace(',', '.');
                              const num = parseFloat(val);
                              setEditValues({ ...editValues, [cat.id]: isNaN(num) ? 0 : num });
                            }}
                            style={{ textAlign: 'right', border: 'none', background: 'transparent', width: '100%', fontWeight: 600, fontSize: '12px', color: '#0f172a' }}
                            disabled={planilha?.status === 'VALIDADO'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f0fdf4', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #bcf0da', color: '#166534' }}>
                  <span>{t('planilha.total_receitas')}</span>
                  <strong style={{ fontSize: '15px' }}>R$ {totals.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* DESPESAS */}
              <div className="spreadsheet-column" style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <h4 className="column-title debito" style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
                  <TrendingDown size={18} /> {t('planilha.despesas')}
                </h4>
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
                      <div style={{ width: '40px' }}>CÓD.</div>
                      <div style={{ flex: 1 }}>DESCRIÇÃO</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>VALOR (R$)</div>
                   </div>
                </div>
                <div style={{ padding: '2px 0' }}>
                  {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_1' && !blacklist.includes(c.nome)).map(cat => (
                    <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', alignItems: 'center', padding: '4px 12px' }}>
                      <div style={{ width: '40px', fontWeight: 700, color: '#991b1b' }}>{cat.codigo}</div>
                      <div style={{ flex: 1, color: '#334155' }}>{cat.nome}</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', width: '100px' }}>
                          <input
                            type="text"
                            value={(editValues[cat.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={e => {
                              const val = e.target.value.replace(/\./g, '').replace(',', '.');
                              const num = parseFloat(val);
                              setEditValues({ ...editValues, [cat.id]: isNaN(num) ? 0 : num });
                            }}
                            style={{ textAlign: 'right', border: 'none', background: 'transparent', width: '100%', fontWeight: 600, fontSize: '12px', color: '#0f172a' }}
                            disabled={planilha?.status === 'VALIDADO'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fef2f2', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #fecaca', color: '#991b1b' }}>
                  <span>{t('planilha.total_despesas')}</span>
                  <strong style={{ fontSize: '15px' }}>R$ {totals.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div style={{ padding: '15px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>11.11</span>
                      <label style={{ fontWeight: 800, fontSize: '13px', color: '#334155' }}>Excedente Retido</label>
                    </div>
                    <strong style={{ fontSize: '16px', color: totals.saldo >= 0 ? '#166534' : '#991b1b' }}>
                      R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>70</span>
                      <label style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>Missas Celebradas (nº)</label>
                    </div>
                    <input
                      type="number"
                      value={numMissas}
                      onChange={e => setNumMissas(parseInt(e.target.value) || 0)}
                      style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, background: '#fff' }}
                      disabled={planilha?.status === 'VALIDADO'}
                    />
                  </div>
                </div>
              </div>
            </div>



            <div className="spreadsheet-summary" style={{ marginTop: '30px', padding: '25px', background: '#f1f5f9', borderRadius: '16px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <input
                  type="file"
                  id="anexo-input"
                  style={{ display: 'none' }}
                  onChange={e => setAnexoFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="anexo-input" className="btn-save" style={{ cursor: 'pointer', background: '#013375', color: 'white', border: 'none', height: '46px', padding: '0 25px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(1, 51, 117, 0.2)' }}>
                  <FileText size={20} /> {anexoFile ? anexoFile.name : (anexoUrl ? "Substituir Anexos" : "Anexar Comprovantes (PDF/IMG)")}
                </label>
                {anexoUrl && (
                  <a href={`${api.defaults.baseURL}${anexoUrl}`} target="_blank" rel="noreferrer" className="btn-icon-view" title="Ver Anexo" style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex' }}>
                    <FileText size={24} color="#013375" />
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                {(!planilha || planilha.status === 'PENDENTE' || planilha.status === 'DEVOLVIDO') && (
                  <>
                    <button className="btn-save" onClick={handleSave} disabled={isSaving} style={{ background: '#64748b', height: '46px', padding: '0 25px', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>
                      {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Salvar Rascunho
                    </button>
                    <button className="btn-save" onClick={handleFinalize} disabled={isSaving} style={{ background: '#10b981', height: '46px', padding: '0 35px', borderRadius: '8px', fontWeight: 800, fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
                      <CheckCircle size={22} /> {isSuperior && (!selectedUserId || selectedUserId === user?.id) ? "Finalizar Prestação" : "Enviar para Conferência"}
                    </button>
                  </>
                )}
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
