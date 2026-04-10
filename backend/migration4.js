const pool = require('./db');

async function runMigration4() {
  try {
    console.log("Creating tb_logs_acesso...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_logs_acesso (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        tipo ENUM('LOGIN', 'LOGOUT', 'FALHA', 'TROCA_SENHA') NOT NULL,
        ip_address VARCHAR(45),
        detalhes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE SET NULL
      )
    `);

    console.log("Migration 4 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 4 failed:", error);
    process.exit(1);
  }
}

runMigration4();
