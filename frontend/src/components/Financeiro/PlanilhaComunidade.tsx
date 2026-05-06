import React, { useState, useEffect } from 'react';
import { Save, Loader2, Calendar, FileText, Download } from 'lucide-react';
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
        <div className="spreedsheet-header">
           <div>
              <h3>{t('planilha.comunidade_title')}</h3>
              <p>{t('planilha.instruction_comunidade')}</p>
           </div>
           <button className="btn-save" onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('planilha.save_comunidade')}
           </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}><Loader2 className="animate-spin" size={40} /></div>
        ) : (
          <>
            <div className="spreadsheet-grid">
            {/* RECEITAS */}
            <div className="spreadsheet-column">
              <h4 className="column-title credito" style={{ background: '#dcfce7', color: '#166534' }}>{t('planilha.receitas')}</h4>
              {categorias.filter(c => c.tipo === 'CREDITO' && c.perfil === 'PERFIL_2').map(cat => (
                <div key={cat.id} className="spreadsheet-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    {isAdminGeral && cat.codigo && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>{cat.codigo}</span>}
                    <label>{cat.nome}</label>
                  </div>
                  <div className="input-money">
                    <span>R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[cat.id] || ''}
                      onChange={e => setEditValues({ ...editValues, [cat.id]: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              ))}
              <div className="column-footer">
                <span>{t('planilha.total_receitas')}</span>
                <strong>R$ {totals.credito.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {/* DESPESAS */}
            <div className="spreadsheet-column">
              <h4 className="column-title debito" style={{ background: '#ffedd5', color: '#9a3412' }}>{t('planilha.despesas')}</h4>
              {categorias.filter(c => c.tipo === 'DEBITO' && c.perfil === 'PERFIL_2').map(cat => (
                <div key={cat.id} className="spreadsheet-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    {isAdminGeral && cat.codigo && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>{cat.codigo}</span>}
                    <label>{cat.nome}</label>
                  </div>
                  <div className="input-money">
                    <span>R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[cat.id] || ''}
                      onChange={e => setEditValues({ ...editValues, [cat.id]: parseFloat(e.target.value) || 0 })}
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
                      <label style={{ fontWeight: 800 }}>{t('planilha.superavit_deficit')}</label>
                   </div>
                   <div className="input-money">
                      <span>R$</span>
                      <input type="text" value={totals.saldo.toLocaleString(undefined, { minimumFractionDigits: 2 })} disabled style={{ background: '#f8fafc' }} />
                   </div>
                </div>

                <div className="spreadsheet-row" style={{ marginTop: '5px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      {isAdminGeral && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700, width: '35px' }}>70</span>}
                      <label style={{ fontWeight: 600 }}>{t('planilha.missas_comunidade')}</label>
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
