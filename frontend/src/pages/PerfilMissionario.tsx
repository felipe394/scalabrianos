import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, MapPin, BookOpen, Home as HomeIcon, Loader2, AlertCircle,
  Save, Trash2, Plus, Star, FileText, Download, ShieldCheck, Eye,
  Activity, ChevronLeft, DollarSign, GraduationCap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/PerfilMissionario.css';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface Missionario {
  id: number;
  nome: string;
  login: string;
  situacao: string;
  is_oconomo: boolean;
  is_superior: boolean;
  proximos_passos: string;
}

interface ItineraryStage {
  etapa: string;
  local: string;
  periodo: string;
  is_sub_etapa: boolean;
  doc_path?: string;
}

interface CivilData {
  data_nascimento: string;
  filiacao: string;
  cidade_estado: string;
  diocese: string;
  pais: string;
  naturalidade: string;
  rnm: string;
  cpf: string;
  titulo_eleitor: string;
  cnh: string;
  passaporte: string;
}

interface EnderecoData {
  logradouro: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade_estado: string;
  celular_whatsapp: string;
  telefone_fixo: string;
  email_pessoal: string;
}

interface ReligiososData {
  primeiros_votos_data: string;
  votos_perpetuos_data: string;
  lugar_profissao: string;
  diaconato_data: string;
  presbiterato_data: string;
  bispo_ordenante: string;
}

const PAISES_COMMON = [
  'Afeganistão', 'África do Sul', 'Albânia', 'Alemanha', 'Andorra', 'Angola', 'Antígua e Barbuda', 'Arábia Saudita', 'Argélia', 'Argentina', 'Armênia', 'Austrália', 'Áustria', 'Azerbaijão',
  'Bahamas', 'Bangladesh', 'Barbados', 'Bahrein', 'Bélgica', 'Belize', 'Benim', 'Bielorrússia', 'Bolívia', 'Bósnia e Herzegovina', 'Botsuana', 'Brasil', 'Brunei', 'Bulgária', 'Burquina Faso', 'Burundi',
  'Butão', 'Cabo Verde', 'Camarões', 'Camboja', 'Canadá', 'Catar', 'Cazaquistão', 'Chade', 'Chile', 'China', 'Chipre', 'Colômbia', 'Comores', 'Congo-Brazzaville', 'Coreia do Norte', 'Coreia do Sul',
  'Costa do Marfim', 'Costa Rica', 'Croácia', 'Cuba', 'Dinamarca', 'Djibuti', 'Dominica', 'Egito', 'El Salvador', 'Emirados Árabes Unidos', 'Equador', 'Eritreia', 'Eslováquia', 'Eslovênia', 'Espanha',
  'Estados Unidos', 'Estônia', 'Etiópia', 'Fiji', 'Filipinas', 'Finlândia', 'França', 'Gabão', 'Gâmbia', 'Gana', 'Geórgia', 'Granada', 'Grécia', 'Guatemala', 'Guiana', 'Guiné', 'Guiné Equatorial',
  'Guiné-Bissau', 'Haiti', 'Honduras', 'Hungria', 'Iêmen', 'Ilhas Marechal', 'Ilhas Salomão', 'Índia', 'Indonésia', 'Irã', 'Iraque', 'Irlanda', 'Islândia', 'Israel', 'Itália', 'Jamaica', 'Japão',
  'Jordânia', 'Kiribati', 'Kuwait', 'Laos', 'Lesoto', 'Letônia', 'Líbano', 'Libéria', 'Líbia', 'Listenstaine', 'Lituânia', 'Luxemburgo', 'Macedônia do Norte', 'Madagascar', 'Malásia', 'Malaui',
  'Maldivas', 'Mali', 'Malta', 'Marrocos', 'Maurícia', 'Mauritânia', 'México', 'Mianmar', 'Micronésia', 'Moçambique', 'Moldávia', 'Mônaco', 'Mongólia', 'Montenegro', 'Namíbia', 'Nauru', 'Nepal',
  'Nicarágua', 'Níger', 'Nigéria', 'Noruega', 'Nova Zelândia', 'Omã', 'Países Baixos', 'Palau', 'Panamá', 'Papua-Nova Guiné', 'Paquistão', 'Paraguai', 'Peru', 'Polônia', 'Portugal', 'Quênia',
  'Quirguistão', 'Reino Unido', 'República Centro-Africana', 'República Checa', 'República Democrática do Congo', 'República Dominicana', 'Romênia', 'Ruanda', 'Rússia', 'Samoa', 'Santa Lúcia',
  'São Cristóvão e Neves', 'São Marinho', 'São Tomé e Príncipe', 'São Vicente e Granadinas', 'Seicheles', 'Senegal', 'Serra Leoa', 'Sérvia', 'Singapura', 'Síria', 'Somália', 'Sri Lanka', 'Suazilândia',
  'Sudão', 'Sudão do Sul', 'Suécia', 'Suíça', 'Suriname', 'Tailândia', 'Taiwan', 'Tajiquistão', 'Tanzânia', 'Timor-Leste', 'Togo', 'Tonga', 'Trindade e Tobago', 'Tunísia', 'Turquemenistão', 'Turquia',
  'Tuvalu', 'Ucrânia', 'Uganda', 'Uruguai', 'Usbequistão', 'Vanuatu', 'Vaticano', 'Venezuela', 'Vietname', 'Zâmbia', 'Zimbábue'
];

interface Documento {
  id: number;
  descricao: string;
  url: string;
  data_upload: string;
}

interface CasaHistorico {
  id: number;
  casa_id: number;
  casa_nome: string;
  data_inicio: string;
  data_fim: string | null;
  funcao: string;
  is_superior: boolean;
}

interface Casa { id: number; nome: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDuracao(dataInicio: string, dataFim?: string | null): string {
  if (!dataInicio) return '';
  const ini = new Date(dataInicio);
  const fim = dataFim ? new Date(dataFim) : new Date();
  let anos = fim.getFullYear() - ini.getFullYear();
  let meses = fim.getMonth() - ini.getMonth();
  if (meses < 0) { anos--; meses += 12; }
  const parts = [];
  if (anos > 0) parts.push(`${anos} ano${anos > 1 ? 's' : ''}`);
  if (meses > 0) parts.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`);
  return parts.length ? parts.join(' e ') : 'menos de 1 mês';
}

// ─── Component ───────────────────────────────────────────────────────────────

const PerfilMissionario: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dados');

  const [missionario, setMissionario] = useState<Missionario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [civilData, setCivilData] = useState<CivilData>({ data_nascimento: '', filiacao: '', cidade_estado: '', diocese: '', pais: '', naturalidade: '', rnm: '', cpf: '', titulo_eleitor: '', cnh: '', passaporte: '' });
  const [enderecoData, setEnderecoData] = useState<EnderecoData>({ logradouro: '', complemento: '', bairro: '', cep: '', cidade_estado: '', celular_whatsapp: '', telefone_fixo: '', email_pessoal: '' });
  const [religiososData, setReligiososData] = useState<ReligiososData>({ primeiros_votos_data: '', votos_perpetuos_data: '', lugar_profissao: '', diaconato_data: '', presbiterato_data: '', bispo_ordenante: '' });
  const [casasHistorico, setCasasHistorico] = useState<CasaHistorico[]>([]);
  const [casasDisponiveis, setCasasDisponiveis] = useState<Casa[]>([]);
  const [novaVinculacao, setNovaVinculacao] = useState({ casa_id: '', data_inicio: '', data_fim: '', funcao: '', is_superior: false });
  const [isSaving, setIsSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [nacionalidades, setNacionalidades] = useState<string[]>([]);

  // Documents state
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pendingDocDesc, setPendingDocDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Itinerary state
  const [itinerarioStages, setItinerarioStages] = useState<ItineraryStage[]>([]);
  const [, setIsSavingItinerary] = useState(false);
  const [, setIsSavingSteps] = useState(false);
  const [, setItinDocUploading] = useState<number | null>(null);
  const itinFileInputRef = useRef<HTMLInputElement>(null);
  const [activeItinIdx, setActiveItinIdx] = useState<number | null>(null);

  // New Sections State
  const [formacaoAcademica, setFormacaoAcademica] = useState<any[]>([]);
  const [atividadesMissionarias, setAtividadesMissionarias] = useState<any[]>([]);
  const [obrasRealizadas, setObrasRealizadas] = useState<any[]>([]);
  const [saudeRecords, setSaudeRecords] = useState<any[]>([]);
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);
  const [observacoesGerais, setObservacoesGerais] = useState<any[]>([]);
  const [nit, setNit] = useState('');

  // Forms for adding
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [tempForm, setTempForm] = useState<any>({});

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => { if (id) fetchData(); }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mRes, civRes, endRes, relRes, casasRes, histRes, nacRes, docRes, itinRes] = await Promise.all([
        api.get(`${API_URL}/usuarios/${id}`),
        api.get(`${API_URL}/usuarios/${id}/dados-civis`),
        api.get(`${API_URL}/usuarios/${id}/endereco-contato`),
        api.get(`${API_URL}/usuarios/${id}/dados-religiosos`),
        api.post(`${API_URL}/casas-religiosas/get`),
        api.get(`${API_URL}/usuarios/${id}/casas-historico`),
        api.get(`${API_URL}/usuarios/${id}/nacionalidades`),
        api.get(`${API_URL}/usuarios/${id}/documentos`),
        api.get(`${API_URL}/usuarios/${id}/itinerario`),
      ]);

      setMissionario(mRes.data);
      if (civRes.data) setCivilData({
        ...civRes.data,
        data_nascimento: civRes.data.data_nascimento ? civRes.data.data_nascimento.split('T')[0] : ''
      });
      if (endRes.data) setEnderecoData(endRes.data);
      if (relRes.data) setReligiososData({
        ...relRes.data,
        primeiros_votos_data: relRes.data.primeiros_votos_data ? relRes.data.primeiros_votos_data.split('T')[0] : '',
        votos_perpetuos_data: relRes.data.votos_perpetuos_data ? relRes.data.votos_perpetuos_data.split('T')[0] : '',
        diaconato_data: relRes.data.diaconato_data ? relRes.data.diaconato_data.split('T')[0] : '',
        presbiterato_data: relRes.data.presbiterato_data ? relRes.data.presbiterato_data.split('T')[0] : '',
      });
      setCasasDisponiveis(casasRes.data);
      setCasasHistorico(histRes.data);
      setNacionalidades(nacRes.data.nacionalidades || []);
      setDocumentos(docRes.data);
      setItinerarioStages(itinRes.data || []);
      setNit(civRes.data?.nit || '');

      // Load new sections
      const [fRes, aRes, oRes, sRes, bRes, obsRes] = await Promise.all([
        api.get(`${API_URL}/usuarios/${id}/formacao-academica`),
        api.get(`${API_URL}/usuarios/${id}/atividade-missionaria`),
        api.get(`${API_URL}/usuarios/${id}/obras-realizadas`),
        api.get(`${API_URL}/usuarios/${id}/saude`),
        api.get(`${API_URL}/usuarios/${id}/contas-bancarias`),
        api.get(`${API_URL}/usuarios/${id}/observacoes-gerais`),
      ]);
      setFormacaoAcademica(fRes.data);
      setAtividadesMissionarias(aRes.data);
      setObrasRealizadas(oRes.data);
      setSaudeRecords(sRes.data);
      setContasBancarias(bRes.data);
      setObservacoesGerais(obsRes.data);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setEnderecoData(prev => ({ ...prev, cep }));

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEnderecoData(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade_estado: `${data.localidade} - ${data.uf}`
          }));
        }
      } catch { /* erro silencioso */ }
      finally { setCepLoading(false); }
    }
  };

  const saveCivil = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        api.post(`${API_URL}/usuarios/${id}/dados-civis`, { ...civilData, nit }),
        api.post(`${API_URL}/usuarios/${id}/nacionalidades`, { nacionalidades })
      ]);
      alert('Dados civis atualizados!');
    } catch { alert('Erro ao salvar dados civis'); }
    finally { setIsSaving(false); }
  };

  const saveReligiosos = async () => {
    setIsSaving(true);
    try {
      await api.put(`${API_URL}/usuarios/${id}/dados-religiosos`, religiososData);
      // tbm atualiza os cargos de oconomo/superior no usuario principal se tiver editado algo no dashboard
      await api.put(`${API_URL}/usuarios/${id}`, {
        nome: missionario?.nome,
        login: missionario?.login,
        is_oconomo: missionario?.is_oconomo,
        is_superior: missionario?.is_superior,
        situacao: missionario?.situacao,
        proximos_passos: missionario?.proximos_passos,
      });
      alert('Dados religiosos atualizados!');
    } catch { alert('Erro ao salvar dados religiosos'); }
    finally { setIsSaving(false); }
  };

  const saveEndereco = async () => {
    setIsSaving(true);
    try {
      await api.post(`${API_URL}/usuarios/${id}/endereco-contato`, enderecoData);
      alert('Endereço e contato atualizados!');
    } catch { alert('Erro ao salvar endereço'); }
    finally { setIsSaving(false); }
  };

  const addCasa = async () => {
    try {
      await api.post(`${API_URL}/usuarios/${id}/casas-historico`, {
        ...novaVinculacao,
        data_fim: novaVinculacao.data_fim || null,
      });
      fetchData();
      setNovaVinculacao({ casa_id: '', data_inicio: '', data_fim: '', funcao: '', is_superior: false });
    } catch { alert('Erro ao vincular casa'); }
  };

  const removeCasa = async (vinculoId: number) => {
    if (!window.confirm('Remover este vínculo?')) return;
    try {
      await api.delete(`${API_URL}/usuarios/${id}/casas-historico/${vinculoId}`);
      fetchData();
    } catch { alert('Erro ao remover vínculo'); }
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pendingDocDesc.trim()) return alert('Informe a descrição do documento');

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('descricao', pendingDocDesc);

    setIsSaving(true);
    try {
      await api.post(`${API_URL}/usuarios/${id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPendingDocDesc('');
      fetchData();
    } catch { alert('Erro ao enviar documento'); }
    finally { setIsSaving(false); }
  };

  const removeDocument = async (docId: number) => {
    if (!window.confirm('Excluir este documento permanentemente?')) return;
    try {
      await api.delete(`${API_URL}/usuarios/${id}/documentos/${docId}`);
      fetchData();
    } catch { alert('Erro ao remover documento'); }
  };

  const saveItinerary = async () => {
    setIsSavingItinerary(true);
    try {
      await api.post(`${API_URL}/usuarios/${id}/itinerario`, { stages: itinerarioStages });
      alert('Itinerário atualizado com sucesso!');
    } catch { alert('Erro ao salvar itinerário'); }
    finally { setIsSavingItinerary(false); }
  };

  const saveProximosSteps = async () => {
    if (!missionario) return;
    setIsSavingSteps(true);
    try {
      await api.put(`${API_URL}/usuarios/${id}`, {
        nome: missionario.nome,
        login: missionario.login,
        situacao: missionario.situacao,
        is_oconomo: missionario.is_oconomo,
        is_superior: missionario.is_superior,
        proximos_passos: missionario.proximos_passos
      });
      alert('Próximos passos salvos!');
    } catch { alert('Erro ao salvar próximos passos'); }
    finally { setIsSavingSteps(false); }
  };

  const handleItinDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setItinDocUploading(idx);
    const stage = itinerarioStages[idx];
    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('descricao', `Doc Etapa: ${stage.etapa}`);

    try {
      const res = await api.post(`${API_URL}/usuarios/${id}/documentos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newPath = res.data.url;
      const newStages = [...itinerarioStages];
      newStages[idx] = { ...newStages[idx], doc_path: newPath };
      setItinerarioStages(newStages);
      await api.post(`${API_URL}/usuarios/${id}/itinerario`, { stages: newStages });
    } catch {
      alert('Erro ao anexar documento');
    } finally {
      setItinDocUploading(null);
    }
  };

  const handleGenericAdd = async (endpoint: string, data: any, _refreshFunc: () => void) => {
    setIsSaving(true);
    try {
      await api.post(`${API_URL}/usuarios/${id}/${endpoint}`, data);
      setShowAddForm(null);
      setTempForm({});
      fetchData();
    } catch { alert('Erro ao salvar registro'); }
    finally { setIsSaving(false); }
  };

  const handleGenericDelete = async (endpoint: string, itemId: number) => {
    if (!window.confirm('Excluir este registro?')) return;
    try {
      await api.delete(`${API_URL}/usuarios/${id}/${endpoint}/${itemId}`);
      fetchData();
    } catch { alert('Erro ao remover registro'); }
  };

  if (isLoading) return <div className="perfil-loading"><Loader2 className="animate-spin" size={40} /><p>{t('profile.loading')}</p></div>;
  if (!missionario) return <div className="perfil-loading"><AlertCircle size={40} /><p>{t('profile.not_found')}</p></div>;

  const TABS = [
    { key: 'dados', label: 'Dados & Contato', icon: <User size={16} /> },
    { key: 'religiosos', label: 'Religioso & Itinerário', icon: <BookOpen size={16} /> },
    { key: 'carreira', label: 'Formação & Missão', icon: <Activity size={16} /> },
    { key: 'saude', label: 'Saúde & Financeiro', icon: <ShieldCheck size={16} /> },
    { key: 'casas', label: t('profile.tabs.houses'), icon: <HomeIcon size={16} /> },
    { key: 'obs', label: 'Observações', icon: <FileText size={16} /> },
  ];

  return (
    <div className="page-container">
      <div className="perfil-header">
        <button className="btn-back" onClick={() => navigate('/missionarios')}>
          <ChevronLeft size={18} /> {t('profile.back_btn')}
        </button>
        <div className="perfil-id">ID: #{missionario.id}</div>
      </div>

      <div className="perfil-top-card">
        <div className="perfil-avatar">{missionario.nome.charAt(0)}</div>
        <div className="perfil-main-info">
          <h1>{missionario.nome}</h1>
          <div className="perfil-badges">
            <span className={`situacao-tag ${missionario.situacao.toLowerCase()}`}>{missionario.situacao}</span>
            {missionario.is_oconomo && <span className="cargo-badge oconomo"><ShieldCheck size={12} /> {t('profile.oconomo_badge')}</span>}
            {missionario.is_superior && <span className="cargo-badge superior"><Star size={12} /> {t('profile.superior_badge')}</span>}
          </div>
        </div>
      </div>

      <div className="perfil-tabs">
        {TABS.map(tab => (
          <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="perfil-content">
        {/* --- DADOS PESSOAIS & CONTATO --- */}
        {activeTab === 'dados' && (
          <div className="tab-panel">
            <div className="section-card">
              <h3 className="section-title"><User size={16} /> {t('profile.sections.civil')}</h3>
              <div className="form-grid-3">
                <div className="form-group"><label>{t('missionaries.wizard.civil.birth_date')}</label><input type="date" value={civilData.data_nascimento} onChange={e => setCivilData({ ...civilData, data_nascimento: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.civil.parents')}</label><input type="text" value={civilData.filiacao} onChange={e => setCivilData({ ...civilData, filiacao: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.civil.birth_place_city')}</label><input type="text" value={civilData.cidade_estado} onChange={e => setCivilData({ ...civilData, cidade_estado: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group">
                  <label>{t('missionaries.wizard.civil.country')}</label>
                  <input type="text" list="paises" value={civilData.pais} onChange={e => setCivilData({ ...civilData, pais: e.target.value })} disabled={!canEdit} />
                  <datalist id="paises">{PAISES_COMMON.map(p => <option key={p} value={p} />)}</datalist>
                </div>
                <div className="form-group"><label>{t('missionaries.wizard.civil.birth_place_natural')}</label><input type="text" value={civilData.naturalidade} onChange={e => setCivilData({ ...civilData, naturalidade: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.civil.diocese')}</label><input type="text" value={civilData.diocese} onChange={e => setCivilData({ ...civilData, diocese: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>RNM</label><input type="text" value={civilData.rnm} onChange={e => setCivilData({ ...civilData, rnm: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>CPF</label><input type="text" value={civilData.cpf} onChange={e => setCivilData({ ...civilData, cpf: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>Título Eleitor</label><input type="text" value={civilData.titulo_eleitor} onChange={e => setCivilData({ ...civilData, titulo_eleitor: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>CNH</label><input type="text" value={civilData.cnh} onChange={e => setCivilData({ ...civilData, cnh: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>Passaporte</label><input type="text" value={civilData.passaporte} onChange={e => setCivilData({ ...civilData, passaporte: e.target.value })} disabled={!canEdit} /></div>
              </div>
              
              <div className="section-header-flex" style={{ marginTop: '20px', marginBottom: '10px' }}>
                <h4 className="wizard-divider-lite">{t('missionaries.wizard.civil.nationalities')}</h4>
                {canEdit && (
                  <button className="btn-action-lite-text" onClick={() => setNacionalidades([...nacionalidades, ''])}>
                    <Plus size={14} /> {t('missionaries.wizard.civil.add_btn')}
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {nacionalidades.map((nac, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '5px' }}>
                    <input type="text" value={nac} onChange={e => {
                      const nn = [...nacionalidades];
                      nn[idx] = e.target.value;
                      setNacionalidades(nn);
                    }} placeholder="Nacionalidade..." style={{ flex: 1 }} disabled={!canEdit} />
                    {canEdit && idx > 0 && <button onClick={() => setNacionalidades(nacionalidades.filter((_, i) => i !== idx))} className="btn-action-lite delete"><Trash2 size={16} /></button>}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="section-actions" style={{ marginTop: '20px' }}>
                  <button className="btn-save-perfil" onClick={saveCivil} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {t('profile.actions.save_civil')}
                  </button>
                </div>
              )}
            </div>

            <div className="section-card">
              <h3 className="section-title"><MapPin size={16} /> {t('profile.sections.address')} & {t('profile.sections.contact')}</h3>
              <div className="form-grid-3">
                <div className="form-group"><label>{t('missionaries.wizard.address.cep')} {cepLoading && <Loader2 size={12} className="animate-spin" />}</label><input type="text" value={enderecoData.cep} onChange={e => handleCepChange(e.target.value)} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.address.neighborhood')}</label><input type="text" value={enderecoData.bairro} onChange={e => setEnderecoData({ ...enderecoData, bairro: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group full"><label>{t('missionaries.wizard.address.street')}</label><input type="text" value={enderecoData.logradouro} onChange={e => setEnderecoData({ ...enderecoData, logradouro: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.address.complement')}</label><input type="text" value={enderecoData.complemento} onChange={e => setEnderecoData({ ...enderecoData, complemento: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.address.city_state')}</label><input type="text" value={enderecoData.cidade_estado} onChange={e => setEnderecoData({ ...enderecoData, cidade_estado: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.address.cellphone')}</label><input type="text" value={enderecoData.celular_whatsapp} onChange={e => setEnderecoData({ ...enderecoData, celular_whatsapp: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.address.phone')}</label><input type="text" value={enderecoData.telefone_fixo} onChange={e => setEnderecoData({ ...enderecoData, telefone_fixo: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.address.personal_email')}</label><input type="email" value={enderecoData.email_pessoal} onChange={e => setEnderecoData({ ...enderecoData, email_pessoal: e.target.value })} disabled={!canEdit} /></div>
              </div>
              {canEdit && (
                <div className="section-actions" style={{ marginTop: '20px' }}>
                  <button className="btn-save-perfil" onClick={saveEndereco} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {t('profile.actions.save_address')}
                  </button>
                </div>
              )}
            </div>

            <div className="section-card docs-section">
              <h3 className="section-title"><FileText size={16} /> {t('profile.sections.docs')}</h3>
              {canEdit && (
                <div className="doc-upload-box-premium">
                  <div className="form-group flex-1">
                    <label>{t('missionaries.wizard.docs.placeholder')}</label>
                    <input type="text" placeholder="Ex: Passaporte, CPF..." value={pendingDocDesc} onChange={e => setPendingDocDesc(e.target.value)} />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={uploadDocument} style={{ display: 'none' }} />
                  <button className="btn-save-perfil" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '18px' }}>
                    <Plus size={18} /> {t('profile.actions.upload_btn')}
                  </button>
                </div>
              )}
              <div className="docs-list">
                {documentos.map(doc => (
                  <div key={doc.id} className="doc-item-row">
                    <div className="doc-info">
                      <FileText size={20} className="icon" />
                      <div>
                        <span className="doc-nome">{doc.descricao}</span>
                        <span className="doc-data">{new Date(doc.data_upload).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="doc-actions">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="btn-action-lite" title="Visualizar"><Eye size={16} /></a>
                      <a href={doc.url} download className="btn-action-lite" title="Download"><Download size={16} /></a>
                      {canEdit && <button className="btn-action-lite delete" onClick={() => removeDocument(doc.id)}><Trash2 size={16} /></button>}
                    </div>
                  </div>
                ))}
                {documentos.length === 0 && <p className="empty-msg">Nenhum documento anexado.</p>}
              </div>
            </div>
          </div>
        )}

        {/* --- RELIGIOSOS & ITINERÁRIO --- */}
        {activeTab === 'religiosos' && (
          <div className="tab-panel">
            <div className="section-card">
              <h3 className="section-title"><BookOpen size={16} /> {t('profile.sections.religious')}</h3>
              <div className="form-grid-3">
                <div className="form-group"><label>{t('missionaries.wizard.religious.first_vows')}</label><input type="date" value={religiososData.primeiros_votos_data} onChange={e => setReligiososData({ ...religiososData, primeiros_votos_data: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.religious.perpetual_vows')}</label><input type="date" value={religiososData.votos_perpetuos_data} onChange={e => setReligiososData({ ...religiososData, votos_perpetuos_data: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.religious.profession_place')}</label><input type="text" value={religiososData.lugar_profissao} onChange={e => setReligiososData({ ...religiososData, lugar_profissao: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.religious.diaconate')}</label><input type="date" value={religiososData.diaconato_data} onChange={e => setReligiososData({ ...religiososData, diaconato_data: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.religious.presbiterato')}</label><input type="date" value={religiososData.presbiterato_data} onChange={e => setReligiososData({ ...religiososData, presbiterato_data: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group"><label>{t('missionaries.wizard.religious.ordaining_bishop')}</label><input type="text" value={religiososData.bispo_ordenante} onChange={e => setReligiososData({ ...religiososData, bispo_ordenante: e.target.value })} disabled={!canEdit} /></div>
                <div className="form-group">
                  <label>{t('missionaries.wizard.civil.situation')}</label>
                  <select value={missionario.situacao} onChange={e => setMissionario({ ...missionario, situacao: e.target.value })} disabled={!canEdit}>
                    <option value="ATIVO">Ativo</option>
                    <option value="FALECIDO">Falecido</option>
                    <option value="EGRESSO">Egresso</option>
                    <option value="EXCLAUSTRADO">Exclaustrado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="checkbox-label" style={{ marginTop: '20px' }}>
                    <input type="checkbox" checked={missionario.is_oconomo} onChange={e => setMissionario({ ...missionario, is_oconomo: e.target.checked })} disabled={!canEdit} />
                    {t('missionaries.wizard.religious.is_oconomo')}
                  </label>
                </div>
                <div className="form-group">
                  <label className="checkbox-label" style={{ marginTop: '20px' }}>
                    <input type="checkbox" checked={missionario.is_superior} onChange={e => setMissionario({ ...missionario, is_superior: e.target.checked })} disabled={!canEdit} />
                    {t('missionaries.wizard.religious.is_superior')}
                  </label>
                </div>
              </div>
              {canEdit && (
                <div className="section-actions" style={{ marginTop: '20px' }}>
                  <button className="btn-save-perfil" onClick={saveReligiosos} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {t('profile.actions.save_religious')}
                  </button>
                </div>
              )}
            </div>

            <div className="section-card">
              <h3 className="section-title"><Activity size={16} /> 4. Itinerário Formativo</h3>
              <div className="itinerary-full-grid">
                <div className="wizard-divider-lite" style={{ gridColumn: '1 / -1' }}>4.1 Formação Inicial</div>
                {[
                  { label: '4.1.1 Seminário Menor', etapa: '4.1.1' },
                  { label: '4.1.2 Propedêutico', etapa: '4.1.2' },
                  { label: '4.1.3 Filosofia', etapa: '4.1.3' },
                  { label: '4.1.4 Postulado', etapa: '4.1.4' },
                  { label: '4.1.5 Noviciado', etapa: '4.1.5' },
                  { label: '4.1.6 Teologia', etapa: '4.1.6' },
                  { label: '4.1.7 Tirocínio', etapa: '4.1.7' },
                ].map((seg, idx) => {
                  const stage = itinerarioStages.find(s => s.etapa === seg.etapa) || { etapa: seg.etapa, local: '', periodo: '', doc_path: '', is_sub_etapa: false };
                  return (
                    <div key={seg.etapa} className="itinerary-row-card">
                      <div className="itin-label">{seg.label}</div>
                      <div className="itin-inputs">
                        <input type="text" placeholder="Local" value={stage.local} onChange={e => {
                          const ns = [...itinerarioStages.filter(s => s.etapa !== seg.etapa), { ...stage, local: e.target.value }];
                          setItinerarioStages(ns);
                        }} disabled={!canEdit} />
                        <input type="text" placeholder="Período" value={stage.periodo} onChange={e => {
                          const ns = [...itinerarioStages.filter(s => s.etapa !== seg.etapa), { ...stage, periodo: e.target.value }];
                          setItinerarioStages(ns);
                        }} disabled={!canEdit} />
                        <div className="itin-doc-actions">
                          {stage.doc_path ? (
                            <a href={stage.doc_path} target="_blank" rel="noreferrer" className="btn-itin-doc success"><FileText size={14} /> Ver</a>
                          ) : (
                            <button className="btn-itin-doc" onClick={() => { setActiveItinIdx(idx); itinFileInputRef.current?.click(); }} disabled={!canEdit}>
                              <Plus size={14} /> Anexar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="wizard-divider-lite" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>4.2 Vida Religiosa & 4.3 Ministérios</div>
                {[
                  { label: '4.2.1 Primeira Profissão', etapa: '4.2.1' },
                  { label: '4.2.2 Renovação Votos', etapa: '4.2.2' },
                  { label: '4.2.3 Profissão Perpétua', etapa: '4.2.3' },
                  { label: '4.3.1 Leitorado', etapa: '4.3.1' },
                  { label: '4.3.2 Acolitado', etapa: '4.3.2' },
                  { label: '4.3.3 Diaconato', etapa: '4.3.3' },
                  { label: '4.3.4 Presbiterato', etapa: '4.3.4' },
                  { label: '4.4 Destinação', etapa: '4.4' },
                ].map((seg, idx) => {
                  const stage = itinerarioStages.find(s => s.etapa === seg.etapa) || { etapa: seg.etapa, local: '', periodo: '', doc_path: '', is_sub_etapa: false };
                  return (
                    <div key={seg.etapa} className="itinerary-row-card simple">
                      <div className="itin-label">{seg.label}</div>
                      <div className="itin-inputs">
                        <input type="text" placeholder="Observação/Lugar" value={stage.local} onChange={e => {
                           const ns = [...itinerarioStages.filter(s => s.etapa !== seg.etapa), { ...stage, local: e.target.value }];
                           setItinerarioStages(ns);
                        }} disabled={!canEdit} />
                        <div className="itin-doc-actions">
                          {stage.doc_path ? (
                            <a href={stage.doc_path} target="_blank" rel="noreferrer" className="btn-itin-doc success"><FileText size={14} /> Ver</a>
                          ) : (
                             <button className="btn-itin-doc" onClick={() => { setActiveItinIdx(itinerarioStages.length + idx); itinFileInputRef.current?.click(); }} disabled={!canEdit}>
                               <Plus size={14} /> Doc
                             </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {canEdit && <button className="btn-save-perfil" onClick={saveItinerary} style={{ marginTop: '20px' }}>Salvar Itinerário</button>}
            </div>

            <div className="section-card">
              <h3 className="section-title"><Activity size={16} /> Próximos Passos</h3>
              <textarea 
                className="steps-textarea"
                placeholder="Descreva os próximos passos para este missionário..."
                value={missionario.proximos_passos || ''}
                onChange={e => setMissionario({ ...missionario, proximos_passos: e.target.value })}
                disabled={!canEdit}
                rows={5}
              />
              {canEdit && <button className="btn-save-perfil" onClick={saveProximosSteps} style={{ marginTop: '10px' }}>{t('common.save')}</button>}
            </div>
          </div>
        )}

        {/* --- CARREIRA & MISSÃO --- */}
        {activeTab === 'carreira' && (
          <div className="tab-panel">
            <div className="section-card">
              <div className="section-header-flex">
                <h3 className="section-title"><GraduationCap size={16} /> 5. Formação Acadêmica</h3>
                {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('formacao')}><Plus size={14} /> Adicionar</button>}
              </div>
              <div className="generic-list">
                {formacaoAcademica.map(f => (
                  <div key={f.id} className="list-item-card-premium">
                    <div className="item-icon-container icon-formacao">
                      <GraduationCap size={20} />
                    </div>
                    <div className="item-main-content">
                      <strong>{f.curso}</strong>
                      <div className="item-subtitle">{f.faculdade} • {f.periodo}</div>
                    </div>
                    <div className="item-actions-premium">
                      {f.doc_path && <a href={f.doc_path} target="_blank" rel="noreferrer" className="btn-action-lite" title="Baixar Diploma"><Download size={14} /></a>}
                      {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('formacao-academica', f.id)} title="Excluir"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                ))}
                {formacaoAcademica.length === 0 && <p className="empty-msg">Nenhuma formação acadêmica registrada.</p>}
              </div>
            </div>

            <div className="section-card">
              <div className="section-header-flex">
                <h3 className="section-title"><MapPin size={16} /> 6. Atividade Missionária</h3>
                {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('atividade')}><Plus size={14} /> Adicionar</button>}
              </div>
              <div className="generic-list">
                {atividadesMissionarias.map(a => (
                  <div key={a.id} className="list-item-card-premium">
                    <div className="item-icon-container icon-missao">
                      <MapPin size={20} />
                    </div>
                    <div className="item-main-content">
                      <strong>{a.lugar}</strong>
                      <div className="item-subtitle">{a.periodo}</div>
                      {a.missao && <div className="item-description">{a.missao}</div>}
                    </div>
                    <div className="item-actions-premium">
                      {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('atividade-missionaria', a.id)} title="Excluir"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                ))}
                {atividadesMissionarias.length === 0 && <p className="empty-msg">Nenhuma atividade missionária registrada.</p>}
              </div>
            </div>

            <div className="section-card">
              <div className="section-header-flex">
                <h3 className="section-title"><Star size={16} /> 11. Obras Realizadas</h3>
                {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('obras')}><Plus size={14} /> Adicionar</button>}
              </div>
              <div className="generic-list">
                {obrasRealizadas.map(o => (
                  <div key={o.id} className="list-item-card-premium">
                    <div className="item-icon-container icon-obra">
                      <Star size={20} />
                    </div>
                    <div className="item-main-content">
                      <strong>{o.lugar}</strong>
                      <div className="item-subtitle">{o.periodo}</div>
                      {o.obra && <div className="item-description">{o.obra}</div>}
                    </div>
                    <div className="item-actions-premium">
                      {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('obras-realizadas', o.id)} title="Excluir"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                ))}
                {obrasRealizadas.length === 0 && <p className="empty-msg">Nenhuma obra registrada.</p>}
              </div>
            </div>
          </div>
        )}

        {/* --- SAÚDE & FINANCEIRO --- */}
        {activeTab === 'saude' && (
          <div className="tab-panel">
            <div className="section-card">
              <div className="section-header-flex">
                <h3 className="section-title"><Activity size={16} /> 7. Saúde</h3>
                {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('saude')}><Plus size={14} /> Adicionar Registro</button>}
              </div>
              <div className="generic-list">
                {saudeRecords.map(s => (
                  <div key={s.id} className="list-item-card-premium">
                    <div className="item-icon-container icon-saude">
                      <Activity size={20} />
                    </div>
                    <div className="item-main-content">
                      <strong>{s.seguradora || 'Seguradora não informada'}</strong>
                      <div className="item-subtitle">CNS: {s.sus_card || 'N/A'} • Carteira: {s.numero_carteira || 'N/A'}</div>
                    </div>
                    <div className="item-actions-premium">
                      {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('saude', s.id)} title="Excluir"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                ))}
                {saudeRecords.length === 0 && <p className="empty-msg">Nenhum registro de saúde cadastrado.</p>}
              </div>
            </div>

            <div className="section-card">
              <h3 className="section-title"><ShieldCheck size={16} /> 8. Previdenciário / IR</h3>
              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label>NIT (Número de Identificação do Trabalhador)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={nit} onChange={e => setNit(e.target.value)} disabled={!canEdit} placeholder="Digite o NIT..." />
                  {canEdit && <button className="btn-save-perfil" onClick={saveCivil} style={{ padding: '0 15px' }} title="Salvar NIT"><Save size={16} /></button>}
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header-flex">
                <h3 className="section-title"><DollarSign size={16} /> 9. Contas Bancárias</h3>
                {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('banco')}><Plus size={14} /> Adicionar</button>}
              </div>
              <div className="generic-list">
                {contasBancarias.map(b => (
                  <div key={b.id} className="list-item-card-premium">
                    <div className="item-icon-container icon-banco">
                      <DollarSign size={20} />
                    </div>
                    <div className="item-main-content">
                      <strong>{b.tipo_conta} • {b.titularidade}</strong>
                      <div className="item-subtitle">Ag: {b.agencia} • Conta: {b.numero}</div>
                    </div>
                    <div className="item-actions-premium">
                      {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('contas-bancarias', b.id)} title="Excluir"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                ))}
                {contasBancarias.length === 0 && <p className="empty-msg">Nenhuma conta bancária registrada.</p>}
              </div>
            </div>
          </div>
        )}

        {/* --- CASAS --- */}
        {activeTab === 'casas' && (
          <div className="tab-panel">
            {canEdit && (
              <div className="section-card">
                <h3 className="section-title"><Plus size={16} /> {t('profile.sections.bind_house')}</h3>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>{t('missionaries.wizard.houses.select_house')}</label>
                    <select value={novaVinculacao.casa_id} onChange={e => setNovaVinculacao(p => ({ ...p, casa_id: e.target.value }))}>
                      <option value="">Selecione...</option>
                      {casasDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>{t('missionaries.wizard.houses.start_date')}</label><input type="date" value={novaVinculacao.data_inicio} onChange={e => setNovaVinculacao(p => ({ ...p, data_inicio: e.target.value }))} /></div>
                  <div className="form-group"><label>Data de Saída (opcional)</label><input type="date" value={novaVinculacao.data_fim} onChange={e => setNovaVinculacao(p => ({ ...p, data_fim: e.target.value }))} /></div>
                  <div className="form-group">
                    <label className="checkbox-label" style={{ marginTop: '20px' }}>
                      <input type="checkbox" checked={novaVinculacao.is_superior} onChange={e => setNovaVinculacao(p => ({ ...p, is_superior: e.target.checked }))} />
                      {t('missionaries.wizard.houses.is_superior')}
                    </label>
                  </div>
                </div>
                <button className="btn-save-perfil" onClick={addCasa}><Plus size={16} /> {t('profile.actions.bind_btn')}</button>
              </div>
            )}
            <div className="section-card">
              <h3 className="section-title"><HomeIcon size={16} /> {t('profile.sections.history_house')}</h3>
              <div className="casas-list">
                {casasHistorico.map(c => (
                  <div key={c.id} className={`casa-item ${!c.data_fim ? 'casa-ativa' : ''}`}>
                    <div className="casa-info">
                      <span className="casa-nome">{c.casa_nome}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                        {c.is_superior && <span className="superior-badge"><Star size={11} /> Superior</span>}
                        <span className="duracao-pill" style={{ background: '#f0f4f8', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>⏱ {calcDuracao(c.data_inicio, c.data_fim)}</span>
                      </div>
                      <span className="casa-periodo" style={{ marginTop: '4px', display: 'block', fontSize: '12px', color: '#666' }}>
                        {c.data_inicio ? new Date(c.data_inicio).toLocaleDateString('pt-BR') : '?'} → {c.data_fim ? new Date(c.data_fim).toLocaleDateString('pt-BR') : 'Atual'}
                      </span>
                    </div>
                    {canEdit && <button className="btn-action-lite delete" onClick={() => removeCasa(c.id)}><Trash2 size={16} /></button>}
                  </div>
                ))}
                {casasHistorico.length === 0 && <p className="empty-msg">Nenhuma casa vinculada.</p>}
              </div>
            </div>
          </div>
        )}

        {/* --- OBSERVATIONS --- */}
        {activeTab === 'obs' && (
          <div className="tab-panel">
            <div className="section-card">
              <div className="section-header-flex">
                <h3 className="section-title"><FileText size={16} /> 12. Observações Gerais</h3>
                {canEdit && <button className="btn-save-perfil" onClick={() => setShowAddForm('obs')}><Plus size={16} /> Nova Obs</button>}
              </div>
              <div className="obs-list" style={{ marginTop: '20px' }}>
                {observacoesGerais.map(o => (
                  <div key={o.id} className="obs-entry-card">
                    <div className="obs-date">{new Date(o.created_at).toLocaleString()}</div>
                    <div className="obs-text">{o.texto}</div>
                    {canEdit && (
                      <div className="obs-actions">
                         <button className="btn-action-lite delete" onClick={() => handleGenericDelete('observacoes-gerais', o.id)}><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <input type="file" ref={itinFileInputRef} className="hidden" onChange={(e) => activeItinIdx !== null && handleItinDocUpload(e, activeItinIdx)} />

        {/* --- MODAL --- */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Adicionar {showAddForm === 'formacao' ? 'Formação' : showAddForm === 'atividade' ? 'Atividade' : showAddForm === 'obras' ? 'Obra' : showAddForm === 'saude' ? 'Registro de Saúde' : showAddForm === 'banco' ? 'Conta Bancária' : 'Observação'}</h3>
              <div className="form-grid-1" style={{ gap: '15px' }}>
                {showAddForm === 'formacao' && (
                  <>
                    <div className="form-group"><label>Curso</label><input type="text" onChange={e => setTempForm({ ...tempForm, curso: e.target.value })} /></div>
                    <div className="form-group"><label>Instituição</label><input type="text" onChange={e => setTempForm({ ...tempForm, faculdade: e.target.value })} /></div>
                    <div className="form-group"><label>Período</label><input type="text" placeholder="Ex: 2018-2022" onChange={e => setTempForm({ ...tempForm, periodo: e.target.value })} /></div>
                  </>
                )}
                {showAddForm === 'atividade' && (
                  <>
                    <div className="form-group"><label>Lugar</label><input type="text" onChange={e => setTempForm({ ...tempForm, lugar: e.target.value })} /></div>
                    <div className="form-group"><label>Período</label><input type="text" onChange={e => setTempForm({ ...tempForm, periodo: e.target.value })} /></div>
                    <div className="form-group"><label>Descrição da Missão</label><textarea rows={3} onChange={e => setTempForm({ ...tempForm, missao: e.target.value })} /></div>
                  </>
                )}
                {showAddForm === 'obras' && (
                  <>
                    <div className="form-group"><label>Lugar</label><input type="text" onChange={e => setTempForm({ ...tempForm, lugar: e.target.value })} /></div>
                    <div className="form-group"><label>Período</label><input type="text" onChange={e => setTempForm({ ...tempForm, periodo: e.target.value })} /></div>
                    <div className="form-group"><label>Obra Realizada</label><textarea rows={3} onChange={e => setTempForm({ ...tempForm, obra: e.target.value })} /></div>
                  </>
                )}
                {showAddForm === 'saude' && (
                  <>
                    <div className="form-group"><label>CNS (Cartão SUS)</label><input type="text" onChange={e => setTempForm({ ...tempForm, sus_card: e.target.value })} /></div>
                    <div className="form-group"><label>Seguradora</label><input type="text" onChange={e => setTempForm({ ...tempForm, seguradora: e.target.value })} /></div>
                    <div className="form-group"><label>Nº Carteira</label><input type="text" onChange={e => setTempForm({ ...tempForm, numero_carteira: e.target.value })} /></div>
                  </>
                )}
                {showAddForm === 'banco' && (
                  <>
                    <div className="form-group"><label>Tipo de Conta</label><input type="text" placeholder="Ex: Corrente, Poupança" onChange={e => setTempForm({ ...tempForm, tipo_conta: e.target.value })} /></div>
                    <div className="form-group"><label>Titularidade</label><input type="text" onChange={e => setTempForm({ ...tempForm, titularidade: e.target.value })} /></div>
                    <div className="form-group"><label>Agência</label><input type="text" onChange={e => setTempForm({ ...tempForm, agencia: e.target.value })} /></div>
                    <div className="form-group"><label>Número Conta</label><input type="text" onChange={e => setTempForm({ ...tempForm, numero: e.target.value })} /></div>
                  </>
                )}
                {showAddForm === 'obs' && (
                  <div className="form-group"><label>Texto da Observação</label><textarea rows={6} onChange={e => setTempForm({ ...tempForm, texto: e.target.value })} /></div>
                )}
              </div>
              <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn-back" onClick={() => setShowAddForm(null)}>Cancelar</button>
                <button className="btn-save-perfil" onClick={() => {
                  const endpoint = showAddForm === 'formacao' ? 'formacao-academica' :
                                   showAddForm === 'atividade' ? 'atividade-missionaria' :
                                   showAddForm === 'obras' ? 'obras-realizadas' :
                                   showAddForm === 'saude' ? 'saude' :
                                   showAddForm === 'banco' ? 'contas-bancarias' :
                                   showAddForm === 'obs' ? 'observacoes-gerais' : '';
                  handleGenericAdd(endpoint, tempForm, fetchData);
                }}>Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilMissionario;
