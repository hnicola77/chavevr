/************************************************************
 * DASHBOARD – JAVASCRIPT PRINCIPAL (public/dashboard.js)
 * Lógica para carregar, filtrar e exibir dados das unidades.
 ************************************************************/

let todasUnidades = [];
let unidadesFiltradas = [];

// Dados fixos (Hardcoded) para preencher os selects. 
// Devem ser os mesmos usados no chavesvr.js
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
    "Bloco A", // Adicionei blocos genéricos se necessário
    "Bloco B"
];

// Mapeamento de rótulos para classes CSS
const SITUACAO_CLASSES = {
    "Em obra": "tag-Em-obra",
    "Ajuste de cliente": "tag-Ajuste-de-cliente",
    "Liberada": "tag-Liberada",
    "Aprovada": "tag-Aprovada"
};

const FINANCEIRO_CLASSES = {
    "OK": "tag-OK",
    "Pendente": "tag-Pendente"
};

const CHAVES_CLASSES = {
    "Entregue": "tag-Entregue",
    "Não Entregue": "tag-Nao-Entregue"
};

/************************************************************
 * FUNÇÕES AUXILIARES
 ************************************************************/

/**
 * Preenche um select HTML com opções baseadas em um array de dados.
 * @param {HTMLElement} selectElement O elemento <select> a ser preenchido.
 * @param {Array<string>} dataArray O array de strings a ser usado como opções.
 * @param {string} defaultLabel O rótulo da primeira opção (e.g., "Todos" ou "Selecione").
 */
function preencherSelect(selectElement, dataArray, defaultLabel) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '';
    // Adiciona a opção padrão (que representa "Todos" ou "Nenhum Filtro")
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    selectElement.appendChild(defaultOption);

    // Adiciona as demais opções
    dataArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}

/**
 * Retorna a lista única de empreendimentos presentes nos dados.
 * @returns {Array<string>} Lista de empreendimentos.
 */
function getEmpreendimentosUnicos() {
    const empreendimentos = todasUnidades.map(u => u.empreendimento).filter(Boolean);
    return [...new Set(empreendimentos)].sort();
}

/**
 * Retorna a lista única de blocos para um empreendimento específico.
 * @param {string} empreendimento O nome do empreendimento.
 * @returns {Array<string>} Lista de blocos.
 */
function getBlocosUnicos(empreendimento) {
    const blocos = todasUnidades
        .filter(u => u.empreendimento === empreendimento)
        .map(u => u.bloco)
        .filter(Boolean);
    return [...new Set(blocos)].sort();
}

/************************************************************
 * PREENCHER FILTROS
 ************************************************************/

/**
 * Preenche os selects iniciais (Empreendimento).
 */
function preencherSelectsIniciais() {
    const empreendimentos = getEmpreendimentosUnicos().length > 0 ? getEmpreendimentosUnicos() : EMPREENDIMENTOS_FIXOS;
    preencherSelect(document.getElementById("fEmpreendimento"), empreendimentos, "Todos Empreendimentos");
    // Preenche o filtro de Bloco inicialmente com todos os blocos fixos ou um array vazio.
    preencherSelect(document.getElementById("fBloco"), [], "Todos os Blocos");
}

/**
 * Preenche o select de Bloco com base no Empreendimento selecionado.
 */
function preencherFiltroBloco() {
    const empSelect = document.getElementById("fEmpreendimento");
    const blocoSelect = document.getElementById("fBloco");
    const empreendimentoSelecionado = empSelect.value;

    if (empreendimentoSelecionado) {
        // Pega os blocos únicos dos dados filtrados por empreendimento
        const blocosUnicos = getBlocosUnicos(empreendimentoSelecionado);
        preencherSelect(blocoSelect, blocosUnicos, "Todos os Blocos");
    } else {
        // Se "Todos Empreendimentos" for selecionado, limpa o filtro de Bloco
        preencherSelect(blocoSelect, [], "Todos os Blocos");
    }
    aplicarFiltro(); // Aplica o filtro após a alteração do empreendimento/bloco
}

/************************************************************
 * CARREGAMENTO DE DADOS
 ************************************************************/

/**
 * Carrega todas as unidades do servidor.
 */
async function carregarDados() {
    try {
        const response = await fetch('/unidades');
        if (!response.ok) {
            throw new Error(`Erro HTTP! Status: ${response.status}`);
        }
        todasUnidades = await response.json();
    } catch (error) {
        console.error("Erro ao carregar unidades:", error);
        // Exibe uma mensagem de erro na tabela, se possível
        const tbody = document.getElementById("tabelaDash");
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: red;">Erro ao carregar dados do servidor.</td></tr>';
    }
}

/************************************************************
 * LÓGICA DE FILTRAGEM
 ************************************************************/

/**
 * Aplica os filtros selecionados e atualiza a interface.
 */
function aplicarFiltro() {
    const fEmp = document.getElementById("fEmpreendimento").value;
    const fBloco = document.getElementById("fBloco").value;
    const fSituacao = document.getElementById("fSituacao").value;
    const fFinanceiro = document.getElementById("fFinanceiro").value;
    const fChaves = document.getElementById("fChaves").value;
    
    unidadesFiltradas = todasUnidades.filter(u => {
        // Filtro por Empreendimento (case insensitive)
        const matchEmp = !fEmp || (u.empreendimento && u.empreendimento.toLowerCase() === fEmp.toLowerCase());
        
        // Filtro por Bloco (case insensitive)
        const matchBloco = !fBloco || (u.bloco && u.bloco.toLowerCase() === fBloco.toLowerCase());

        // Filtro por Situação (case sensitive, correspondente às opções)
        const matchSituacao = !fSituacao || (u.situacao === fSituacao);
        
        // Filtro por Status Financeiro (case sensitive, correspondente às opções)
        const matchFinanceiro = !fFinanceiro || (u.statusFinanceiro === fFinanceiro);
        
        // Filtro por Status Chaves (case sensitive, correspondente às opções)
        const matchChaves = !fChaves || (u.chaves === fChaves);

        return matchEmp && matchBloco && matchSituacao && matchFinanceiro && matchChaves;
    });

    renderDash();
}

/************************************************************
 * RENDERIZAÇÃO
 ************************************************************/

/**
 * Atualiza os cards de resumo e a tabela de unidades.
 */
function renderDash() {
    const total = unidadesFiltradas.length;
    
    // Contagem dos cards
    const entregues = unidadesFiltradas.filter(u => u.chaves === "Entregue").length;
    const pendentes = unidadesFiltradas.filter(u => u.chaves === "Não Entregue").length; // Pendente = Chaves Não Entregues
    const liberadas = unidadesFiltradas.filter(u => u.situacao === "Liberada").length;
    const aprovadas = unidadesFiltradas.filter(u => u.situacao === "Aprovada").length;

    // --- 1. ATUALIZAR CARDS ---
    document.querySelector("#cardTotal p").textContent = total;
    document.querySelector("#cardEntregues p").textContent = entregues;
    document.querySelector("#cardPendentes p").textContent = pendentes;
    document.querySelector("#cardLiberadas p").textContent = liberadas;
    document.querySelector("#cardAprovadas p").textContent = aprovadas;

    // --- 2. ATUALIZAR TABELA ---
    const tbody = document.getElementById("tabelaDash");
    tbody.innerHTML = "";

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Nenhuma unidade encontrada com estes filtros.</td></tr>';
        return;
    }

    unidadesFiltradas.forEach(u => {
        const tr = document.createElement("tr");

        // Aplica as classes CSS com base no status
        const situacaoTag = u.situacao ? 
            `<span class="status-tag ${SITUACAO_CLASSES[u.situacao] || 'tag-default'}">${u.situacao}</span>` : 
            '';
        const financeiroTag = u.statusFinanceiro ? 
            `<span class="status-tag ${FINANCEIRO_CLASSES[u.statusFinanceiro] || 'tag-default'}">${u.statusFinanceiro}</span>` : 
            '';
        const chavesTag = u.chaves ? 
            `<span class="status-tag ${CHAVES_CLASSES[u.chaves] || 'tag-default'}">${u.chaves}</span>` : 
            '';
            
        // Formata as datas para exibição (DD/MM/AAAA)
        const dataVistoriaFmt = u.dataVistoria ? formatarDataBr(u.dataVistoria) : '-';
        const dataLiberacaoFmt = u.dataLiberacao ? formatarDataBr(u.dataLiberacao) : '-';


        // Usa data-label para responsividade em mobile (definido no styles.css)
        tr.innerHTML = `
            <td data-label="Empreendimento">${u.empreendimento || '-'}</td>
            <td data-label="Bloco">${u.bloco || '-'}</td>
            <td data-label="Unidade">${u.unidade || '-'}</td>
            <td data-label="Situação">${situacaoTag}</td>
            <td data-label="Financeiro">${financeiroTag}</td>
            <td data-label="Habitável">${u.habitavel || '-'}</td>
            <td data-label="Chaves">${chavesTag}</td>
            <td data-label="Vistoria">${dataVistoriaFmt} ${u.horaVistoria || ''}</td>
            <td data-label="Liberação">${dataLiberacaoFmt}</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Converte data ISO (YYYY-MM-DD) para BR (DD/MM/YYYY).
 * @param {string} iso Data no formato ISO.
 * @returns {string} Data no formato BR.
 */
function formatarDataBr(iso) {
    if (!iso) return "";
    const partes = iso.split("-");
    if (partes.length !== 3) return iso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/************************************************************
 * LOAD INICIAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carrega todos os dados do servidor
    await carregarDados();
    
    // 2. Preenche os filtros com a opção inicial "vazia" e os dados carregados
    preencherSelectsIniciais();

    // 3. Aplica o filtro inicial (mostra todos os dados)
    aplicarFiltro();

    // 4. Adiciona listener de evento para o filtro de Empreendimento (já foi adicionado no HTML, mas garantimos aqui)
    document.getElementById("fEmpreendimento").addEventListener("change", preencherFiltroBloco);

    // 5. Adiciona listeners de evento para os demais filtros
    document.getElementById("fBloco").addEventListener("change", aplicarFiltro);
    document.getElementById("fSituacao").addEventListener("change", aplicarFiltro);
    document.getElementById("fFinanceiro").addEventListener("change", aplicarFiltro);
    document.getElementById("fChaves").addEventListener("change", aplicarFiltro);
});
