const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ======================================================
// 🔥 SERVIR ARQUIVOS ESTÁTICOS
// ======================================================
app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// 🔥 CAMINHO DO BANCO (Render usa /data)
// ======================================================
const dbPath = "/data/chavesvr.db";

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco:", err.message);
    } else {
        console.log("Banco conectado com sucesso:", dbPath);
    }
});

// ======================================================
// 🔥 CRIAR TABELA SE NÃO EXISTIR
// ======================================================
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

// ======================================================
// 🔥 ROTA RAIZ (CORRIGE "Cannot GET /")
// ======================================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================================================
// 🔥 ROTA PARA SALVAR CADASTRO
// ======================================================
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
        INSERT INTO unidades (
            empreendimento, bloco, pavimento, unidade,
            situacao, statusFinanceiro, habiteSe, cvco,
            chaves, dataVistoria, horaVistoria, dataLiberacao,
            agendadoPor, observacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                console.error("Erro ao salvar unidade:", err);
                return res.status(500).json({ error: "Erro ao salvar unidade" });
            }

            return res.json({
                message: "Unidade cadastrada com sucesso!",
                id: this.lastID
            });
        }
    );
});

// ======================================================
// 🔥 ROTA PARA LISTAR UNIDADES
// ======================================================
app.get("/unidades", (req, res) => {
    db.all("SELECT * FROM unidades", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao listar" });
        }
        res.json(rows);
    });
});

// =========================
// 🔥 ROTA PARA ATUALIZAR (EDITAR) UMA UNIDADE
// =========================
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
            observacao,
            id
        ],
        function (err) {
            if (err) {
                console.error("Erro ao atualizar unidade:", err);
                return res.status(500).json({ error: "Erro ao atualizar unidade" });
            }
            return res.json({ message: "Unidade atualizada com sucesso!" });
        }
    );
});

// ======================================================
// 🔥 INICIAR SERVIDOR
// ======================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("ChaveVR rodando na porta " + PORT);
});

