import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Users, Eye, X, Save, Loader2, AlertCircle, EyeOff,
  ChevronRight, ChevronLeft, User, MapPin, BookOpen, Lock, CheckCircle,
  Home as HomeIcon, Plus, Trash2, FileText, Image as ImageIcon, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/Perfis.css';
import '../styles/Missionarios.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Missionario {
  id: number;
  nome: string;
  login: string;
  role: 'PADRE';
  status: 'ATIVO' | 'INATIVO';
  situacao: 'ATIVO' | 'FALECIDO' | 'EGRESSO' | 'EXCLAUSTRADO';
  is_oconomo: boolean;
  is_superior: boolean;
}

interface Casa { id: number; nome: string; }

interface DocEntry {
  uid: string;         // temp local id
  descricao: string;
  file: File | null;
  previewUrl: string;
  tipo: string;        // 'pdf' | 'jpg' | 'png'
}

interface CasaVinculo {
  casa_id: string;
  data_inicio: string;
  is_superior: boolean;
}

interface WizardData {
  // Step 1 - Dados Civis
  nome: string;
  data_nascimento: string;
  filiacao: string;
  naturalidade: string;
  pais: string;
  cidade_estado: string;
  diocese: string;
  situacao: 'ATIVO' | 'FALECIDO' | 'EGRESSO' | 'EXCLAUSTRADO';
  // Step 2 - Endereços
  logradouro: string;
  complemento: string;
  bairro: string;
  cep: string;
  endereco_cidade_estado: string;
  celular_whatsapp: string;
  telefone_fixo: string;
  email_pessoal: string;
  // Step 3 - Dados Religiosos
  primeiros_votos_data: string;
  votos_perpetuos_data: string;
  lugar_profissao: string;
  diaconato_data: string;
  presbiterato_data: string;
  bispo_ordenante: string;
  is_oconomo: boolean;
  is_superior: boolean;
  // Step 5 - Acesso
  login: string;
  password: string;
  status: 'ATIVO' | 'INATIVO';
  // Additional Step 1
  nacionalidades: string[];
}

const STEPS = [
  { label: 'Dados Civis', icon: <User size={15} /> },
  { label: 'Endereço', icon: <MapPin size={15} /> },
  { label: 'Dados Religiosos', icon: <BookOpen size={15} /> },
  { label: 'Casas', icon: <HomeIcon size={15} /> },
  { label: 'Acesso Login', icon: <Lock size={15} /> },
];

const initialWizard: WizardData = {
  nome: '', data_nascimento: '', filiacao: '', naturalidade: '', pais: 'Brasil',
  cidade_estado: '', diocese: '', situacao: 'ATIVO',
  logradouro: '', complemento: '', bairro: '', cep: '', endereco_cidade_estado: '',
  celular_whatsapp: '', telefone_fixo: '', email_pessoal: '',
  primeiros_votos_data: '', votos_perpetuos_data: '', lugar_profissao: '',
  diaconato_data: '', presbiterato_data: '', bispo_ordenante: '', 
  is_oconomo: false, is_superior: false,
  login: '', password: '', status: 'ATIVO',
  nacionalidades: ['Brasileira'],
};

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDuracao(dataInicio: string): string {
  if (!dataInicio) return '';
  const ini = new Date(dataInicio);
  const hoje = new Date();
  let anos = hoje.getFullYear() - ini.getFullYear();
  let meses = hoje.getMonth() - ini.getMonth();
  if (meses < 0) { anos--; meses += 12; }
  const parts = [];
  if (anos > 0) parts.push(`${anos} ano${anos > 1 ? 's' : ''}`);
  if (meses > 0) parts.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`);
  return parts.length ? parts.join(' e ') : 'menos de 1 mês';
}

// ─── Component ───────────────────────────────────────────────────────────────

const Missionarios: React.FC = () => {
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [missionarios, setMissionarios] = useState<Missionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizard);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 — dynamic docs (local, uploaded after user created)
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocDescricao, setPendingDocDescricao] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  // Step 4 — casas
  const [casasDisponiveis, setCasasDisponiveis] = useState<Casa[]>([]);
  const [casasVinculos, setCasasVinculos] = useState<CasaVinculo[]>([]);
  const [novaCasa, setNovaCasa] = useState<CasaVinculo>({ casa_id: '', data_inicio: new Date().toISOString().split('T')[0], is_superior: false });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';

  useEffect(() => { fetchMissionarios(); }, []);

  const fetchMissionarios = async () => {
    setIsLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.post(`${API_URL}/usuarios/get`),
        api.post(`${API_URL}/casas-religiosas/get`),
      ]);
      setMissionarios(mRes.data.filter((u: any) => u.role === 'PADRE'));
      setCasasDisponiveis(cRes.data);
      setError(null);
    } catch { setError('Erro ao carregar missionários'); }
    finally { setIsLoading(false); }
  };

  const openWizard = () => {
    setWizardData(initialWizard);
    setDocs([]);
    setCasasVinculos([]);
    setNovaCasa({ casa_id: '', data_inicio: new Date().toISOString().split('T')[0], is_superior: false });
    setPendingDocDescricao('');
    setWizardStep(0);
    setIsWizardOpen(true);
  };

  const set = (field: keyof WizardData, val: any) => {
    setWizardData(prev => ({ ...prev, [field]: val }));
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    set('cep', cep);

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setWizardData(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            endereco_cidade_estado: `${data.localidade} - ${data.uf}`
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setCepLoading(false);
      }
    }
  };

  // ── Document handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pendingDocDescricao.trim()) {
      alert('Escreva a descrição do documento antes de selecionar o arquivo.');
      e.target.value = '';
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const previewUrl = ['jpg', 'jpeg', 'png'].includes(ext) ? URL.createObjectURL(file) : '';
    const entry: DocEntry = {
      uid: `${Date.now()}`,
      descricao: pendingDocDescricao.trim(),
      file,
      previewUrl,
      tipo: ext,
    };
    setDocs(prev => [...prev, entry]);
    setPendingDocDescricao('');
    e.target.value = '';
  };

  const removeDoc = (uid: string) => {
    setDocs(prev => prev.filter(d => d.uid !== uid));
  };

  // ── Casa handlers ──
  const addCasaVinculo = () => {
    if (!novaCasa.casa_id) { alert('Selecione uma casa'); return; }
    if (!novaCasa.data_inicio) { alert('Informe a data de início'); return; }
    // Check max 5 years
    const ini = new Date(novaCasa.data_inicio);
    const maxDate = new Date(ini);
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    setCasasVinculos(prev => [...prev, { ...novaCasa }]);
    setNovaCasa({ casa_id: '', data_inicio: new Date().toISOString().split('T')[0], is_superior: false });
  };

  const removeCasaVinculo = (idx: number) =>
    setCasasVinculos(prev => prev.filter((_, i) => i !== idx));

  // ── Finish ──
  const handleFinish = async () => {
    if (!wizardData.login || !wizardData.password) {
      alert('Informe o e-mail de login e a senha.');
      return;
    }
    setSaveLoading(true);
    try {
      // 1 — Create user
      const userRes = await api.post(`${API_URL}/usuarios`, {
        nome: wizardData.nome, login: wizardData.login, password: wizardData.password,
        role: 'PADRE', status: wizardData.status, situacao: wizardData.situacao,
        is_oconomo: wizardData.is_oconomo, is_superior: wizardData.is_superior,
      });
      const newId = userRes.data.id;

      // 2 — Civil data
      await api.post(`${API_URL}/usuarios/${newId}/dados-civis`, {
        data_nascimento: wizardData.data_nascimento || null, filiacao: wizardData.filiacao,
        cidade_estado: wizardData.cidade_estado, diocese: wizardData.diocese,
        pais: wizardData.pais, naturalidade: wizardData.naturalidade,
        rnm: '', cpf: '', titulo_eleitor: '', cnh: '', passaporte: '',
      });

      // 3 — Address
      await api.post(`${API_URL}/usuarios/${newId}/endereco-contato`, {
        logradouro: wizardData.logradouro, complemento: wizardData.complemento,
        bairro: wizardData.bairro, cep: wizardData.cep,
        cidade_estado: wizardData.endereco_cidade_estado,
        celular_whatsapp: wizardData.celular_whatsapp, telefone_fixo: wizardData.telefone_fixo,
        email_pessoal: wizardData.email_pessoal,
      });

      // 4 — Religious data
      await api.post(`${API_URL}/usuarios/${newId}/dados-religiosos`, {
        primeiros_votos_data: wizardData.primeiros_votos_data || null,
        votos_perpetuos_data: wizardData.votos_perpetuos_data || null,
        lugar_profissao: wizardData.lugar_profissao,
        diaconato_data: wizardData.diaconato_data || null,
        presbiterato_data: wizardData.presbiterato_data || null,
        bispo_ordenante: wizardData.bispo_ordenante,
      });

      // 5 — Casa vinculos
      for (const v of casasVinculos) {
        await api.post(`${API_URL}/usuarios/${newId}/casas-historico`, {
          casa_id: v.casa_id, data_inicio: v.data_inicio, data_fim: null,
          funcao: v.is_superior ? 'Superior Local' : '',
          is_superior: v.is_superior,
        });
      }

      // 6 — Nacionalidades
      await api.post(`${API_URL}/usuarios/${newId}/nacionalidades`, {
        nacionalidades: wizardData.nacionalidades
      });

      // 7 — Documentos (uploaded after user creation)
      for (const doc of docs) {
        if (!doc.file) continue;
        const fd = new FormData();
        fd.append('arquivo', doc.file);
        fd.append('descricao', doc.descricao);
        await api.post(`${API_URL}/usuarios/${newId}/documentos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await fetchMissionarios();
      setIsWizardOpen(false);
      alert(`Missionário ${wizardData.nome} cadastrado com sucesso!`);
    } catch (err: any) {
      alert('Erro ao cadastrar missionário: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const filtered = missionarios.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSituacao = situacaoFilter ? m.situacao === situacaoFilter : true;
    return matchesSearch && matchesSituacao;
  });

  // ▸ Get casa name
  const casaNome = (id: string) => casasDisponiveis.find(c => String(c.id) === id)?.nome || id;

  return (
    <div className="module-container">
      <div className="page-header">
        <div className="title-with-badge"><Users size={24} /><h2>Cadastro de Missionários</h2></div>
        {canEdit && <button className="btn-new" onClick={openWizard}>+ Novo Missionário</button>}
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>BUSCAR POR NOME</label>
          <div className="search-input">
            <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>SITUAÇÃO</label>
          <select value={situacaoFilter} onChange={e => setSituacaoFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="FALECIDO">Falecido</option>
            <option value="EGRESSO">Egresso</option>
            <option value="EXCLAUSTRADO">Exclaustrado</option>
          </select>
        </div>
        <button className="btn-filter"><Filter size={18} /> Filtrar</button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>Carregando missionários...</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button onClick={fetchMissionarios} className="btn-retry">Tentar novamente</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nome</th><th>Login</th>
                <th className="center">Ecônomo</th>
                <th className="center">Superior</th>
                <th className="center">Status</th>
                <th className="center">Situação</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
                  <td className="bold">{m.nome}</td>
                  <td>{m.login}</td>
                  <td className="center"><span className={`status-tag ${m.is_oconomo ? 'ativo' : 'inativo'}`}>{m.is_oconomo ? 'Sim' : 'Não'}</span></td>
                  <td className="center"><span className={`status-tag ${m.is_superior ? 'ativo' : 'inativo'}`}>{m.is_superior ? 'Sim' : 'Não'}</span></td>
                  <td className="center"><span className={`status-tag ${m.status.toLowerCase()}`}>{m.status}</span></td>
                  <td className="center"><span className={`situacao-tag ${m.situacao.toLowerCase()}`}>{m.situacao}</span></td>
                  <td className="center">
                    <button className="btn-icon-view" title="Ver Detalhes" onClick={() => navigate(`/missionarios/${m.id}`)}>
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>Nenhum missionário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════ WIZARD MODAL ═══════════════ */}
      {isWizardOpen && (
        <div className="modal-overlay">
          <div className="modal-content wizard-modal">
            <div className="modal-header">
              <h3>Novo Missionário</h3>
              <button className="close-btn" onClick={() => setIsWizardOpen(false)}><X size={20} /></button>
            </div>

            {/* Step bar */}
            <div className="wizard-steps">
              {STEPS.map((step, i) => (
                <div key={i} className={`wizard-step-indicator ${i === wizardStep ? 'active' : ''} ${i < wizardStep ? 'done' : ''}`}>
                  <div className="step-circle">
                    {i < wizardStep ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="step-label">{step.icon}{step.label}</span>
                  {i < STEPS.length - 1 && <div className="step-line" />}
                </div>
              ))}
            </div>

            {/* ── body ── */}
            <div className="wizard-body">

              {/* ══ STEP 1 — Dados Civis ══ */}
              {wizardStep === 0 && (
                <div className="wizard-step-content">
                  <div className="form-group full">
                    <label>Nome Completo *</label>
                    <input type="text" value={wizardData.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo..." />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Data de Nascimento</label>
                      <input type="date" value={wizardData.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Situação</label>
                      <select value={wizardData.situacao} onChange={e => set('situacao', e.target.value)}>
                        <option value="ATIVO">Ativo</option>
                        <option value="FALECIDO">Falecido</option>
                        <option value="EGRESSO">Egresso</option>
                        <option value="EXCLAUSTRADO">Exclaustrado</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Filiação (Pais)</label>
                      <input type="text" value={wizardData.filiacao} onChange={e => set('filiacao', e.target.value)} placeholder="Nome dos pais..." />
                    </div>
                    <div className="form-group">
                      <label>Naturalidade</label>
                      <input type="text" value={wizardData.naturalidade} onChange={e => set('naturalidade', e.target.value)} placeholder="Naturalidade..." />
                    </div>
                    <div className="form-group">
                      <label>Cidade / Estado (Nasc.)</label>
                      <input type="text" value={wizardData.cidade_estado} onChange={e => set('cidade_estado', e.target.value)} placeholder="Cidade - UF" />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>País</label>
                      <input
                        type="text"
                        list="paises-list"
                        value={wizardData.pais}
                        onChange={e => set('pais', e.target.value)}
                        placeholder="Selecione ou digite..."
                      />
                      <datalist id="paises-list">
                        {PAISES_COMMON.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>
                    <div className="form-group">
                      <label>Diocese</label>
                      <input type="text" value={wizardData.diocese} onChange={e => set('diocese', e.target.value)} />
                    </div>
                  </div>

                  <div className="wizard-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Nacionalidades
                    <button
                      className="btn-add-doc"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                      onClick={() => set('nacionalidades', [...wizardData.nacionalidades, ''])}
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {wizardData.nacionalidades.map((nac, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '5px' }}>
                        <input
                          type="text"
                          value={nac}
                          onChange={e => {
                            const newNacs = [...wizardData.nacionalidades];
                            newNacs[idx] = e.target.value;
                            set('nacionalidades', newNacs);
                          }}
                          placeholder="Nacionalidade..."
                          style={{ flex: 1 }}
                        />
                        {idx > 0 && (
                          <button
                            onClick={() => set('nacionalidades', wizardData.nacionalidades.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Dynamic Document Upload ── */}
                  <div className="wizard-divider">Documentos</div>
                  <p className="wizard-hint" style={{ marginBottom: 0 }}>
                    Escreva o nome do documento (ex: RG, CPF, Passaporte) e clique em <strong>Adicionar Arquivo</strong>.
                  </p>

                  <div className="doc-add-row">
                    <input
                      type="text"
                      className="doc-desc-input"
                      placeholder="Descrição do documento (ex: RG, CNH, Passaporte)..."
                      value={pendingDocDescricao}
                      onChange={e => setPendingDocDescricao(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                    />
                    <button
                      className="btn-add-doc"
                      onClick={() => fileInputRef.current?.click()}
                      title="Selecionar arquivo (PDF, JPG, PNG)"
                    >
                      <Plus size={16} /> Adicionar Arquivo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Doc previews */}
                  {docs.length > 0 && (
                    <div className="docs-grid">
                      {docs.map(doc => (
                        <div key={doc.uid} className="doc-card">
                          <button className="doc-remove" onClick={() => removeDoc(doc.uid)}>
                            <X size={12} />
                          </button>
                          <div className="doc-thumb">
                            {doc.previewUrl
                              ? <img src={doc.previewUrl} alt={doc.descricao} />
                              : doc.tipo === 'pdf'
                                ? <FileText size={32} className="doc-icon-pdf" />
                                : <ImageIcon size={32} className="doc-icon-img" />
                            }
                          </div>
                          <div className="doc-info">
                            <span className="doc-desc">{doc.descricao}</span>
                            <span className="doc-filename">{doc.file?.name}</span>
                            <span className={`doc-type doc-type-${doc.tipo}`}>{doc.tipo.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ STEP 2 — Endereço ══ */}
              {wizardStep === 1 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">Endereço</div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>CEP {cepLoading && <Loader2 size={12} className="animate-spin" style={{ marginLeft: 4 }} />}</label>
                      <input
                        type="text"
                        value={wizardData.cep}
                        onChange={e => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Bairro</label>
                      <input type="text" value={wizardData.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro..." />
                    </div>
                  </div>

                  <div className="form-group full">
                    <label>Logradouro</label>
                    <input type="text" value={wizardData.logradouro} onChange={e => set('logradouro', e.target.value)} placeholder="Rua, Av., número..." />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group"><label>Complemento</label><input type="text" value={wizardData.complemento} onChange={e => set('complemento', e.target.value)} /></div>
                    <div className="form-group"><label>Cidade / Estado</label><input type="text" value={wizardData.endereco_cidade_estado} onChange={e => set('endereco_cidade_estado', e.target.value)} placeholder="Cidade - UF" /></div>
                  </div>

                  <div className="wizard-divider">Contato</div>
                  <div className="form-row-3">
                    <div className="form-group"><label>Celular / WhatsApp</label><input type="text" value={wizardData.celular_whatsapp} onChange={e => set('celular_whatsapp', e.target.value)} placeholder="(00) 90000-0000" /></div>
                    <div className="form-group"><label>Telefone Fixo</label><input type="text" value={wizardData.telefone_fixo} onChange={e => set('telefone_fixo', e.target.value)} /></div>
                    <div className="form-group"><label>E-mail Pessoal</label><input type="email" value={wizardData.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} /></div>
                  </div>
                </div>
              )}

              {/* ══ STEP 3 — Dados Religiosos ══ */}
              {wizardStep === 2 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">Consagração e Votos</div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Data Primeiros Votos</label><input type="date" value={wizardData.primeiros_votos_data} onChange={e => set('primeiros_votos_data', e.target.value)} /></div>
                    <div className="form-group"><label>Data Votos Perpétuos</label><input type="date" value={wizardData.votos_perpetuos_data} onChange={e => set('votos_perpetuos_data', e.target.value)} /></div>
                  </div>
                  <div className="form-group full"><label>Lugar de Profissão</label><input type="text" value={wizardData.lugar_profissao} onChange={e => set('lugar_profissao', e.target.value)} /></div>
                  <div className="wizard-divider">Ordenação</div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Data do Diaconato</label><input type="date" value={wizardData.diaconato_data} onChange={e => set('diaconato_data', e.target.value)} /></div>
                    <div className="form-group"><label>Data do Presbiterato</label><input type="date" value={wizardData.presbiterato_data} onChange={e => set('presbiterato_data', e.target.value)} /></div>
                  </div>
                  <div className="form-group full"><label>Bispo Ordenante</label><input type="text" value={wizardData.bispo_ordenante} onChange={e => set('bispo_ordenante', e.target.value)} /></div>
                  <div className="form-group full">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={wizardData.is_oconomo} onChange={e => set('is_oconomo', e.target.checked)} />
                      É Ecônomo — acessa relatórios financeiros e marca apontamentos
                    </label>
                  </div>
                  <div className="form-group full">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={wizardData.is_superior} onChange={e => set('is_superior', e.target.checked)} />
                      É Superior Local — cargo de liderança na casa religiosa
                    </label>
                  </div>
                </div>
              )}

              {/* ══ STEP 4 — Casas Religiosas ══ */}
              {wizardStep === 3 && (
                <div className="wizard-step-content">
                  <p className="wizard-hint">
                    Vincule o missionário às casas religiosas em que vai atuar. O tempo de permanência é registrado automaticamente a partir da data de entrada. O máximo por casa é 5 anos.
                  </p>

                  {/* Add casa form */}
                  <div className="casa-wizard-add">
                    <div className="casa-wizard-add-fields">
                      <div className="form-group">
                        <label>Casa Religiosa</label>
                        <select value={novaCasa.casa_id} onChange={e => setNovaCasa(p => ({ ...p, casa_id: e.target.value }))}>
                          <option value="">Selecione...</option>
                          {casasDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Data de Início</label>
                        <input type="date" value={novaCasa.data_inicio} onChange={e => setNovaCasa(p => ({ ...p, data_inicio: e.target.value }))} />
                      </div>
                    </div>
                    <label className="checkbox-label" style={{ marginTop: '6px' }}>
                      <input type="checkbox" checked={novaCasa.is_superior} onChange={e => setNovaCasa(p => ({ ...p, is_superior: e.target.checked }))} />
                      <Star size={14} /> Superior Local
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                      <button className="btn-add-casa-wz" onClick={addCasaVinculo}>
                        <Plus size={15} /> Vincular Casa
                      </button>
                    </div>
                  </div>

                  {/* Added houses list */}
                  {casasVinculos.length === 0 ? (
                    <div className="casa-empty">Nenhuma casa vinculada ainda. Isso pode ser feito depois também.</div>
                  ) : (
                    <div className="casas-wz-list">
                      {casasVinculos.map((v, i) => (
                        <div key={i} className="casa-wz-item">
                          <div className="casa-wz-left">
                            <HomeIcon size={18} className="casa-icon" />
                            <div>
                              <span className="casa-wz-nome">{casaNome(v.casa_id)}</span>
                              <div className="casa-wz-meta">
                                <span>desde {new Date(v.data_inicio).toLocaleDateString('pt-BR')}</span>
                                <span className="duracao-pill">⏱ {calcDuracao(v.data_inicio)}</span>
                                {v.is_superior && <span className="superior-pill"><Star size={11} /> Superior</span>}
                              </div>
                            </div>
                          </div>
                          <button className="btn-remove-wz" onClick={() => removeCasaVinculo(i)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="casa-wz-info">
                    <AlertCircle size={14} />
                    O tempo de permanência máximo numa casa é de <strong>5 anos</strong>.
                    Casas podem ser alteradas a qualquer momento no perfil do missionário.
                  </div>
                </div>
              )}

              {/* ══ STEP 5 — Acesso Login ══ */}
              {wizardStep === 4 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">Credenciais de Acesso</div>
                  <p className="wizard-hint">
                    O missionário terá acesso limitado ao sistema. Defina o e-mail e a senha iniciais.
                  </p>
                  <div className="form-group full">
                    <label>E-mail de Login *</label>
                    <input type="email" value={wizardData.login} onChange={e => set('login', e.target.value)} placeholder="padre@email.com" />
                  </div>
                  <div className="form-group full">
                    <label>Senha *</label>
                    <div className="password-group">
                      <input type={showPassword ? 'text' : 'password'} value={wizardData.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres..." />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group full">
                    <label>Status da Conta</label>
                    <select value={wizardData.status} onChange={e => set('status', e.target.value as 'ATIVO' | 'INATIVO')}>
                      <option value="ATIVO">Ativo — pode acessar o sistema</option>
                      <option value="INATIVO">Inativo — acesso bloqueado</option>
                    </select>
                  </div>

                  {/* Summary */}
                  <div className="wizard-summary">
                    <h4>Resumo do cadastro</h4>
                    <div className="summary-row"><span>Nome</span><strong>{wizardData.nome || '—'}</strong></div>
                    <div className="summary-row"><span>Login</span><strong>{wizardData.login || '—'}</strong></div>
                    <div className="summary-row"><span>Situação</span><strong>{wizardData.situacao}</strong></div>
                    <div className="summary-row"><span>Ecônomo</span><strong>{wizardData.is_oconomo ? 'Sim' : 'Não'}</strong></div>
                    <div className="summary-row"><span>Superior Local</span><strong>{wizardData.is_superior ? 'Sim' : 'Não'}</strong></div>
                    <div className="summary-row"><span>Casas vinculadas</span><strong>{casasVinculos.length}</strong></div>
                    <div className="summary-row"><span>Documentos</span><strong>{docs.length} arquivo{docs.length !== 1 ? 's' : ''}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="wizard-footer">
              <button className="btn-cancel" onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : setIsWizardOpen(false)}>
                {wizardStep > 0 ? <><ChevronLeft size={16} /> Voltar</> : 'Cancelar'}
              </button>

              <div className="step-dots">
                {STEPS.map((_, i) => <span key={i} className={`dot ${i === wizardStep ? 'active' : ''} ${i < wizardStep ? 'done' : ''}`} />)}
              </div>

              {wizardStep < STEPS.length - 1 ? (
                <button className="btn-save" onClick={() => {
                  if (wizardStep === 0 && !wizardData.nome.trim()) { alert('Informe o nome.'); return; }
                  setWizardStep(s => s + 1);
                }}>
                  Próximo <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn-save" onClick={handleFinish} disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Cadastrar Missionário
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Missionarios;
