import React from 'react';
import { Save, Milestone, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/ItinerarioFormativo.css';

const ItinerarioFormativo: React.FC = () => {
  const { canEdit } = useAuth();

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Itinerário Formativo</h2>
        {canEdit && <button className="btn-save-main"><Save size={20} /> Salvar Tudo</button>}
      </div>

      <div className="form-card">
        <div className="section-title">
          <Milestone size={20} /> <h3>Etapas de Formação</h3>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Propedêutico (Ano/Local)</label>
            <input type="text" placeholder="2010 - Seminário X" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Filosofia (Período/Inst.)</label>
            <input type="text" placeholder="2011-2013 - Faculdade Y" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Noviciado (Ano/Local)</label>
            <input type="text" placeholder="2014 - Casa Z" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Teologia (Período/Inst.)</label>
            <input type="text" placeholder="2015-2018 - Gregoriana" disabled={!canEdit} />
          </div>
        </div>

        <div className="section-title mt-2">
          <GraduationCap size={20} /> <h3>Formação Acadêmica Adicional</h3>
        </div>
        <div className="form-grid">
          <div className="form-group full-row">
            <label>Outras Especializações / Mestrados</label>
            <textarea
              rows={4}
              placeholder="Descreva outras formações..."
              disabled={!canEdit}
            ></textarea>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ItinerarioFormativo;
