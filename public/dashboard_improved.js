/************************************************************
 * DASHBOARD MELHORADO — ChaveVR
 * Versão com gráficos, busca, exportação e modo escuro
 ************************************************************/

let todasUnidades = [];
let unidadesFiltradas = [];
let currentCardFilter = 'total';
let chartSituacao = null;
let chartEntrega = null;

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
 * INICIALIZAÇÃO
 ************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
    preencherSelectsIniciais();
    await carregarDados();
    aplicarFiltro();
    inicializarGraficos();
    configurarModoEscuro();
    inicializarLucideIcons();
});

function inicializarLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/************************************************************
 * MODO ESCURO
 ************************************************************/
function configurarModoEscuro() {
    const toggleBtn = document.getElementById('toggleDarkMode');
    const isDark = localStorage.getItem('darkMode') === 'true';
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀️';
    }
    
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isNowDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isNowDark);
        toggleBtn.textContent = isNowDark ? '☀️' : '🌙';
        
        // Atualiza cores dos gráficos
        atualizarCoresGraficos();
    });
}

function atualizarCoresGraficos() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? '#444' : '#ddd';
    
    if (chartSituacao) {
        chartSituacao.options.plugins.legend.labels.color = textColor;
        chartSituacao.options.scales.y.grid.color = gridColor;
        chartSituacao.options.scales.y.ticks.color = textColor;
        chartSituacao.options.scales.x.ticks.color = textColor;
        chartSituacao.update();
    }
    
    if (chartEntrega) {
        chartEntrega.options.plugins.legend.labels.color = textColor;
        chartEntrega.update();
    }
}

/************************************************************
 * CARREGAR DADOS
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
 * PREENCHER FILTROS
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
    preencherSelect(document.getElementById('fEmpreendimento'), EMPREENDIMENTOS_FIXOS, 'Todos');
    const fBloco = document.getElementById('fBloco');
    fBloco.innerHTML = '<option value="">Todos</option>';
    preencherSelect(fBloco, BLOCOS_FIXOS, 'Todos');
}

/************************************************************
 * FILTROS
 ************************************************************/
function filtrarPorCard(filterKey) {
    if (currentCardFilter === filterKey) {
        currentCardFilter = 'total';
    } else {
        currentCardFilter = filterKey;
    }
    aplicarFiltro();
}

function limparTodosFiltros() {
    document.getElementById('buscaRapida').value = '';
    document.getElementById('fEmpreendimento').value = '';
    document.getElementById('fBloco').value = '';
    document.getElementById('fSituacao').value = '';
    document.getElementById('fChaves').value = '';
    currentCardFilter = 'total';
    aplicarFiltro();
}

function marcarCardAtivo() {
    document.querySelectorAll('.card-clickable').forEach(card => {
        card.classList.remove('active-filter');
    });

    if (currentCardFilter !== 'total') {
        const cardId = 'card' + currentCardFilter.charAt(0).toUpperCase() + currentCardFilter.slice(1);
        const activeCard = document.getElementById(cardId);
        if (activeCard) {
            activeCard.classList.add('active-filter');
        }
    }
}

function aplicarFiltro() {
    const busca = document.getElementById('buscaRapida').value.toLowerCase();
    const empreendimento = document.getElementById('fEmpreendimento').value;
    const bloco = document.getElementById('fBloco').value;
    const situacao = document.getElementById('fSituacao').value;
    const chaves = document.getElementById('fChaves').value;

    marcarCardAtivo();

    let unidadesGerais = todasUnidades.filter(u => {
        if (busca && !u.bloco.toLowerCase().includes(busca) && !u.unidade.toLowerCase().includes(busca)) return false;
        if (empreendimento && u.empreendimento !== empreendimento) return false;
        if (bloco && u.bloco !== bloco) return false;
        if (situacao && u.situacao !== situacao) return false;
        if (chaves && u.chaves !== chaves) return false;
        return true;
    });
    
    const totalGeral = unidadesGerais.length;
    const entreguesGeral = unidadesGerais.filter(u => u.chaves === "Entregue").length;
    const pendentesGeral = unidadesGerais.filter(u => 
        u.situacao !== 'Liberada' && u.situacao !== 'Aprovada' && u.chaves !== 'Entregue'
    ).length;
    const liberadasGeral = unidadesGerais.filter(u => u.situacao === "Liberada").length;
    const aprovadasGeral = unidadesGerais.filter(u => u.situacao === "Aprovada").length;

    // Atualizar cards com porcentagens
    atualizarCard('cardTotal', totalGeral);
    atualizarCard('cardEntregues', entreguesGeral, totalGeral);
    atualizarCard('cardPendentes', pendentesGeral, totalGeral);
    atualizarCard('cardLiberadas', liberadasGeral, totalGeral);
    atualizarCard('cardAprovadas', aprovadasGeral, totalGeral);

    // Filtro do card
    unidadesFiltradas = unidadesGerais.filter(u => {
        switch (currentCardFilter) {
            case 'total': return true;
            case 'entregues': return u.chaves === "Entregue";
            case 'pendentes': return u.situacao !== 'Liberada' && u.situacao !== 'Aprovada' && u.chaves !== 'Entregue';
            case 'liberadas': return u.situacao === "Liberada";
            case 'aprovadas': return u.situacao === "Aprovada";
            default: return true;
        }
    });

    renderizarTabela();
    atualizarGraficos();
    atualizarFooterStats();
}

function atualizarCard(cardId, valor, total = null) {
    const card = document.getElementById(cardId);
    const numberElement = card.querySelector('.card-number');
    const percentElement = card.querySelector('.card-percent');
    
    numberElement.textContent = valor;
    
    if (percentElement && total && total > 0) {
        const percent = ((valor / total) * 100).toFixed(1);
        percentElement.textContent = `${percent}%`;
    }
}

/************************************************************
 * RENDERIZAR TABELA
 ************************************************************/
function renderizarTabela() {
    const tbody = document.getElementById("tabelaDash");
    tbody.innerHTML = "";

    if (unidadesFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Nenhuma unidade encontrada com estes filtros.</td></tr>';
        return;
    }

    unidadesFiltradas.forEach(u => {
        const tr = document.createElement("tr");
        tr.classList.add('table-row-animated');

        tr.innerHTML = `
            <td>${u.empreendimento}</td>
            <td>${u.bloco}</td>
            <td><strong>${u.unidade}</strong></td>
            <td><span class="badge badge-${getBadgeClass(u.situacao)}">${u.situacao}</span></td>
            <td><span class="badge badge-${u.statusFinanceiro === 'Liberada' ? 'success' : 'warning'}">${u.statusFinanceiro}</span></td>
            <td><span class="badge badge-${u.habitavel === 'Sim' ? 'success' : 'secondary'}">${u.habitavel}</span></td>
            <td><span class="badge badge-${u.chaves === 'Entregue' ? 'danger' : 'info'}">${u.chaves}</span></td>
            <td>${u.dataVistoria || '-'}</td>
            <td>${u.dataLiberacao || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getBadgeClass(situacao) {
    const map = {
        'Em obra': 'warning',
        'Ajuste de cliente': 'info',
        'Liberada': 'success',
        'Aprovada': 'primary',
        'Cancelada': 'secondary'
    };
    return map[situacao] || 'secondary';
}

/************************************************************
 * GRÁFICOS
 ************************************************************/
function inicializarGraficos() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? '#444' : '#ddd';

    // Gráfico de Situação (Barras)
    const ctxSituacao = document.getElementById('chartSituacao').getContext('2d');
    chartSituacao = new Chart(ctxSituacao, {
        type: 'bar',
        data: {
            labels: ['Em Obra', 'Ajuste', 'Liberada', 'Aprovada', 'Cancelada'],
            datasets: [{
                label: 'Unidades',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(0, 188, 212, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(158, 158, 158, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(0, 188, 212, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(158, 158, 158, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    ticks: { color: textColor }
                }
            }
        }
    });

    // Gráfico de Entrega (Pizza)
    const ctxEntrega = document.getElementById('chartEntrega').getContext('2d');
    chartEntrega = new Chart(ctxEntrega, {
        type: 'doughnut',
        data: {
            labels: ['Entregue', 'Não Entregue'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(244, 67, 54, 0.8)',
                    'rgba(158, 158, 158, 0.8)'
                ],
                borderColor: [
                    'rgba(244, 67, 54, 1)',
                    'rgba(158, 158, 158, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor }
                }
            }
        }
    });
}

function atualizarGraficos() {
    if (!chartSituacao || !chartEntrega) return;

    const emObra = unidadesFiltradas.filter(u => u.situacao === 'Em obra').length;
    const ajuste = unidadesFiltradas.filter(u => u.situacao === 'Ajuste de cliente').length;
    const liberada = unidadesFiltradas.filter(u => u.situacao === 'Liberada').length;
    const aprovada = unidadesFiltradas.filter(u => u.situacao === 'Aprovada').length;
    const cancelada = unidadesFiltradas.filter(u => u.situacao === 'Cancelada').length;

    chartSituacao.data.datasets[0].data = [emObra, ajuste, liberada, aprovada, cancelada];
    chartSituacao.update();

    const entregue = unidadesFiltradas.filter(u => u.chaves === 'Entregue').length;
    const naoEntregue = unidadesFiltradas.filter(u => u.chaves === 'Não entregue').length;

    chartEntrega.data.datasets[0].data = [entregue, naoEntregue];
    chartEntrega.update();
}

/************************************************************
 * EXPORTAR EXCEL
 ************************************************************/
function exportarParaExcel() {
    if (unidadesFiltradas.length === 0) {
        alert('Nenhum dado para exportar!');
        return;
    }

    const dadosExportar = unidadesFiltradas.map(u => ({
        'Empreendimento': u.empreendimento,
        'Bloco': u.bloco,
        'Unidade': u.unidade,
        'Situação': u.situacao,
        'Financeiro': u.statusFinanceiro,
        'Habitável': u.habitavel,
        'CVCO': u.cvco,
        'Chaves': u.chaves,
        'Data Vistoria': u.dataVistoria || '',
        'Hora Vistoria': u.horaVistoria || '',
        'Agendado Por': u.agendadoPor || '',
        'Data Liberação': u.dataLiberacao || '',
        'Observação': u.observacao || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dashboard");

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ChaveVR_Dashboard_${dataAtual}.xlsx`);
}

/************************************************************
 * FOOTER STATS
 ************************************************************/
function atualizarFooterStats() {
    document.getElementById('totalExibindo').textContent = unidadesFiltradas.length;
    document.getElementById('totalGeral').textContent = todasUnidades.length;
}
