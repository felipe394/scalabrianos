import React, { useState, useEffect } from 'react';
import { Save, FileText, Landmark, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/FormationStage.css';

interface StagePageProps {
  title: string;
  stageKey: string;
  hasSubStage?: boolean;
}

const FormationStage: React.FC<StagePageProps> = ({ title, stageKey, hasSubStage }) => {
  const { canEdit, user } = useAuth();
  const [local, setLocal] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [subLocal, setSubLocal] = useState('');
  const [subPeriodo, setSubPeriodo] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStageData();
    }
  }, [user?.id, stageKey]);

  const fetchStageData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/usuarios/${user?.id}/itinerario`);
      if (response.data && Array.isArray(response.data)) {
        const mainStage = response.data.find((s: any) => s.etapa === stageKey && !s.is_sub_etapa);
        const subStage = response.data.find((s: any) => s.etapa === stageKey && s.is_sub_etapa);
        
        if (mainStage) {
          setLocal(mainStage.local || '');
          setPeriodo(mainStage.periodo || '');
        }
        if (subStage) {
          setSubLocal(subStage.local || '');
          setSubPeriodo(subStage.periodo || '');
        }
      }
    } catch (err) {
      console.error('Error fetching stage data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      // Fetch current itinerary first to avoid overwriting unrelated stages
      const currentResp = await api.get(`/usuarios/${user.id}/itinerario`);
      let stages = Array.isArray(currentResp.data) ? currentResp.data : [];
      
      // Filter out existing entries for this stageKey
      stages = stages.filter((s: any) => s.etapa !== stageKey);
      
      // Add new entries
      if (local || periodo) {
        stages.push({ etapa: stageKey, local, periodo, is_sub_etapa: false });
      }
      if (hasSubStage && (subLocal || subPeriodo)) {
        stages.push({ etapa: stageKey, local: subLocal, periodo: subPeriodo, is_sub_etapa: true });
      }

      await api.post(`/usuarios/${user.id}/itinerario`, { stages });
      alert('Dados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving stage data:', err);
      alert('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando dados da etapa...</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>{title}</h2>
        {canEdit && (
          <button className="btn-save-main" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        )}
      </div>

      <div className="form-card">
        <div className="section-title">
          <Landmark size={20} /> <h3>Informações da Etapa</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Local</label>
            <input 
              type="text" 
              placeholder="Local de formação..." 
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Período</label>
            <input 
              type="text" 
              placeholder="Ex: 2010 - 2012" 
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              disabled={!canEdit} 
            />
          </div>
        </div>

        <div className="form-group mt-1">
          <label>Anexo de Documento (PDF/JPEG)</label>
          <div className="input-with-upload">
            <input type="text" placeholder="Nenhum arquivo selecionado..." disabled />
            <button className="btn-upload"><FileText size={18} /> Anexar</button>
          </div>
        </div>

        {hasSubStage && (
          <div className="mt-4 nested-section">
            <div className="section-title">
              <Landmark size={20} /> <h3>Etapa Complementar / Menor</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Local</label>
                <input 
                  type="text" 
                  placeholder="Local..." 
                  value={subLocal}
                  onChange={(e) => setSubLocal(e.target.value)}
                  disabled={!canEdit} 
                />
              </div>
              <div className="form-group">
                <label>Período</label>
                <input 
                  type="text" 
                  placeholder="Período..." 
                  value={subPeriodo}
                  onChange={(e) => setSubPeriodo(e.target.value)}
                  disabled={!canEdit} 
                />
              </div>
            </div>
            <div className="form-group mt-1">
              <label>Anexo de Documento (PDF/JPEG)</label>
              <div className="input-with-upload">
                <input type="text" placeholder="Nenhum arquivo selecionado..." disabled />
                <button className="btn-upload"><FileText size={18} /> Anexar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormationStage;
