const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ---------------------------
// Arquivos estáticos
// ---------------------------
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------
// Banco de dados
// ---------------------------
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco:", err.message);
    } else {
        console.log("Banco conectado com sucesso:", dbPath);
    }
});

// Criação das tabelas
db.serialize(() => {
    // ⚠️ APAGA a tabela 'unidades' antiga para recriar com o novo formato
    // (só as UNIDADES são perdidas; empreendimentos ficam)
    db.run("DROP TABLE IF EXISTS unidades");

    // Se em algum momento quiser zerar também empreendimentos, descomente:
    // db.run("DROP TABLE IF EXISTS empreendimentos");

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
        CREATE TABLE IF NOT EXISTS unidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            empreendimento TEXT,
            bloco TEXT,
            pavimento TEXT,
            unidade TEXT,
            situacao TEXT,
            statusFinanceiro TEXT,
            habiteSe TEXT,
            cvco TEXT,
            chaves TEXT,
            dataVistoria TEXT,
            horaVistoria TEXT,
            dataLiberacao TEXT,
            agendadoPor TEXT,
            observacao TEXT
        )
    `);
});

// ---------------------------
// Rota raiz -> index.html
// ---------------------------
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================================================
// EMPREENDIMENTOS
// ======================================================

// Listar empreendimentos
app.get("/empreendimentos", (req, res) => {
    db.all("SELECT * FROM empreendimentos ORDER BY nome ASC", [], (err, rows) => {
        if (err) {
            console.error("Erro ao listar empreendimentos:", err);
            return res.status(500).json({ error: "Erro ao listar empreendimentos" });
        }
        res.json(rows);
    });
});

// Criar novo empreendimento
app.post("/empreendimentos", (req, res) => {
    const {
        nome,
        cidade,
        uf,
        fase,
        dataEntrega,
        codigoInterno,
        observacao
    } = req.body;

    const sql = `
        INSERT INTO empreendimentos
        (nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao],
        function (err) {
            if (err) {
                console.error("Erro ao inserir empreendimento:", err);
                return res.status(500).json({ error: "Erro ao inserir empreendimento" });
            }
            res.json({ message: "Empreendimento cadastrado com sucesso!", id: this.lastID });
        }
    );
});

// Atualizar empreendimento
app.put("/empreendimentos/:id", (req, res) => {
    const { id } = req.params;
    const {
        nome,
        cidade,
        uf,
        fase,
        dataEntrega,
        codigoInterno,
        observacao
    } = req.body;

    const sql = `
        UPDATE empreendimentos SET
            nome = ?,
            cidade = ?,
            uf = ?,
            fase = ?,
            dataEntrega = ?,
            codigoInterno = ?,
            observacao = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [nome, cidade, uf, fase, dataEntrega, codigoInterno, observacao, id],
        function (err) {
            if (err) {
                console.error("Erro ao atualizar empreendimento:", err);
                return res.status(500).json({ error: "Erro ao atualizar empreendimento" });
            }
            res.json({ message: "Empreendimento atualizado com sucesso!" });
        }
    );
});

// ======================================================
// UNIDADES
// ======================================================

// Listar unidades (opcional: filtrar por empreendimento)
app.get("/unidades", (req, res) => {
    const empNome = req.query.empreendimento;

    let sql = "SELECT * FROM unidades";
    const params = [];

    if (empNome) {
        sql += " WHERE empreendimento = ?";
        params.push(empNome);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Erro ao listar unidades:", err);
            return res.status(500).json({ error: "Erro ao listar unidades" });
        }
        res.json(rows);
    });
});

// Criar nova unidade
app.post("/unidades", (req, res) => {
    const {
        empreendimento,
        bloco,
        pavimento,
        unidade,
        situacao,
        statusFinanceiro,
        habiteSe,
        cvco,
        chaves,
        dataVistoria,
        horaVistoria,
        dataLiberacao,
        agendadoPor,
        observacao
    } = req.body;

    const sql = `
        INSERT INTO unidades
        (
            empreendimento, bloco, pavimento, unidade,
            situacao, statusFinanceiro, habiteSe, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            empreendimento, bloco, pavimento, unidade,
            situacao, statusFinanceiro, habiteSe, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        ],
        function (err) {
            if (err) {
                console.error("Erro ao inserir unidade:", err);
                return res.status(500).json({ error: "Erro ao inserir unidade" });
            }
            res.json({ message: "Unidade cadastrada com sucesso!", id: this.lastID });
        }
    );
});

// Atualizar unidade
app.put("/unidades/:id", (req, res) => {
    const { id } = req.params;
    const {
        empreendimento,
        bloco,
        pavimento,
        unidade,
        situacao,
        statusFinanceiro,
        habiteSe,
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
            empreendimento = ?,
            bloco = ?,
            pavimento = ?,
            unidade = ?,
            situacao = ?,
            statusFinanceiro = ?,
            habiteSe = ?,
            cvco = ?,
            chaves = ?,
            dataVistoria = ?,
            horaVistoria = ?,
            dataLiberacao = ?,
            agendadoPor = ?,
            observacao = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [
            empreendimento, bloco, pavimento, unidade,
            situacao, statusFinanceiro, habiteSe, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao, id
        ],
        function (err) {
            if (err) {
                console.error("Erro ao atualizar unidade:", err);
                return res.status(500).json({ error: "Erro ao atualizar unidade" });
            }
            res.json({ message: "Unidade atualizada com sucesso!" });
        }
    );
});

// ======================================================
// Servidor
// ======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("ChaveVR rodando na porta " + PORT);
});

