const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// ── GET /api/orcamentos ── listar todos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, numero, cli_nome, cli_empresa, total, status, moeda, criado_em
       FROM orcamentos ORDER BY criado_em DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orcamentos/:id ── buscar um
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orcamentos WHERE id=$1', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });

    const { rows: itens } = await pool.query(
      'SELECT * FROM orcamento_itens WHERE orcamento_id=$1 ORDER BY ordem',
      [req.params.id]
    );
    res.json({ ...rows[0], itens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orcamentos ── criar
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      numero, cli_nome, cli_empresa, cli_cnpj, cli_ac, cli_email, cli_tel,
      emi_nome, emi_cnpj, emi_email, emi_tel,
      prop_data, prop_validade, cond_pag, obs, moeda, total,
      itens = []
    } = req.body;

    const { rows } = await client.query(`
      INSERT INTO orcamentos
        (numero, cli_nome, cli_empresa, cli_cnpj, cli_ac, cli_email, cli_tel,
         emi_nome, emi_cnpj, emi_email, emi_tel,
         prop_data, prop_validade, cond_pag, obs, moeda, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [numero, cli_nome, cli_empresa, cli_cnpj, cli_ac, cli_email, cli_tel,
       emi_nome, emi_cnpj, emi_email, emi_tel,
       prop_data || null, prop_validade, cond_pag, obs, moeda || 'BRL', total || 0]
    );

    const orcId = rows[0].id;
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];
      await client.query(`
        INSERT INTO orcamento_itens
          (orcamento_id, descricao, quantidade, preco_unitario, total, garantia, ordem)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orcId, it.descricao, it.quantidade || 1, it.preco_unitario || 0,
         it.total || 0, it.garantia, i]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: orcId, numero, message: 'Orçamento salvo com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Número de orçamento já existe.' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── PUT /api/orcamentos/:id ── atualizar
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      cli_nome, cli_empresa, cli_cnpj, cli_ac, cli_email, cli_tel,
      emi_nome, emi_cnpj, emi_email, emi_tel,
      prop_data, prop_validade, cond_pag, obs, moeda, total, status,
      itens = []
    } = req.body;

    await client.query(`
      UPDATE orcamentos SET
        cli_nome=$1, cli_empresa=$2, cli_cnpj=$3, cli_ac=$4, cli_email=$5, cli_tel=$6,
        emi_nome=$7, emi_cnpj=$8, emi_email=$9, emi_tel=$10,
        prop_data=$11, prop_validade=$12, cond_pag=$13, obs=$14,
        moeda=$15, total=$16, status=$17, atualizado_em=NOW()
      WHERE id=$18`,
      [cli_nome, cli_empresa, cli_cnpj, cli_ac, cli_email, cli_tel,
       emi_nome, emi_cnpj, emi_email, emi_tel,
       prop_data || null, prop_validade, cond_pag, obs,
       moeda || 'BRL', total || 0, status || 'rascunho', req.params.id]
    );

    await client.query('DELETE FROM orcamento_itens WHERE orcamento_id=$1', [req.params.id]);
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i];
      await client.query(`
        INSERT INTO orcamento_itens
          (orcamento_id, descricao, quantidade, preco_unitario, total, garantia, ordem)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.params.id, it.descricao, it.quantidade || 1, it.preco_unitario || 0,
         it.total || 0, it.garantia, i]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Orçamento atualizado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── DELETE /api/orcamentos/:id ── deletar
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orcamentos WHERE id=$1', [req.params.id]);
    res.json({ message: 'Orçamento deletado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
