// =====================================================
// CHAVEVR - FRONTEND COMPLETO
// Dashboard + Empreendimentos + Unidades
// =====================================================

let todasUnidades = [];
let unidadeEmEdicaoId = null;

let empreendimentos = [];
let empreendimentoEmEdicaoId = null;
let empreendimentoSelecionado = null;

// -----------------------------
// Helpers
// -----------------------------
function lerValor(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}
function setValor(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v || "";
}

// =====================================================
// CARREGAR DADOS DO SERVIDOR
// =====================================================

async function carregarUnidadesDoServidor() {
    const resp = await fetch("/unidades");
    if (!resp.ok) throw new Error("Erro ao buscar unidades");
    todasUnidades = await resp.json();
}

async function carregarEmpreendimentosDoServidor() {
    const resp = await fetch("/empreendimentos");
    if (!resp.ok) throw new Error("Erro ao buscar empreendimentos");
    empreendimentos = await resp.json();
}

// =====================================================
// DASHBOARD
// =====================================================

function preencherSelectEmpreendimentoDashboard() {
    const select = document.getElementById("filtro-empreendimento");
    if (!select) return;

    const nomes = [...new Set(todasUnidades.map(u => u.empreendimento).filter(Boolean))].sort();
    select.innerHTML = `<option value="">Empreendimento</option>`;
    nomes.forEach(n => {
        const opt = document.createElement("option");
        opt.value = n;
        opt.textContent = n;
        select.appendChild(opt);
    });
}

function atualizarCards(lista) {
    const total = lista.length;
    const pendentes = lista.filter(u => u.situacao === "Pendente").length;
    const liberadas = lista.filter(u => u.situacao === "Liberada").length;
    const reprovadas = lista.filter(u => u.situacao === "Reprovada").length;
    const chavesEnt = lista.filter(u => u.chaves === "Entregue" || u.chaves === "Sim").length;
    const cvcoLib   = lista.filter(u => u.cvco === "Liberado" || u.cvco === "Sim").length;

    const setText = (id,val) => { const e=document.getElementById(id); if (e) e.textContent = val; };

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
        td.colSpan = 14;
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
        `;
        tbody.appendChild(tr);
    });
}

function aplicarFiltrosDashboard() {
    if (!todasUnidades.length) return;

    const emp  = lerValor("filtro-empreendimento");
    const sit  = lerValor("filtro-situacao");
    const stat = lerValor("filtro-status-financeiro");
    const cvco = lerValor("filtro-cvco");
    const hab  = lerValor("filtro-habitese");
    const data = lerValor("filtro-data-vistoria");

    let lista = [...todasUnidades];

    if (emp)  lista = lista.filter(u => u.empreendimento === emp);
    if (sit)  lista = lista.filter(u => u.situacao === sit);
    if (stat) lista = lista.filter(u => u.statusFinanceiro === stat);
    if (cvco) lista = lista.filter(u => u.cvco === cvco);
    if (hab)  lista = lista.filter(u => u.habiteSe === hab);
    if (data) lista = lista.filter(u => (u.dataVistoria || "") === data);

    atualizarCards(lista);
    preencherTabelaDashboard(lista);
}

function filtrar() {
    aplicarFiltrosDashboard();
}

async function initDashboard() {
    const tabela = document.getElementById("tabela-unidades");
    if (!tabela) return;

    try {
        await carregarUnidadesDoServidor();
        preencherSelectEmpreendimentoDashboard();
        aplicarFiltrosDashboard();
    } catch (e) {
        console.error(e);
        alert("Erro ao carregar dashboard.");
    }
}

// =====================================================
// EMPREENDIMENTOS
// =====================================================

function limparFormEmpreendimento() {
    empreendimentoEmEdicaoId = null;
    setValor("nomeEmp", "");
    setValor("cidadeEmp", "");
    setValor("ufEmp", "");
    setValor("faseEmp", "");
    setValor("dataEntregaEmp", "");
    setValor("codigoEmp", "");
    setValor("obsEmp", "");
}

function renderEmpreendimentos() {
    const tbody = document.getElementById("tabela-empreendimentos");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (!empreendimentos.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.textContent = "Nenhum empreendimento cadastrado.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    empreendimentos.forEach(emp => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.nome || ""}</td>
            <td>${emp.cidade || ""}</td>
            <td>${emp.fase || ""}</td>
            <td>${emp.dataEntrega || ""}</td>
            <td>
                <button class="btn-small btn-editar" onclick="editarEmpreendimento(${emp.id})">Editar</button>
                <button class="btn-small btn-unidades" onclick="irParaUnidades(${emp.id})">Unidades</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function preencherFormEmpreendimento(emp) {
    setValor("nomeEmp", emp.nome);
    setValor("cidadeEmp", emp.cidade);
    setValor("ufEmp", emp.uf);
    setValor("faseEmp", emp.fase);
    setValor("dataEntregaEmp", emp.dataEntrega);
    setValor("codigoEmp", emp.codigoInterno);
    setValor("obsEmp", emp.observacao);
}

async function salvarEmpreendimento(event) {
    event.preventDefault();

    const dados = {
        nome:          lerValor("nomeEmp"),
        cidade:        lerValor("cidadeEmp"),
        uf:            lerValor("ufEmp"),
        fase:          lerValor("faseEmp"),
        dataEntrega:   lerValor("dataEntregaEmp"),
        codigoInterno: lerValor("codigoEmp"),
        observacao:    lerValor("obsEmp")
    };

    if (!dados.nome) {
        alert("Informe o nome do empreendimento.");
        return;
    }

    const url = empreendimentoEmEdicaoId ? `/empreendimentos/${empreendimentoEmEdicaoId}` : "/empreendimentos";
    const method = empreendimentoEmEdicaoId ? "PUT" : "POST";

    const resp = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(dados)
    });

    if (!resp.ok) {
        console.error(await resp.text());
        alert("Erro ao salvar empreendimento.");
        return;
    }

    alert(empreendimentoEmEdicaoId ? "Empreendimento atualizado." : "Empreendimento cadastrado.");

    await carregarEmpreendimentosDoServidor();
    renderEmpreendimentos();
    limparFormEmpreendimento();
}

function editarEmpreendimento(id) {
    const emp = empreendimentos.find(e => e.id === id);
    if (!emp) return;

    empreendimentoEmEdicaoId = id;
    preencherFormEmpreendimento(emp);
    window.scrollTo({ top:0, behavior:"smooth" });
}

function irParaUnidades(id) {
    window.location.href = `/unidades.html?empreendimentoId=${id}`;
}

async function initEmpreendimentos() {
    const form = document.getElementById("form-empreendimento");
    if (!form) return;

    try {
        await carregarEmpreendimentosDoServidor();
        renderEmpreendimentos();

        form.addEventListener("submit", salvarEmpreendimento);
        const btnNovo = document.getElementById("btnNovoEmp");
        if (btnNovo) btnNovo.addEventListener("click", limparFormEmpreendimento);
    } catch (e) {
        console.error(e);
        alert("Erro ao carregar empreendimentos.");
    }
}

// =====================================================
// UNIDADES POR EMPREENDIMENTO
// =====================================================

function atualizarInfoEmpreendimento() {
    const div = document.getElementById("infoEmpreendimento");
    if (!div) return;

    if (!empreendimentoSelecionado) {
        div.style.display = "none";
        div.innerHTML = "";
        return;
    }

    div.style.display = "block";
    div.innerHTML = `
        <strong>Empreendimento:</strong> ${empreendimentoSelecionado.nome || ""}<br>
        <strong>Cidade:</strong> ${empreendimentoSelecionado.cidade || ""} - ${empreendimentoSelecionado.uf || ""}<br>
        <strong>Fase:</strong> ${empreendimentoSelecionado.fase || ""} • 
        <strong>Entrega:</strong> ${empreendimentoSelecionado.dataEntrega || ""}
    `;
}

function limparFormUnidade() {
    unidadeEmEdicaoId = null;
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

function renderUnidadesDoEmpreendimento() {
    const tbody = document.getElementById("tabela-unidades-empreendimento");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!empreendimentoSelecionado) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 12;
        td.textContent = "Selecione um empreendimento.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    const nomeEmp = empreendimentoSelecionado.nome;
    const lista = todasUnidades.filter(u => u.empreendimento === nomeEmp);

    if (!lista.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 12;
        td.textContent = "Nenhuma unidade cadastrada para este empreendimento.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    lista.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.unidade || ""}</td>
            <td>${u.bloco || ""}</td>
            <td>${u.pavimento || ""}</td>
            <td>${u.situacao || ""}</td>
            <td>${u.statusFinanceiro || ""}</td>
            <td>${u.habiteSe || ""}</td>
            <td>${u.cvco || ""}</td>
            <td>${u.chaves || ""}</td>
            <td>${u.dataVistoria || ""}</td>
            <td>${u.dataLiberacao || ""}</td>
            <td>
                <button class="btn-small btn-editar" onclick="editarUnidade(${u.id})">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function preencherFormUnidade(u) {
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

function editarUnidade(id) {
    const u = todasUnidades.find(x => x.id === id);
    if (!u) return;

    unidadeEmEdicaoId = id;

    if (!empreendimentoSelecionado || empreendimentoSelecionado.nome !== u.empreendimento) {
        empreendimentoSelecionado = empreendimentos.find(e => e.nome === u.empreendimento) || null;
        const sel = document.getElementById("selectEmpreendimento");
        if (sel && empreendimentoSelecionado) {
            sel.value = String(empreendimentoSelecionado.id);
        }
        atualizarInfoEmpreendimento();
    }

    preencherFormUnidade(u);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function salvarUnidade(event) {
    event.preventDefault();

    if (!empreendimentoSelecionado) {
        alert("Selecione um empreendimento primeiro.");
        return;
    }

    const dados = {
        empreendimento:  empreendimentoSelecionado.nome,
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

    if (!dados.unidade) {
        alert("Informe a unidade.");
        return;
    }

    const url = unidadeEmEdicaoId ? `/unidades/${unidadeEmEdicaoId}` : "/unidades";
    const method = unidadeEmEdicaoId ? "PUT" : "POST";

    const resp = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(dados)
    });

    if (!resp.ok) {
        console.error(await resp.text());
        alert("Erro ao salvar unidade.");
        return;
    }

    alert(unidadeEmEdicaoId ? "Unidade atualizada." : "Unidade cadastrada.");

    await carregarUnidadesDoServidor();
    renderUnidadesDoEmpreendimento();
    limparFormUnidade();
}

function onChangeEmpreendimentoSelect() {
    const sel = document.getElementById("selectEmpreendimento");
    if (!sel) return;

    const idStr = sel.value;
    if (!idStr) {
        empreendimentoSelecionado = null;
        atualizarInfoEmpreendimento();
        renderUnidadesDoEmpreendimento();
        return;
    }
    const id = parseInt(idStr, 10);
    empreendimentoSelecionado = empreendimentos.find(e => e.id === id) || null;
    atualizarInfoEmpreendimento();
    renderUnidadesDoEmpreendimento();
    limparFormUnidade();
}

async function initUnidades() {
    const form = document.getElementById("form-unidade");
    const selEmp = document.getElementById("selectEmpreendimento");
    if (!form || !selEmp) return;

    try {
        await carregarEmpreendimentosDoServidor();
        await carregarUnidadesDoServidor();

        // preencher select de empreendimentos
        selEmp.innerHTML = `<option value="">Selecione...</option>`;
        empreendimentos.forEach(emp => {
            const opt = document.createElement("option");
            opt.value = String(emp.id);
            opt.textContent = emp.nome;
            selEmp.appendChild(opt);
        });

        const params = new URLSearchParams(window.location.search);
        const empIdParam = params.get("empreendimentoId");
        if (empIdParam) {
            selEmp.value = empIdParam;
            onChangeEmpreendimentoSelect();
        } else {
            renderUnidadesDoEmpreendimento();
        }

        selEmp.addEventListener("change", onChangeEmpreendimentoSelect);
        form.addEventListener("submit", salvarUnidade);

        const btnNova = document.getElementById("btnNovaUnidade");
        if (btnNova) btnNova.addEventListener("click", limparFormUnidade);

    } catch (e) {
        console.error(e);
        alert("Erro ao carregar unidades / empreendimentos.");
    }
}

// =====================================================
// Inicialização global
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    initEmpreendimentos();
    initUnidades();
});

// Expor funções usadas em onclick
window.filtrar = filtrar;
window.editarEmpreendimento = editarEmpreendimento;
window.irParaUnidades = irParaUnidades;
window.editarUnidade = editarUnidade;
