const pool = require('./db');

async function runMigration3() {
  try {
    console.log("Creating tb_notificacoes...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        mensagem TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'INFO',
        lida BOOLEAN DEFAULT FALSE,
        link_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log("Migration 3 completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 3 failed:", error);
    process.exit(1);
  }
}

runMigration3();
