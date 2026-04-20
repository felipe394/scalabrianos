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
  status: 'PENDENTE' | 'VALIDADO';
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

  // Consolidated view state
  const [viewMode, setViewMode] = useState<'individual' | 'consolidado'>('individual');
  const [consolidadoData, setConsolidadoData] = useState<ConsolidatedRow[]>([]);
  const [, setIsConsolidadoLoading] = useState(false);

  const canValidate = user?.role === 'ADMIN_GERAL' || user?.is_oconomo;

  useEffect(() => {
    if (selectedMes && user) {
       if (viewMode === 'individual') loadPlanilha();
       else loadConsolidado();
    }
  }, [selectedMes, user, viewMode, selectedCasa]);

  const loadPlanilha = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/financas-mensais/usuario/${user.id}/mes/${selectedMes}`);
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

  const handleValidar = async (status: 'VALIDADO' | 'PENDENTE') => {
    if (!planilha?.id) return;
    setIsValidating(true);
    try {
      await api.put(`/api/financas-mensais/${planilha.id}/validar`, { status, apontamentos });
      alert(`Planilha ${status === 'VALIDADO' ? 'validada' : 'marcada como pendente'}!`);
      loadPlanilha();
    } catch (err) {
      alert('Erro ao validar');
    } finally {
      setIsValidating(false);
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
                  {planilha.status === 'VALIDADO' ? <CheckCircle size={14} /> : <Loader2 size={14} className="animate-spin" />}
                  {planilha.status}
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

      {canValidate && (
        <div className="view-mode-tabs">
          <button className={`mode-btn ${viewMode === 'individual' ? 'active' : ''}`} onClick={() => setViewMode('individual')}>Minha Planilha</button>
          <button className={`mode-btn ${viewMode === 'consolidado' ? 'active' : ''}`} onClick={() => setViewMode('consolidado')}>Relatório Consolidado</button>
        </div>
      )}

      {viewMode === 'consolidado' ? (
         <div className="consolidado-container card-lite">
           <div className="data-table">
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
                        <button className="btn-icon-view" title="Ver Detalhes" onClick={() => {
                          // Force switch to individual for this user
                          // This would require more state management to view "others"
                          // For now, let's keep it simple.
                        }}>
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
           {(!planilha || planilha.status === 'PENDENTE') && (
             <button className="btn-save" onClick={handleSave} disabled={isSaving}>
               {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
               Salvar Planilha
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

        <div className="spreadsheet-summary">
           <div className="summary-item">
             <label>Saldo do Mês</label>
             <h2 style={{ color: totals.saldo >= 0 ? '#10b981' : '#ef4444' }}>
               R$ {totals.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </h2>
           </div>
        </div>
      </div>

      {/* Ecônomo Validation Area */}
      {planilha && (canValidate || planilha.apontamentos) && (
        <div className="validation-card card-lite" style={{ marginTop: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div className="section-header">
            <h3><FileText size={18} /> {canValidate ? 'Validação do Ecônomo' : 'Observações do Ecônomo'}</h3>
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}>
            <textarea 
              placeholder="Notas ou correções necessárias..."
              value={apontamentos}
              onChange={e => setApontamentos(e.target.value)}
              disabled={!canValidate || planilha.status === 'VALIDADO'}
              rows={3}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
          {canValidate && planilha.status === 'PENDENTE' && (
            <div className="validation-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
               <button className="btn-approve" onClick={() => handleValidar('VALIDADO')} disabled={isValidating}>
                 <CheckCircle size={18} /> Validar e Fechar Mês
               </button>
               <button className="btn-reject" onClick={() => handleValidar('PENDENTE')} disabled={isValidating}>
                 <XCircle size={18} /> Solicitar Ajustes
               </button>
            </div>
          )}
        </div>
      )}
    </>
  )}
</div>
  );
};

export default PlanilhaMensal;
