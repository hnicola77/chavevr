/*******************************************************************************************
 * ChaveVR – Frontend completo
 * Empreendimentos → Blocos → Unidades → Dashboard
 ******************************************************************************************/

// Dados globais
let empreendimentos = [];
let blocos = [];
let unidades = [];

// Config
const API = {
    empreendimentos: "/empreendimentos",
    blocos: "/blocos",
    unidades: "/unidades",
};

/*******************************************************************************************
 * HELPERS
 ******************************************************************************************/

function get(id) { return document.getElementById(id); }
function val(id) { return get(id)?.value ?? ""; }
function set(id, v) { if (get(id)) get(id).value = v; }
function qs(selector) { return document.querySelector(selector); }
function ce(tag) { return document.createElement(tag); }

function limparCampos(ids) {
    ids.forEach(id => set(id, ""));
}

/*******************************************************************************************
 * CARREGAMENTO INICIAL
 ******************************************************************************************/

document.addEventListener("DOMContentLoaded", () => {
    initEmpreendimentos();
    initBlocos();
    initUnidades();
    initDashboard();
});

/*******************************************************************************************
 * EMPREENDIMENTOS
 ******************************************************************************************/

async function carregarEmpreendimentos() {
    const res = await fetch(API.empreendimentos);
    empreendimentos = await res.json();
}

async function salvarEmpreendimento(e) {
    e.preventDefault();

    const emp = {
        nome: val("nomeEmp"),
        cidade: val("cidadeEmp"),
        uf: val("ufEmp"),
        fase: val("faseEmp"),
        dataEntrega: val("dataEntregaEmp"),
        codigoInterno: val("codigoEmp"),
        observacao: val("obsEmp")
    };

    if (!emp.nome) return alert("Nome obrigatório");

    await fetch(API.empreendimentos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emp)
    });

    alert("Empreendimento cadastrado");
    limparCampos(["nomeEmp","cidadeEmp","ufEmp","faseEmp","dataEntregaEmp","codigoEmp","obsEmp"]);
    initEmpreendimentos();
}

async function initEmpreendimentos() {
    if (!get("tabelaEmp")) return;

    await carregarEmpreendimentos();

    const tbody = get("tabelaEmp");
    tbody.innerHTML = "";

    empreendimentos.forEach(emp => {
        const tr = ce("tr");
        tr.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.nome}</td>
            <td>${emp.cidade}</td>
            <td>${emp.uf}</td>
            <td>${emp.fase}</td>
            <td>
                <button onclick="abrirBlocos(${emp.id})">Blocos</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (get("formEmp"))
        get("formEmp").onsubmit = salvarEmpreendimento;
}

/*******************************************************************************************
 * BLOCOS
 ******************************************************************************************/

async function carregarBlocos(empreendimentoId) {
    const res = await fetch(`${API.blocos}/${empreendimentoId}`);
    blocos = await res.json();
}

async function salvarBloco(e) {
    e.preventDefault();

    const bloco = {
        empreendimento_id: val("selEmpBloco"),
        nome: val("nomeBloco"),
        observacao: val("obsBloco")
    };

    if (!bloco.empreendimento_id) return alert("Selecione empreendimento");
    if (!bloco.nome) return alert("Nome obrigatório");

    await fetch(API.blocos, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(bloco)
    });

    alert("Bloco cadastrado");
    limparCampos(["nomeBloco","obsBloco"]);
    abrirBlocos(bloco.empreendimento_id);
}

async function abrirBlocos(empreendimentoId) {
    window.location.href = `/chavevr/cadastro_blocos.html?emp=${empreendimentoId}`;
}

async function initBlocos() {
    const blocoTable = get("tabelaBlocos");
    if (!blocoTable) return;

    const params = new URLSearchParams(window.location.search);
    const empId = params.get("emp");

    await carregarEmpreendimentos();
    await carregarBlocos(empId);

    // Preencher select empreendimento
    empreendimentos.forEach(emp => {
        const opt = ce("option");
        opt.value = emp.id;
        opt.textContent = emp.nome;
        get("selEmpBloco").appendChild(opt);
    });
    get("selEmpBloco").value = empId;

    // Preencher tabela de blocos
    blocoTable.innerHTML = "";
    blocos.forEach(b => {
        const tr = ce("tr");
        tr.innerHTML = `
            <td>${b.id}</td>
            <td>${b.nome}</td>
            <td>${b.observacao || ""}</td>
            <td>
                <button onclick="abrirUnidades(${b.id})">Unidades</button>
            </td>
        `;
        blocoTable.appendChild(tr);
    });

    if (get("formBloco"))
        get("formBloco").onsubmit = salvarBloco;
}

/*******************************************************************************************
 * UNIDADES
 ******************************************************************************************/

async function carregarUnidades(blocoId) {
    const res = await fetch(`${API.unidades}/${blocoId}`);
    unidades = await res.json();
}

async function salvarUnidade(e) {
    e.preventDefault();

    const u = {
        bloco_id: val("selBloco"),
        unidade: val("nUnidade"),
        situacao: val("selSituacao"),
        statusFinanceiro: val("selFinanceiro"),
        habitavel: val("selHabitavel"),
        cvco: val("selCVCO"),
        chaves: val("selChaves"),
        dataVistoria: val("dtVistoria"),
        horaVistoria: val("hrVistoria"),
        dataLiberacao: val("dtLiberacao"),
        agendadoPor: val("agendadoPor"),
        observacao: val("obsUnidade")
    };

    if (!u.bloco_id) return alert("Selecione o bloco");
    if (!u.unidade) return alert("Unidade obrigatória");

    await fetch(API.unidades, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(u)
    });

    alert("Unidade cadastrada");
    abrirUnidades(u.bloco_id);
}

async function abrirUnidades(blocoId) {
    window.location.href = `/chavevr/cadastro_unidades.html?bloco=${blocoId}`;
}

async function initUnidades() {
    const tabela = get("tabelaUnidades");
    if (!tabela) return;

    const params = new URLSearchParams(window.location.search);
    const blocoId = params.get("bloco");

    await carregarEmpreendimentos();
    const empId = blocos.find(b => b.id === blocoId)?.empreendimento_id;

    // Carregar blocos
    const resBlocos = await fetch(`${API.blocos}/${empId}`);
    blocos = await resBlocos.json();

    // Carregar unidades
    await carregarUnidades(blocoId);

    // Preencher select de blocos
    blocos.forEach(b => {
        const opt = ce("option");
        opt.value = b.id;
        opt.textContent = b.nome;
        get("selBloco").appendChild(opt);
    });
    get("selBloco").value = blocoId;

    // Preencher tabela de unidades
    tabela.innerHTML = "";
    unidades.forEach(u => {
        const tr = ce("tr");

        // Cores
        let classe = "";
        if (u.chaves === "Entregue") classe = "verde";
        else if (["Liberada","Aprovada"].includes(u.situacao) && u.chaves === "Não entregue") classe = "amarelo";
        else if (["Em obra", "Ajuste de cliente"].includes(u.situacao)) classe = "vermelho";

        tr.classList.add(classe);

        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.statusFinanceiro}</td>
            <td>${u.habitavel}</td>
            <td>${u.cvco}</td>
            <td>${u.chaves}</td>
            <td>${u.dataVistoria || ""}</td>
            <td>${u.dataLiberacao || ""}</td>
        `;
        tabela.appendChild(tr);
    });

    if (get("formUnidade"))
        get("formUnidade").onsubmit = salvarUnidade;
}

/*******************************************************************************************
 * DASHBOARD
 ******************************************************************************************/

async function initDashboard() {
    const tabela = get("dashTable");
    if (!tabela) return;

    // Carregar todos os blocos
    const empreRes = await fetch(API.empreendimentos);
    empreendimentos = await empreRes.json();

    // Carregar todas unidades (forçar leitura de todos blocos)
    unidades = [];

    for (const emp of empreendimentos) {
        const resBlocos = await fetch(`${API.blocos}/${emp.id}`);
        const listaBlocos = await resBlocos.json();

        for (const b of listaBlocos) {
            const resUni = await fetch(`${API.unidades}/${b.id}`);
            const un = await resUni.json();

            un.forEach(u => unidades.push({
                ...u,
                empreendimento: emp.nome,
                bloco: b.nome
            }));
        }
    }

    preencherDashboard();
}

function preencherDashboard() {
    const tabela = get("dashTable");
    tabela.innerHTML = "";

    unidades.forEach(u => {
        const tr = ce("tr");

        // cor
        if (u.chaves === "Entregue") tr.classList.add("verde");
        else if (["Liberada","Aprovada"].includes(u.situacao) && u.chaves === "Não entregue")
            tr.classList.add("amarelo");
        else if (["Em obra","Ajuste de cliente"].includes(u.situacao))
            tr.classList.add("vermelho");

        tr.innerHTML = `
            <td>${u.empreendimento}</td>
            <td>${u.bloco}</td>
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.statusFinanceiro}</td>
            <td>${u.habitavel}</td>
            <td>${u.cvco}</td>
            <td>${u.chaves}</td>
            <td>${u.dataVistoria || ""}</td>
            <td>${u.dataLiberacao || ""}</td>
        `;
        tabela.appendChild(tr);
    });
}
