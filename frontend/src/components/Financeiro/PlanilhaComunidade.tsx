import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Save, Loader2, Calendar, FileText, Download } from 'lucide-react';
=======
import {
  Save, Loader2, CheckCircle, XCircle, AlertCircle,
  Calendar, FileText, Download, TrendingUp, TrendingDown, Plus
} from 'lucide-react';
>>>>>>> 84f1922 (🚀:Rebuild das telas principais)
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface Categoria {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  perfil: string;
}

interface Item {
  categoria_id: number;
  valor: number;
}

interface PlanilhaData {
  id?: number;
  casa_id: number;
  mes_referencia: string;
  status: string;
  total_credito: number;
  total_debito: number;
  num_missas_superior: number;
  anexo_path: string | null;
  apontamentos_economo?: string;
  apontamentos_superior?: string;
  itens: Item[];
}

interface Props {
  casas: { id: number; nome: string }[];
  categorias: Categoria[];
}

const PlanilhaComunidade: React.FC<Props> = ({ casas, categorias }) => {
  const { t } = useTranslation();
  const { user, isAdminGeral } = useAuth();
  const [selectedMes, setSelectedMes] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCasa, setSelectedCasa] = useState('');
  const [planilha, setPlanilha] = useState<PlanilhaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<number, number>>({});
  const [numMissas, setNumMissas] = useState(0);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [anexoUrl, setAnexoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Insertion form state
  const [tempReceitaCat, setTempReceitaCat] = useState('');
  const [tempReceitaVal, setTempReceitaVal] = useState('');
  const [tempDespesaCat, setTempDespesaCat] = useState('');
  const [tempDespesaVal, setTempDespesaVal] = useState('');
  const [obsReceita, setObsReceita] = useState('');
  const [obsDespesa, setObsDespesa] = useState('');

  useEffect(() => {
    if (user?.casa_id && !selectedCasa) {
      setSelectedCasa(user.casa_id.toString());
    }
  }, [user]);

  useEffect(() => {
    if (selectedCasa && selectedMes) {
      loadPlanilha();
    }
  }, [selectedCasa, selectedMes]);

  const loadPlanilha = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/financas-comunidade/${selectedCasa}/${selectedMes}`);
      if (res.data) {
        setPlanilha(res.data);
        const vals: Record<number, number> = {};
        res.data.itens.forEach((it: any) => {
          vals[it.categoria_id] = parseFloat(it.valor);
        });
        setEditValues(vals);
        setNumMissas(res.data.num_missas_superior || 0);
        setAnexoUrl(res.data.anexo_path || null);
      } else {
        setPlanilha(null);
        setEditValues({});
        setNumMissas(0);
        setAnexoUrl(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    let cre = 0;
    let deb = 0;
    categorias.filter(c => c.perfil === 'PERFIL_2').forEach(cat => {
      const val = editValues[cat.id] || 0;
      if (cat.tipo === 'CREDITO') cre += val;
      else deb += val;
    });
    return { credito: cre, debito: deb, saldo: cre - deb };
  };

  const handleAddItem = (tipo: 'CREDITO' | 'DEBITO') => {
    const catId = tipo === 'CREDITO' ? tempReceitaCat : tempDespesaCat;
    const valStr = tipo === 'CREDITO' ? tempReceitaVal : tempDespesaVal;

    if (!catId) { alert('Selecione uma categoria.'); return; }
    const num = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(num) || num <= 0) { alert('Informe um valor válido.'); return; }

    const currentVal = editValues[parseInt(catId)] || 0;
    setEditValues({
      ...editValues,
      [parseInt(catId)]: currentVal + num
    });

    if (tipo === 'CREDITO') {
       setTempReceitaVal('');
    } else {
       setTempDespesaVal('');
    }
  };

  const handleSave = async () => {
    if (!selectedCasa) return alert('Selecione uma casa.');
    setIsSaving(true);

    let finalAnexoPath = anexoUrl;
    if (anexoFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('arquivo', anexoFile);
      formData.append('descricao', `Recibo Comunidade ${selectedMes}`);
      try {
        const upRes = await api.post(`/usuarios/${user?.id}/documentos`, formData);
        finalAnexoPath = upRes.data.arquivo_path;
      } catch {
        alert('Erro no upload do anexo.');
      } finally {
        setIsUploading(false);
      }
    }

    const totals = calculateTotals();
    const payload = {
      casa_id: parseInt(selectedCasa),
      mes_referencia: selectedMes,
      total_credito: totals.credito,
      total_debito: totals.debito,
      num_missas_superior: numMissas,
      anexo_path: finalAnexoPath,
      status: planilha?.status || 'PENDENTE_ECONOMO',
      itens: Object.entries(editValues).map(([id, val]) => ({
        categoria_id: parseInt(id),
        valor: val
      }))
    };

    try {
      await api.post('/financas-comunidade', payload);
      alert(t('common.save') + '!');
      loadPlanilha();
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const exportToExcel = () => {
    const totals = calculateTotals();
    const casaNome = casas.find(c => String(c.id) === selectedCasa)?.nome || 'Comunidade';

    // Build the sheet data
    const rows: any[] = [];
    rows.push(['PRESTAÇÃO DE CONTAS MENSAL - COMUNIDADE']);
    rows.push([`Casa: ${casaNome}`]);
    rows.push([`Mês: ${selectedMes}`]);
    rows.push([]);

    // Headers
    rows.push(['CÓDIGO', 'RECEITAS', 'VALOR (R$)', '', 'CÓDIGO', 'DESPESAS', 'VALOR (R$)']);

    const receitas = categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2');
    const despesas = categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2');
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
        row[5] = 'SUPERÁVIT / DÉFICIT';
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
    XLSX.utils.book_append_sheet(wb, ws, 'Comunidade');
    XLSX.writeFile(wb, `Comunidade_${casaNome.replace(' ', '_')}_${selectedMes}.xlsx`);
  };

  const totals = calculateTotals();

  return (
    <div className="planilha-mensal-content">
      <div className="filters-card">
        <div className="filters-grid-premium" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="filter-item">
            <label><Calendar size={14} /> Mês/Ano</label>
            <input type="month" value={selectedMes} onChange={e => setSelectedMes(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Comunidade Religiosa</label>
            <select value={selectedCasa} onChange={e => setSelectedCasa(e.target.value)}>
              <option value="">Selecione...</option>
              {casas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="filter-item">
             <label>Ações</label>
             <button className="btn-export-small" onClick={exportToExcel} style={{ width: '100%', height: '40px', justifyContent: 'center' }}>
                <Download size={16} /> {t('financeiro.actions.export')}
             </button>
          </div>
        </div>
      </div>

      <div className="spreedsheet-container card-lite" style={{ marginTop: '20px' }}>
        <div className="spreadsheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
           <div>
               <h3 style={{ margin: 0, color: '#013375', fontSize: '20px', fontWeight: 800 }}>{t('planilha.comunidade_title')}</h3>
               <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 500 }}>{t('planilha.instruction_comunidade')}</p>
           </div>
            <button 
              className="btn-save" 
              onClick={handleSave} 
              disabled={isSaving || isUploading}
              style={{ background: '#013375', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('planilha.save_comunidade')}
           </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}><Loader2 className="animate-spin" size={40} /></div>
        ) : (
          <>
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
              {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2').map(c => (
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
              <Plus size={16} /> Adicionar Receita
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
              {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2').map(c => (
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
              <Plus size={16} /> Adicionar Despesa
            </button>
          </div>
        </div>
      </div>

            <div className="spreadsheet-grid" style={{ display: 'flex', gap: '20px' }}>
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
                  {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2').map(cat => (
                    <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', alignItems: 'center', padding: '4px 12px' }}>
                      <div style={{ width: '40px', fontWeight: 700, color: '#166534' }}>{cat.codigo}</div>
                      <div style={{ flex: 1, color: '#334155' }}>{cat.nome}</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', width: '100px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues[cat.id] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setEditValues({ ...editValues, [cat.id]: isNaN(val) ? 0 : val });
                            }}
                            style={{ textAlign: 'right', border: 'none', background: 'transparent', width: '100%', fontWeight: 700, fontSize: '12px', color: '#0f172a', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f0fdf4', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #bcf0da', color: '#166534' }}>
                   <span>TOTAL RECEITAS</span>
                   <span>R$ {totals.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                  {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2').map(cat => (
                    <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fff', fontSize: '12px', alignItems: 'center', padding: '4px 12px' }}>
                      <div style={{ width: '40px', fontWeight: 700, color: '#991b1b' }}>{cat.codigo}</div>
                      <div style={{ flex: 1, color: '#334155' }}>{cat.nome}</div>
                      <div style={{ width: '110px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', width: '100px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues[cat.id] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setEditValues({ ...editValues, [cat.id]: isNaN(val) ? 0 : val });
                            }}
                            style={{ textAlign: 'right', border: 'none', background: 'transparent', width: '100%', fontWeight: 700, fontSize: '12px', color: '#0f172a', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fef2f2', padding: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '2px solid #fecaca', color: '#991b1b' }}>
                   <span>TOTAL DESPESAS</span>
                   <span>R$ {totals.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ padding: '15px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#334155' }}>SUPERÁVIT / DÉFICIT (= 30 - 40)</span>
                    <strong style={{ fontSize: '16px', color: totals.saldo >= 0 ? '#166534' : '#991b1b' }}>
                      R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#475569' }}>Missas celebradas ad mentem Superioris n.º</span>
                    <input
                      type="number"
                      value={numMissas}
                      onChange={e => setNumMissas(parseInt(e.target.value) || 0)}
                      style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, background: '#fff' }}
                    />
                  </div>
                </div>
              </div>
            </div>


            <div className="spreadsheet-summary" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    id="anexo-comunidade"
                    style={{ display: 'none' }}
                    onChange={e => setAnexoFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="anexo-comunidade" className="btn-save" style={{ cursor: 'pointer', background: '#013375', color: 'white', border: 'none', height: '38px', padding: '0 20px', margin: 0 }}>
                    <FileText size={18} /> {anexoFile ? anexoFile.name : (anexoUrl ? t('planilha.replace_files') : t('planilha.attach_files'))}
                  </label>
                  {anexoUrl && (
                    <a href={`${api.defaults.baseURL}${anexoUrl}`} target="_blank" rel="noreferrer" className="btn-icon-view" title="Ver Anexo">
                      <FileText size={20} />
                    </a>
                  )}
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanilhaComunidade;
