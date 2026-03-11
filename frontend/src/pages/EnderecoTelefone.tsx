import React from 'react';
import { Save, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/EnderecoTelefone.css';

const EnderecoTelefone: React.FC = () => {
  const { canEdit } = useAuth();

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Endereço e Telefones</h2>
        {canEdit && <button className="btn-save-main"><Save size={20} /> Salvar Tudo</button>}
      </div>

      <div className="form-card">
        <div className="section-title">
          <MapPin size={20} /> <h3>Endereço de Residência</h3>
        </div>

        <div className="form-grid">
          <div className="form-group full-row">
            <label>Logradouro (Rua/Avenida)</label>
            <input type="text" placeholder="Ex: Rua das Flores, 123" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Complemento</label>
            <input type="text" placeholder="Apto, Bloco, etc." disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Bairro</label>
            <input type="text" placeholder="Bairro..." disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>CEP</label>
            <input type="text" placeholder="00000-000" disabled={!canEdit} />
          </div>
          <div className="form-group">
            <label>Cidade/Estado</label>
            <input type="text" placeholder="Cidade - UF" disabled={!canEdit} />
          </div>
        </div>

        <div className="section-title mt-2">
          <Phone size={20} /> <h3>Contatos e Telefones</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Telefone Celular (WhatsApp)</label>
            <div className="input-with-icon">
              <input type="text" placeholder="(00) 00000-0000" disabled={!canEdit} />
              <Phone size={18} className="field-icon" />
            </div>
          </div>
          <div className="form-group">
            <label>Telefone Fixo</label>
            <div className="input-with-icon">
              <input type="text" placeholder="(00) 0000-0000" disabled={!canEdit} />
              <Phone size={18} className="field-icon" />
            </div>
          </div>
          <div className="form-group full-row">
            <label>E-mail Pessoal</label>
            <div className="input-with-icon">
              <input type="email" placeholder="email@exemplo.com" disabled={!canEdit} />
              <Mail size={18} className="field-icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnderecoTelefone;
