/************************************************************
 * CADASTRO DE UNIDADES MELHORADO — ChaveVR
 * Versão com busca, filtros, exportação e modo escuro
 ************************************************************/

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

let idAtual = null;
let todasUnidades = [];
let unidadesFiltradas = [];

/************************************************************
 * INICIALIZAÇÃO
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
    preencherSelects();
    preencherFiltros();
    listarUnidades();
    configurarModoEscuro();
    configurarCalculoLote();
});

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
    });
}

/************************************************************
 * PREENCHER SELECTS
 ************************************************************/
function preencherSelect(selectElement, options, defaultText) {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(option => {
        selectElement.innerHTML += `<option value="${option}">${option}</option>`;
    });
}

function preencherSelects() {
    // Modal Individual
    preencherSelect(document.getElementById("mEmpreendimento"), EMPREENDIMENTOS_FIXOS, "Selecione o Empreendimento");
    preencherSelect(document.getElementById("mBloco"), BLOCOS_FIXOS, "Selecione o Bloco");

    // Modal Lote
    preencherSelect(document.getElementById("lEmpreendimento"), EMPREENDIMENTOS_FIXOS, "Selecione o Empreendimento");
    preencherSelect(document.getElementById("lBloco"), BLOCOS_FIXOS, "Selecione o Bloco");
}

function preencherFiltros() {
    preencherSelect(document.getElementById("filtroEmpreendimento"), EMPREENDIMENTOS_FIXOS, "Todos");
    preencherSelect(document.getElementById("filtroBloco"), BLOCOS_FIXOS, "Todos");
}

/************************************************************
 * LISTAR E FILTRAR UNIDADES
 ************************************************************/
async function listarUnidades() {
    try {
        const res = await fetch("/unidades");
        todasUnidades = await res.json();
        unidadesFiltradas = [...todasUnidades];
        
        atualizarCards();
        renderizarTabela();
        atualizarFooterStats();
    } catch (error) {
        console.error("Erro ao listar unidades:", error);
        mostrarNotificacao("Erro ao carregar unidades", "error");
    }
}

function filtrarTabela() {
    const busca = document.getElementById("buscaRapida").value.toLowerCase();
    const empreendimento = document.getElementById("filtroEmpreendimento").value;
    const bloco = document.getElementById("filtroBloco").value;
    const situacao = document.getElementById("filtroSituacao").value;

    unidadesFiltradas = todasUnidades.filter(u => {
        const matchBusca = !busca || 
            u.bloco.toLowerCase().includes(busca) || 
            u.unidade.toLowerCase().includes(busca) ||
            u.empreendimento.toLowerCase().includes(busca);
        
        const matchEmpreendimento = !empreendimento || u.empreendimento === empreendimento;
        const matchBloco = !bloco || u.bloco === bloco;
        const matchSituacao = !situacao || u.situacao === situacao;

        return matchBusca && matchEmpreendimento && matchBloco && matchSituacao;
    });

    renderizarTabela();
    atualizarFooterStats();
}

function limparFiltros() {
    document.getElementById("buscaRapida").value = "";
    document.getElementById("filtroEmpreendimento").value = "";
    document.getElementById("filtroBloco").value = "";
    document.getElementById("filtroSituacao").value = "";
    filtrarTabela();
}

function renderizarTabela() {
    const tbody = document.getElementById("tabelaUnidades");
    tbody.innerHTML = "";

    if (unidadesFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">Nenhuma unidade cadastrada</td></tr>';
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
            <td><span class="badge badge-${u.cvco === 'Liberado' ? 'success' : 'warning'}">${u.cvco}</span></td>
            <td><span class="badge badge-${u.chaves === 'Entregue' ? 'danger' : 'info'}">${u.chaves}</span></td>
            <td>${u.dataVistoria || '-'}</td>
            <td>${u.dataLiberacao || '-'}</td>
            <td class="td-actions">
                <button class="btn-small btn-editar" onclick="abrirModalEdicao('${u.id}')" title="Editar">✏️</button>
                <button class="btn-small btn-excluir" onclick="excluirUnidade('${u.id}')" title="Excluir">🗑️</button>
            </td>
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
 * ATUALIZAR CARDS
 ************************************************************/
function atualizarCards() {
    const total = todasUnidades.length;
    const liberadas = todasUnidades.filter(u => u.situacao === 'Liberada').length;
    const entregues = todasUnidades.filter(u => u.chaves === 'Entregue').length;

    document.getElementById('totalUnidades').textContent = total;
    document.getElementById('totalLiberadas').textContent = liberadas;
    document.getElementById('totalEntregues').textContent = entregues;
}

function atualizarFooterStats() {
    document.getElementById('totalExibindo').textContent = unidadesFiltradas.length;
    document.getElementById('totalGeral').textContent = todasUnidades.length;
}

/************************************************************
 * MODAL INDIVIDUAL
 ************************************************************/
function abrirModalNovo() {
    document.getElementById("tituloModal").textContent = "Nova Unidade";
    idAtual = null;
    limparFormularioModal();
    document.getElementById("mUnidade").readOnly = false;
    document.getElementById("modalFundo").style.display = "flex";
}

function limparFormularioModal() {
    document.getElementById("mEmpreendimento").value = "";
    document.getElementById("mBloco").value = "";
    document.getElementById("mUnidade").value = "";
    document.getElementById("mSituacao").value = "Em obra";
    document.getElementById("mFinanceiro").value = "Pendente";
    document.getElementById("mHabitavel").value = "Não";
    document.getElementById("mCVCO").value = "Pendente";
    document.getElementById("mChaves").value = "Não entregue";
    document.getElementById("mDataVistoria").value = "";
    document.getElementById("mHoraVistoria").value = "";
    document.getElementById("mAgendadoPor").value = "";
    document.getElementById("mDataLiberacao").value = "";
    document.getElementById("mObservacao").value = "";
}

async function abrirModalEdicao(id) {
    try {
        const res = await fetch(`/unidades/${id}`);
        const u = await res.json();

        if (u) {
            document.getElementById("tituloModal").textContent = "Editar Unidade";
            idAtual = id;

            document.getElementById("mEmpreendimento").value = u.empreendimento;
            document.getElementById("mBloco").value = u.bloco;
            document.getElementById("mUnidade").value = u.unidade;
            document.getElementById("mUnidade").readOnly = true;

            document.getElementById("mSituacao").value = u.situacao;
            document.getElementById("mFinanceiro").value = u.statusFinanceiro;
            document.getElementById("mHabitavel").value = u.habitavel;
            document.getElementById("mCVCO").value = u.cvco;
            document.getElementById("mChaves").value = u.chaves;

            document.getElementById("mDataVistoria").value = u.dataVistoria || "";
            document.getElementById("mHoraVistoria").value = u.horaVistoria || "";
            document.getElementById("mAgendadoPor").value = u.agendadoPor || "";
            document.getElementById("mDataLiberacao").value = u.dataLiberacao || "";
            document.getElementById("mObservacao").value = u.observacao || "";

            document.getElementById("modalFundo").style.display = "flex";
        }
    } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
        mostrarNotificacao("Erro ao carregar dados da unidade", "error");
    }
}

function fecharModal() {
    document.getElementById("modalFundo").style.display = "none";
    idAtual = null;
}

async function salvarModal() {
    const empreendimento = document.getElementById("mEmpreendimento").value;
    const bloco = document.getElementById("mBloco").value;
    const unidade = document.getElementById("mUnidade").value;

    if (!empreendimento || !bloco || !unidade) {
        mostrarNotificacao("Empreendimento, Bloco e Unidade são obrigatórios!", "error");
        return;
    }

    const dados = {
        empreendimento,
        bloco,
        unidade,
        situacao: document.getElementById("mSituacao").value,
        statusFinanceiro: document.getElementById("mFinanceiro").value,
        habitavel: document.getElementById("mHabitavel").value,
        cvco: document.getElementById("mCVCO").value,
        chaves: document.getElementById("mChaves").value,
        dataVistoria: document.getElementById("mDataVistoria").value,
        horaVistoria: document.getElementById("mHoraVistoria").value,
        agendadoPor: document.getElementById("mAgendadoPor").value,
        dataLiberacao: document.getElementById("mDataLiberacao").value,
        observacao: document.getElementById("mObservacao").value
    };

    const metodo = idAtual ? 'PUT' : 'POST';
    const url = idAtual ? `/unidades/${idAtual}` : '/unidades';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            fecharModal();
            listarUnidades();
            mostrarNotificacao(
                idAtual ? "Unidade atualizada com sucesso!" : "Unidade cadastrada com sucesso!",
                "success"
            );
        } else {
            mostrarNotificacao("Erro ao salvar unidade", "error");
        }
    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
        mostrarNotificacao("Erro na comunicação com o servidor", "error");
    }
}

/************************************************************
 * MODAL LOTE
 ************************************************************/
function configurarCalculoLote() {
    const inicio = document.getElementById('lUnidadeInicio');
    const fim = document.getElementById('lUnidadeFim');
    
    [inicio, fim].forEach(input => {
        input.addEventListener('input', calcularQuantidadeLote);
    });
}

function calcularQuantidadeLote() {
    const inicio = parseInt(document.getElementById('lUnidadeInicio').value);
    const fim = parseInt(document.getElementById('lUnidadeFim').value);
    
    if (inicio && fim && inicio <= fim) {
        const quantidade = fim - inicio + 1;
        document.getElementById('quantidadeLote').textContent = quantidade;
        document.getElementById('alertaQuantidade').style.display = 'block';
    } else {
        document.getElementById('alertaQuantidade').style.display = 'none';
    }
}

function abrirModalLote() {
    document.getElementById("lEmpreendimento").value = "";
    document.getElementById("lBloco").value = "";
    document.getElementById("lUnidadeInicio").value = "";
    document.getElementById("lUnidadeFim").value = "";
    document.getElementById("alertaQuantidade").style.display = "none";
    document.getElementById("modalLoteFundo").style.display = "flex";
}

function fecharModalLote() {
    document.getElementById("modalLoteFundo").style.display = "none";
}

async function salvarModalLote() {
    const empreendimento = document.getElementById("lEmpreendimento").value;
    const bloco = document.getElementById("lBloco").value;
    const inicio = parseInt(document.getElementById("lUnidadeInicio").value);
    const fim = parseInt(document.getElementById("lUnidadeFim").value);

    if (!empreendimento || !bloco || isNaN(inicio) || isNaN(fim) || inicio > fim) {
        mostrarNotificacao("Preencha todos os campos corretamente!", "error");
        return;
    }
    
    const quantidade = fim - inicio + 1;
    
    if (quantidade > 100) {
        if (!confirm(`Você está prestes a cadastrar ${quantidade} unidades. Tem certeza?`)) {
            return;
        }
    }

    const dadosLote = { empreendimento, bloco, inicio, fim };

    try {
        const res = await fetch('/unidades/lote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLote)
        });

        if (res.ok) {
            fecharModalLote();
            listarUnidades();
            mostrarNotificacao(`${quantidade} unidades cadastradas com sucesso!`, "success");
        } else {
            const erro = await res.json();
            mostrarNotificacao(`Erro: ${erro.message || 'Verifique os dados'}`, "error");
        }
    } catch (error) {
        console.error("Erro na comunicação com o servidor (Lote):", error);
        mostrarNotificacao("Erro na comunicação com o servidor", "error");
    }
}

/************************************************************
 * EXCLUIR UNIDADE
 ************************************************************/
async function excluirUnidade(id) {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) {
        return;
    }
    
    try {
        const res = await fetch(`/unidades/${id}`, { method: 'DELETE' });
        
        if (res.ok) {
            listarUnidades();
            mostrarNotificacao("Unidade excluída com sucesso!", "success");
        } else {
            mostrarNotificacao("Erro ao excluir unidade", "error");
        }
    } catch (error) {
        console.error("Erro ao excluir:", error);
        mostrarNotificacao("Erro na comunicação com o servidor", "error");
    }
}

/************************************************************
 * EXPORTAR EXCEL
 ************************************************************/
function exportarParaExcel() {
    if (unidadesFiltradas.length === 0) {
        mostrarNotificacao('Nenhum dado para exportar!', 'error');
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
    XLSX.utils.book_append_sheet(wb, ws, "Cadastro");

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ChaveVR_Cadastro_${dataAtual}.xlsx`);
    
    mostrarNotificacao('Excel exportado com sucesso!', 'success');
}

/************************************************************
 * NOTIFICAÇÕES
 ************************************************************/
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificação anterior se existir
    const notifAnterior = document.querySelector('.notification');
    if (notifAnterior) notifAnterior.remove();

    const notificacao = document.createElement('div');
    notificacao.className = `notification notification-${tipo}`;
    
    const icones = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notificacao.innerHTML = `
        <span>${icones[tipo]} ${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => notificacao.classList.add('show'), 100);
    
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}
