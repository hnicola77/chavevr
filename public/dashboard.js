/************************************************************
 * DASHBOARD – JAVASCRIPT PRINCIPAL (public/dashboard.js)
 * VERSÃO FINAL COM CORREÇÕES DE FILTRO E SEM CVCO
 ************************************************************/

let todasUnidades = [];
let unidadesFiltradas = [];

// Dados fixos (Hardcoded) para preencher os selects. 
// Estes devem ser os mesmos usados no chavesvr.js
const EMPREENDIMENTOS_FIXOS = [
    "New Jersey",
    "Honolulu",
    "Plaza de Espanha",
    "Plaza Valencia",
    "Boulevard Fecile",
    "Federico Fellini"
];

const BLOCOS_FIXOS = [
    "Bloco 01",
    "Bloco 02",
    "Bloco 03",
];

/************************************************************
 * LOAD INICIAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Preenche os filtros com a opção inicial "vazia"
    preencherSelectsIniciais();
    
    // 2. Carrega todos os dados do servidor
    await carregarDados();
    
    // 3. Aplica o filtro inicial (mostra todos os dados, pois o filtro é "")
    aplicarFiltro();

    // 4. Adiciona listener de evento para o filtro de Empreendimento
    document.getElementById("fEmpreendimento").addEventListener("change", preencherFiltroBloco);
});

/************************************************************
 * PREENCHER FILTROS
 * (Garante que o value inicial seja "" para não filtrar o array)
 ************************************************************/
function preencherSelectsIniciais() {
    
    // 1. Preenche o fEmpreendimento
    const selectEmp = document.getElementById("fEmpreendimento");
    // CRÍTICO: value="" para o filtro funcionar na inicialização
    selectEmp.innerHTML = '<option value="">Empreendimento</option>'; 
    
    EMPREENDIMENTOS_FIXOS.forEach(e => {
        selectEmp.innerHTML += `<option value="${e}">${e}</option>`;
    });

    // 2. Chama a função para preencher o Bloco
    preencherFiltroBloco(); 
}

function preencherFiltroBloco() {
    const selectBloco = document.getElementById("fBloco");
    
    // CRÍTICO: value="" para o filtro funcionar na inicialização
    selectBloco.innerHTML = '<option value="">Bloco</option>'; 

    BLOCOS_FIXOS.forEach(b => {
        selectBloco.innerHTML += `<option value="${b}">${b}</option>`;
    });
}


/************************************************************
 * CARREGAR DADOS DO SERVIDOR
 ************************************************************/
async function carregarDados() {
    try {
        const res = await fetch("/unidades");
        // 'todasUnidades' recebe a lista completa de unidades cadastradas
        todasUnidades = await res.json();
    } catch (error) {
        console.error("Erro ao carregar dados para o Dashboard:", error); 
    }
}

/************************************************************
 * LÓGICA DE FILTRO E ATUALIZAÇÃO
 ************************************************************/
function aplicarFiltro() {
    const fEmp = document.getElementById("fEmpreendimento").value;
    const fBloco = document.getElementById("fBloco").value;
    const fSit = document.getElementById("fSituacao").value;

    unidadesFiltradas = todasUnidades.filter(u => {
        // A lógica !fEmp verifica se o filtro está vazio (""). Se estiver, retorna true.
        const matchEmp = !fEmp || u.empreendimento === fEmp;
        const matchBloco = !fBloco || u.bloco === fBloco;
        const matchSit = !fSit || u.situacao === fSit;

        return matchEmp && matchBloco && matchSit;
    });

    atualizarDashboard();
}

/************************************************************
 * ATUALIZAR CARDS E TABELA (CVCO REMOVIDO)
 ************************************************************/
function atualizarDashboard() {
    
    // --- 1. CALCULAR TOTAIS ---
    const total = unidadesFiltradas.length;
    
    const entregues = unidadesFiltradas.filter(u => u.chaves === "Entregue").length;
    
    const pendentes = unidadesFiltradas.filter(u => 
        u.situacao !== "Liberada" && u.situacao !== "Aprovada"
    ).length;
    
    const liberadas = unidadesFiltradas.filter(u => u.situacao === "Liberada").length;
    
    const aprovadas = unidadesFiltradas.filter(u => u.situacao === "Aprovada").length;

    // --- 2. ATUALIZAR CARDS ---
    document.querySelector("#cardTotal p").textContent = total;
    document.querySelector("#cardEntregues p").textContent = entregues;
    document.querySelector("#cardPendentes p").textContent = pendentes;
    document.querySelector("#cardLiberadas p").textContent = liberadas;
    document.querySelector("#cardAprovadas p").textContent = aprovadas;
    // O Card CVCO foi removido do HTML.

    // --- 3. ATUALIZAR TABELA (Todos os campos listados) ---
    const tbody = document.getElementById("tabelaDash");
    tbody.innerHTML = "";

    if (total === 0) {
        // Colspan é 9 porque removemos o CVCO, mas mantemos o restante
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Nenhuma unidade encontrada com estes filtros.</td></tr>';
        return;
    }

    unidadesFiltradas.forEach(u => {
        const tr = document.createElement("tr");

        // Inclui todos os campos: Empreendimento, Bloco, Unidade, Situação, Financeiro, Habitável, Chaves, Vistoria, Liberação
        tr.innerHTML = `
            <td>${u.empreendimento}</td>
            <td>${u.bloco}</td>
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.statusFinanceiro}</td>
            <td>${u.habitavel}</td>
            <td>${u.chaves}</td>
            <td>${u.dataVistoria || '-'}</td>
            <td>${u.dataLiberacao || '-'}</td>
        `;

        tbody.appendChild(tr);
    });
}
