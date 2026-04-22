const pool = require('./db');

async function runMigration11() {
  try {
    console.log("Starting Migration 11: Situations and Financial Approval Flow...");

    // 1. Update tb_financas_mensais status to include 'DEVOLVIDO'
    console.log("Updating tb_financas_mensais status enum...");
    await pool.query(`
      ALTER TABLE tb_financas_mensais 
      MODIFY COLUMN status ENUM('PENDENTE', 'VALIDADO', 'DEVOLVIDO') DEFAULT 'PENDENTE'
    `);

    // 2. Create tb_financas_consolidado
    console.log("Creating tb_financas_consolidado table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_financas_consolidado (
        id INT AUTO_INCREMENT PRIMARY KEY,
        casa_id INT NOT NULL,
        mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
        status ENUM('PENDENTE_ECONOMO', 'PENDENTE_SUPERIOR', 'APROVADO', 'DEVOLVIDO_SUPERIOR') DEFAULT 'PENDENTE_ECONOMO',
        apontamentos_economo TEXT,
        apontamentos_superior TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY house_month (casa_id, mes_referencia),
        FOREIGN KEY (casa_id) REFERENCES tb_casas_religiosas(id) ON DELETE CASCADE
      )
    `);

    // 3. Create tb_dados_situacao
    console.log("Creating tb_dados_situacao table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tb_dados_situacao (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        
        -- Falecido
        data_falecimento DATE,
        cidade_falecimento VARCHAR(255),
        certidao_obito_path VARCHAR(500),
        local_sepultamento VARCHAR(255),
        
        -- Egresso
        egresso_incardinado_path VARCHAR(500),
        egresso_desistencia_path VARCHAR(500),
        egresso_laicizado_path VARCHAR(500),
        egresso_transf_para_regiao_path VARCHAR(500),
        egresso_transf_da_regiao_path VARCHAR(500),
        
        -- Exclaustrado
        exclaustrado_data DATE,
        exclaustrado_processo VARCHAR(500), -- Path to doc or text
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY user_situation (usuario_id),
        FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log("Migration 11 completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration 11 failed:", error);
    process.exit(1);
  }
}

runMigration11();
