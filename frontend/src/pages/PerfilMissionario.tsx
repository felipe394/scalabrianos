import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, MapPin, BookOpen, FileText, Home as HomeIcon,
  DollarSign, Save, Loader2, Plus, Trash2, AlertCircle, CheckCircle,
  Clock, Star, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/PerfilMissionario.css';
import '../styles/Missionarios.css'; // Reuse wizard styles for doc cards

interface CivilData {
  data_nascimento: string; filiacao: string; cidade_estado: string;
  diocese: string; pais: string; naturalidade: string; rnm: string;
  cpf: string; titulo_eleitor: string; cnh: string; passaporte: string;
}
interface EnderecoData {
  logradouro: string; complemento: string; bairro: string; cep: string;
  cidade_estado: string; celular_whatsapp: string; telefone_fixo: string; email_pessoal: string;
}
interface ReligiososData {
  primeiros_votos_data: string; votos_perpetuos_data: string; lugar_profissao: string;
  diaconato_data: string; presbiterato_data: string; bispo_ordenante: string;
}
interface CasaHistorico {
  id: number;
  casa_id: number;
  casa_nome: string;
  data_inicio: string;
  data_fim?: string;
  funcao: string;
  is_superior: boolean;
}
interface Casa { id: number; nome: string; }

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
interface Lancamento { id: number; descricao: string; valor: number; tipo_transacao: 'CREDITO' | 'DEBITO'; data: string; status: string; apontamento_texto?: string; registrado_por_nome: string; }
interface Missionario { id: number; nome: string; login: string; situacao: string; is_oconomo: boolean; }

interface Documento {
  id: number;
  descricao: string;
  arquivo_path: string;
  arquivo_nome: string;
  tipo_arquivo: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcDuracao(dataInicio: string, dataFim?: string): string {
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

const TABS = [
  { key: 'dados', label: 'Dados Pessoais', icon: <User size={16} /> },
  { key: 'contato', label: 'Contato & Endereço', icon: <MapPin size={16} /> },
  { key: 'religiosos', label: 'Dados Religiosos', icon: <BookOpen size={16} /> },
  { key: 'casas', label: 'Casas', icon: <HomeIcon size={16} /> },
  { key: 'financeiro', label: 'Financeiro', icon: <DollarSign size={16} /> },
];

const PerfilMissionario: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, isOconomo } = useAuth();
  const [activeTab, setActiveTab] = useState('dados');
  const [missionario, setMissionario] = useState<Missionario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [civilData, setCivilData] = useState<CivilData>({ data_nascimento: '', filiacao: '', cidade_estado: '', diocese: '', pais: '', naturalidade: '', rnm: '', cpf: '', titulo_eleitor: '', cnh: '', passaporte: '' });
  const [enderecoData, setEnderecoData] = useState<EnderecoData>({ logradouro: '', complemento: '', bairro: '', cep: '', cidade_estado: '', celular_whatsapp: '', telefone_fixo: '', email_pessoal: '' });
  const [religiososData, setReligiososData] = useState<ReligiososData>({ primeiros_votos_data: '', votos_perpetuos_data: '', lugar_profissao: '', diaconato_data: '', presbiterato_data: '', bispo_ordenante: '' });
  const [casasHistorico, setCasasHistorico] = useState<CasaHistorico[]>([]);
  const [casasDisponiveis, setCasasDisponiveis] = useState<Casa[]>([]);
  const [novaVinculacao, setNovaVinculacao] = useState({ casa_id: '', data_inicio: '', data_fim: '', funcao: '', is_superior: false });
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [novoLancamento, setNovoLancamento] = useState({ descricao: '', valor: '', tipo_transacao: 'DEBITO', data: new Date().toISOString().split('T')[0] });
  const [selectedCasaFinanceiro, setSelectedCasaFinanceiro] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [nacionalidades, setNacionalidades] = useState<string[]>([]);

  // Documents state
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pendingDocDesc, setPendingDocDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://scalabrinianos.dev.connectortech.com.br/api';
  const BASE_URL = API_URL.replace('/api', '');

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [usersRes, casasRes] = await Promise.all([
        api.post(`${API_URL}/usuarios/get`),
        api.post(`${API_URL}/casas-religiosas/get`),
      ]);
      const found = usersRes.data.find((u: any) => u.id === Number(id));
      setMissionario(found || null);
      setCasasDisponiveis(casasRes.data);

      const [civil, endereco, religiosos, casasHist, docsRes] = await Promise.all([
        api.post(`${API_URL}/usuarios/${id}/dados-civis/get`).catch(() => ({ data: {} })),
        api.post(`${API_URL}/usuarios/${id}/endereco-contato/get`).catch(() => ({ data: {} })),
        api.post(`${API_URL}/usuarios/${id}/dados-religiosos/get`).catch(() => ({ data: {} })),
        api.get(`${API_URL}/usuarios/${id}/casas-historico`).catch(() => ({ data: [] })),
        api.get(`${API_URL}/usuarios/${id}/documentos`).catch(() => ({ data: [] })),
      ]);

      if (civil.data?.data_nascimento) civil.data.data_nascimento = civil.data.data_nascimento.split('T')[0];
      setCivilData(prev => ({ ...prev, ...civil.data }));
      setEnderecoData(prev => ({ ...prev, ...endereco.data }));
      if (religiosos.data?.primeiros_votos_data) religiosos.data.primeiros_votos_data = religiosos.data.primeiros_votos_data.split('T')[0];
      if (religiosos.data?.votos_perpetuos_data) religiosos.data.votos_perpetuos_data = religiosos.data.votos_perpetuos_data.split('T')[0];
      if (religiosos.data?.diaconato_data) religiosos.data.diaconato_data = religiosos.data.diaconato_data.split('T')[0];
      if (religiosos.data?.presbiterato_data) religiosos.data.presbiterato_data = religiosos.data.presbiterato_data.split('T')[0];
      setReligiososData(prev => ({ ...prev, ...religiosos.data }));
      setCasasHistorico(casasHist.data);
      setDocumentos(docsRes.data);

      try {
        const nacRes = await api.get(`${API_URL}/usuarios/${id}/nacionalidades`);
        setNacionalidades(nacRes.data || []);
      } catch { setNacionalidades([]); }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLancamentos = async (casaId: string) => {
    try {
      const res = await api.get(`${API_URL}/financas-casa/casa/${casaId}`);
      setLancamentos(res.data);
    } catch { setLancamentos([]); }
  };

  useEffect(() => {
    if (selectedCasaFinanceiro) loadLancamentos(selectedCasaFinanceiro);
  }, [selectedCasaFinanceiro]);

  const saveCivil = async () => {
    setIsSaving(true);
    try { 
      await api.post(`${API_URL}/usuarios/${id}/dados-civis`, civilData); 
      await api.post(`${API_URL}/usuarios/${id}/nacionalidades`, { nacionalidades });
      alert('Dados civis e nacionalidades salvos!'); 
    }
    catch { alert('Erro ao salvar dados civis.'); }
    finally { setIsSaving(false); }
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setEnderecoData(p => ({ ...p, cep }));

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
      } catch (err) {
        console.error('CEP error:', err);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const saveEndereco = async () => {
    setIsSaving(true);
    try { await api.post(`${API_URL}/usuarios/${id}/endereco-contato`, enderecoData); alert('Endereço e contato salvos!'); }
    catch { alert('Erro ao salvar endereço.'); }
    finally { setIsSaving(false); }
  };

  const saveReligiosos = async () => {
    setIsSaving(true);
    try { await api.post(`${API_URL}/usuarios/${id}/dados-religiosos`, religiososData); alert('Dados religiosos salvos!'); }
    catch { alert('Erro ao salvar dados religiosos.'); }
    finally { setIsSaving(false); }
  };

  const addCasa = async () => {
    if (!novaVinculacao.casa_id) return alert('Selecione uma casa');
    try {
      await api.post(`${API_URL}/usuarios/${id}/casas-historico`, novaVinculacao);
      setNovaVinculacao({ casa_id: '', data_inicio: '', data_fim: '', funcao: '', is_superior: false });
      const res = await api.get(`${API_URL}/usuarios/${id}/casas-historico`);
      setCasasHistorico(res.data);
    } catch { alert('Erro ao vincular casa.'); }
  };

  const removeCasa = async (historico_id: number) => {
    if (!confirm('Deseja remover este vínculo?')) return;
    try {
      await api.delete(`${API_URL}/usuarios/${id}/casas-historico/${historico_id}`);
      setCasasHistorico(prev => prev.filter(c => c.id !== historico_id));
    } catch { alert('Erro ao remover vínculo.'); }
  };

  // Document actions
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pendingDocDesc.trim()) { alert('Informe a descrição do documento primeiro.'); return; }
    
    setIsSaving(true);
    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('descricao', pendingDocDesc.trim());
    
    try {
      await api.post(`${API_URL}/usuarios/${id}/documentos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPendingDocDesc('');
      const res = await api.get(`${API_URL}/usuarios/${id}/documentos`);
      setDocumentos(res.data);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch { alert('Erro ao enviar documento'); }
    finally { setIsSaving(false); }
  };

  const removeDoc = async (docId: number) => {
    if (!confirm('Excluir este documento permanentemente?')) return;
    try {
      await api.delete(`${API_URL}/usuarios/${id}/documentos/${docId}`);
      setDocumentos(prev => prev.filter(d => d.id !== docId));
    } catch { alert('Erro ao remover documento'); }
  };

  const addLancamento = async () => {
    if (!selectedCasaFinanceiro) return alert('Selecione uma casa primeiro');
    if (!novoLancamento.descricao || !novoLancamento.valor) return alert('Preencha descrição e valor');
    try {
      await api.post(`${API_URL}/financas-casa`, { ...novoLancamento, casa_id: selectedCasaFinanceiro, valor: parseFloat(novoLancamento.valor) });
      setNovoLancamento({ descricao: '', valor: '', tipo_transacao: 'DEBITO', data: new Date().toISOString().split('T')[0] });
      loadLancamentos(selectedCasaFinanceiro);
    } catch { alert('Erro ao registrar lançamento'); }
  };

  const marcarApontamento = async (lancId: number, texto: string) => {
    try {
      await api.put(`${API_URL}/financas-casa/${lancId}`, { status: 'APONTAMENTO', apontamento_texto: texto });
      loadLancamentos(selectedCasaFinanceiro);
    } catch { alert('Erro ao marcar apontamento'); }
  };

  const marcarVerificado = async (lancId: number) => {
    try {
      await api.put(`${API_URL}/financas-casa/${lancId}`, { status: 'VERIFICADO', apontamento_texto: null });
      loadLancamentos(selectedCasaFinanceiro);
    } catch { alert('Erro ao verificar lançamento'); }
  };

  if (isLoading) return <div className="perfil-loading"><Loader2 className="animate-spin" size={40} /><p>Carregando perfil...</p></div>;
  if (!missionario) return <div className="perfil-loading"><AlertCircle size={40} /><p>Missionário não encontrado</p></div>;

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <button className="btn-back" onClick={() => navigate('/missionarios')}><ArrowLeft size={18} /> Voltar</button>
        <div className="perfil-title-area">
          <div className="perfil-avatar"><User size={28} /></div>
          <div>
            <h2>{missionario.nome}</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              <span className={`status-badge ${missionario.situacao.toLowerCase()}`}>{missionario.situacao}</span>
              {missionario.is_oconomo && <span className="oconomo-badge">Ocônomo</span>}
              <span className="id-badge">ID #{missionario.id}</span>
            </div>
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
        {/* --- DADOS PESSOAIS --- */}
        {activeTab === 'dados' && (
          <div className="tab-panel">
            <div className="section-card">
              <h3 className="section-title"><User size={16} /> Dados Civis</h3>
              <div className="form-grid-3">
                <div className="form-group"><label>Data de Nascimento</label><input type="date" value={civilData.data_nascimento} onChange={e => setCivilData(p => ({ ...p, data_nascimento: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Filiação</label><input type="text" value={civilData.filiacao} onChange={e => setCivilData(p => ({ ...p, filiacao: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Naturalidade</label><input type="text" value={civilData.naturalidade} onChange={e => setCivilData(p => ({ ...p, naturalidade: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group">
                  <label>País</label>
                  <input 
                    type="text" 
                    list="paises-filter"
                    value={civilData.pais} 
                    onChange={e => setCivilData(p => ({ ...p, pais: e.target.value }))} 
                    disabled={!canEdit} 
                  />
                  <datalist id="paises-filter">
                    {PAISES_COMMON.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="form-group"><label>Cidade/Estado (Nasc.)</label><input type="text" value={civilData.cidade_estado} onChange={e => setCivilData(p => ({ ...p, cidade_estado: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Diocese</label><input type="text" value={civilData.diocese} onChange={e => setCivilData(p => ({ ...p, diocese: e.target.value }))} disabled={!canEdit} /></div>
              </div>

              <div className="wizard-divider" style={{ borderBottom: '1px solid #eef2f7', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>Nacionalidades</span>
                {canEdit && (
                  <button 
                    className="btn-add-doc" 
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={() => setNacionalidades([...nacionalidades, ''])}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {nacionalidades.map((nac, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={nac} 
                      onChange={e => {
                        const newNacs = [...nacionalidades];
                        newNacs[idx] = e.target.value;
                        setNacionalidades(newNacs);
                      }} 
                      placeholder="Nacionalidade..."
                      disabled={!canEdit}
                      style={{ flex: 1 }}
                    />
                    {canEdit && (
                      <button 
                        onClick={() => setNacionalidades(nacionalidades.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', padding: '0 4px' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {nacionalidades.length === 0 && <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>Nenhuma nacionalidade informada.</p>}
              </div>

              {canEdit && <div className="tab-save-row" style={{ marginTop: '15px' }}><button className="btn-save-tab" onClick={saveCivil} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Dados Civis e Nacionalidades</button></div>}
            </div>

            <div className="section-card">
              <h3 className="section-title"><FileText size={16} /> Documentos & Anexos</h3>
              
              {canEdit && (
                <div className="doc-add-row" style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    className="doc-desc-input"
                    placeholder="Descrição do documento (ex: RG, CPF, Passaporte)..."
                    value={pendingDocDesc}
                    onChange={e => setPendingDocDesc(e.target.value)}
                  />
                  <button className="btn-add-doc" onClick={() => fileInputRef.current?.click()}>
                    <Plus size={16} /> Enviar Arquivo
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleDocUpload} />
                </div>
              )}

              {documentos.length === 0 ? (
                <p className="empty-msg">Nenhum documento anexado.</p>
              ) : (
                <div className="docs-grid">
                  {documentos.map(doc => (
                    <div key={doc.id} className="doc-card" onClick={() => window.open(`${BASE_URL}${doc.arquivo_path}`, '_blank')}>
                      {canEdit && (
                        <button className="doc-remove" onClick={(e) => { e.stopPropagation(); removeDoc(doc.id); }}>
                          <X size={12} />
                        </button>
                      )}
                      <div className="doc-thumb">
                        {['jpg', 'jpeg', 'png'].includes(doc.tipo_arquivo.toLowerCase())
                          ? <img src={`${BASE_URL}${doc.arquivo_path}`} alt={doc.descricao} />
                          : <FileText size={32} className="doc-icon-pdf" />
                        }
                      </div>
                      <div className="doc-info">
                        <span className="doc-desc">{doc.descricao}</span>
                        <span className="doc-filename">{doc.arquivo_nome}</span>
                        <span className={`doc-type doc-type-${doc.tipo_arquivo.toLowerCase()}`}>{doc.tipo_arquivo.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CONTATO & ENDEREÇO --- */}
        {activeTab === 'contato' && (
          <div className="tab-panel">
            <div className="section-card">
              <h3 className="section-title"><MapPin size={16} /> Endereço</h3>
              <div className="form-grid-3">
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Logradouro</label><input type="text" value={enderecoData.logradouro} onChange={e => setEnderecoData(p => ({ ...p, logradouro: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group">
                  <label>CEP {cepLoading && <Loader2 size={12} className="animate-spin" style={{ marginLeft: 4 }} />}</label>
                  <input type="text" value={enderecoData.cep} onChange={e => handleCepChange(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="form-group"><label>Bairro</label><input type="text" value={enderecoData.bairro} onChange={e => setEnderecoData(p => ({ ...p, bairro: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Complemento</label><input type="text" value={enderecoData.complemento} onChange={e => setEnderecoData(p => ({ ...p, complemento: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Cidade/Estado (End.)</label><input type="text" value={enderecoData.cidade_estado} onChange={e => setEnderecoData(p => ({ ...p, cidade_estado: e.target.value }))} disabled={!canEdit} /></div>
              </div>
            </div>
            <div className="section-card">
              <h3 className="section-title"><MapPin size={16} /> Contato</h3>
              <div className="form-grid-3">
                <div className="form-group"><label>Celular / WhatsApp</label><input type="text" value={enderecoData.celular_whatsapp} onChange={e => setEnderecoData(p => ({ ...p, celular_whatsapp: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Telefone Fixo</label><input type="text" value={enderecoData.telefone_fixo} onChange={e => setEnderecoData(p => ({ ...p, telefone_fixo: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>E-mail Pessoal</label><input type="email" value={enderecoData.email_pessoal} onChange={e => setEnderecoData(p => ({ ...p, email_pessoal: e.target.value }))} disabled={!canEdit} /></div>
              </div>
            </div>
            {canEdit && <div className="tab-save-row"><button className="btn-save-tab" onClick={saveEndereco} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Endereço e Contato</button></div>}
          </div>
        )}

        {/* --- DADOS RELIGIOSOS --- */}
        {activeTab === 'religiosos' && (
          <div className="tab-panel">
            <div className="section-card">
              <h3 className="section-title"><BookOpen size={16} /> Dados Religiosos</h3>
              <div className="form-grid-3">
                <div className="form-group"><label>Data Primeiros Votos</label><input type="date" value={religiososData.primeiros_votos_data} onChange={e => setReligiososData(p => ({ ...p, primeiros_votos_data: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Data Votos Perpétuos</label><input type="date" value={religiososData.votos_perpetuos_data} onChange={e => setReligiososData(p => ({ ...p, votos_perpetuos_data: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Lugar de Profissão</label><input type="text" value={religiososData.lugar_profissao} onChange={e => setReligiososData(p => ({ ...p, lugar_profissao: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Data do Diaconato</label><input type="date" value={religiososData.diaconato_data} onChange={e => setReligiososData(p => ({ ...p, diaconato_data: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Data do Presbiterato</label><input type="date" value={religiososData.presbiterato_data} onChange={e => setReligiososData(p => ({ ...p, presbiterato_data: e.target.value }))} disabled={!canEdit} /></div>
                <div className="form-group"><label>Bispo Ordenante</label><input type="text" value={religiososData.bispo_ordenante} onChange={e => setReligiososData(p => ({ ...p, bispo_ordenante: e.target.value }))} disabled={!canEdit} /></div>
              </div>
            </div>
            {canEdit && <div className="tab-save-row"><button className="btn-save-tab" onClick={saveReligiosos} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Dados Religiosos</button></div>}
          </div>
        )}

        {/* --- CASAS --- */}
        {activeTab === 'casas' && (
          <div className="tab-panel">
            {canEdit && (
              <div className="section-card">
                <h3 className="section-title"><Plus size={16} /> Vincular a uma Casa</h3>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Casa Religiosa</label>
                    <select value={novaVinculacao.casa_id} onChange={e => setNovaVinculacao(p => ({ ...p, casa_id: e.target.value }))}>
                      <option value="">Selecione...</option>
                      {casasDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Função / Cargo na Casa</label><input type="text" placeholder="Ex: Superior, Ecônomo..." value={novaVinculacao.funcao} onChange={e => setNovaVinculacao(p => ({ ...p, funcao: e.target.value }))} /></div>
                  <div className="form-group"><label>Data de Início</label><input type="date" value={novaVinculacao.data_inicio} onChange={e => setNovaVinculacao(p => ({ ...p, data_inicio: e.target.value }))} /></div>
                  <div className="form-group"><label>Data de Saída (opcional)</label><input type="date" value={novaVinculacao.data_fim} onChange={e => setNovaVinculacao(p => ({ ...p, data_fim: e.target.value }))} /></div>
                  <div className="form-group">
                    <label className="checkbox-label" style={{ marginTop: '20px' }}>
                      <input type="checkbox" checked={novaVinculacao.is_superior} onChange={e => setNovaVinculacao(p => ({ ...p, is_superior: e.target.checked }))} />
                      Superior Local
                    </label>
                  </div>
                </div>
                <button className="btn-add-casa" onClick={addCasa}><Plus size={16} /> Vincular Casa</button>
              </div>
            )}

            <div className="section-card">
              <h3 className="section-title"><HomeIcon size={16} /> Histórico de Casas</h3>
              {casasHistorico.length === 0 ? (
                <p className="empty-msg">Nenhuma casa vinculada ainda.</p>
              ) : (
                <div className="casas-list">
                  {casasHistorico.map(c => (
                    <div key={c.id} className={`casa-item ${!c.data_fim ? 'casa-ativa' : ''}`}>
                      <div className="casa-info">
                        <span className="casa-nome">{c.casa_nome}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                          {c.funcao && <span className="casa-funcao">{c.funcao}</span>}
                          {c.is_superior && <span className="superior-pill"><Star size={11} /> Superior</span>}
                          <span className="duracao-pill" style={{ background: '#f0f4f8' }}>⏱ {calcDuracao(c.data_inicio, c.data_fim)}</span>
                        </div>
                        <span className="casa-periodo" style={{ marginTop: '4px', display: 'block' }}>
                          {c.data_inicio ? new Date(c.data_inicio).toLocaleDateString('pt-BR') : '?'}
                          {' → '}
                          {c.data_fim ? new Date(c.data_fim).toLocaleDateString('pt-BR') : 'Atual'}
                        </span>
                      </div>
                      {!c.data_fim && <span className="badge-atual">Atual</span>}
                      {canEdit && <button className="btn-remove-casa" onClick={() => removeCasa(c.id)}><Trash2 size={14} /></button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- FINANCEIRO --- */}
        {activeTab === 'financeiro' && (
          <div className="tab-panel">
            <div className="section-card">
              <h3 className="section-title"><HomeIcon size={16} /> Selecione a Casa</h3>
              <select className="house-selector" value={selectedCasaFinanceiro} onChange={e => setSelectedCasaFinanceiro(e.target.value)}>
                <option value="">-- Selecione uma casa vinculada --</option>
                {casasHistorico.filter(c => !c.data_fim).map(c => (
                  <option key={c.id} value={c.casa_id}>{c.casa_nome}</option>
                ))}
                {casasHistorico.filter(c => !!c.data_fim).length > 0 && (
                  <optgroup label="Casas Anteriores">
                    {casasHistorico.filter(c => !!c.data_fim).map(c => (
                      <option key={c.id} value={c.casa_id}>{c.casa_nome} (encerrado)</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {selectedCasaFinanceiro && (
              <>
                <div className="section-card">
                  <h3 className="section-title"><Plus size={16} /> Novo Lançamento</h3>
                  <div className="form-grid-3">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Descrição</label><input type="text" placeholder="Descrição do lançamento..." value={novoLancamento.descricao} onChange={e => setNovoLancamento(p => ({ ...p, descricao: e.target.value }))} /></div>
                    <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" placeholder="0,00" value={novoLancamento.valor} onChange={e => setNovoLancamento(p => ({ ...p, valor: e.target.value }))} /></div>
                    <div className="form-group">
                      <label>Tipo</label>
                      <select value={novoLancamento.tipo_transacao} onChange={e => setNovoLancamento(p => ({ ...p, tipo_transacao: e.target.value }))}>
                        <option value="DEBITO">Débito (Saída)</option>
                        <option value="CREDITO">Crédito (Entrada)</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Data</label><input type="date" value={novoLancamento.data} onChange={e => setNovoLancamento(p => ({ ...p, data: e.target.value }))} /></div>
                  </div>
                  <button className="btn-add-casa" onClick={addLancamento}><Plus size={16} /> Registrar Lançamento</button>
                </div>

                <div className="section-card">
                  <h3 className="section-title"><DollarSign size={16} /> Lançamentos</h3>
                  {lancamentos.length === 0 ? <p className="empty-msg">Nenhum lançamento registrado.</p> : (
                    <div className="lancamentos-list">
                      {lancamentos.map(l => (
                        <div key={l.id} className={`lancamento-item lancamento-${l.tipo_transacao.toLowerCase()} status-${l.status.toLowerCase()}`}>
                          <div className="lancamento-info">
                            <span className="lancamento-desc">{l.descricao}</span>
                            <span className="lancamento-meta">{new Date(l.data).toLocaleDateString('pt-BR')} · Por: {l.registrado_por_nome}</span>
                            {l.apontamento_texto && <span className="lancamento-apontamento">⚠️ {l.apontamento_texto}</span>}
                          </div>
                          <div className="lancamento-right">
                            <span className={`valor-tag ${l.tipo_transacao.toLowerCase()}`}>
                              {l.tipo_transacao === 'CREDITO' ? '+' : '-'}R$ {Number(l.valor).toFixed(2)}
                            </span>
                            <span className={`status-lancamento status-${l.status.toLowerCase()}`}>
                              {l.status === 'PENDENTE' && <Clock size={14} />}
                              {l.status === 'VERIFICADO' && <CheckCircle size={14} />}
                              {l.status === 'APONTAMENTO' && <AlertCircle size={14} />}
                              {l.status}
                            </span>
                            {isOconomo && l.status !== 'VERIFICADO' && (
                              <div className="oconomo-actions">
                                <button className="btn-verificar" onClick={() => marcarVerificado(l.id)}>✓ Verificar</button>
                                <button className="btn-apontar" onClick={() => {
                                  const texto = prompt('Informe o apontamento / motivo:');
                                  if (texto) marcarApontamento(l.id, texto);
                                  else if (texto === '') alert('O texto do apontamento não pode ser vazio.');
                                }}>⚠ Apontar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilMissionario;
