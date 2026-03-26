const pool = require('./db');

async function checkUser() {
  try {
    const [rows] = await pool.query('SELECT * FROM tb_usuarios WHERE login = ?', ['admin@teste.com']);
    console.log('User found:', rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error querying database:', err);
    process.exit(1);
  }
}

checkUser();
