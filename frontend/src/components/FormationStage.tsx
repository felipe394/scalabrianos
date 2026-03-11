import React from 'react';
import { Save, FileText, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/FormationStage.css';

interface StagePageProps {
  title: string;
  hasSubStage?: boolean;
}

const FormationStage: React.FC<StagePageProps> = ({ title, hasSubStage }) => {
  const { canEdit } = useAuth();

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>{title}</h2>
        {canEdit && <button className="btn-save-main"><Save size={20} /> Salvar Tudo</button>}
      </div>

      <div className="form-card">
        <div className="section-title">
          <Landmark size={20} /> <h3>Informações da Etapa</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Local</label>
            <input type="text" placeholder="Local de formação..." disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Período</label>
            <input type="text" placeholder="Ex: 2010 - 2012" disabled={!canEdit} />
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
          <div className="mt-3 nested-section">
            <div className="section-title">
              <Landmark size={20} /> <h3>Seminário Menor</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Local</label>
                <input type="text" placeholder="Local..." disabled={!canEdit} />
              </div>
              <div className="form-group">
                <label>Período</label>
                <input type="text" placeholder="Período..." disabled={!canEdit} />
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
