import React from 'react';
import { BarChart3 } from 'lucide-react';
import '../styles/Relatorios.css';

const Relatorios: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <BarChart3 size={64} color="#ccc" style={{ marginBottom: '20px' }} />
      <h2 style={{ color: '#666' }}>Módulo em Manutenção</h2>
      <p style={{ color: '#888', maxWidth: '400px' }}>
        A tela de relatórios está temporariamente indisponível. Por favor, utilize as planilhas financeiras para consulta de dados.
      </p>
    </div>
  );
};

export default Relatorios;
