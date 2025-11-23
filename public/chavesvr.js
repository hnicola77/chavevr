/*****************************************************
 * ChaveVR – JS central (Dashboard + Suporte geral)
 *****************************************************/

/************ HELPERS ************/
function get(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

/************ API ************/
const API = {
    empreendimentos: "/empreendimentos",
    blocos: (idEmp) => `/blocos/${idEmp}`,
    unidades: (idBloco) => `/unidades/${idBloco}`,
    unidadesCompletas: "/unidades_completas"
};

/*****************************************************
 * CARREGAR EMPREENDIMENTOS EM SELECTS
 *****************************************************/
async function carregarEmpreendimentosSelect(selectId) {
    const sel = get(selectId);
    if (!sel) return;

    const res = await fetch(API.empreendimentos);
    const lista = await res.json();

    sel.innerHTML = `<option value="">Selecione</option>`;

    lista.forEach(emp => {
        sel.innerHTML += `<option value="${emp.id}">${emp.nome}</option>`;
    });
}

/*****************************************************
 * CARREGAR BLOCOS EM SELECTS
 *****************************************************/
async function carregarBlocosSelect(selectId, empId) {
    const sel = get(selectId);
    if (!sel) return;

    if (!empId) {
        sel.innerHTML = `<option value="">Bloco</option>`;
        return;
    }

    const res = await fetch(API.blocos(empId));
    const blocos = await res.json();

    sel.innerHTML = `<option value="">Bloco</option>`;

    blocos.forEach(b => {
        sel.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
    });
}

/*****************************************************
 * COR DA UNIDADE
 *****************************************************/
function corUnidade(u) {
    if (u.chaves === "Entregue") return "verde";
    if ((u.situacao === "Liberada" || u.situacao === "Aprovada") &&
        u.chaves === "Não entregue") return "amarelo";
    return "vermelho";
}

/*****************************************************
 * DASHBOARD – Carregar todas unidades completas
 *****************************************************/
async function carregarDashboardCompleto() {
    const res = await fetch(API.unidadesCompletas);
    return await res.json();
}

/*****************************************************
 * DASHBOARD – Atualizar cards
 *****************************************************/
function atualizarCardsDash(lista) {
    get("cardTotal").innerText = lista.length;

    get("cardPendentes").innerText =
        lista.filter(u => u.situacao === "Em obra" || u.situacao === "Ajuste de cliente").length;

    get("cardLiberadas").innerText =
        lista.filter(u => u.situacao === "Liberada").length;

    get("cardReprovadas").innerText =
        lista.filter(u => u.situacao === "Aprovada").length;

    get("cardChaves").innerText =
        lista.filter(u => u.chaves === "Entregue").length;

    get("cardCVCO").innerText =
        lista.filter(u => u.cvco === "Liberado").length;
}

/*****************************************************
 * DASHBOARD – Preencher tabela
 *****************************************************/
function preencherTabelaDash(lista) {
    const tbody = get("tabelaDash");
    tbody.innerHTML = "";

    lista.forEach(u => {
        const tr = document.createElement("tr");
        tr.classList.add(corUnidade(u));

        tr.innerHTML = `
            <td>${u.emp_nome}</td>
            <td>${u.bloco_nome}</td>
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.statusFinanceiro}</td>
            <td>${u.habitavel}</td>
            <td>${u.cvco}</td>
            <td>${u.chaves}</td>
            <td>${u.dataVistoria || ""}</td>
            <td>${u.dataLiberacao || ""}</td>
        `;

        tbody.appendChild(tr);
    });
}

/*****************************************************
 * FILTRO PELOS CARDS
 *****************************************************/
function filtrarPorCard(lista, tipo) {
    if (tipo === "pendentes")
        return lista.filter(u => u.situacao === "Em obra" || u.situacao === "Ajuste de cliente");

    if (tipo === "liberadas")
        return lista.filter(u => u.situacao === "Liberada");

    if (tipo === "reprovadas")
        return lista.filter(u => u.situacao === "Aprovada");

    if (tipo === "entregues")
        return lista.filter(u => u.chaves === "Entregue");

    if (tipo === "cvco")
        return lista.filter(u => u.cvco === "Liberado");

    return lista;
}

/*****************************************************
 * INICIALIZAR DASHBOARD
 *****************************************************/
async function initDashboard() {
    const lista = await carregarDashboardCompleto();

    atualizarCardsDash(lista);
    preencherTabelaDash(lista);

    get("filtroEmpreendimento")?.addEventListener("change", async (e) => {
        await carregarBlocosSelect("filtroBloco", e.target.value);
    });

    return lista;
}

/*****************************************************
 * EXPORT GLOBAL
 *****************************************************/
window.ChaveVR = {
    carregarEmpreendimentosSelect,
    carregarBlocosSelect,
    carregarDashboardCompleto,
    atualizarCardsDash,
    preencherTabelaDash,
    filtrarPorCard,
    initDashboard
};
