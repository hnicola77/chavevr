// =====================================================
// CHAVEVR - FRONTEND FINAL (Dashboard + Cadastro + Edição)
// =====================================================

let todasUnidades = [];
let unidadeEmEdicaoId = null;

// -----------------------------
// Utilitários
// -----------------------------
function lerValor(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function setValor(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor || "";
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

// =====================================================
// DASHBOARD
// =====================================================

function preencherSelectEmpreendimentoDashboard() {
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

function preencherTabelaDashboard(lista) {
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

function aplicarFiltrosDashboard() {
    if (!todasUnidades.length) return;

    const empSel     = lerValor("filtro-empreendimento");
    const sitSel     = lerValor("filtro-situacao");
    const statusSel  = lerValor("filtro-status-financeiro");
    const cvcoSel    = lerValor("filtro-cvco");
    const habiteSel  = lerValor("filtro-habitese");
    const dataVisSel = lerValor("filtro-data-vistoria");

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
    preencherTabelaDashboard(filtradas);
}

function filtrar() {
    aplicarFiltrosDashboard();
}

async function initDashboard() {
    const tabela = document.getElementById("tabela-unidades");
    if (!tabela) return; // não está na página de dashboard

    try {
        await carregarUnidadesDoServidor();
        preencherSelectEmpreendimentoDashboard();

        const selEmp = document.getElementById("filtro-empreendimento");
        if (selEmp) {
            selEmp.addEventListener("change", aplicarFiltrosDashboard);
        }

        aplicarFiltrosDashboard();
    } catch (erro) {
        console.error("Erro ao iniciar dashboard:", erro);
        alert("Erro ao carregar o dashboard. Verifique o servidor.");
    }
}

// =====================================================
// CADASTRO + LISTA + EDIÇÃO
// =====================================================

function preencherSelectEmpreendimentoCadastro() {
    const select = document.getElementById("filtroEmpCad");
    if (!select || !todasUnidades.length) return;

    const unicos = [...new Set(
        todasUnidades
            .map(u => u.empreendimento)
            .filter(emp => emp && emp !== "")
    )].sort();

    select.innerHTML = `<option value="">Todos os empreendimentos</option>`;
    unicos.forEach(emp => {
        const opt = document.createElement("option");
        opt.value = emp;
        opt.textContent = emp;
        select.appendChild(opt);
    });
}

function atualizarListaCadastro() {
    const tbody = document.getElementById("tabela-cadastro-unidades");
    if (!tbody) return;

    const filtroEmp = lerValor("filtroEmpCad");

    let lista = [...todasUnidades];
    if (filtroEmp) {
        lista = lista.filter(u => u.empreendimento === filtroEmp);
    }

    tbody.innerHTML = "";

    if (!lista.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 15;
        td.textContent = "Nenhuma unidade cadastrada para este filtro.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.id}</td>
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
            <td>
                <button type="button" onclick="editarUnidade(${u.id})">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function preencherFormularioCadastro(u) {
    setValor("empreendimento", u.empreendimento);
    setValor("bloco", u.bloco);
    setValor("pavimento", u.pavimento);
    setValor("unidade", u.unidade);
    setValor("situacao", u.situacao);
    setValor("statusFinanceiro", u.statusFinanceiro);
    setValor("habiteSe", u.habiteSe);
    setValor("cvco", u.cvco);
    setValor("chaves", u.chaves);
    setValor("dataVistoria", u.dataVistoria);
    setValor("horaVistoria", u.horaVistoria);
    setValor("dataLiberacao", u.dataLiberacao);
    setValor("agendadoPor", u.agendadoPor);
    setValor("observacao", u.observacao);
}

function limparFormularioCadastro() {
    unidadeEmEdicaoId = null;
    setValor("empreendimento", "");
    setValor("bloco", "");
    setValor("pavimento", "");
    setValor("unidade", "");
    setValor("situacao", "Pendente");
    setValor("statusFinanceiro", "Pendente");
    setValor("habiteSe", "Não");
    setValor("cvco", "Pendente");
    setValor("chaves", "Não entregue");
    setValor("dataVistoria", "");
    setValor("horaVistoria", "");
    setValor("dataLiberacao", "");
    setValor("agendadoPor", "");
    setValor("observacao", "");
}

// função global para o onclick do botão "Editar"
function editarUnidade(id) {
    const u = todasUnidades.find(item => item.id === id);
    if (!u) {
        alert("Unidade não encontrada para edição.");
        return;
    }
    unidadeEmEdicaoId = id;
    preencherFormularioCadastro(u);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// salvar (novo ou edição)
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

    const url = unidadeEmEdicaoId ? `/unidades/${unidadeEmEdicaoId}` : "/unidades";
    const metodo = unidadeEmEdicaoId ? "PUT" : "POST";

    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!resp.ok) {
            console.error("Erro ao salvar:", await resp.text());
            alert("Erro ao salvar a unidade.");
            return;
        }

        const msg = unidadeEmEdicaoId
            ? "Unidade atualizada com sucesso!"
            : "Unidade cadastrada com sucesso!";
        alert(msg);

        // recarrega a lista a partir do servidor
        await carregarUnidadesDoServidor();
        atualizarListaCadastro();
        atualizarCards(todasUnidades); // opcional, se quiser sincronizar dashboard

        limparFormularioCadastro();

    } catch (erro) {
        console.error("Erro no envio:", erro);
        alert("Erro de comunicação com o servidor.");
    }
}

async function initCadastro() {
    const form = document.getElementById("form-cadastro");
    if (!form) return; // não está na página de cadastro

    form.addEventListener("submit", salvarCadastro);

    try {
        await carregarUnidadesDoServidor();
        preencherSelectEmpreendimentoCadastro();
        atualizarListaCadastro();

        const filtroCad = document.getElementById("filtroEmpCad");
        if (filtroCad) {
            filtroCad.addEventListener("change", atualizarListaCadastro);
        }

    } catch (erro) {
        console.error("Erro ao iniciar cadastro:", erro);
        alert("Erro ao carregar unidades já cadastradas.");
    }
}

// =====================================================
// INICIALIZAÇÃO GERAL
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    initCadastro();
});

// Deixar funções acessíveis no escopo global
window.filtrar = filtrar;
window.editarUnidade = editarUnidade;
