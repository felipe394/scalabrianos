const pool = require('./db');

async function runMigration10() {
  try {
    console.log("Expanding missionary profile tables...");
    
    // 1. Add NIT to tb_dados_civis
    await pool.query(`
      ALTER TABLE tb_dados_civis 
      ADD COLUMN IF NOT EXISTS nit VARCHAR(50) AFTER passaporte_doc_path
    `);

    // 2. Academic Formation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_formacao_academica (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        curso VARCHAR(255),
        faculdade VARCHAR(255),
        periodo VARCHAR(100),
        doc_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    // 3. Missionary Activity
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_atividade_missionaria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        periodo VARCHAR(255),
        lugar VARCHAR(255),
        missao TEXT,
        doc_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    // 4. Health
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_saude (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        sus_card VARCHAR(100),
        seguradora VARCHAR(255),
        numero_carteira VARCHAR(100),
        doc_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    // 5. Bank Accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_contas_bancarias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo_conta VARCHAR(100),
        titularidade VARCHAR(255),
        agencia VARCHAR(50),
        numero VARCHAR(50),
        doc_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    // 6. Works Done
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_obras_realizadas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        periodo VARCHAR(255),
        lugar VARCHAR(255),
        obra TEXT,
        doc_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    // 7. General Observations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_observacoes_gerais (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        texto TEXT,
        doc_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log("Migration 10 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 10 failed:", error);
    process.exit(1);
  }
}

runMigration10();
