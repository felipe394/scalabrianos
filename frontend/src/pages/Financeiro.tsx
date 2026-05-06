import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import PlanilhaMensal from '../components/Financeiro/PlanilhaMensal';
import PlanilhaComunidade from '../components/Financeiro/PlanilhaComunidade';
import PlanejamentoOrcamentario from '../components/Financeiro/PlanejamentoOrcamentario';
import PrestacaoContasAnual from '../components/Financeiro/PrestacaoContasAnual';
import { useAuth } from '../context/AuthContext';
import '../styles/Relatorios.css';
import '../styles/FinanceiroSpreadsheet.css';

interface Categoria {
  id: number;
  codigo: string;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoria_pai: 'PESSOAL' | 'CASA';
  perfil: 'PERFIL_1' | 'PERFIL_2' | 'ANUAL' | 'PLANEJAMENTO';
}

interface Casa {
  id: number;
  nome: string;
}

const Financeiro: React.FC = () => {
  const { t } = useTranslation();
  const { isAdminGeral, isOconomo, isSuperior, isPadre } = useAuth();
  const [casas, setCasas] = useState<Casa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [activeTab, setActiveTab] = useState<'individual' | 'comunidade' | 'planejamento' | 'anual'>('individual');

  const isCommonPadre = isPadre && !isOconomo && !isSuperior;
  const isLocalAuthority = isOconomo || isSuperior;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [housesRes, catsRes] = await Promise.all([
          api.post('/casas-religiosas/get'),
          api.get('/categorias-financas')
        ]);
        setCasas(housesRes.data);
        setCategorias(catsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <DollarSign size={24} />
          <h2>{t('financeiro.title')}</h2>
        </div>
      </div>

      {!isCommonPadre && (
        <div className="view-mode-tabs" style={{ marginBottom: '20px' }}>
          <button 
            className={`mode-btn ${activeTab === 'individual' ? 'active' : ''}`} 
            onClick={() => setActiveTab('individual')}
          >
            {t('planilha.individual_title')}
          </button>
          <button 
            className={`mode-btn ${activeTab === 'comunidade' ? 'active' : ''}`} 
            onClick={() => setActiveTab('comunidade')}
          >
            {t('planilha.comunidade_title')}
          </button>
          {isAdminGeral && (
            <>
              <button 
                className={`mode-btn ${activeTab === 'planejamento' ? 'active' : ''}`} 
                onClick={() => setActiveTab('planejamento')}
              >
                {t('menu.finance')}
              </button>
              <button 
                className={`mode-btn ${activeTab === 'anual' ? 'active' : ''}`} 
                onClick={() => setActiveTab('anual')}
              >
                Anual
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'individual' && <PlanilhaMensal casas={casas} categorias={categorias} />}
      {activeTab === 'comunidade' && (isAdminGeral || isLocalAuthority) && <PlanilhaComunidade casas={casas} categorias={categorias} />}
      {activeTab === 'planejamento' && isAdminGeral && <PlanejamentoOrcamentario casas={casas} categorias={categorias.filter(c => c.perfil === 'PLANEJAMENTO')} />}
      {activeTab === 'anual' && isAdminGeral && <PrestacaoContasAnual casas={casas} categorias={categorias.filter(c => c.perfil === 'ANUAL')} />}
    </div>
  );
};

export default Financeiro;
