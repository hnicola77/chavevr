/************************************************************
 * ChaveVR — Backend Novo (Modelo Excel VR)
 * Simples, direto e totalmente estável
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
// Banco de dados
// ----------------------------------------------------------
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("❌ Erro ao conectar:", err.message);
    else console.log("✅ Banco conectado:", dbPath);
});

// ----------------------------------------------------------
// Criar tabelas
// ----------------------------------------------------------
db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS empreendimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            cidade TEXT,
            uf TEXT,
            fase TEXT,
            dataEntrega TEXT,
            codigoInterno TEXT,
            observacao TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS blocos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empreendimento_id INTEGER,
            nome TEXT,
            observacao TEXT,
            FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS unidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empreendimento_id INTEGER,
            bloco_id INTEGER,
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
            observacao TEXT,
            FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id),
            FOREIGN KEY (bloco_id) REFERENCES blocos(id)
        )
    `);
});

// ==========================================================
// EMPREENDIMENTOS
// ==========================================================

// Listar
app.get("/empreendimentos", (_, res) => {
    db.all("SELECT * FROM empreendimentos ORDER BY nome ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Salvar em lote
app.post("/empreendimentos/salvar", (req, res) => {
    const lista = req.body;

    db.serialize(() => {

        // Apaga tudo antes
        db.run("DELETE FROM empreendimentos");

        const stmt = db.prepare(`
            INSERT INTO empreendimentos 
            (id, nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        lista.forEach(e => {
            stmt.run(
                e.id || null,
                e.nome,
                e.cidade,
                e.uf,
                e.fase,
                e.dataEntrega,
                e.codigoInterno,
                e.observacao
            );
        });

        stmt.finalize();
    });

    res.json({ message: "Empreendimentos salvos com sucesso." });
});

// ==========================================================
// BLOCOS
// ==========================================================

// Listar todos blocos
app.get("/blocos", (_, res) => {
    db.all(`
        SELECT b.*, e.nome AS emp_nome 
        FROM blocos b
        LEFT JOIN empreendimentos e ON e.id = b.empreendimento_id
        ORDER BY e.nome ASC, b.nome ASC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Salvar blocos em lote
app.post("/blocos/salvar", (req, res) => {
    const lista = req.body;

    db.serialize(() => {
        db.run("DELETE FROM blocos");

        const stmt = db.prepare(`
            INSERT INTO blocos (id, empreendimento_id, nome, observacao)
            VALUES (?, ?, ?, ?)
        `);

        lista.forEach(b => {
            stmt.run(
                b.id || null,
                b.empreendimento_id,
                b.nome,
                b.observacao
            );
        });

        stmt.finalize();
    });

    res.json({ message: "Blocos salvos com sucesso." });
});

// ==========================================================
// UNIDADES
// ==========================================================

// Listar unidades completas
app.get("/unidades", (_, res) => {
    db.all(`
        SELECT u.*, 
               e.nome AS emp_nome,
               b.nome AS bloco_nome
        FROM unidades u
        LEFT JOIN empreendimentos e ON e.id = u.empreendimento_id
        LEFT JOIN blocos b ON b.id = u.bloco_id
        ORDER BY e.nome, b.nome, u.unidade
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Salvar unidades em lote
app.post("/unidades/salvar", (req, res) => {
    const lista = req.body;

    db.serialize(() => {
        db.run("DELETE FROM unidades");

        const stmt = db.prepare(`
            INSERT INTO unidades (
                id, empreendimento_id, bloco_id, unidade, situacao,
                statusFinanceiro, habitavel, cvco, chaves,
                dataVistoria, horaVistoria, dataLiberacao,
                agendadoPor, observacao
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        lista.forEach(u => {
            stmt.run(
                u.id || null,
                u.empreendimento_id,
                u.bloco_id,
                u.unidade,
                u.situacao,
                u.statusFinanceiro,
                u.habitavel,
                u.cvco,
                u.chaves,
                u.dataVistoria,
                u.horaVistoria,
                u.dataLiberacao,
                u.agendadoPor,
                u.observacao
            );
        });

        stmt.finalize();
    });

    res.json({ message: "Unidades salvas com sucesso." });
});

// ==========================================================
// INICIAR SERVIDOR
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 ChaveVR rodando na porta", PORT));
