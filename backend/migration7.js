const db = require('./db');

async function migrate() {
  try {
    console.log('Starting migration v7...');

    // 1. Add columns to tb_casas_religiosas
    console.log('Updating tb_casas_religiosas...');
    await db.query(`
      ALTER TABLE tb_casas_religiosas 
      ADD COLUMN IF NOT EXISTS regional VARCHAR(255),
      ADD COLUMN IF NOT EXISTS data_referencia_casa DATE;
    `);

    // 2. Create tb_categorias_financas
    console.log('Creating tb_categorias_financas...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS tb_categorias_financas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo ENUM('CREDITO', 'DEBITO') NOT NULL,
        categoria_pai ENUM('PESSOAL', 'CASA') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 3. Add column to tb_financas_casa
    console.log('Updating tb_financas_casa...');
    await db.query(`
      ALTER TABLE tb_financas_casa 
      ADD COLUMN IF NOT EXISTS categoria_id INT,
      ADD COLUMN IF NOT EXISTS tipo_despesa ENUM('PESSOAL', 'CASA') DEFAULT 'CASA',
      ADD CONSTRAINT fk_financas_categoria FOREIGN KEY (categoria_id) REFERENCES tb_categorias_financas(id) ON DELETE SET NULL;
    `);

    // 4. Pre-populate some common categories
    console.log('Populating default categories...');
    const [existing] = await db.query('SELECT COUNT(*) as count FROM tb_categorias_financas');
    if (existing[0].count === 0) {
      await db.query(`
        INSERT INTO tb_categorias_financas (nome, tipo, categoria_pai) VALUES 
        ('Aluguel', 'DEBITO', 'CASA'),
        ('Energia Elétrica', 'DEBITO', 'CASA'),
        ('Água', 'DEBITO', 'CASA'),
        ('Internet', 'DEBITO', 'CASA'),
        ('Supermercado', 'DEBITO', 'CASA'),
        ('Saúde/Medicamentos', 'DEBITO', 'PESSOAL'),
        ('Vestuário', 'DEBITO', 'PESSOAL'),
        ('Transporte', 'DEBITO', 'PESSOAL'),
        ('Doações', 'CREDITO', 'CASA'),
        ('Congregação', 'CREDITO', 'CASA');
      `);
    }

    console.log('Migration v7 completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
