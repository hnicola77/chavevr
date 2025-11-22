// ===============================================================
// CHAVEVR - FRONTEND COMPLETO (Dashboard + Cadastro)
// ===============================================================

// ============================
// API
// ============================
const API = {
    unidades: "/api/unidades",
    empreendimentos: "/api/empreendimentos",
    unidadeId: (id) => `/api/unidades/${id}`
};

// ===============================================================
// DASHBOARD — CARREGAR EMPREENDIMENTOS
// ===============================================================
async function carregarEmpreendimentos() {
    const select = document.getElementById("selectEmp");
    if (!select) return;

    const r = await fetch(API.empreendimentos);
    const lista = await r.json();

    select.innerHTML = `<option value="">Selecione o empreendimento</option>`;

    lista.forEach(emp => {
        const opt = document.createElement("option");
        opt.value = emp;
        opt.textContent = emp;
        select.appendChild(opt);
    });
}

// ===============================================================
// DASHBOARD — QUANDO SELECIONA O EMPREENDIMENTO
// ===============================================================
async function selecionarEmpreendimento() {
    const emp = document.getElementById("selectEmp").value;
    if (!emp) return;

    await carregarDashboard(emp);
    await carregarTabela(emp);
}

// ===============================================================
// DASHBOARD — CARDS
// ===============================================================
async function carregarDashboard(empreendimento) {
    const r = await fetch(`${API.unidades}?empreendimento=${encodeURIComponent(empreendimento)}`);
    const dados = await r.json();

    const total = dados.length;
    const pendentes = dados.filter(u => u.situacao === "Pendente").length;
    const liberadas = dados.filter(u => u.situacao === "Liberado").length;
    const reprovadas = dados.filter(u => u.situacao === "Reprovado").length;
    const chaves = dados.filter(u => u.chaves_entregues === "Sim").length;
    const cvco = dados.filter(u => u.cvco === "Sim").length;

    document.getElementById("card-total").innerText = total;
    document.getElementById("card-pendentes").innerText = pendentes;
    document.getElementById("card-liberadas").innerText = liberadas;
    document.getElementById("card-reprovadas").innerText = reprovadas;
    document.getElementById("card-chaves").innerText = chaves;
    document.getElementById("card-cvco").innerText = cvco;

    document.getElementById("cards-area").style.display = "flex";
    document.getElementById("tabela-area").style.display = "block";
    document.getElementById("filtros-area").style.display = "flex";
}

// ===============================================================
// DASHBOARD — TABELA
// ===============================================================
async function carregarTabela(empreendimento) {
    const corpo = document.getElementById("tabela-unidades");
    corpo.innerHTML = "";

    const r = await fetch(`${API.unidades}?empreendimento=${encodeURIComponent(empreendimento)}`);
    const dados = await r.json();

    dados.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.empreendimento}</td>
            <td>${u.bloco}</td>
            <td>${u.pavimento}</td>
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.status_financeiro}</td>
            <td>${u.habite_se}</td>
            <td>${u.cvco}</td>
            <td>${u.chaves_entregues}</td>
            <td>${u.data_vistoria || ""}</td>
            <td>${u.hora_vistoria || ""}</td>
            <td>${u.data_liberacao || ""}</td>
            <td>${u.agendado_por || ""}</td>
            <td>${u.observacao || ""}</td>
            <td>
                <button onclick="editarUnidade(${u.id})">✏️</button>
                <button onclick="deletarUnidade(${u.id})">🗑️</button>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

// ===============================================================
// CADASTRO — SALVAR
// ===============================================================
async function salvarCadastro() {
    const dados = {
        empreendimento: document.getElementById("empreendimento").value,
        bloco: document.getElementById("bloco").value,
        pavimento: document.getElementById("pavimento").value,
        unidade: document.getElementById("unidade").value,
        situacao: document.getElementById("situacao").value,
        status_financeiro: document.getElementById("status_financeiro").value,
        habite_se: document.getElementById("habite_se").value,
        cvco: document.getElementById("cvco").value,
        chaves_entregues: document.getElementById("chaves_entregues").value,
        data_vistoria: document.getElementById("data_vistoria").value,
        hora_vistoria: document.getElementById("hora_vistoria").value,
        data_liberacao: document.getElementById("data_liberacao").value,
        agendado_por: document.getElementById("agendado_por").value,
        observacao: document.getElementById("observacao").value
    };

    const r = await fetch(API.unidades, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    if (r.ok) {
        alert("Unidade cadastrada com sucesso!");
        window.location.href = "/dashboard.html";
    } else {
        alert("Erro ao salvar.");
    }
}


// ===============================================================
// EDIÇÃO — CARREGAR DADOS PARA O FORMULÁRIO
// ===============================================================
async function editarUnidade(id) {
    const r = await fetch(API.unidadeId(id));
    const lista = await fetch(API.unidades);
    const dados = (await lista.json()).find(x => x.id == id);

    if (!dados) return alert("Unidade não encontrada.");

    // grava no localStorage para pré-preencher o cadastro
    localStorage.setItem("editarUnidade", JSON.stringify(dados));
    window.location.href = "/cadastro.html";
}


// ===============================================================
// CADASTRO — SE ENTRAR EM MODO DE EDIÇÃO
// ===============================================================
function carregarEdicaoSeExistir() {
    const dadosStr = localStorage.getItem("editarUnidade");
    if (!dadosStr) return;

    const d = JSON.parse(dadosStr);

    document.getElementById("empreendimento").value = d.empreendimento;
    document.getElementById("bloco").value = d.bloco;
    document.getElementById("pavimento").value = d.pavimento;
    document.getElementById("unidade").value = d.unidade;
    document.getElementById("situacao").value = d.situacao;
    document.getElementById("status_financeiro").value = d.status_financeiro;
    document.getElementById("habite_se").value = d.habite_se;
    document.getElementById("cvco").value = d.cvco;
    document.getElementById("chaves_entregues").value = d.chaves_entregues;
    document.getElementById("data_vistoria").value = d.data_vistoria;
    document.getElementById("hora_vistoria").value = d.hora_vistoria;
    document.getElementById("data_liberacao").value = d.data_liberacao;
    document.getElementById("agendado_por").value = d.agendado_por;
    document.getElementById("observacao").value = d.observacao;

    // troca botão para "Salvar Edição"
    document.getElementById("btnSalvar").onclick = () => salvarEdicao(d.id);
}


// ===============================================================
// SALVAR EDIÇÃO
// ===============================================================
async function salvarEdicao(id) {
    const dados = {
        empreendimento: document.getElementById("empreendimento").value,
        bloco: document.getElementById("bloco").value,
        pavimento: document.getElementById("pavimento").value,
        unidade: document.getElementById("unidade").value,
        situacao: document.getElementById("situacao").value,
        status_financeiro: document.getElementById("status_financeiro").value,
        habite_se: document.getElementById("habite_se").value,
        cvco: document.getElementById("cvco").value,
        chaves_entregues: document.getElementById("chaves_entregues").value,
        data_vistoria: document.getElementById("data_vistoria").value,
        hora_vistoria: document.getElementById("hora_vistoria").value,
        data_liberacao: document.getElementById("data_liberacao").value,
        agendado_por: document.getElementById("agendado_por").value,
        observacao: document.getElementById("observacao").value
    };

    const r = await fetch(API.unidadeId(id), {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(dados)
    });

    if (r.ok) {
        alert("Unidade atualizada.");
        localStorage.removeItem("editarUnidade");
        window.location.href = "/dashboard.html";
    }
}


// ===============================================================
// DELETAR
// ===============================================================
async function deletarUnidade(id) {
    if (!confirm("Deseja realmente excluir esta unidade?")) return;

    await fetch(API.unidadeId(id), { method: "DELETE" });

    const emp = document.getElementById("selectEmp").value;
    carregarDashboard(emp);
    carregarTabela(emp);
}


// ===============================================================
// INIT
// ===============================================================
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("selectEmp")) carregarEmpreendimentos();
    if (document.getElementById("btnSalvar")) carregarEdicaoSeExistir();
});

