import React from 'react';
import { Save, BookOpen, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/DadosReligiosos.css';

const DadosReligiosos: React.FC = () => {
  const { canEdit } = useAuth();

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Dados Religiosos</h2>
        {canEdit && <button className="btn-save-main"><Save size={20} /> Salvar Tudo</button>}
      </div>

      <div className="form-card">
        <div className="section-title">
          <BookOpen size={20} /> <h3>Informações de Votos</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Primeiros Votos (Data)</label>
            <input type="date" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Votos Perpétuos (Data)</label>
            <input type="date" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Lugar da Profissão</label>
            <input type="text" placeholder="Cidade/País" disabled={!canEdit} />
          </div>
        </div>

        <div className="section-title mt-2">
          <ShieldCheck size={20} /> <h3>Ordenação</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Diaconato (Data)</label>
            <input type="date" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Presbiterato (Data)</label>
            <input type="date" disabled={!canEdit} />
          </div>
          <div className="form-group full-row">
            <label>Bispo Ordenante</label>
            <input type="text" placeholder="Nome do Bispo" disabled={!canEdit} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosReligiosos;
