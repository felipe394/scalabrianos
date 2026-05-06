import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import PlanilhaMensal from '../components/Financeiro/PlanilhaMensal';
import { useAuth } from '../context/AuthContext';
import '../styles/Relatorios.css';
import '../styles/FinanceiroSpreadsheet.css';

interface Categoria {
  id: number;
  nome: string;
  tipo: 'CREDITO' | 'DEBITO';
  categoria_pai: 'PESSOAL' | 'CASA';
}

interface Casa {
  id: number;
  nome: string;
}

const Financeiro: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [casas, setCasas] = useState<Casa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

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

      <PlanilhaMensal casas={casas} categorias={categorias} />
    </div>
  );
};

export default Financeiro;
