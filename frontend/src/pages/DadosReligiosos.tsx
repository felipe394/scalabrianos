import React, { useState, useEffect } from 'react';
import { Save, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/DadosReligiosos.css';

interface ReligiousData {
  primeiros_votos_data: string;
  votos_perpetuos_data: string;
  lugar_profissao: string;
  diaconato_data: string;
  presbiterato_data: string;
  bispo_ordenante: string;
}

const DadosReligiosos: React.FC = () => {
  const { canEdit, user } = useAuth();
  const [formData, setFormData] = useState<ReligiousData>({
    primeiros_votos_data: '',
    votos_perpetuos_data: '',
    lugar_profissao: '',
    diaconato_data: '',
    presbiterato_data: '',
    bispo_ordenante: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchReligiousData();
    }
  }, [user?.id]);

  const fetchReligiousData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/usuarios/${user?.id}/dados-religiosos`);
      if (response.data) {
        const data = response.data;
        // Format dates
        ['primeiros_votos_data', 'votos_perpetuos_data', 'diaconato_data', 'presbiterato_data'].forEach(field => {
          if (data[field]) data[field] = data[field].split('T')[0];
        });
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error fetching religious data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await api.post(`/usuarios/${user.id}/dados-religiosos`, formData);
      alert('Dados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving religious data:', err);
      alert('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando dados religiosos...</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Dados Religiosos</h2>
        {canEdit && (
          <button className="btn-save-main" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        )}
      </div>

      <div className="form-card">
        <div className="section-title">
          <BookOpen size={20} /> <h3>Informações de Votos</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Primeiros Votos (Data)</label>
            <input 
              type="date" 
              name="primeiros_votos_data"
              value={formData.primeiros_votos_data}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Votos Perpétuos (Data)</label>
            <input 
              type="date" 
              name="votos_perpetuos_data"
              value={formData.votos_perpetuos_data}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Lugar da Profissão</label>
            <input 
              type="text" 
              name="lugar_profissao"
              placeholder="Cidade/País" 
              value={formData.lugar_profissao}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
        </div>

        <div className="section-title mt-4">
          <ShieldCheck size={20} /> <h3>Ordenação</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Diaconato (Data)</label>
            <input 
              type="date" 
              name="diaconato_data"
              value={formData.diaconato_data}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Presbiterato (Data)</label>
            <input 
              type="date" 
              name="presbiterato_data"
              value={formData.presbiterato_data}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group full-row">
            <label>Bispo Ordenante</label>
            <input 
              type="text" 
              name="bispo_ordenante"
              placeholder="Nome do Bispo" 
              value={formData.bispo_ordenante}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosReligiosos;
