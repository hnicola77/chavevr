// ... (Mantenha o código de importação do express, sqlite3, cors e setup do banco de dados)

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuração do banco de dados (Deve ser a mesma configuração com persistência no Render)
const DB_PATH = path.join('/mnt/data', 'chavesvr.db');
// Se o disco de persistência falhar, ele usa o local
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Erro ao abrir ou criar o banco de dados em /mnt/data:", err.message);
        // Tenta usar o diretório local como fallback (não persistente no Render)
        const LOCAL_DB_PATH = path.join(__dirname, 'chavesvr.db');
        const localDb = new sqlite3.Database(LOCAL_DB_PATH, (localErr) => {
            if (localErr) {
                return console.error("Erro FATAL ao abrir banco de dados local:", localErr.message);
            }
            console.log('Usando banco de dados local (não persistente).');
            global.db = localDb;
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
            });
        });
        return;
    }
    console.log('Conectado ao banco de dados SQLite persistente em /mnt/data.');
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
    });
});

app.use(cors());
app.use(express.json());
// Serve arquivos estáticos da pasta public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));


/************************************************************
 * NOVA ROTA: CADASTRO EM LOTE
 ************************************************************/
app.post('/unidades/lote', (req, res) => {
    const { empreendimento, bloco, inicio, fim } = req.body;

    if (!empreendimento || !bloco || !inicio || !fim || inicio > fim) {
        return res.status(400).json({ message: "Dados incompletos ou faixa numérica inválida." });
    }
    
    const count = fim - inicio + 1;
    let successfulInserts = 0;
    
    // Inicia uma transação para garantir que todas as inserções sejam rápidas
    global.db.serialize(() => {
        global.db.run("BEGIN TRANSACTION;");

        for (let i = inicio; i <= fim; i++) {
            const unidade = i.toString().padStart(3, '0'); // Garante formato 101, 102, 001, etc.
            
            // Valores padrão para o cadastro em lote
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
            // Verifica se todas as inserções foram bem-sucedidas antes de enviar 200
            if (successfulInserts === count) {
                res.status(201).json({ message: `${successfulInserts} unidades cadastradas com sucesso.` });
            } else {
                res.status(500).json({ message: `Apenas ${successfulInserts} de ${count} unidades foram cadastradas.` });
            }
        });
    });
});


// ... (Mantenha as rotas GET, POST /unidades, PUT, DELETE existentes)
app.get('/unidades', (req, res) => {
    global.db.all("SELECT * FROM unidades", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/unidades/:id', (req, res) => {
    const { id } = req.params;
    global.db.get("SELECT * FROM unidades WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

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

app.delete('/unidades/:id', (req, res) => {
    const { id } = req.params;
    global.db.run("DELETE FROM unidades WHERE id = ?", id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Unidade excluída.' });
    });
});


// ... (Mantenha o listen do servidor)
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
