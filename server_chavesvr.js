// ===============================================================
// CHAVEVR - BACKEND COMPLETO (Versão Final)
// Compatível com: FRONTEND vA + Render.com + SQLite
// ===============================================================

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ============================
// BANCO DE DADOS (Render ou Local)
// ============================
const isRender = !!process.env.RENDER;

let dbPath;
if (isRender) {
    dbPath = "/data/chavesvr.db"; // Render cria automaticamente
} else {
    dbPath = path.join(__dirname, "chavesvr.db"); // Local
}

console.log("Banco sendo usado em:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco:", err);
    } else {
        console.log("Banco conectado com sucesso!");
    }
});

// ============================
// CRIAÇÃO DA TABELA "unidades"
// ============================
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS unidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unidade TEXT,
            empreendimento TEXT,
            status TEXT,
            obs TEXT
        );
    `);
});

// ============================
// SERVIR ARQUIVOS DO FRONTEND
// ============================
app.use(express.static(path.join(__dirname, "public")));

// ============================
// ROTAS DA API
// ============================

// LISTAR TODAS
app.get("/api/unidades", (req, res) => {
    db.all("SELECT * FROM unidades ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error("Erro ao listar unidades:", err);
            return res.status(500).json({ error: "Erro ao listar" });
        }
        res.json(rows);
    });
});

// CRIAR
app.post("/api/unidades", (req, res) => {
    const { unidade, empreendimento, status, obs } = req.body;

    const sql = `
        INSERT INTO unidades (unidade, empreendimento, status, obs)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [unidade, empreendimento, status, obs], function (err) {
        if (err) {
            console.error("Erro ao inserir unidade:", err);
            return res.status(500).json({ error: "Erro ao cadastrar" });
        }
        res.json({ id: this.lastID });
    });
});

// EDITAR
app.put("/api/unidades/:id", (req, res) => {
    const { id } = req.params;
    const { unidade, empreendimento, status, obs } = req.body;

    const sql = `
        UPDATE unidades
        SET unidade = ?, empreendimento = ?, status = ?, obs = ?
        WHERE id = ?
    `;

    db.run(sql, [unidade, empreendimento, status, obs, id], function (err) {
        if (err) {
            console.error("Erro ao editar unidade:", err);
            return res.status(500).json({ error: "Erro ao editar" });
        }
        res.json({ success: true });
    });
});

// DELETAR
app.delete("/api/unidades/:id", (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM unidades WHERE id = ?`;

    db.run(sql, [id], function (err) {
        if (err) {
            console.error("Erro ao deletar unidade:", err);
            return res.status(500).json({ error: "Erro ao deletar" });
        }
        res.json({ success: true });
    });
});

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`ChaveVR rodando na porta ${PORT}`);
});
