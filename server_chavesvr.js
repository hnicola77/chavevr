// ==========================================================
// ChaveVR - Backend Novo (Modelo B com Abas por Etapa)
// ==========================================================

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ----------------------------------------------------------
// Servindo arquivos estáticos
// ----------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------------
// Banco de dados
// ----------------------------------------------------------
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Erro ao conectar ao banco:", err.message);
    else console.log("🔌 Banco conectado:", dbPath);
});

// ----------------------------------------------------------
// Criar tabelas (NOVO MODELO)
// ----------------------------------------------------------
db.serialize(() => {

    // EMPREENDIMENTOS
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

    // BLOCOS
    db.run(`
        CREATE TABLE IF NOT EXISTS blocos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empreendimento_id INTEGER,
            nome TEXT,
            observacao TEXT,
            FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id)
        )
    `);

    // UNIDADES
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

// ==========================================================
// ROTAS — EMPREENDIMENTOS
// ==========================================================

// Listar
app.get("/empreendimentos", (req, res) => {
    db.all("SELECT * FROM empreendimentos ORDER BY nome ASC", [], (err, rows) => {
        if (err) res.status(500).json({ error: "Erro ao listar empreendimentos" });
        else res.json(rows);
    });
});

// Criar
app.post("/empreendimentos", (req, res) => {
    const { nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao } = req.body;

    db.run(`
        INSERT INTO empreendimentos 
        (nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
        [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao],
        function (err) {
            if (err) res.status(500).json({ error: "Erro ao salvar empreendimento" });
            else res.json({ message: "Empreendimento criado", id: this.lastID });
        }
    );
});

// Atualizar
app.put("/empreendimentos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao } = req.body;

    db.run(`
        UPDATE empreendimentos SET 
        nome=?, cidade=?, uf=?, fase=?, dataEntrega=?, codigoInterno=?, observacao=?
        WHERE id=?
    `,
        [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao, id],
        function (err) {
            if (err) res.status(500).json({ error: "Erro ao atualizar empreendimento" });
            else res.json({ message: "Atualizado" });
        }
    );
});

// ==========================================================
// ROTAS — BLOCOS
// ==========================================================

// Listar blocos de um empreendimento
app.get("/blocos/:empId", (req, res) => {
    db.all(
        "SELECT * FROM blocos WHERE empreendimento_id=? ORDER BY nome ASC",
        [req.params.empId],
        (err, rows) => {
            if (err) res.status(500).json({ error: "Erro ao listar blocos" });
            else res.json(rows);
        }
    );
});

// Criar bloco
app.post("/blocos", (req, res) => {
    const { empreendimento_id, nome, observacao } = req.body;

    db.run(`
        INSERT INTO blocos (empreendimento_id, nome, observacao)
        VALUES (?, ?, ?)
    `,
        [empreendimento_id, nome, observacao],
        function (err) {
            if (err) res.status(500).json({ error: "Erro ao salvar bloco" });
            else res.json({ message: "Bloco criado", id: this.lastID });
        }
    );
});

// Atualizar bloco
app.put("/blocos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, observacao } = req.body;

    db.run(`
        UPDATE blocos SET nome=?, observacao=? WHERE id=?
    `,
        [nome, observacao, id],
        function (err) {
            if (err) res.status(500).json({ error: "Erro ao atualizar bloco" });
            else res.json({ message: "Atualizado" });
        }
    );
});

// ==========================================================
// ROTAS — UNIDADES
// ==========================================================

// Listar unidades de um bloco
app.get("/unidades/:blocoId", (req, res) => {
    db.all(
        "SELECT * FROM unidades WHERE bloco_id=? ORDER BY unidade ASC",
        [req.params.blocoId],
        (err, rows) => {
            if (err) res.status(500).json({ error: "Erro ao listar unidades" });
            else res.json(rows);
        }
    );
});

// Criar unidade
app.post("/unidades", (req, res) => {
    const {
        bloco_id,
        unidade,
        situacao,
        statusFinanceiro,
        habitavel,
        cvco,
        chaves,
        dataVistoria,
        horaVistoria,
        dataLiberacao,
        agendadoPor,
        observacao
    } = req.body;

    db.run(`
        INSERT INTO unidades (
            bloco_id, unidade, situacao, statusFinanceiro, habitavel, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao, agendadoPor, observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
            bloco_id, unidade, situacao, statusFinanceiro, habitavel, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao, agendadoPor, observacao
        ],
        function (err) {
            if (err) res.status(500).json({ error: "Erro ao salvar unidade" });
            else res.json({ message: "Unidade criada", id: this.lastID });
        }
    );
});

// Atualizar unidade
app.put("/unidades/:id", (req, res) => {
    const { id } = req.params;

    const {
        bloco_id,
        unidade,
        situacao,
        statusFinanceiro,
        habitavel,
        cvco,
        chaves,
        dataVistoria,
        horaVistoria,
        dataLiberacao,
        agendadoPor,
        observacao
    } = req.body;

    db.run(`
        UPDATE unidades SET
        bloco_id=?, unidade=?, situacao=?, statusFinanceiro=?, habitavel=?, cvco=?,
        chaves=?, dataVistoria=?, horaVistoria=?, dataLiberacao=?, agendadoPor=?, observacao=?
        WHERE id=?
    `,
        [
            bloco_id, unidade, situacao, statusFinanceiro, habitavel, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao, agendadoPor, observacao, id
        ],
        function (err) {
            if (err) res.status(500).json({ error: "Erro ao atualizar unidade" });
            else res.json({ message: "Unidade atualizada" });
        }
    );
});

// ==========================================================
// Servidor
// ==========================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("🚀 Servidor ChaveVR rodando na porta", PORT);
});
