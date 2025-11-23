// =======================================================
// ChaveVR - Servidor Node + Express + SQLite
// =======================================================

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// -------------------------------------------------------
// Servir arquivos estáticos
// -------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------------------
// Banco de Dados
// -------------------------------------------------------
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Erro ao conectar ao banco:", err.message);
    else console.log("Banco conectado:", dbPath);
});

// -------------------------------------------------------
// Criar tabelas
// -------------------------------------------------------
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
            FOREIGN KEY (bloco_id) REFERENCES blocos(id)
        )
    `);

});

// =======================================================
// ROTAS — EMPREENDIMENTOS
// =======================================================

app.get("/empreendimentos", (req, res) => {
    db.all("SELECT * FROM empreendimentos ORDER BY nome ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erro ao listar" });
        res.json(rows);
    });
});

app.post("/empreendimentos", (req, res) => {
    const { nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao } = req.body;

    db.run(`
        INSERT INTO empreendimentos (nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
        [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao],
        function (err) {
            if (err) return res.status(500).json({ error: "Erro ao salvar empreendimento" });
            res.json({ message: "Criado", id: this.lastID });
        }
    );
});

// =======================================================
// ROTAS — BLOCOS
// =======================================================

app.get("/blocos/:empId", (req, res) => {
    db.all(
        "SELECT * FROM blocos WHERE empreendimento_id = ? ORDER BY nome ASC",
        [req.params.empId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "Erro ao listar" });
            res.json(rows);
        }
    );
});

app.post("/blocos", (req, res) => {
    const { empreendimento_id, nome, observacao } = req.body;

    db.run(`
        INSERT INTO blocos (empreendimento_id, nome, observacao)
        VALUES (?, ?, ?)
    `,
        [empreendimento_id, nome, observacao],
        function (err) {
            if (err) return res.status(500).json({ error: "Erro ao salvar bloco" });
            res.json({ message: "Criado", id: this.lastID });
        }
    );
});

// =======================================================
// ROTAS — UNIDADES
// =======================================================

app.get("/unidades/:blocoId", (req, res) => {
    db.all(
        "SELECT * FROM unidades WHERE bloco_id = ? ORDER BY unidade ASC",
        [req.params.blocoId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "Erro ao listar unidades" });
            res.json(rows);
        }
    );
});

// 👉 NOVA ROTA — Unidades completas (Dashboard)
app.get("/unidades_completas", (req, res) => {
    const sql = `
        SELECT 
            u.*,
            b.nome AS bloco_nome,
            e.nome AS emp_nome,
            e.id AS emp_id,
            b.id AS bloco_id
        FROM unidades u
        JOIN blocos b ON u.bloco_id = b.id
        JOIN empreendimentos e ON b.empreendimento_id = e.id
        ORDER BY e.nome, b.nome, u.unidade
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erro ao listar unidades completas" });
        res.json(rows);
    });
});

// Unidade por ID
app.get("/unidade/:id", (req, res) => {
    db.get("SELECT * FROM unidades WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar unidade" });
        res.json(row);
    });
});

// Criar unidade
app.post("/unidades", (req, res) => {

    const {
        bloco_id, unidade, situacao, statusFinanceiro, habitavel,
        cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
        agendadoPor, observacao
    } = req.body;

    db.run(`
        INSERT INTO unidades (
            bloco_id, unidade, situacao, statusFinanceiro, habitavel,
            cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            bloco_id, unidade, situacao, statusFinanceiro, habitavel, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao, agendadoPor, observacao
        ],
        function (err) {
            if (err) return res.status(500).json({ error: "Erro ao salvar unidade" });
            res.json({ message: "Criado", id: this.lastID });
        }
    );
});

// =======================================================
// INICIAR SERVIDOR
// =======================================================

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));
