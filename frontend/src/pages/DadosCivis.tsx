import React, { useState } from 'react';
import { Save, Plus, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/DadosCivis.css';

const DadosCivis: React.FC = () => {
  const { canEdit } = useAuth();
  const [nationalities, setNationalities] = useState(['']);
  const [rgList, setRgList] = useState(['']);

  const handleAddNationality = () => setNationalities([...nationalities, '']);
  const handleRemoveNationality = (index: number) => setNationalities(nationalities.filter((_, i) => i !== index));

  const handleAddRG = () => setRgList([...rgList, '']);
  const handleRemoveRG = (index: number) => setRgList(rgList.filter((_, i) => i !== index));

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Dados Civis</h2>
        {canEdit && <button className="btn-save-main"><Save size={20} /> Salvar Tudo</button>}
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Nascimento (Data)</label>
            <div className="input-with-upload">
              <input type="date" disabled={!canEdit} />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Filiação</label>
            <input type="text" placeholder="Nome dos pais..." disabled={!canEdit} />
          </div>

          <div className="form-group">
            <label>Cidade/Estado</label>
            <input type="text" placeholder="Cidade - UF" disabled={!canEdit} />
          </div>

          <div className="form-group">
            <label>Diocese</label>
            <input type="text" placeholder="Diocese..." disabled={!canEdit} />
          </div>

          <div className="form-group">
            <label>País</label>
            <input type="text" placeholder="Brasil" disabled={!canEdit} />
          </div>

          <div className="form-group">
            <label>Naturalidade</label>
            <input type="text" placeholder="Naturalidade..." disabled={!canEdit} />
          </div>
        </div>

        <div className="dynamic-section">
          <div className="section-header">
            <h3>Nacionalidade</h3>
            {canEdit && <button className="btn-add-circle" onClick={handleAddNationality}><Plus size={16} /></button>}
          </div>
          {nationalities.map((_, index) => (
            <div key={index} className="dynamic-row">
              <div className="input-with-upload full-width">
                <input type="text" placeholder="Nacionalidade..." disabled={!canEdit} />
                <button className="btn-upload"><FileText size={18} /></button>
                {canEdit && index > 0 && <button className="btn-remove" onClick={() => handleRemoveNationality(index)}><Trash2 size={18} /></button>}
              </div>
            </div>
          ))}
        </div>

        <div className="dynamic-section">
          <div className="section-header">
            <h3>RG</h3>
            {canEdit && <button className="btn-add-circle" onClick={handleAddRG}><Plus size={16} /></button>}
          </div>
          {rgList.map((_, index) => (
            <div key={index} className="dynamic-row">
              <div className="input-with-upload full-width">
                <input type="text" placeholder="Número do RG..." disabled={!canEdit} />
                <button className="btn-upload"><FileText size={18} /></button>
                {canEdit && index > 0 && <button className="btn-remove" onClick={() => handleRemoveRG(index)}><Trash2 size={18} /></button>}
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>RNM</label>
          <div className="input-with-upload">
            <input type="text" placeholder="Registro Nacional Migratório..." disabled={!canEdit} />
            <button className="btn-upload"><FileText size={18} /></button>
          </div>
        </div>

        <div className="form-grid mt-2">
          <div className="form-group">
            <label>CPF</label>
            <div className="input-with-upload">
              <input type="text" placeholder="000.000.000-00" disabled={!canEdit} />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Título de Eleitor</label>
            <div className="input-with-upload">
              <input type="text" placeholder="Número do título..." disabled={!canEdit} />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>CNH</label>
            <div className="input-with-upload">
              <input type="text" placeholder="Número da CNH..." disabled={!canEdit} />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Passaporte</label>
            <div className="input-with-upload">
              <input type="text" placeholder="Número do passaporte..." disabled={!canEdit} />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosCivis;
