/***************************************************************
 * ChaveVR - Servidor Node + Express + SQLite
 * Versão FINAL corrigida e compatível com todo o sistema
 ***************************************************************/

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "public")));

// Caminho do banco (Render)
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Erro ao conectar ao banco:", err.message);
    else console.log("Banco conectado:", dbPath);
});

/***************************************************************
 * CRIAÇÃO DAS TABELAS
 ***************************************************************/
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

/***************************************************************
 * ROTAS DE EMPREENDIMENTOS
 ***************************************************************/
app.get("/empreendimentos", (req, res) => {
    db.all("SELECT * FROM empreendimentos ORDER BY nome ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erro ao listar empreendimentos" });
        res.json(rows);
    });
});

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

app.put("/empreendimentos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao } = req.body;

    const sql = `
        UPDATE empreendimentos SET
            nome=?, cidade=?, uf=?, fase=?, dataEntrega=?, codigoInterno=?, observacao=?
        WHERE id=?
    `;

    db.run(sql, [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao, id], function (err) {
        if (err) return res.status(500).json({ error: "Erro ao atualizar" });
        res.json({ message: "Empreendimento atualizado" });
    });
});

/***************************************************************
 * ROTAS DE BLOCOS
 ***************************************************************/
app.get("/blocos/:empId", (req, res) => {
    db.all(
        "SELECT * FROM blocos WHERE empreendimento_id = ? ORDER BY nome ASC",
        [req.params.empId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "Erro ao listar blocos" });
            res.json(rows);
        }
    );
});

app.post("/blocos", (req, res) => {
    const { empreendimento_id, nome, observacao } = req.body;

    db.run(
        `INSERT INTO blocos (empreendimento_id, nome, observacao) VALUES (?, ?, ?)`,
        [empreendimento_id, nome, observacao],
        function (err) {
            if (err) return res.status(500).json({ error: "Erro ao salvar bloco" });
            res.json({ message: "Bloco criado", id: this.lastID });
        }
    );
});

app.put("/blocos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, observacao } = req.body;

    db.run(
        `UPDATE blocos SET nome=?, observacao=? WHERE id=?`,
        [nome, observacao, id],
        (err) => {
            if (err) return res.status(500).json({ error: "Erro ao atualizar bloco" });
            res.json({ message: "Bloco atualizado" });
        }
    );
});

/***************************************************************
 * ROTAS DE UNIDADES
 ***************************************************************/
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

app.post("/unidades", (req, res) => {
    const {
        bloco_id, unidade, situacao, statusFinanceiro, habitavel,
        cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
        agendadoPor, observacao
    } = req.body;

    const sql = `
        INSERT INTO unidades (
            bloco_id, unidade, situacao, statusFinanceiro, habitavel,
            cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            bloco_id, unidade, situacao, statusFinanceiro, habitavel,
            cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        ],
        function (err) {
            if (err) return res.status(500).json({ error: "Erro ao salvar unidade" });
            res.json({ message: "Unidade criada", id: this.lastID });
        }
    );
});

app.put("/unidades/:id", (req, res) => {
    const { id } = req.params;

    const {
        bloco_id, unidade, situacao, statusFinanceiro, habitavel,
        cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
        agendadoPor, observacao
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
            bloco_id, unidade, situacao, statusFinanceiro, habitavel,
            cvco, chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao, id
        ],
        (err) => {
            if (err) return res.status(500).json({ error: "Erro ao atualizar unidade" });
            res.json({ message: "Unidade atualizada" });
        }
    );
});

/***************************************************************
 * ROTA PRINCIPAL — LISTAR UNIDADES COMPLETAS (JOIN)
 ***************************************************************/
app.get("/unidades_completas", (req, res) => {
    const sql = `
        SELECT 
            u.*,
            b.nome AS bloco_nome,
            b.empreendimento_id AS emp_id,
            e.nome AS emp_nome
        FROM unidades u
        JOIN blocos b ON b.id = u.bloco_id
        JOIN empreendimentos e ON e.id = b.empreendimento_id
        ORDER BY e.nome ASC, b.nome ASC, u.unidade ASC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.log("Erro /unidades_completas:", err);
            return res.status(500).json({ error: "Erro ao carregar unidades completas" });
        }
        res.json(rows);
    });
});

/***************************************************************
 * INICIAR SERVIDOR
 ***************************************************************/
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("ChaveVR rodando na porta", PORT);
});
