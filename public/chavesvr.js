/*****************************************************
 * ChaveVR – JS central para páginas
 * Empreendimentos → Blocos → Unidades
 * Dashboard completo
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
    unidadePorId: (id) => `/unidade/${id}`
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
        sel.innerHTML = `<option value="">Selecione um Empreendimento</option>`;
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
 * COR DA UNIDADE (para Dashboard e Cadastro)
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
 * DASHBOARD – Carregar todas as unidades do sistema
 *****************************************************/
async function carregarDashboardCompleto() {
    let listaCompleta = [];

    const empreendimentos = await (await fetch(API.empreendimentos)).json();

    for (const emp of empreendimentos) {
        const blocos = await (await fetch(API.blocos(emp.id))).json();

        for (const bloco of blocos) {
            const unidades = await (await fetch(API.unidades(bloco.id))).json();

            unidades.forEach(u => {
                listaCompleta.push({
                    emp: emp.nome,
                    bloco: bloco.nome,
                    ...u
                });
            });
        }
    }

    return listaCompleta;
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
            <td>${u.emp}</td>
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

        tbody.appendChild(tr);
    });
}

/*****************************************************
 * DASHBOARD – filtro pelos cards
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
 * DASHBOARD – inicialização
 *****************************************************/
async function initDashboard() {
    const lista = await carregarDashboardCompleto();

    atualizarCardsDash(lista);
    preencherTabelaDash(lista);

    // Filtrar blocos ao escolher empreendimento
    get("filtroEmpreendimento")?.addEventListener("change", async (e) => {
        await carregarBlocosSelect("filtroBloco", e.target.value);
    });

    return lista;
}

/*****************************************************
 * EXPORTAR GLOBALMENTE (opcional)
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
