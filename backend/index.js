const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://scalabrinianos.dev.connectortech.com.br'
  ],
  credentials: true
}));
app.use(express.json());

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Scalabrianos API is running' });
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM tb_usuarios WHERE login = ? AND status = ?', [email, 'ATIVO']);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado ou inativo' });
    }

    const user = rows[0];
    
    // For now, accept both hashed and plain text for the provided admin password
    // In a real app, always use bcrypt
    let isMatch = false;
    if (user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = (password === user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.login,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    fs.appendFileSync('debug.log', `${new Date().toISOString()} - Login Error: ${error.stack}\n`);
    res.status(500).json({ success: false, message: 'Erro no servidor: ' + error.message });
  }
});

// Generic CRUD endpoints for tables
// Users
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome, login, role, status, situacao FROM tb_usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/usuarios', authenticateToken, async (req, res) => {
  const { nome, login, password, role, status, situacao } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await db.query(
      'INSERT INTO tb_usuarios (nome, login, password_hash, role, status, situacao) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, login, hashedPassword, role, status, situacao]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/usuarios/:id', authenticateToken, async (req, res) => {
  const { nome, login, password, role, status, situacao } = req.body;
  const { id } = req.params;

  try {
    let query = 'UPDATE tb_usuarios SET nome = ?, login = ?, role = ?, status = ?, situacao = ?';
    let params = [nome, login, role, status, situacao];

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
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

app.post('/api/casas-religiosas', authenticateToken, async (req, res) => {
  const { nome, endereco, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tb_casas_religiosas (nome, endereco, status) VALUES (?, ?, ?)',
      [nome, endereco, status]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
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

app.post('/api/usuarios/:id/dados-civis', authenticateToken, async (req, res) => {
  const { data_nascimento, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM tb_dados_civis WHERE usuario_id = ?', [req.params.id]);
    if (rows.length > 0) {
      await db.query(
        'UPDATE tb_dados_civis SET data_nascimento=?, filiacao=?, cidade_estado=?, diocese=?, pais=?, naturalidade=?, rnm=?, cpf=?, titulo_eleitor=?, cnh=?, passaporte=? WHERE usuario_id=?',
        [data_nascimento, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO tb_dados_civis (usuario_id, data_nascimento, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, data_nascimento, filiacao, cidade_estado, diocese, pais, naturalidade, rnm, cpf, titulo_eleitor, cnh, passaporte]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

app.post('/api/usuarios/:id/dados-religiosos', authenticateToken, async (req, res) => {
  const { primeiros_votos_data, votos_perpetuos_data, lugar_profissao, diaconato_data, presbiterato_data, bispo_ordenante } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM tb_dados_religiosos WHERE usuario_id = ?', [req.params.id]);
    if (rows.length > 0) {
      await db.query(
        'UPDATE tb_dados_religiosos SET primeiros_votos_data=?, votos_perpetuos_data=?, lugar_profissao=?, diaconato_data=?, presbiterato_data=?, bispo_ordenante=? WHERE usuario_id=?',
        [primeiros_votos_data, votos_perpetuos_data, lugar_profissao, diaconato_data, presbiterato_data, bispo_ordenante, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO tb_dados_religiosos (usuario_id, primeiros_votos_data, votos_perpetuos_data, lugar_profissao, diaconato_data, presbiterato_data, bispo_ordenante) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, primeiros_votos_data, votos_perpetuos_data, lugar_profissao, diaconato_data, presbiterato_data, bispo_ordenante]
      );
    }
    res.json({ success: true });
  } catch (error) {
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

app.post('/api/usuarios/:id/endereco-contato', authenticateToken, async (req, res) => {
  const { logradouro, complemento, bairro, cep, cidade_estado, celular_whatsapp, telefone_fixo, email_pessoal } = req.body;
  try {
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

app.post('/api/usuarios/:id/itinerario', authenticateToken, async (req, res) => {
  const { stages } = req.body; // Expecting an array of stages
  try {
    // Basic implementation: Delete existing and insert new
    await db.query('DELETE FROM tb_itinerario_formativo WHERE usuario_id = ?', [req.params.id]);
    for (const stage of stages) {
      await db.query(
        'INSERT INTO tb_itinerario_formativo (usuario_id, etapa, local, periodo) VALUES (?, ?, ?, ?)',
        [req.params.id, stage.etapa, stage.local, stage.periodo]
      );
    }
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
      // For now, mock some data or add more queries if needed
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
