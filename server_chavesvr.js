// ===============================================================
// CHAVEVR - BACKEND COMPLETO VERSÃO FINAL
// ===============================================================

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ============================
// BANCO DE DADOS
// ============================
const dbPath = process.env.RENDER ? "/data/chavesvr.db" : path.join(__dirname, "chavesvr.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Erro ao conectar no banco:", err);
    else console.log("Banco conectado:", dbPath);
});

// ============================
// CRIAÇÃO DA TABELA
// ============================
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS unidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empreendimento TEXT,
            bloco TEXT,
            pavimento TEXT,
            unidade TEXT,
            situacao TEXT,
            status_financeiro TEXT,
            habite_se TEXT,
            cvco TEXT,
            chaves_entregues TEXT,
            data_vistoria TEXT,
            hora_vistoria TEXT,
            data_liberacao TEXT,
            agendado_por TEXT,
            observacao TEXT
        );
    `);
});

// ============================
// SERVE ARQUIVOS FRONT
// ============================
app.use(express.static(path.join(__dirname, "public")));

// ============================
// ROTAS API
// ============================

// LISTAR TODOS (ou filtrar por empreendimento)
app.get("/api/unidades", (req, res) => {
    const emp = req.query.empreendimento;
    const sql = emp ? 
        `SELECT * FROM unidades WHERE empreendimento = ?` :
        `SELECT * FROM unidades`;

    db.all(sql, emp ? [emp] : [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// LISTAR EMPREENDIMENTOS
app.get("/api/empreendimentos", (req, res) => {
    db.all(`SELECT DISTINCT empreendimento FROM unidades ORDER BY empreendimento ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.empreendimento));
    });
});

// CRIAR
app.post("/api/unidades", (req, res) => {
    const d = req.body;

    const sql = `
        INSERT INTO unidades 
        (empreendimento, bloco, pavimento, unidade, situacao, status_financeiro, habite_se, cvco, chaves_entregues, 
        data_vistoria, hora_vistoria, data_liberacao, agendado_por, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        d.empreendimento, d.bloco, d.pavimento, d.unidade, d.situacao, d.status_financeiro, d.habite_se, d.cvco, d.chaves_entregues,
        d.data_vistoria, d.hora_vistoria, d.data_liberacao, d.agendado_por, d.observacao
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

// EDITAR
app.put("/api/unidades/:id", (req, res) => {
    const d = req.body;
    const { id } = req.params;

    const sql = `
        UPDATE unidades SET 
        empreendimento=?, bloco=?, pavimento=?, unidade=?, situacao=?, status_financeiro=?, habite_se=?, cvco=?, chaves_entregues=?,
        data_vistoria=?, hora_vistoria=?, data_liberacao=?, agendado_por=?, observacao=?
        WHERE id=?
    `;
    
    const params = [
        d.empreendimento, d.bloco, d.pavimento, d.unidade, d.situacao, d.status_financeiro, d.habite_se, d.cvco, d.chaves_entregues,
        d.data_vistoria, d.hora_vistoria, d.data_liberacao, d.agendado_por, d.observacao,
        id
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: true });
    });
});

// DELETAR
app.delete("/api/unidades/:id", (req, res) => {
    db.run(`DELETE FROM unidades WHERE id=?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: true });
    });
});

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("ChaveVR rodando na porta", PORT));
