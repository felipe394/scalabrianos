const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Multer configuration for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'documentos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG.'));
  }
});

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'https://scalabrinianos.dev.connectortech.com.br'
  ],
  credentials: true
}));
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Diagnostic logging for all requests
app.use((req, res, next) => {
  console.log(`[BACKEND] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Acesso negado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Health check (Enhanced for diagnostic)
app.use(['/api/health', '/health'], (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '3.0.0-FINAL-FIX', 
    message: 'API ATUALIZADA - SE VOCE VE ISSO O RESTART FUNCIONOU',
    method: req.method,
    url: req.originalUrl
  });
});

// Logs helper function
async function logAction(usuarioId, acao, tabela, detalhes) {
  try {
    await db.query('INSERT INTO tb_logs (usuario_id, acao, tabela_afetada, detalhes) VALUES (?, ?, ?, ?)', [usuarioId, acao, tabela, detalhes]);
  } catch (err) { console.error('Error logging action:', err); }
}

async function createNotification(usuarioId, mensagem, tipo = 'INFO', linkPath = null) {
  try {
    await db.query('INSERT INTO tb_notificacoes (usuario_id, mensagem, tipo, link_path) VALUES (?, ?, ?, ?)', [usuarioId, mensagem, tipo, linkPath]);
  } catch (err) { console.error('Error creating notification:', err); }
};

async function logAccess(usuarioId, tipo, req, detalhes) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await db.query('INSERT INTO tb_logs_acesso (usuario_id, tipo, ip_address, detalhes) VALUES (?, ?, ?, ?)', [usuarioId, tipo, ip, detalhes]);
  } catch (err) { console.error('Error logging access:', err); }
}

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN] ${new Date().toISOString()} - Attempt for: ${email}`);

  try {
    const [rows] = await db.query('SELECT * FROM tb_usuarios WHERE login = ? AND status = ?', [email, 'ATIVO']);
    
    if (rows.length === 0) {
      console.log(`[LOGIN] User not found or inactive: ${email}`);
      return res.status(401).json({ success: false, message: 'Usuário não encontrado ou inativo' });
    }

    const user = rows[0];
    
    // For now, accept both hashed and plain text for the provided admin password
    let isMatch = false;
    if (user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = (password === user.password_hash);
    }

    console.log(`[LOGIN] User ID: ${user.id}, Password match: ${isMatch}`);

    if (!isMatch) {
      await logAccess(user.id, 'FALHA', req, 'Senha incorreta');
      return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logAccess(user.id, 'LOGIN', req, 'Autenticação bem-sucedida');

    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.login,
        role: user.role,
        is_superior: !!user.is_superior,
        is_oconomo: !!user.is_oconomo
      },
      token
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - Login Error: ${error.stack}\n`);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor durante o login. Por favor, tente novamente mais tarde.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper to sanitize dates (convert empty string to null)
const sanitizeDate = (date) => (date === '' || date === undefined || date === null) ? null : (typeof date === 'string' ? date.split('T')[0] : date);

// Generic CRUD endpoints for tables
// Users
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome, login, role, status, situacao, is_oconomo, is_superior FROM tb_usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome, login, role, status, situacao, is_oconomo, is_superior, proximos_passos FROM tb_usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/get', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome, login, role, status, situacao, is_oconomo, is_superior FROM tb_usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios', authenticateToken, async (req, res) => {
  const { nome, login, password, role, status, situacao, is_oconomo, is_superior } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    console.log('Creating user:', { nome, login, role, status, situacao, is_oconomo, is_superior });
    const [result] = await db.query(
      'INSERT INTO tb_usuarios (nome, login, password_hash, role, status, situacao, is_oconomo, is_superior) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, login, hashedPassword, role, status, situacao, is_oconomo ? 1 : 0, is_superior ? 1 : 0]
    );
    await logAction(req.user.id, 'CRIO_USUARIO', 'tb_usuarios', `Criou usuario ${login}`);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
  const { nome, login, password, role, status, situacao, is_oconomo, is_superior, proximos_passos } = req.body;
  const { id } = req.params;

  try {
    let query = 'UPDATE tb_usuarios SET nome = ?, login = ?, role = ?, status = ?, situacao = ?, is_oconomo = ?, is_superior = ?, proximos_passos = ?';
    let params = [nome, login, role, status, situacao, is_oconomo ? 1 : 0, is_superior ? 1 : 0, proximos_passos || null];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    await logAction(req.user.id, 'EDITOU_USUARIO', 'tb_usuarios', `Editou usuario ID ${id}`);
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Alias for PUT to avoid 403 Forbidden issues on some servers
app.post('/api/usuarios/:id/update', authenticateToken, async (req, res) => {
  const { nome, login, password, role, status, situacao, is_oconomo, is_superior, proximos_passos } = req.body;
  const { id } = req.params;

  try {
    let query = 'UPDATE tb_usuarios SET nome = ?, login = ?, role = ?, status = ?, situacao = ?, is_oconomo = ?, is_superior = ?, proximos_passos = ?';
    let params = [nome, login, role, status, situacao, is_oconomo ? 1 : 0, is_superior ? 1 : 0, proximos_passos || null];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    await logAction(req.user.id, 'EDITOU_USUARIO', 'tb_usuarios', `Editou usuario ID ${id} (via POST)`);
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Religious Houses
app.get('/api/casas-religiosas', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_casas_religiosas');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/casas-religiosas/get', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM tb_missionario_casas mc WHERE mc.casa_id = c.id AND (mc.data_fim IS NULL OR mc.data_fim >= CURDATE())) as missionarios_count
      FROM tb_casas_religiosas c
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/casas-religiosas', authenticateToken, async (req, res) => {
  const { nome, endereco, status, regional, data_referencia_casa } = req.body;
  try {
    const dRef = sanitizeDate(data_referencia_casa);
    const [result] = await db.query(
      'INSERT INTO tb_casas_religiosas (nome, endereco, status, regional, data_referencia_casa) VALUES (?, ?, ?, ?, ?)',
      [nome, endereco, status, regional, dRef]
    );
    await logAction(req.user.id, 'CRIAR_CASA_RELIGIOSA', 'tb_casas_religiosas', `Casa "${nome}" criada em ${regional || 'N/A'}`);
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/casas-religiosas/:id', authenticateToken, async (req, res) => {
  const { nome, endereco, status, regional, data_referencia_casa } = req.body;
  const { id } = req.params;
  try {
    const dRef = sanitizeDate(data_referencia_casa);
    await db.query(
      'UPDATE tb_casas_religiosas SET nome = ?, endereco = ?, status = ?, regional = ?, data_referencia_casa = ? WHERE id = ?',
      [nome, endereco, status, regional, dRef, id]
    );
    await logAction(req.user.id, 'ATUALIZAR_CASA_RELIGIOSA', 'tb_casas_religiosas', `Casa ID ${id} ("${nome}") atualizada`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/casas-religiosas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Get info for logging
    const [rows] = await db.query('SELECT nome FROM tb_casas_religiosas WHERE id = ?', [id]);
    const nome = rows.length > 0 ? rows[0].nome : `ID ${id}`;

    await db.query('DELETE FROM tb_casas_religiosas WHERE id = ?', [id]);
    await logAction(req.user.id, 'DELETAR_CASA_RELIGIOSA', 'tb_casas_religiosas', `Casa "${nome}" excluída`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Categories
app.get('/api/categorias-financas', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_categorias_financas ORDER BY categoria_pai, nome');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User-specific data (Civil, Religious, Address, Itinerary)
app.get('/api/usuarios/:id/dados-civis', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_dados_civis WHERE usuario_id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/dados-civis/get', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_dados_civis WHERE usuario_id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/dados-civis', authenticateToken, async (req, res) => {
  const { data_nascimento, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte, nit } = req.body;
  try {
    console.log(`Updating/Inserting civil data for user ${req.params.id}`);
    const [rows] = await db.query('SELECT * FROM tb_dados_civis WHERE usuario_id = ?', [req.params.id]);
    const dNasc = sanitizeDate(data_nascimento);
    if (rows.length > 0) {
      await db.query(
        'UPDATE tb_dados_civis SET data_nascimento=?, filiacao=?, cidade_estado=?, diocese=?, pais=?, naturalidade=?, rnm=?, cpf=?, titulo_eleitor=?, cnh=?, passaporte=?, nit=? WHERE usuario_id=?',
        [dNasc, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte, nit || null, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO tb_dados_civis (usuario_id, data_nascimento, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte, nit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, dNasc, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte, nit || null]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in dados-civis:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/usuarios/:id/nacionalidades', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT nacionalidade FROM tb_nacionalidades WHERE usuario_id = ?', [req.params.id]);
    res.json(rows.map(r => r.nacionalidade));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/nacionalidades', authenticateToken, async (req, res) => {
  const { nacionalidades } = req.body; // Array of strings
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Remove existing
    await connection.query('DELETE FROM tb_nacionalidades WHERE usuario_id = ?', [req.params.id]);
    
    // Insert new ones
    if (nacionalidades && nacionalidades.length > 0) {
      for (const nac of nacionalidades) {
        if (nac.trim()) {
          await connection.query('INSERT INTO tb_nacionalidades (usuario_id, nacionalidade) VALUES (?, ?)', [req.params.id, nac.trim()]);
        }
      }
    }
    
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error in nacionalidades:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/usuarios/:id/dados-religiosos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_dados_religiosos WHERE usuario_id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/dados-religiosos/get', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_dados_religiosos WHERE usuario_id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/dados-religiosos', authenticateToken, async (req, res) => {
  const { primeiros_votos_data, votos_perpetuos_data, lugar_profissao, diaconato_data, presbiterato_data, bispo_ordenante } = req.body;
  try {
    console.log(`Updating/Inserting religious data for user ${req.params.id}`);
    const [rows] = await db.query('SELECT * FROM tb_dados_religiosos WHERE usuario_id = ?', [req.params.id]);
    const dPrimeiros = sanitizeDate(primeiros_votos_data);
    const dPerpetuos = sanitizeDate(votos_perpetuos_data);
    const dDiaconato = sanitizeDate(diaconato_data);
    const dPresbiterato = sanitizeDate(presbiterato_data);
    
    if (rows.length > 0) {
      await db.query(
        'UPDATE tb_dados_religiosos SET primeiros_votos_data=?, votos_perpetuos_data=?, lugar_profissao=?, diaconato_data=?, presbiterato_data=?, bispo_ordenante=? WHERE usuario_id=?',
        [dPrimeiros, dPerpetuos, lugar_profissao, dDiaconato, dPresbiterato, bispo_ordenante, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO tb_dados_religiosos (usuario_id, primeiros_votos_data, votos_perpetuos_data, lugar_profissao, diaconato_data, presbiterato_data, bispo_ordenante) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, dPrimeiros, dPerpetuos, lugar_profissao, dDiaconato, dPresbiterato, bispo_ordenante]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in dados-religiosos:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/usuarios/:id/endereco-contato', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_enderecos_contatos WHERE usuario_id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/endereco-contato/get', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_enderecos_contatos WHERE usuario_id = ?', [req.params.id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/endereco-contato', authenticateToken, async (req, res) => {
  const { logradouro, complemento, bairro, cep, cidade_estado, celular_whatsapp, telefone_fixo, email_pessoal } = req.body;
  try {
    console.log(`Updating/Inserting address for user ${req.params.id}`);
    const [rows] = await db.query('SELECT * FROM tb_enderecos_contatos WHERE usuario_id = ?', [req.params.id]);
    if (rows.length > 0) {
      await db.query(
        'UPDATE tb_enderecos_contatos SET logradouro=?, complemento=?, bairro=?, cep=?, cidade_estado=?, celular_whatsapp=?, telefone_fixo=?, email_pessoal=? WHERE usuario_id=?',
        [logradouro, complemento, bairro, cep, cidade_estado, celular_whatsapp, telefone_fixo, email_pessoal, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO tb_enderecos_contatos (usuario_id, logradouro, complemento, bairro, cep, cidade_estado, celular_whatsapp, telefone_fixo, email_pessoal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, logradouro, complemento, bairro, cep, cidade_estado, celular_whatsapp, telefone_fixo, email_pessoal]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error in endereco-contato:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/usuarios/:id/itinerario', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_itinerario_formativo WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/itinerario/get', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_itinerario_formativo WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/itinerario', authenticateToken, async (req, res) => {
  const { stages } = req.body; // Expecting an array of stages
  try {
    // Basic implementation: Delete existing and insert new
    await db.query('DELETE FROM tb_itinerario_formativo WHERE usuario_id = ?', [req.params.id]);
    for (const stage of stages) {
      await db.query(
        'INSERT INTO tb_itinerario_formativo (usuario_id, etapa, local, periodo, is_sub_etapa, doc_path) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, stage.etapa, stage.local, stage.periodo, stage.is_sub_etapa || 0, stage.doc_path || null]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- New Endpoints ---
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.nome as usuario_nome 
      FROM tb_logs l 
      LEFT JOIN tb_usuarios u ON l.usuario_id = u.id 
      ORDER BY l.created_at DESC LIMIT 200
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/usuarios/:id/casas-historico', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT h.*, c.nome as casa_nome 
      FROM tb_missionario_casas h 
      JOIN tb_casas_religiosas c ON h.casa_id = c.id 
      WHERE h.usuario_id = ? 
      ORDER BY h.data_inicio DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/casas-historico', authenticateToken, async (req, res) => {
  const { casa_id, data_inicio, data_fim, funcao, is_superior } = req.body;
  try {
    const dInicio = sanitizeDate(data_inicio);
    const dFim = sanitizeDate(data_fim);
    const superior = is_superior ? 1 : 0;

    const [result] = await db.query(
      'INSERT INTO tb_missionario_casas (usuario_id, casa_id, data_inicio, data_fim, funcao, is_superior) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, casa_id, dInicio, dFim, funcao, superior]
    );
    await logAction(req.user.id, 'ADICIONOU_CASA', 'tb_missionario_casas', `Usuário ${req.params.id} vinculado à casa ${casa_id}`);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Specialized Profile Sections ---

// 1. Formação Acadêmica
app.get('/api/usuarios/:id/formacao-academica', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_formacao_academica WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/usuarios/:id/formacao-academica', authenticateToken, async (req, res) => {
  const { curso, faculdade, periodo, doc_path } = req.body;
  try {
    await db.query('INSERT INTO tb_formacao_academica (usuario_id, curso, faculdade, periodo, doc_path) VALUES (?, ?, ?, ?, ?)', [req.params.id, curso, faculdade, periodo, doc_path]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id/formacao-academica/:fid', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_formacao_academica WHERE id = ? AND usuario_id = ?', [req.params.fid, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Atividade Missionária
app.get('/api/usuarios/:id/atividade-missionaria', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_atividade_missionaria WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/usuarios/:id/atividade-missionaria', authenticateToken, async (req, res) => {
  const { periodo, lugar, missao, doc_path } = req.body;
  try {
    await db.query('INSERT INTO tb_atividade_missionaria (usuario_id, periodo, lugar, missao, doc_path) VALUES (?, ?, ?, ?, ?)', [req.params.id, periodo, lugar, missao, doc_path]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id/atividade-missionaria/:aid', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_atividade_missionaria WHERE id = ? AND usuario_id = ?', [req.params.aid, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Saúde
app.get('/api/usuarios/:id/saude', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_saude WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/usuarios/:id/saude', authenticateToken, async (req, res) => {
  const { sus_card, seguradora, numero_carteira, doc_path } = req.body;
  try {
    await db.query('INSERT INTO tb_saude (usuario_id, sus_card, seguradora, numero_carteira, doc_path) VALUES (?, ?, ?, ?, ?)', [req.params.id, sus_card, seguradora, numero_carteira, doc_path]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id/saude/:sid', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_saude WHERE id = ? AND usuario_id = ?', [req.params.sid, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Contas Bancárias
app.get('/api/usuarios/:id/contas-bancarias', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_contas_bancarias WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/usuarios/:id/contas-bancarias', authenticateToken, async (req, res) => {
  const { tipo_conta, titularidade, agencia, numero, doc_path } = req.body;
  try {
    await db.query('INSERT INTO tb_contas_bancarias (usuario_id, tipo_conta, titularidade, agencia, numero, doc_path) VALUES (?, ?, ?, ?, ?, ?)', [req.params.id, tipo_conta, titularidade, agencia, numero, doc_path]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id/contas-bancarias/:bid', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_contas_bancarias WHERE id = ? AND usuario_id = ?', [req.params.bid, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5. Obras Realizadas
app.get('/api/usuarios/:id/obras-realizadas', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_obras_realizadas WHERE usuario_id = ?', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/usuarios/:id/obras-realizadas', authenticateToken, async (req, res) => {
  const { periodo, lugar, obra, doc_path } = req.body;
  try {
    await db.query('INSERT INTO tb_obras_realizadas (usuario_id, periodo, lugar, obra, doc_path) VALUES (?, ?, ?, ?, ?)', [req.params.id, periodo, lugar, obra, doc_path]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id/obras-realizadas/:oid', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_obras_realizadas WHERE id = ? AND usuario_id = ?', [req.params.oid, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 6. Observações Gerais
app.get('/api/usuarios/:id/observacoes-gerais', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_observacoes_gerais WHERE usuario_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/usuarios/:id/observacoes-gerais', authenticateToken, async (req, res) => {
  const { texto, doc_path } = req.body;
  try {
    await db.query('INSERT INTO tb_observacoes_gerais (usuario_id, texto, doc_path) VALUES (?, ?, ?)', [req.params.id, texto, doc_path]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/usuarios/:id/observacoes-gerais/:oid', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM tb_observacoes_gerais WHERE id = ? AND usuario_id = ?', [req.params.oid, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/financas-casa/casa/:casa_id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, u.nome as registrado_por_nome 
      FROM tb_financas_casa f 
      LEFT JOIN tb_usuarios u ON f.registrado_por = u.id 
      WHERE f.casa_id = ? 
      ORDER BY f.data DESC
    `, [req.params.casa_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Monthly Financial Spreadsheets (Planilhas Mensais) ---

app.get('/api/financas-mensais/usuario/:usuario_id/mes/:mes', authenticateToken, async (req, res) => {
  const { usuario_id, mes } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM tb_financas_mensais WHERE usuario_id = ? AND mes_referencia = ?', [usuario_id, mes]);
    if (rows.length === 0) return res.json(null);
    
    const [itens] = await db.query('SELECT * FROM tb_financas_mensais_itens WHERE planilha_id = ?', [rows[0].id]);
    res.json({ ...rows[0], itens });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/financas-mensais', authenticateToken, async (req, res) => {
  const { usuario_id, casa_id, mes_referencia, itens, total_credito, total_debito } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if exists
    const [existing] = await connection.query('SELECT id, status FROM tb_financas_mensais WHERE usuario_id = ? AND mes_referencia = ?', [usuario_id, mes_referencia]);
    
    let planilhaId;
    if (existing.length > 0) {
      if (existing[0].status === 'VALIDADO' && req.user.role !== 'ADMIN_GERAL') {
         throw new Error('Esta planilha já foi validada e não pode ser editada.');
      }
      planilhaId = existing[0].id;
      await connection.query(
        'UPDATE tb_financas_mensais SET total_credito = ?, total_debito = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [total_credito, total_debito, planilhaId]
      );
      // Clean old items
      await connection.query('DELETE FROM tb_financas_mensais_itens WHERE planilha_id = ?', [planilhaId]);
    } else {
      const [result] = await connection.query(
        'INSERT INTO tb_financas_mensais (usuario_id, casa_id, mes_referencia, total_credito, total_debito) VALUES (?, ?, ?, ?, ?)',
        [usuario_id, casa_id, mes_referencia, total_credito, total_debito]
      );
      planilhaId = result.insertId;
    }

    // Insert items
    for (const item of itens) {
      if (item.valor > 0) {
        await connection.query(
          'INSERT INTO tb_financas_mensais_itens (planilha_id, categoria_id, valor) VALUES (?, ?, ?)',
          [planilhaId, item.categoria_id, item.valor]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, id: planilhaId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/financas-mensais/consolidado/casa/:casa_id/mes/:mes', authenticateToken, async (req, res) => {
  const { casa_id, mes } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.nome as usuario_nome 
      FROM tb_financas_mensais p
      JOIN tb_usuarios u ON p.usuario_id = u.id
      WHERE p.casa_id = ? AND p.mes_referencia = ?
    `, [casa_id, mes]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/financas-mensais/:id/validar', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, apontamentos } = req.body;
  try {
    await db.query(
      'UPDATE tb_financas_mensais SET status = ?, apontamentos = ? WHERE id = ?',
      [status, apontamentos, id]
    );
    await logAction(req.user.id, 'VALIDAR_PLANILHA_MENSAL', 'tb_financas_mensais', `Planilha ${id} validada como ${status}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/financas-casa', authenticateToken, async (req, res) => {
  const { casa_id, descricao, valor, tipo_transacao, data, status, categoria_id, tipo_despesa } = req.body;
  try {
    const defaultStatus = status || 'PENDENTE';
    const dLanc = sanitizeDate(data);
    const [result] = await db.query(
      'INSERT INTO tb_financas_casa (casa_id, registrado_por, descricao, valor, tipo_transacao, data, status, categoria_id, tipo_despesa) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [casa_id, req.user.id, descricao, valor, tipo_transacao, dLanc, defaultStatus, categoria_id || null, tipo_despesa || 'CASA']
    );
    await logAction(req.user.id, 'LANCAMENTO_FINANCEIRO', 'tb_financas_casa', `Lançamento de ${tipo_transacao} na casa ${casa_id} - R$ ${valor}`);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/financas-casa/:id', authenticateToken, async (req, res) => {
  try {
    const { casa_id, descricao, valor, tipo_transacao, data, status, categoria_id, tipo_despesa, apontamento_texto } = req.body;
    
    // Get existing data to know who to notify
    const [existing] = await db.query('SELECT registrado_por, descricao, casa_id FROM tb_financas_casa WHERE id = ?', [req.params.id]);
    
    const dLanc = data ? sanitizeDate(data) : undefined;
    
    let updateQuery = 'UPDATE tb_financas_casa SET id = id'; // dummy start
    const params = [];

    if (casa_id) { updateQuery += ', casa_id = ?'; params.push(casa_id); }
    if (descricao) { updateQuery += ', descricao = ?'; params.push(descricao); }
    if (valor !== undefined) { updateQuery += ', valor = ?'; params.push(valor); }
    if (tipo_transacao) { updateQuery += ', tipo_transacao = ?'; params.push(tipo_transacao); }
    if (dLanc !== undefined) { updateQuery += ', data = ?'; params.push(dLanc); }
    if (status) { updateQuery += ', status = ?'; params.push(status); }
    if (categoria_id !== undefined) { updateQuery += ', categoria_id = ?'; params.push(categoria_id); }
    if (tipo_despesa) { updateQuery += ', tipo_despesa = ?'; params.push(tipo_despesa); }
    if (apontamento_texto !== undefined) { updateQuery += ', apontamento_texto = ?'; params.push(apontamento_texto); }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await db.query(updateQuery, params);
    
    await logAction(req.user.id, 'ATUALIZAR_FINANCAS', 'tb_financas_casa', `Lançamento ID ${req.params.id} ("${descricao || 'sem desc'}") atualizado - Status: ${status}`);
    
    // Notify user if it's an "Apontamento"
    if (status === 'APONTAMENTO' && existing.length > 0) {
      const msg = `Correção solicitada no lançamento: "${existing[0].descricao}". Motivo: ${apontamento_texto}`;
      await createNotification(existing[0].registrado_por, msg, 'ALERTA', `/missionarios/${existing[0].registrado_por}`);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/financas-casa/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT descricao, valor FROM tb_financas_casa WHERE id = ?', [req.params.id]);
    const info = rows.length > 0 ? `"${rows[0].descricao}" (R$ ${rows[0].valor})` : `ID ${req.params.id}`;

    await db.query('DELETE FROM tb_financas_casa WHERE id = ?', [req.params.id]);
    await logAction(req.user.id, 'DELETAR_FINANCAS', 'tb_financas_casa', `Lançamento ${info} excluído`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Consolidated Financial Report
app.get('/api/financas-casa/relatorio', authenticateToken, async (req, res) => {
  const { casa_id, status, data_inicio, data_fim, tipo_despesa } = req.query;
  try {
    let query = `
      SELECT f.*, u.nome as registrado_por_nome, c.nome as casa_nome, cat.nome as categoria_nome 
      FROM tb_financas_casa f 
      LEFT JOIN tb_usuarios u ON f.registrado_por = u.id 
      LEFT JOIN tb_casas_religiosas c ON f.casa_id = c.id 
      LEFT JOIN tb_categorias_financas cat ON f.categoria_id = cat.id
      WHERE 1=1
    `;
    const params = [];

    if (casa_id) { query += ' AND f.casa_id = ?'; params.push(casa_id); }
    if (status) { query += ' AND f.status = ?'; params.push(status); }
    if (data_inicio) { query += ' AND f.data >= ?'; params.push(data_inicio); }
    if (data_fim) { query += ' AND f.data <= ?'; params.push(data_fim); }
    if (tipo_despesa) { query += ' AND f.tipo_despesa = ?'; params.push(tipo_despesa); }

    query += ' ORDER BY f.data DESC, f.id DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/financas-casa/sumario', authenticateToken, async (req, res) => {
  const { casa_id, data_inicio, data_fim, tipo_despesa } = req.query;
  try {
    let query = 'SELECT tipo_transacao, SUM(valor) as total FROM tb_financas_casa WHERE 1=1';
    const params = [];

    if (casa_id) { query += ' AND casa_id = ?'; params.push(casa_id); }
    if (data_inicio) { query += ' AND data >= ?'; params.push(data_inicio); }
    if (data_fim) { query += ' AND data <= ?'; params.push(data_fim); }
    if (tipo_despesa) { query += ' AND tipo_despesa = ?'; params.push(tipo_despesa); }

    query += ' GROUP BY tipo_transacao';

    const [rows] = await db.query(query, params);
    
    const summary = {
      credito: 0,
      debito: 0,
      saldo: 0
    };

    rows.forEach(row => {
      if (row.tipo_transacao === 'CREDITO') summary.credito = row.total;
      if (row.tipo_transacao === 'DEBITO') summary.debito = row.total;
    });

    summary.saldo = summary.credito - summary.debito;
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analytics Dashboard Endpoint
app.get('/api/financas-casa/estatisticas', authenticateToken, async (req, res) => {
  try {
    // 1. Totals by house
    const [houseTotals] = await db.query(`
      SELECT c.nome, SUM(f.valor) as total, f.tipo_transacao
      FROM tb_financas_casa f
      JOIN tb_casas_religiosas c ON f.casa_id = c.id
      GROUP BY c.id, f.tipo_transacao
    `);

    // 2. Data by month (last 6 months)
    const [monthlyStats] = await db.query(`
      SELECT DATE_FORMAT(data, '%Y-%m') as mes, tipo_transacao, SUM(valor) as total
      FROM tb_financas_casa
      WHERE data >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes, tipo_transacao
      ORDER BY mes ASC
    `);

    // 3. Largest single transactions
    const [largeTransactions] = await db.query(`
      SELECT f.*, c.nome as casa_nome
      FROM tb_financas_casa f
      JOIN tb_casas_religiosas c ON f.casa_id = c.id
      ORDER BY valor DESC LIMIT 5
    `);

    res.json({ houseTotals, monthlyStats, largeTransactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Access Logs Endpoint
app.get('/api/logs-acesso', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.nome as usuario_nome, u.login as usuario_login
      FROM tb_logs_acesso l
      LEFT JOIN tb_usuarios u ON l.usuario_id = u.id
      ORDER BY l.created_at DESC LIMIT 200
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Documents
app.get('/api/usuarios/:id/documentos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_documentos WHERE usuario_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios/:id/documentos', authenticateToken, upload.single('arquivo'), async (req, res) => {
  const { descricao } = req.body;
  if (!req.file) return res.status(400).json({ message: 'Arquivo não enviado' });
  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  try {
    const filePath = `/uploads/documentos/${req.file.filename}`;
    const [result] = await db.query(
      'INSERT INTO tb_documentos (usuario_id, descricao, arquivo_path, arquivo_nome, tipo_arquivo) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, descricao, filePath, req.file.originalname, ext]
    );
    await logAction(req.user.id, 'UPLOAD_DOCUMENTO', 'tb_documentos', `Documento "${descricao}" enviado para usuario ${req.params.id}`);
    res.json({ success: true, id: result.insertId, arquivo_path: filePath, arquivo_nome: req.file.originalname, tipo_arquivo: ext, descricao });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/usuarios/:id/documentos/:doc_id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_documentos WHERE id = ? AND usuario_id = ?', [req.params.doc_id, req.params.id]);
    if (rows.length > 0) {
      const fullPath = path.join(__dirname, rows[0].arquivo_path);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    await db.query('DELETE FROM tb_documentos WHERE id = ? AND usuario_id = ?', [req.params.doc_id, req.params.id]);
    await logAction(req.user.id, 'DELETE_DOCUMENTO', 'tb_documentos', `Documento ${req.params.doc_id} removido`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notifications
app.get('/api/notificacoes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tb_notificacoes WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/notificacoes/:id/lida', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE tb_notificacoes SET lida = TRUE WHERE id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/notificacoes/ler-todas', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE tb_notificacoes SET lida = TRUE WHERE usuario_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM tb_usuarios');
    const [houseCount] = await db.query('SELECT COUNT(*) as count FROM tb_casas_religiosas');
    const [itineraryCount] = await db.query('SELECT COUNT(*) as count FROM tb_itinerario_formativo');
    
    res.json({
      totalUsers: userCount[0].count,
      totalHouses: houseCount[0].count,
      totalItineraries: itineraryCount[0].count,
      recentActivities: [
        { id: 1, user: 'Admin', activity: 'Sistema pronto', time: 'Agora mesmo' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/stats', authenticateToken, async (req, res) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM tb_usuarios');
    const [houseCount] = await db.query('SELECT COUNT(*) as count FROM tb_casas_religiosas');
    const [itineraryCount] = await db.query('SELECT COUNT(*) as count FROM tb_itinerario_formativo');
    
    res.json({
      totalUsers: userCount[0].count,
      totalHouses: houseCount[0].count,
      totalItineraries: itineraryCount[0].count,
      recentActivities: [
        { id: 1, user: 'Admin', activity: 'Sistema pronto', time: 'Agora mesmo' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed Admin User
const seedAdmin = async () => {
  try {
    const login = 'admin@teste.com';
    const password = 'F9289*#s';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [rows] = await db.query('SELECT * FROM tb_usuarios WHERE login = ?', [login]);
    if (rows.length === 0) {
      await db.query(
        'INSERT INTO tb_usuarios (nome, login, password_hash, role, status, situacao) VALUES (?, ?, ?, ?, ?, ?)',
        ['Administrador Geral', login, hashedPassword, 'ADMIN_GERAL', 'ATIVO', 'ATIVO']
      );
      console.log('✅ Admin user seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - Seed Error: ${error.stack}\n`);
  }
};

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await seedAdmin();
});

// Final catch-all for 404s (to distinguish from Apache 404)
app.use((req, res) => {
  console.log(`[404] No route for ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found in Node.js', 
    method: req.method, 
    path: req.originalUrl,
    hint: 'Check if the /api prefix is being handled correctly by the proxy'
  });
});
