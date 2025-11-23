/*****************************************************
 * ChaveVR – JS central (Dashboard + Carregamentos)
 * Versão FINAL compatível com /unidades_completas
 *****************************************************/

/************ HELPERS ************/
function get(id) { return document.getElementById(id); }
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

/************ API ************/
const API = {
    empreendimentos: "/empreendimentos",
    blocos: (idEmp) => `/blocos/${idEmp}`,
    unidadesPorBloco: (blocoId) => `/unidades/${blocoId}`,
    unidadesCompletas: "/unidades_completas"
};

/*****************************************************
 * CARREGAR EMPREENDIMENTOS EM SELECTS
 *****************************************************/
async function carregarEmpreendimentosSelect(selectId) {
    const sel = get(selectId);
    if (!sel) return;

    sel.innerHTML = `<option value="">Carregando...</option>`;

    const res = await fetch(API.empreendimentos);
    const lista = await res.json();

    sel.innerHTML = `<option value="">Selecione</option>`;

    lista.forEach(emp => {
        const opt = document.createElement("option");
        opt.value = emp.id;
        opt.textContent = emp.nome;
        sel.appendChild(opt);
    });
}

/*****************************************************
 * CARREGAR BLOCOS EM SELECTS
 *****************************************************/
async function carregarBlocosSelect(selectId, empId) {
    const sel = get(selectId);
    if (!sel) return;

    if (!empId) {
        sel.innerHTML = `<option value="">Selecione o bloco</option>`;
        return;
    }

    sel.innerHTML = `<option value="">Carregando...</option>`;

    const res = await fetch(API.blocos(empId));
    const lista = await res.json();

    sel.innerHTML = `<option value="">Selecione</option>`;

    lista.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b.id;
        opt.textContent = b.nome;
        sel.appendChild(opt);
    });
}

/*****************************************************
 * COR DA UNIDADE NA TABELA
 *****************************************************/
function corUnidade(u) {
    if (u.chaves === "Entregue") return "verde";

    if (
        (u.situacao === "Liberada" || u.situacao === "Aprovada") &&
        u.chaves === "Não entregue"
    ) return "amarelo";

    return "vermelho";
}

/*****************************************************
 * DASHBOARD – CARREGAR TODAS AS UNIDADES
 *****************************************************/
async function carregarDashboardCompleto() {
    const res = await fetch(API.unidadesCompletas);
    const lista = await res.json();
    return lista;
}

/*****************************************************
 * DASHBOARD – Atualizar Cards
 *****************************************************/
function atualizarCardsDash(lista) {
    if (get("cardTotal")) get("cardTotal").innerText = lista.length;

    if (get("cardPendentes"))
        get("cardPendentes").innerText =
            lista.filter(u => u.situacao === "Em obra" || u.situacao === "Ajuste de cliente").length;

    if (get("cardLiberadas"))
        get("cardLiberadas").innerText =
            lista.filter(u => u.situacao === "Liberada").length;

    if (get("cardReprovadas"))
        get("cardReprovadas").innerText =
            lista.filter(u => u.situacao === "Aprovada").length;

    if (get("cardChaves"))
        get("cardChaves").innerText =
            lista.filter(u => u.chaves === "Entregue").length;

    if (get("cardCVCO"))
        get("cardCVCO").innerText =
            lista.filter(u => u.cvco === "Liberado").length;
}

/*****************************************************
 * DASHBOARD – Preencher Tabela
 *****************************************************/
function preencherTabelaDash(lista) {
    const tbody = get("tabelaDash");
    if (!tbody) return;
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
 * DASHBOARD – FILTRAR POR CARDS
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

    // Atualizar blocos quando muda o empreendimento no filtro
    get("filtroEmpreendimento")?.addEventListener("change", async (e) => {
        await carregarBlocosSelect("filtroBloco", e.target.value);
    });

    return lista;
}

/*****************************************************
 * EXPORTAR FUNÇÕES PARA AS TELAS
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
