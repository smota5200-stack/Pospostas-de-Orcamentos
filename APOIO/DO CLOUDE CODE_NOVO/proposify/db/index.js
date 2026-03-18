const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// Cria as tabelas se não existirem
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS orcamentos (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(50) UNIQUE NOT NULL,
        cli_nome VARCHAR(255),
        cli_empresa VARCHAR(255),
        cli_cnpj VARCHAR(20),
        cli_ac VARCHAR(255),
        cli_email VARCHAR(255),
        cli_tel VARCHAR(20),
        emi_nome VARCHAR(255),
        emi_cnpj VARCHAR(20),
        emi_email VARCHAR(255),
        emi_tel VARCHAR(20),
        prop_data DATE,
        prop_validade VARCHAR(100),
        cond_pag VARCHAR(255),
        obs TEXT,
        moeda VARCHAR(10) DEFAULT 'BRL',
        total NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'rascunho',
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orcamento_itens (
        id SERIAL PRIMARY KEY,
        orcamento_id INTEGER REFERENCES orcamentos(id) ON DELETE CASCADE,
        descricao TEXT,
        quantidade NUMERIC(10,2) DEFAULT 1,
        preco_unitario NUMERIC(12,2) DEFAULT 0,
        total NUMERIC(12,2) DEFAULT 0,
        garantia VARCHAR(100),
        ordem INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Banco de dados inicializado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
