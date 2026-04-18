import React, { useState, useEffect } from 'react';
import { Save, Milestone, GraduationCap, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/ItinerarioFormativo.css';

interface FormationStage {
  etapa: string;
  local: string;
  periodo: string;
}

const ItinerarioFormativo: React.FC = () => {
  const { t } = useTranslation();
  const { canEdit, user } = useAuth();
  const [stages, setStages] = useState<Record<string, FormationStage>>({
    'PROPEDEUTICO': { etapa: 'PROPEDEUTICO', local: '', periodo: '' },
    'FILOSOFIA': { etapa: 'FILOSOFIA', local: '', periodo: '' },
    'NOVICIADO': { etapa: 'NOVICIADO', local: '', periodo: '' },
    'TEOLOGIA': { etapa: 'TEOLOGIA', local: '', periodo: '' },
  });
  const [outrasFormacoes, setOutrasFormacoes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => {
    if (user?.id) {
      fetchItinerary();
    }
  }, [user?.id]);

  const fetchItinerary = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`${API_URL}/usuarios/${user?.id}/itinerario/get`);
      if (response.data && Array.isArray(response.data)) {
        const newStages = { ...stages };
        response.data.forEach((s: any) => {
          if (newStages[s.etapa]) {
            newStages[s.etapa] = { etapa: s.etapa, local: s.local || '', periodo: s.periodo || '' };
          }
        });
        setStages(newStages);
      }
    } catch (err) {
      console.error('Error fetching itinerary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageChange = (etapa: string, field: 'local' | 'periodo', value: string) => {
    setStages(prev => ({
      ...prev,
      [etapa]: { ...prev[etapa], [field]: value }
    }));
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const stagesArray = Object.values(stages).filter(s => s.local || s.periodo);
      await api.post(`${API_URL}/usuarios/${user.id}/itinerario`, { stages: stagesArray });
      alert(t('common.save'));
    } catch (err) {
      console.error('Error saving itinerary:', err);
      alert(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>{t('itinerary.title')}</h2>
        {canEdit && (
          <button className="btn-save-main" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? t('login.loading') : t('common.save')}
          </button>
        )}
      </div>

      <div className="form-card">
        <div className="section-title">
          <Milestone size={20} /> <h3>{t('itinerary.sections.stages')}</h3>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Propedêutico</label>
            <div className="multi-input">
              <input 
                type="text" 
                placeholder={t('itinerary.fields.period')} 
                value={stages['PROPEDEUTICO'].periodo}
                onChange={(e) => handleStageChange('PROPEDEUTICO', 'periodo', e.target.value)}
                disabled={!canEdit} 
              />
              <input 
                type="text" 
                placeholder={t('itinerary.fields.location')} 
                value={stages['PROPEDEUTICO'].local}
                onChange={(e) => handleStageChange('PROPEDEUTICO', 'local', e.target.value)}
                disabled={!canEdit} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Filosofia</label>
            <div className="multi-input">
              <input 
                type="text" 
                placeholder={t('itinerary.fields.period')} 
                value={stages['FILOSOFIA'].periodo}
                onChange={(e) => handleStageChange('FILOSOFIA', 'periodo', e.target.value)}
                disabled={!canEdit} 
              />
              <input 
                type="text" 
                placeholder={t('itinerary.fields.location')} 
                value={stages['FILOSOFIA'].local}
                onChange={(e) => handleStageChange('FILOSOFIA', 'local', e.target.value)}
                disabled={!canEdit} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Noviciado</label>
            <div className="multi-input">
              <input 
                type="text" 
                placeholder={t('itinerary.fields.period')} 
                value={stages['NOVICIADO'].periodo}
                onChange={(e) => handleStageChange('NOVICIADO', 'periodo', e.target.value)}
                disabled={!canEdit} 
              />
              <input 
                type="text" 
                placeholder={t('itinerary.fields.location')} 
                value={stages['NOVICIADO'].local}
                onChange={(e) => handleStageChange('NOVICIADO', 'local', e.target.value)}
                disabled={!canEdit} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Teologia</label>
            <div className="multi-input">
              <input 
                type="text" 
                placeholder={t('itinerary.fields.period')} 
                value={stages['TEOLOGIA'].periodo}
                onChange={(e) => handleStageChange('TEOLOGIA', 'periodo', e.target.value)}
                disabled={!canEdit} 
              />
              <input 
                type="text" 
                placeholder={t('itinerary.fields.location')} 
                value={stages['TEOLOGIA'].local}
                onChange={(e) => handleStageChange('TEOLOGIA', 'local', e.target.value)}
                disabled={!canEdit} 
              />
            </div>
          </div>
        </div>

        <div className="section-title mt-4">
          <GraduationCap size={20} /> <h3>{t('itinerary.sections.academic')}</h3>
        </div>
        <div className="form-grid">
          <div className="form-group full-row">
            <label>{t('itinerary.fields.others')}</label>
            <textarea
              rows={4}
              placeholder="..."
              value={outrasFormacoes}
              onChange={(e) => setOutrasFormacoes(e.target.value)}
              disabled={!canEdit}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItinerarioFormativo;
