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
// Servir arquivos estáticos (HTML/CSS/JS)
// -------------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------------------
// Banco de Dados (arquivo no Render: /data/chavesvr.db)
// -------------------------------------------------------
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco:", err.message);
    } else {
        console.log("Banco conectado:", dbPath);
    }
});

// -------------------------------------------------------
// Criar Tabelas (com Blocos integrados)
// -------------------------------------------------------
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

// =======================================================
// ROTAS - EMPREENDIMENTOS
// =======================================================

// Listar empreendimentos
app.get("/empreendimentos", (req, res) => {
    db.all("SELECT * FROM empreendimentos ORDER BY nome ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erro ao listar empreendimentos" });
        res.json(rows);
    });
});

// Criar empreendimento
app.post("/empreendimentos", (req, res) => {
    const { nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao } = req.body;

    const sql = `
        INSERT INTO empreendimentos (nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao], function (err) {
        if (err) return res.status(500).json({ error: "Erro ao salvar empreendimento" });

        res.json({ message: "Empreendimento criado", id: this.lastID });
    });
});

// Editar empreendimento
app.put("/empreendimentos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao } = req.body;

    const sql = `
        UPDATE empreendimentos SET
            nome=?, cidade=?, uf=?, fase=?, dataEntrega=?, codigoInterno=?, observacao=?
        WHERE id=?
    `;

    db.run(sql, [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao, id], function (err) {
        if (err) return res.status(500).json({ error: "Erro ao atualizar empreendimento" });

        res.json({ message: "Empreendimento atualizado" });
    });
});

// =======================================================
// ROTAS - BLOCOS
// =======================================================

// Listar blocos por empreendimento
app.get("/blocos/:empreendimento_id", (req, res) => {
    const { empreendimento_id } = req.params;

    db.all(
        "SELECT * FROM blocos WHERE empreendimento_id = ? ORDER BY nome ASC",
        [empreendimento_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "Erro ao listar blocos" });
            res.json(rows);
        }
    );
});

// Criar bloco
app.post("/blocos", (req, res) => {
    const { empreendimento_id, nome, observacao } = req.body;

    const sql = `
        INSERT INTO blocos (empreendimento_id, nome, observacao)
        VALUES (?, ?, ?)
    `;

    db.run(sql, [empreendimento_id, nome, observacao], function (err) {
        if (err) return res.status(500).json({ error: "Erro ao salvar bloco" });

        res.json({ message: "Bloco criado", id: this.lastID });
    });
});

// Editar bloco
app.put("/blocos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, observacao } = req.body;

    const sql = `
        UPDATE blocos SET nome=?, observacao=? WHERE id=?
    `;

    db.run(sql, [nome, observacao, id], function (err) {
        if (err) return res.status(500).json({ error: "Erro ao atualizar bloco" });

        res.json({ message: "Bloco atualizado" });
    });
});

// =======================================================
// ROTAS - UNIDADES
// =======================================================

// Listar unidades por bloco
app.get("/unidades/:bloco_id", (req, res) => {
    const { bloco_id } = req.params;

    db.all(
        "SELECT * FROM unidades WHERE bloco_id = ? ORDER BY unidade ASC",
        [bloco_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "Erro ao listar unidades" });
            res.json(rows);
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

    const sql = `
        INSERT INTO unidades (
            bloco_id, unidade, situacao, statusFinanceiro, habitavel, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao, agendadoPor, observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
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
        ],
        function (err) {
            if (err) {
                console.log("Erro ao gravar:", err);
                return res.status(500).json({ error: "Erro ao salvar unidade" });
            }
            res.json({ message: "Unidade criada", id: this.lastID });
        }
    );
});

// Editar unidade
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

    const sql = `
        UPDATE unidades SET
            bloco_id=?, unidade=?, situacao=?, statusFinanceiro=?, habitavel=?,
            cvco=?, chaves=?, dataVistoria=?, horaVistoria=?, dataLiberacao=?,
            agendadoPor=?, observacao=?
        WHERE id=?
    `;

    db.run(
        sql,
        [
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
            observacao,
            id
        ],
        function (err) {
            if (err) return res.status(500).json({ error: "Erro ao atualizar unidade" });

            res.json({ message: "Unidade atualizada" });
        }
    );
});

// =======================================================
// Servidor
// =======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Servidor rodando na porta", PORT);
});
