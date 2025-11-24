/*********************************************************
 * ChaveVR – JS completo do novo sistema em 3 etapas
 * Modelo B + Abas + Avançar (Opção A escolhida)
 *********************************************************/

function get(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

/****************************************************
 * API
 ****************************************************/
const API = {
    empreendimentos: "/empreendimentos",
    blocos: (empId) => `/blocos/${empId}`,
    unidades: (blocoId) => `/unidades/${blocoId}`
};

/****************************************************
 * CONTROLE DE ABAS / ETAPAS
 ****************************************************/
function ativarAba(aba) {
    // Remove "ativa"
    qsa(".aba").forEach(x => x.classList.remove("ativa"));

    // Esconde todas etapas
    qsa(".etapa").forEach(x => x.classList.remove("visivel"));

    // Ativa a aba clicada
    get(`aba${aba}`).classList.add("ativa");
    get(`etapa${aba}`).classList.add("visivel");
}

// Bloqueia abas próximas até cadastro anterior ser concluído
function bloquearAba(nome) {
    get(`aba${nome}`).classList.add("bloqueada");
}
function desbloquearAba(nome) {
    get(`aba${nome}`).classList.remove("bloqueada");
}

/****************************************************
 * INICIAR TELA
 ****************************************************/
document.addEventListener("DOMContentLoaded", () => {

    // Aba inicial (Empreendimento)
    ativarAba("Empreendimento");

    // Garantir blocos e unidades bloqueados
    bloquearAba("Blocos");
    bloquearAba("Unidades");

});

/****************************************************
 * 1️⃣ EMPREENDIMENTO
 ****************************************************/
async function salvarEmpreendimento(e) {
    e.preventDefault();

    const id = get("emp_id").value;

    const dados = {
        nome: get("emp_nome").value,
        cidade: get("emp_cidade").value,
        uf: get("emp_uf").value,
        fase: get("emp_fase").value,
        dataEntrega: get("emp_dataEntrega").value,
        codigoInterno: get("emp_codigoInterno").value,
        observacao: get("emp_observacao").value
    };

    const metodo = id ? "PUT" : "POST";
    const url = id ? `/empreendimentos/${id}` : `/empreendimentos`;

    const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    const ret = await res.json();

    if (!id) get("emp_id").value = ret.id;

    alert("Empreendimento salvo com sucesso!");

    // Libera aba de blocos
    desbloquearAba("Blocos");
    ativarAba("Blocos");

    carregarBlocos();
}

/****************************************************
 * 2️⃣ BLOCOS
 ****************************************************/
async function carregarBlocos() {

    const empId = get("emp_id").value;
    if (!empId) return;

    // Carrega nome do empreendimento
    const resEmp = await fetch(API.empreendimentos);
    const empreendimentos = await resEmp.json();
    const emp = empreendimentos.find(e => e.id == empId);
    get("nomeEmp").innerText = `Empreendimento: ${emp.nome}`;

    // Carrega blocos
    const res = await fetch(API.blocos(empId));
    const lista = await res.json();

    const tbody = get("listaBlocos");
    tbody.innerHTML = "";

    lista.forEach(b => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${b.nome}</td>
            <td>${b.observacao || ""}</td>
            <td>
                <button class="btn-small btn-editar" onclick='editarBloco(${JSON.stringify(b)})'>
                    Editar
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    carregarBlocosNaEtapaUnidades(lista);
}

function editarBloco(b) {
    get("bloco_id").value = b.id;
    get("bloco_nome").value = b.nome;
    get("bloco_observacao").value = b.observacao || "";
}

async function salvarBloco(e) {
    e.preventDefault();

    const id = get("bloco_id").value;
    const empId = get("emp_id").value;

    const dados = {
        empreendimento_id: empId,
        nome: get("bloco_nome").value,
        observacao: get("bloco_observacao").value
    };

    const metodo = id ? "PUT" : "POST";
    const url = id ? `/blocos/${id}` : `/blocos`;

    await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    alert("Bloco salvo com sucesso!");

    get("formBloco").reset();
    get("bloco_id").value = "";

    carregarBlocos();

    // Libera aba de unidades
    desbloquearAba("Unidades");
}

/****************************************************
 * Avançar para Unidades
 ****************************************************/
function irParaUnidades() {
    desbloquearAba("Unidades");
    ativarAba("Unidades");
}

/****************************************************
 * 3️⃣ UNIDADES
 ****************************************************/
function carregarBlocosNaEtapaUnidades(lista) {
    const sel = get("selBlocos");
    sel.innerHTML = `<option value="">Selecione</option>`;

    lista.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = b.nome;
        sel.appendChild(opt);
    });
}

async function carregarUnidadesBloco() {
    const blocoId = get("selBlocos").value;
    if (!blocoId) return;

    const res = await fetch(API.unidades(blocoId));
    const lista = await res.json();

    const tbody = get("listaUnidades");
    tbody.innerHTML = "";

    lista.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.statusFinanceiro}</td>
            <td>${u.habitavel}</td>
            <td>${u.cvco}</td>
            <td>${u.chaves}</td>
            <td>${u.dataVistoria || ""}</td>
            <td>${u.dataLiberacao || ""}</td>
            <td>
                <button class="btn-small btn-editar" onclick='editarUnidade(${JSON.stringify(u)})'>
                    Editar
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function editarUnidade(u) {
    get("uni_id").value = u.id;
    get("uni_nome").value = u.unidade;
    get("uni_situacao").value = u.situacao;
    get("uni_statusFinanceiro").value = u.statusFinanceiro;
    get("uni_habitavel").value = u.habitavel;
    get("uni_cvco").value = u.cvco;
    get("uni_chaves").value = u.chaves;
    get("uni_dataVistoria").value = u.dataVistoria || "";
    get("uni_horaVistoria").value = u.horaVistoria || "";
    get("uni_dataLiberacao").value = u.dataLiberacao || "";
    get("uni_agendadoPor").value = u.agendadoPor || "";
    get("uni_observacao").value = u.observacao || "";
}

async function salvarUnidade(e) {
    e.preventDefault();

    const id = get("uni_id").value;
    const blocoId = get("selBlocos").value;

    if (!blocoId) {
        alert("Selecione um bloco!");
        return;
    }

    const dados = {
        bloco_id: blocoId,
        unidade: get("uni_nome").value,
        situacao: get("uni_situacao").value,
        statusFinanceiro: get("uni_statusFinanceiro").value,
        habitavel: get("uni_habitavel").value,
        cvco: get("uni_cvco").value,
        chaves: get("uni_chaves").value,
        dataVistoria: get("uni_dataVistoria").value,
        horaVistoria: get("uni_horaVistoria").value,
        dataLiberacao: get("uni_dataLiberacao").value,
        agendadoPor: get("uni_agendadoPor").value,
        observacao: get("uni_observacao").value
    };

    const metodo = id ? "PUT" : "POST";
    const url = id ? `/unidades/${id}` : `/unidades`;

    await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    });

    alert("Unidade salva com sucesso!");

    get("formUnidade").reset();
    get("uni_id").value = "";

    carregarUnidadesBloco();
}
