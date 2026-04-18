const pool = require('./db');

async function runMigration9() {
  try {
    console.log("Creating financial spreadsheet tables...");
    
    // 1. Header table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_financas_mensais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        casa_id INT NOT NULL,
        mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
        status ENUM('PENDENTE', 'VALIDADO') DEFAULT 'PENDENTE',
        total_credito DECIMAL(10,2) DEFAULT 0,
        total_debito DECIMAL(10,2) DEFAULT 0,
        apontamentos TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY user_month (usuario_id, mes_referencia),
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (casa_id) REFERENCES tb_casas_religiosas(id) ON DELETE CASCADE
      )
    `);

    // 2. Items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_financas_mensais_itens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planilha_id INT NOT NULL,
        categoria_id INT NOT NULL,
        valor DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (planilha_id) REFERENCES tb_financas_mensais(id) ON DELETE CASCADE,
        FOREIGN KEY (categoria_id) REFERENCES tb_categorias_financas(id) ON DELETE CASCADE
      )
    `);

    console.log("Migration 9 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 9 failed:", error);
    process.exit(1);
  }
}

runMigration9();
