const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho do banco: em produção (Render) usa /data, local usa arquivo na pasta
const isRender = !!process.env.RENDER;
const dbPath = isRender
  ? "/data/chavesvr.db"
  : path.join(__dirname, "chavesvr.db");
const isRender = !!process.env.RENDER;
let dbPath;

// Se estiver no Render, usa /data e cria a pasta se não existir
if (isRender) {
  const fs = require("fs");
  const dataDir = "/data";

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  dbPath = path.join(dataDir, "chavesvr.db");
} else {
  dbPath = path.join(__dirname, "chavesvr.db");
}

console.log("Usando banco de dados em:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao abrir banco:", err.message);
  } else {
    console.log("Banco ChavesVR carregado com sucesso.");
  }
});

app.use(cors());
app.use(express.json());

// ---------- Criação da tabela principal ----------
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS entregas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empreendimento TEXT NOT NULL,
      bloco TEXT NOT NULL,
      unidade TEXT NOT NULL,
      pavimento TEXT,
      status_financeiro TEXT,
      situacao TEXT NOT NULL,
      agendado TEXT,
      agenda_vistoria TEXT,
      habitavel TEXT,
      liberacao_financeiro TEXT,
      chaves_entregues TEXT,
      cvco TEXT,
      motivo TEXT,
      data_liberacao_vistoria TEXT,
      datas_chamadas_vistoria TEXT,
      observacao TEXT,
      criado_em TEXT,
      atualizado_em TEXT
    )
  `);
});

// ---------- Função para montar query de listagem ----------
function buildListQuery(query) {
  const {
    empreendimento,
    bloco,
    unidade,
    situacao,
    chavesEntregues,
    habitavel,
    statusFinanceiro
  } = query;

  let sql = `
    SELECT
      id,
      empreendimento,
      bloco,
      unidade,
      pavimento,
      status_financeiro AS statusFinanceiro,
      situacao,
      agendado,
      agenda_vistoria AS agendaVistoria,
      habitavel,
      liberacao_financeiro AS liberacaoFinanceiro,
      chaves_entregues AS chavesEntregues,
      cvco,
      motivo,
      data_liberacao_vistoria AS dataLiberacaoVistoria,
      datas_chamadas_vistoria AS datasChamadasVistoria,
      observacao,
      criado_em AS criadoEm,
      atualizado_em AS atualizadoEm
    FROM entregas
    WHERE 1=1
  `;
  const params = [];

  if (empreendimento) {
    sql += " AND empreendimento LIKE ?";
    params.push(`%${empreendimento}%`);
  }
  if (bloco) {
    sql += " AND bloco LIKE ?";
    params.push(`%${bloco}%`);
  }
  if (unidade) {
    sql += " AND unidade LIKE ?";
    params.push(`%${unidade}%`);
  }
  if (situacao) {
    sql += " AND situacao = ?";
    params.push(situacao);
  }
  if (statusFinanceiro) {
    sql += " AND status_financeiro = ?";
    params.push(statusFinanceiro);
  }
  if (chavesEntregues === "SIM" || chavesEntregues === "NÃO") {
    sql += " AND chaves_entregues = ?";
    params.push(chavesEntregues);
  }
  if (habitavel === "SIM" || habitavel === "NÃO") {
    sql += " AND habitavel = ?";
    params.push(habitavel);
  }

  sql += " ORDER BY empreendimento, bloco, unidade";

  return { sql, params };
}

// ---------- Rotas da API ----------

// Listar entregas
app.get("/api/entregas", (req, res) => {
  const { sql, params } = buildListQuery(req.query);

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Erro ao listar entregas:", err);
      return res.status(500).json({ error: "Erro ao listar entregas." });
    }
    res.json(rows);
  });
});

// Buscar por ID
app.get("/api/entregas/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT
      id,
      empreendimento,
      bloco,
      unidade,
      pavimento,
      status_financeiro AS statusFinanceiro,
      situacao,
      agendado,
      agenda_vistoria AS agendaVistoria,
      habitavel,
      liberacao_financeiro AS liberacaoFinanceiro,
      chaves_entregues AS chavesEntregues,
      cvco,
      motivo,
      data_liberacao_vistoria AS dataLiberacaoVistoria,
      datas_chamadas_vistoria AS datasChamadasVistoria,
      observacao,
      criado_em AS criadoEm,
      atualizado_em AS atualizadoEm
    FROM entregas
    WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Erro ao buscar entrega:", err);
      return res.status(500).json({ error: "Erro ao buscar entrega." });
    }
    if (!row) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }
    res.json(row);
  });
});

// Criar entrega
app.post("/api/entregas", (req, res) => {
  const {
    empreendimento,
    bloco,
    unidade,
    pavimento,
    statusFinanceiro,
    situacao,
    agendado,
    agendaVistoria,
    habitavel,
    liberacaoFinanceiro,
    chavesEntregues,
    cvco,
    motivo,
    dataLiberacaoVistoria,
    datasChamadasVistoria,
    observacao
  } = req.body || {};

  if (!empreendimento || !bloco || !unidade || !situacao) {
    return res.status(400).json({
      error: "Campos obrigatórios: Empreendimento, Bloco, Unidade e Situação."
    });
  }

  const s = (situacao || "").toUpperCase();
  if (s !== "LIBERADO" && s !== "APROVADO" && !motivo) {
    return res.status(400).json({
      error:
        "Informe o motivo quando a situação não for LIBERADO ou APROVADO."
    });
  }

  const nowIso = new Date().toISOString();

  const sql = `
    INSERT INTO entregas (
      empreendimento,
      bloco,
      unidade,
      pavimento,
      status_financeiro,
      situacao,
      agendado,
      agenda_vistoria,
      habitavel,
      liberacao_financeiro,
      chaves_entregues,
      cvco,
      motivo,
      data_liberacao_vistoria,
      datas_chamadas_vistoria,
      observacao,
      criado_em,
      atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    empreendimento,
    bloco,
    unidade,
    pavimento || "",
    statusFinanceiro || "",
    situacao,
    agendado || "",
    agendaVistoria || "",
    habitavel || "",
    liberacaoFinanceiro || "",
    chavesEntregues || "",
    cvco || "",
    motivo || "",
    dataLiberacaoVistoria || "",
    datasChamadasVistoria || "",
    observacao || "",
    nowIso,
    nowIso
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Erro ao criar entrega:", err);
      return res.status(500).json({ error: "Erro ao criar entrega." });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Atualizar entrega
app.put("/api/entregas/:id", (req, res) => {
  const id = req.params.id;

  const {
    empreendimento,
    bloco,
    unidade,
    pavimento,
    statusFinanceiro,
    situacao,
    agendado,
    agendaVistoria,
    habitavel,
    liberacaoFinanceiro,
    chavesEntregues,
    cvco,
    motivo,
    dataLiberacaoVistoria,
    datasChamadasVistoria,
    observacao
  } = req.body || {};

  if (!empreendimento || !bloco || !unidade || !situacao) {
    return res.status(400).json({
      error: "Campos obrigatórios: Empreendimento, Bloco, Unidade e Situação."
    });
  }

  const s = (situacao || "").toUpperCase();
  if (s !== "LIBERADO" && s !== "APROVADO" && !motivo) {
    return res.status(400).json({
      error:
        "Informe o motivo quando a situação não for LIBERADO ou APROVADO."
    });
  }

  const nowIso = new Date().toISOString();

  const sql = `
    UPDATE entregas
    SET
      empreendimento = ?,
      bloco = ?,
      unidade = ?,
      pavimento = ?,
      status_financeiro = ?,
      situacao = ?,
      agendado = ?,
      agenda_vistoria = ?,
      habitavel = ?,
      liberacao_financeiro = ?,
      chaves_entregues = ?,
      cvco = ?,
      motivo = ?,
      data_liberacao_vistoria = ?,
      datas_chamadas_vistoria = ?,
      observacao = ?,
      atualizado_em = ?
    WHERE id = ?
  `;

  const params = [
    empreendimento,
    bloco,
    unidade,
    pavimento || "",
    statusFinanceiro || "",
    situacao,
    agendado || "",
    agendaVistoria || "",
    habitavel || "",
    liberacaoFinanceiro || "",
    chavesEntregues || "",
    cvco || "",
    motivo || "",
    dataLiberacaoVistoria || "",
    datasChamadasVistoria || "",
    observacao || "",
    nowIso,
    id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Erro ao atualizar entrega:", err);
      return res.status(500).json({ error: "Erro ao atualizar entrega." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }
    res.json({ success: true });
  });
});

// Excluir entrega
app.delete("/api/entregas/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM entregas WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao excluir entrega:", err);
      return res.status(500).json({ error: "Erro ao excluir entrega." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Registro não encontrado." });
    }
    res.json({ success: true });
  });
});

// Lista de empreendimentos (para Dashboard)
app.get("/api/empreendimentos", (req, res) => {
  db.all(
    "SELECT DISTINCT empreendimento FROM entregas ORDER BY empreendimento",
    [],
    (err, rows) => {
      if (err) {
        console.error("Erro ao listar empreendimentos:", err);
        return res.status(500).json({ error: "Erro ao listar empreendimentos." });
      }
      res.json(rows.map((r) => r.empreendimento));
    }
  );
});

// ---------- Arquivos estáticos ----------
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ChavesVR rodando na porta ${PORT}`);
});

