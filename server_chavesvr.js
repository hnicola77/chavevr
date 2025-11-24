/************************************************************
 * ChaveVR – Backend Simplificado (Versão Final)
 * Tabela ÚNICA: unidades
 * Empreendimentos e blocos são FIXOS no frontend
 ************************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ----------------------------------------------------------
// Servir arquivos estáticos
// ----------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------
// SQLite – banco principal
// ----------------------------------------------------------
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("❌ Erro ao conectar:", err.message);
    else console.log("✅ Banco conectado:", dbPath);
});

// ----------------------------------------------------------
// Criar Tabela Única
// ----------------------------------------------------------
db.run(`
    CREATE TABLE IF NOT EXISTS unidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        empreendimento TEXT,
        bloco TEXT,
        unidade TEXT,
        situacao TEXT,
        statusFinanceiro TEXT,
        habitavel TEXT,
        cvco TEXT,
        chaves TEXT,
        dataVistoria TEXT,
        horaVistoria TEXT,
        dataLiberacao TEXT,
        agendadoPor TEXT,
        observacao TEXT
    )
`);

// ==========================================================
// ROTAS – UNIDADES
// ==========================================================

// Listar todas unidades
app.get("/unidades", (req, res) => {
    db.all("SELECT * FROM unidades ORDER BY empreendimento, bloco, unidade", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Criar nova unidade
app.post("/unidades", (req, res) => {
    const u = req.body;

    const sql = `
        INSERT INTO unidades (
            empreendimento, bloco, unidade, situacao,
            statusFinanceiro, habitavel, cvco, chaves,
            dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        u.empreendimento, u.bloco, u.unidade, u.situacao,
        u.statusFinanceiro, u.habitavel, u.cvco, u.chaves,
        u.dataVistoria, u.horaVistoria, u.dataLiberacao,
        u.agendadoPor, u.observacao
    ], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Unidade criada", id: this.lastID });
    });
});

// Editar unidade
app.put("/unidades/:id", (req, res) => {
    const id = req.params.id;
    const u = req.body;

    const sql = `
        UPDATE unidades SET
            empreendimento=?, bloco=?, unidade=?, situacao=?,
            statusFinanceiro=?, habitavel=?, cvco=?, chaves=?,
            dataVistoria=?, horaVistoria=?, dataLiberacao=?,
            agendadoPor=?, observacao=?
        WHERE id=?
    `;

    db.run(sql, [
        u.empreendimento, u.bloco, u.unidade, u.situacao,
        u.statusFinanceiro, u.habitavel, u.cvco, u.chaves,
        u.dataVistoria, u.horaVistoria, u.dataLiberacao,
        u.agendadoPor, u.observacao, id
    ], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Unidade atualizada" });
    });
});

// Excluir unidade
app.delete("/unidades/:id", (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM unidades WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ message: "Unidade excluída" });
    });
});

// ==========================================================
// INICIAR SERVIDOR
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 ChaveVR rodando na porta", PORT));
