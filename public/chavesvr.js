// =====================================================
// CHAVEVR - FRONTEND FINAL (Dashboard + Cadastro)
// Compatível com server_chavesvr.js e tabela `unidades`
// =====================================================

let todasUnidades = [];

// -----------------------------
// Utilitários
// -----------------------------
function lerValor(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

// -----------------------------
// CARREGAR DADOS DO SERVIDOR
// -----------------------------
async function carregarUnidadesDoServidor() {
    const resp = await fetch("/unidades");

    if (!resp.ok) {
        throw new Error("Erro ao buscar unidades no servidor.");
    }

    todasUnidades = await resp.json();
    console.log("Unidades carregadas:", todasUnidades);
}

// -----------------------------
// DASHBOARD - Preencher select de Empreendimento
// -----------------------------
function preencherSelectEmpreendimento() {
    const select = document.getElementById("filtro-empreendimento");
    if (!select || !todasUnidades.length) return;

    const unicos = [...new Set(
        todasUnidades
            .map(u => u.empreendimento)
            .filter(emp => emp && emp !== "")
    )].sort();

    select.innerHTML = `<option value="">Selecione o Empreendimento</option>`;
    unicos.forEach(emp => {
        const opt = document.createElement("option");
        opt.value = emp;
        opt.textContent = emp;
        select.appendChild(opt);
    });
}

// -----------------------------
// DASHBOARD - Atualizar cards
// -----------------------------
function atualizarCards(lista) {
    const total = lista.length;
    const pendentes   = lista.filter(u => u.situacao === "Pendente").length;
    const liberadas   = lista.filter(u => u.situacao === "Liberada").length;
    const reprovadas  = lista.filter(u => u.situacao === "Reprovada").length;
    const chavesEnt   = lista.filter(u => u.chaves === "Sim" || u.chaves === "Entregue").length;
    const cvcoLib     = lista.filter(u => u.cvco === "Sim" || u.cvco === "Liberado").length;

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setText("card-total", total);
    setText("card-pendentes", pendentes);
    setText("card-liberadas", liberadas);
    setText("card-reprovadas", reprovadas);
    setText("card-chaves", chavesEnt);
    setText("card-cvco", cvcoLib);
}

// -----------------------------
// DASHBOARD - Preencher tabela
// -----------------------------
function preencherTabela(lista) {
    const tbody = document.getElementById("tabela-unidades");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!lista.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 15;
        td.textContent = "Nenhuma unidade encontrada.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.empreendimento || ""}</td>
            <td>${u.bloco || ""}</td>
            <td>${u.pavimento || ""}</td>
            <td>${u.unidade || ""}</td>
            <td>${u.situacao || ""}</td>
            <td>${u.statusFinanceiro || ""}</td>
            <td>${u.habiteSe || ""}</td>
            <td>${u.cvco || ""}</td>
            <td>${u.chaves || ""}</td>
            <td>${u.dataVistoria || ""}</td>
            <td>${u.horaVistoria || ""}</td>
            <td>${u.dataLiberacao || ""}</td>
            <td>${u.agendadoPor || ""}</td>
            <td>${u.observacao || ""}</td>
            <td>-</td>
        `;

        tbody.appendChild(tr);
    });
}

// -----------------------------
// DASHBOARD - Aplicar filtros
// -----------------------------
function aplicarFiltros() {
    if (!todasUnidades.length) return;

    const empSel     = lerValor("filtro-empreendimento");
    const sitSel     = lerValor("filtro-situacao");
    const statusSel  = lerValor("filtro-status-financeiro");
    const cvcoSel    = lerValor("filtro-cvco");
    const habiteSel  = lerValor("filtro-habitese");
    const dataVisSel = lerValor("filtro-data-vistoria"); // YYYY-MM-DD

    let filtradas = [...todasUnidades];

    if (empSel) {
        filtradas = filtradas.filter(u => u.empreendimento === empSel);
    }

    if (sitSel) {
        filtradas = filtradas.filter(u => u.situacao === sitSel);
    }

    if (statusSel) {
        filtradas = filtradas.filter(u => u.statusFinanceiro === statusSel);
    }

    if (cvcoSel) {
        filtradas = filtradas.filter(u => u.cvco === cvcoSel);
    }

    if (habiteSel) {
        filtradas = filtradas.filter(u => u.habiteSe === habiteSel);
    }

    if (dataVisSel) {
        filtradas = filtradas.filter(u => (u.dataVistoria || "") === dataVisSel);
    }

    atualizarCards(filtradas);
    preencherTabela(filtradas);
}

// Chamado pelo botão "Buscar" no dashboard
function filtrar() {
    aplicarFiltros();
}

// -----------------------------
// DASHBOARD - Inicialização
// -----------------------------
async function initDashboard() {
    try {
        await carregarUnidadesDoServidor();
        preencherSelectEmpreendimento();

        const selEmp = document.getElementById("filtro-empreendimento");
        if (selEmp) {
            selEmp.addEventListener("change", aplicarFiltros);
        }

        aplicarFiltros(); // primeira carga
    } catch (erro) {
        console.error("Erro ao iniciar dashboard:", erro);
        alert("Erro ao carregar o dashboard. Verifique o servidor.");
    }
}

// -----------------------------
// CADASTRO - Enviar dados
// -----------------------------
async function salvarCadastro(event) {
    event.preventDefault();

    const dados = {
        empreendimento:  lerValor("empreendimento"),
        bloco:           lerValor("bloco"),
        pavimento:       lerValor("pavimento"),
        unidade:         lerValor("unidade"),
        situacao:        lerValor("situacao"),
        statusFinanceiro:lerValor("statusFinanceiro"),
        habiteSe:        lerValor("habiteSe"),
        cvco:            lerValor("cvco"),
        chaves:          lerValor("chaves"),
        dataVistoria:    lerValor("dataVistoria"),
        horaVistoria:    lerValor("horaVistoria"),
        dataLiberacao:   lerValor("dataLiberacao"),
        agendadoPor:     lerValor("agendadoPor"),
        observacao:      lerValor("observacao")
    };

    if (!dados.empreendimento || !dados.unidade) {
        alert("Preencha pelo menos Empreendimento e Unidade.");
        return;
    }

    try {
        const resp = await fetch("/unidades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!resp.ok) {
            console.error("Erro ao salvar:", await resp.text());
            alert("Erro ao salvar a unidade.");
            return;
        }

        alert("Unidade cadastrada com sucesso!");
        window.location.href = "/dashboard.html";

    } catch (erro) {
        console.error("Erro no envio:", erro);
        alert("Erro de comunicação com o servidor.");
    }
}

// -----------------------------
// CADASTRO - Inicialização
// -----------------------------
function initCadastro() {
    const form = document.getElementById("form-cadastro");
    if (!form) return;

    form.addEventListener("submit", salvarCadastro);
}

// -----------------------------
// INICIALIZAÇÃO GERAL
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tabela-unidades")) {
        initDashboard();
    }
    if (document.getElementById("form-cadastro")) {
        initCadastro();
    }
});
