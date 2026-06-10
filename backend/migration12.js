const pool = require('./db');

async function runMigration12() {
  try {
    console.log("Creating tb_contatos table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_contatos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        parentesco VARCHAR(100) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        endereco VARCHAR(255),
        telefone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration 12 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 12 failed:", error);
    process.exit(1);
  }
}

runMigration12();
