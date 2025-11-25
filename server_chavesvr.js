const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// O Render usa o caminho de montagem do disco de persistência para salvar dados.
// Seu Mount path está configurado como /data.
const DB_PATH = path.join('/data', 'chavesvr.db'); 
console.log(`Tentando conectar ao banco de dados persistente em: ${DB_PATH}`);

// Configuração do banco de dados (Sem fallback para local)
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        // Se houver erro aqui, o problema é no disco do Render.
        // O log FATAL é essencial para debugar.
        return console.error("Erro FATAL ao abrir o banco de dados persistente:", err.message);
    }
    console.log('Conectado ao banco de dados SQLite persistente.');
    global.db = db;
    
    // Cria a tabela
    global.db.serialize(() => {
        global.db.run(`
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
                agendadoPor TEXT,
                dataLiberacao TEXT,
                observacao TEXT
            )
        `);
        console.log('Tabela "unidades" verificada ou criada.');
    });
});

app.use(cors());
app.use(express.json());
// Serve arquivos estáticos da pasta public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

/************************************************************
 * ROTAS DE UNIDADES (EXISTENTES E LOTE)
 ************************************************************/

// Rota POST para Cadastro em Lote
app.post('/unidades/lote', (req, res) => {
    const { empreendimento, bloco, inicio, fim } = req.body;

    if (!empreendimento || !bloco || !inicio || !fim || inicio > fim) {
        return res.status(400).json({ message: "Dados incompletos ou faixa numérica inválida." });
    }
    
    const count = fim - inicio + 1;
    let successfulInserts = 0;
    
    global.db.serialize(() => {
        global.db.run("BEGIN TRANSACTION;");

        for (let i = inicio; i <= fim; i++) {
            const unidade = i.toString().padStart(3, '0');
            
            // Valores padrão
            const defaults = {
                situacao: 'Em obra',
                statusFinanceiro: 'Pendente',
                habitavel: 'Não',
                cvco: 'Pendente',
                chaves: 'Não entregue',
                dataVistoria: null,
                horaVistoria: null,
                agendadoPor: null,
                dataLiberacao: null,
                observacao: `Cadastro em lote: ${new Date().toLocaleDateString()}`
            };

            const stmt = global.db.prepare(`
                INSERT INTO unidades (
                    empreendimento, bloco, unidade, situacao, statusFinanceiro, 
                    habitavel, cvco, chaves, dataVistoria, horaVistoria, agendadoPor, 
                    dataLiberacao, observacao
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                empreendimento, bloco, unidade, defaults.situacao, defaults.statusFinanceiro, 
                defaults.habitavel, defaults.cvco, defaults.chaves, defaults.dataVistoria, 
                defaults.horaVistoria, defaults.agendadoPor, defaults.dataLiberacao, defaults.observacao,
                function(err) {
                    if (!err) {
                        successfulInserts++;
                    }
                }
            );
            stmt.finalize();
        }

        global.db.run("COMMIT;", (err) => {
            if (err) {
                console.error("Erro durante o COMMIT da transação:", err.message);
                return res.status(500).json({ message: "Erro interno ao finalizar o cadastro em lote." });
            }
            if (successfulInserts === count) {
                res.status(201).json({ message: `${successfulInserts} unidades cadastradas com sucesso.` });
            } else {
                res.status(500).json({ message: `Apenas ${successfulInserts} de ${count} unidades foram cadastradas.` });
            }
        });
    });
});

// Rota GET para listar todas as unidades
app.get('/unidades', (req, res) => {
    global.db.all("SELECT * FROM unidades", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Rota GET para buscar unidade por ID
app.get('/unidades/:id', (req, res) => {
    const { id } = req.params;
    global.db.get("SELECT * FROM unidades WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Rota POST para cadastro individual
app.post('/unidades', (req, res) => {
    const { 
        empreendimento, bloco, unidade, situacao, statusFinanceiro, habitavel, cvco, chaves, 
        dataVistoria, horaVistoria, agendadoPor, dataLiberacao, observacao 
    } = req.body;

    const stmt = global.db.prepare(`
        INSERT INTO unidades (
            empreendimento, bloco, unidade, situacao, statusFinanceiro, habitavel, 
            cvco, chaves, dataVistoria, horaVistoria, agendadoPor, dataLiberacao, observacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        empreendimento, bloco, unidade, situacao, statusFinanceiro, habitavel, 
        cvco, chaves, dataVistoria, horaVistoria, agendadoPor, dataLiberacao, observacao,
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
    stmt.finalize();
});

// Rota PUT para atualização
app.put('/unidades/:id', (req, res) => {
    const { id } = req.params;
    const { 
        empreendimento, bloco, unidade, situacao, statusFinanceiro, habitavel, cvco, chaves, 
        dataVistoria, horaVistoria, agendadoPor, dataLiberacao, observacao 
    } = req.body;

    const stmt = global.db.prepare(`
        UPDATE unidades SET 
            empreendimento = ?, bloco = ?, unidade = ?, situacao = ?, statusFinanceiro = ?, 
            habitavel = ?, cvco = ?, chaves = ?, dataVistoria = ?, horaVistoria = ?, 
            agendadoPor = ?, dataLiberacao = ?, observacao = ?
        WHERE id = ?
    `);

    stmt.run(
        empreendimento, bloco, unidade, situacao, statusFinanceiro, habitavel, 
        cvco, chaves, dataVistoria, horaVistoria, agendadoPor, dataLiberacao, observacao,
        id,
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'Unidade atualizada.' });
        }
    );
    stmt.finalize();
});

// Rota DELETE
app.delete('/unidades/:id', (req, res) => {
    const { id } = req.params;
    global.db.run("DELETE FROM unidades WHERE id = ?", id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Unidade excluída.' });
    });
});

/************************************************************
 * INICIALIZAÇÃO DO SERVIDOR
 ************************************************************/
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
