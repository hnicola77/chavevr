/************************************************************
 * DASHBOARD – JAVASCRIPT PRINCIPAL (public/dashboard.js)
 * VERSÃO FINAL COM CORREÇÕES DE FILTRO, SEM CVCO E COM FILTRO POR CARD
 ************************************************************/

let todasUnidades = [];
let unidadesFiltradas = [];
let currentCardFilter = 'total'; // Novo estado para o filtro ativo do card. 'total' é o padrão (sem filtro).

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
    "Bloco 04",
    "Bloco 05",
    "Bloco 06",
    "Bloco 07",
    "Bloco 08",
    "Bloco 09",
    "Bloco 10",
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
function preencherSelect(selectElement, options, defaultText) {
    selectElement.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = defaultText;
    selectElement.appendChild(defaultOption);

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        selectElement.appendChild(opt);
    });
}

function preencherSelectsIniciais() {
    preencherSelect(document.getElementById('fEmpreendimento'), EMPREENDIMENTOS_FIXOS, 'Empreendimento');
    // Para o bloco, a lista inicial é vazia, mas com o texto padrão
    const fBloco = document.getElementById('fBloco');
    fBloco.innerHTML = '<option value="">Bloco</option>'; 
}

// Preenche o filtro de Bloco com base no Empreendimento selecionado (ou todos)
function preencherFiltroBloco() {
    const empreendimentoSelecionado = document.getElementById("fEmpreendimento").value;
    const fBloco = document.getElementById('fBloco');
    
    // Resetar o filtro de Bloco antes de preencher
    preencherSelect(fBloco, [], 'Bloco');
    
    if (empreendimentoSelecionado) {
        // Em um sistema real, você filtraria os blocos por empreendimento.
        // Aqui, para o propósito do teste, apenas preenchemos com a lista fixa.
        preencherSelect(fBloco, BLOCOS_FIXOS, 'Bloco');
    }
    
    // Dispara a aplicação do filtro após a mudança
    aplicarFiltro();
}


/************************************************************
 * FUNÇÕES DE CARREGAMENTO DE DADOS
 ************************************************************/
async function carregarDados() {
    try {
        const response = await fetch('/unidades');
        if (!response.ok) throw new Error('Falha ao carregar unidades.');
        todasUnidades = await response.json();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados do servidor.');
        todasUnidades = [];
    }
}

/************************************************************
 * FUNÇÕES DE FILTRO POR CARD
 ************************************************************/

// 1. Função chamada ao clicar em um card
function filtrarPorCard(filterKey) {
    if (currentCardFilter === filterKey) {
        // Se clicar no card ativo, limpa o filtro do card (volta para 'total')
        currentCardFilter = 'total';
    } else {
        currentCardFilter = filterKey;
    }
    aplicarFiltro();
}

// 2. Limpa apenas os filtros dos selects
function limparFiltrosGerais() {
    document.getElementById("fEmpreendimento").value = '';
    document.getElementById("fBloco").value = '';
    document.getElementById("fSituacao").value = '';
    preencherFiltroBloco(); // Repreencher o Bloco (que chama aplicarFiltro)
}

// 3. Limpa o filtro do card
function limparFiltroCards() {
    currentCardFilter = 'total';
    aplicarFiltro();
}

// 4. Função para marcar o card ativo
function marcarCardAtivo() {
    document.querySelectorAll('.card-clickable').forEach(card => {
        card.classList.remove('active-filter');
    });

    // Marca o card ativo, exceto 'total' (que é o padrão sem filtro)
    if (currentCardFilter !== 'total') {
        // Converte 'entregues' para 'cardEntregues' para encontrar o elemento
        const cardId = 'card' + currentCardFilter.charAt(0).toUpperCase() + currentCardFilter.slice(1);
        const activeCard = document.getElementById(cardId);
        if (activeCard) {
            activeCard.classList.add('active-filter');
        }
    }
}


/************************************************************
 * APLICAÇÃO DE FILTROS E RENDERIZAÇÃO
 ************************************************************/
function aplicarFiltro() {
    // 1. Coleta os valores de filtro dos selects
    const empreendimento = document.getElementById("fEmpreendimento").value;
    const bloco = document.getElementById("fBloco").value;
    const situacao = document.getElementById("fSituacao").value;

    // 2. Marca o card ativo visualmente
    marcarCardAtivo();

    // 3. Filtra o array principal com base nos FILTROS GERAIS (selects)
    let unidadesGerais = todasUnidades.filter(u => {
        // Filtro de Empreendimento
        if (empreendimento && u.empreendimento !== empreendimento) return false;

        // Filtro de Bloco
        if (bloco && u.bloco !== bloco) return false;

        // Filtro de Situação
        if (situacao && u.situacao !== situacao) return false;

        return true;
    });
    
    // 4. Recalcula os cards (sempre baseado no array filtrado pelos selects)
    // Os contadores dos cards refletem o universo filtrado pelos selects

    const totalGeral = unidadesGerais.length;
    const entreguesGeral = unidadesGerais.filter(u => u.chaves === "Entregue").length;
    const pendentesGeral = unidadesGerais.filter(u => 
        u.situacao !== 'Liberada' && u.situacao !== 'Aprovada' && u.chaves !== 'Entregue'
    ).length;
    const liberadasGeral = unidadesGerais.filter(u => u.situacao === "Liberada").length;
    const aprovadasGeral = unidadesGerais.filter(u => u.situacao === "Aprovada").length;

    // --- 5. ATUALIZAR CARDS (com base em unidadesGerais) ---
    document.querySelector("#cardTotal p").textContent = totalGeral;
    document.querySelector("#cardEntregues p").textContent = entreguesGeral;
    document.querySelector("#cardPendentes p").textContent = pendentesGeral;
    document.querySelector("#cardLiberadas p").textContent = liberadasGeral;
    document.querySelector("#cardAprovadas p").textContent = aprovadasGeral;

    // 6. Aplica o FILTRO DO CARD sobre o array já filtrado pelos selects
    unidadesFiltradas = unidadesGerais.filter(u => {
        switch (currentCardFilter) {
            case 'total':
                return true; // Sem filtro adicional
            case 'entregues':
                return u.chaves === "Entregue";
            case 'pendentes':
                // A unidade é pendente se não for Liberada, Aprovada, nem Chaves Entregues
                return u.situacao !== 'Liberada' && u.situacao !== 'Aprovada' && u.chaves !== 'Entregue';
            case 'liberadas':
                return u.situacao === "Liberada";
            case 'aprovadas':
                return u.situacao === "Aprovada";
            default:
                return true;
        }
    });

    // 7. Renderiza a tabela com o resultado final (unidadesFiltradas)
    const tbody = document.getElementById("tabelaDash");
    tbody.innerHTML = "";

    if (unidadesFiltradas.length === 0) {
        // Colspan é 9 (verificado no HTML)
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
