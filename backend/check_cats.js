const pool = require('./db');

async function checkCategories() {
  try {
    const [rows] = await pool.query('SELECT * FROM tb_categorias_financas');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking categories:', error);
    process.exit(1);
  }
}

checkCategories();
