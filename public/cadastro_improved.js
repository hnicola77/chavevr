/************************************************************
 * CADASTRO DE UNIDADES MELHORADO — ChaveVR (CORRIGIDO)
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
    if (!toggleBtn) return;
    
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
    if (!selectElement) return;
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
        if (!res.ok) throw new Error('Erro ao carregar unidades');
        
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
    const busca = document.getElementById("buscaRapida")?.value.toLowerCase() || '';
    const empreendimento = document.getElementById("filtroEmpreendimento")?.value || '';
    const bloco = document.getElementById("filtroBloco")?.value || '';
    const situacao = document.getElementById("filtroSituacao")?.value || '';

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
    const busca = document.getElementById("buscaRapida");
    const emp = document.getElementById("filtroEmpreendimento");
    const bloco = document.getElementById("filtroBloco");
    const sit = document.getElementById("filtroSituacao");
    
    if (busca) busca.value = "";
    if (emp) emp.value = "";
    if (bloco) bloco.value = "";
    if (sit) sit.value = "";
    
    filtrarTabela();
}

function renderizarTabela() {
    const tbody = document.getElementById("tabelaUnidades");
    if (!tbody) return;
    
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

    const totalEl = document.getElementById('totalUnidades');
    const libEl = document.getElementById('totalLiberadas');
    const entEl = document.getElementById('totalEntregues');
    
    if (totalEl) totalEl.textContent = total;
    if (libEl) libEl.textContent = liberadas;
    if (entEl) entEl.textContent = entregues;
}

function atualizarFooterStats() {
    const exibindo = document.getElementById('totalExibindo');
    const geral = document.getElementById('totalGeral');
    
    if (exibindo) exibindo.textContent = unidadesFiltradas.length;
    if (geral) geral.textContent = todasUnidades.length;
}

/************************************************************
 * MODAL INDIVIDUAL
 ************************************************************/
function abrirModalNovo() {
    const titulo = document.getElementById("tituloModal");
    const modal = document.getElementById("modalFundo");
    const unidadeInput = document.getElementById("mUnidade");
    
    if (titulo) titulo.textContent = "Nova Unidade";
    idAtual = null;
    limparFormularioModal();
    if (unidadeInput) unidadeInput.readOnly = false;
    if (modal) modal.style.display = "flex";
}

function limparFormularioModal() {
    const campos = {
        mEmpreendimento: "",
        mBloco: "",
        mUnidade: "",
        mSituacao: "Em obra",
        mFinanceiro: "Pendente",
        mHabitavel: "Não",
        mCVCO: "Pendente",
        mChaves: "Não entregue",
        mDataVistoria: "",
        mHoraVistoria: "",
        mAgendadoPor: "",
        mDataLiberacao: "",
        mObservacao: ""
    };
    
    Object.keys(campos).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = campos[id];
    });
}

async function abrirModalEdicao(id) {
    try {
        const res = await fetch(`/unidades/${id}`);
        if (!res.ok) throw new Error('Erro ao carregar unidade');
        
        const u = await res.json();

        if (u) {
            const titulo = document.getElementById("tituloModal");
            const modal = document.getElementById("modalFundo");
            const unidadeInput = document.getElementById("mUnidade");
            
            if (titulo) titulo.textContent = "Editar Unidade";
            idAtual = id;

            const campos = {
                mEmpreendimento: u.empreendimento,
                mBloco: u.bloco,
                mUnidade: u.unidade,
                mSituacao: u.situacao,
                mFinanceiro: u.statusFinanceiro,
                mHabitavel: u.habitavel,
                mCVCO: u.cvco,
                mChaves: u.chaves,
                mDataVistoria: u.dataVistoria || "",
                mHoraVistoria: u.horaVistoria || "",
                mAgendadoPor: u.agendadoPor || "",
                mDataLiberacao: u.dataLiberacao || "",
                mObservacao: u.observacao || ""
            };
            
            Object.keys(campos).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = campos[id];
            });
            
            if (unidadeInput) unidadeInput.readOnly = true;
            if (modal) modal.style.display = "flex";
        }
    } catch (error) {
        console.error("Erro ao carregar dados para edição:", error);
        mostrarNotificacao("Erro ao carregar dados da unidade", "error");
    }
}

function fecharModal() {
    const modal = document.getElementById("modalFundo");
    if (modal) modal.style.display = "none";
    idAtual = null;
}

async function salvarModal() {
    console.log("Função salvarModal chamada"); // DEBUG
    
    const empreendimento = document.getElementById("mEmpreendimento")?.value;
    const bloco = document.getElementById("mBloco")?.value;
    const unidade = document.getElementById("mUnidade")?.value;

    console.log("Valores:", { empreendimento, bloco, unidade }); // DEBUG

    if (!empreendimento || !bloco || !unidade) {
        mostrarNotificacao("Empreendimento, Bloco e Unidade são obrigatórios!", "error");
        return;
    }

    const dados = {
        empreendimento,
        bloco,
        unidade,
        situacao: document.getElementById("mSituacao")?.value || "Em obra",
        statusFinanceiro: document.getElementById("mFinanceiro")?.value || "Pendente",
        habitavel: document.getElementById("mHabitavel")?.value || "Não",
        cvco: document.getElementById("mCVCO")?.value || "Pendente",
        chaves: document.getElementById("mChaves")?.value || "Não entregue",
        dataVistoria: document.getElementById("mDataVistoria")?.value || null,
        horaVistoria: document.getElementById("mHoraVistoria")?.value || null,
        agendadoPor: document.getElementById("mAgendadoPor")?.value || null,
        dataLiberacao: document.getElementById("mDataLiberacao")?.value || null,
        observacao: document.getElementById("mObservacao")?.value || null
    };

    const metodo = idAtual ? 'PUT' : 'POST';
    const url = idAtual ? `/unidades/${idAtual}` : '/unidades';

    console.log("Enviando:", { metodo, url, dados }); // DEBUG

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        console.log("Resposta status:", res.status); // DEBUG

        if (res.ok) {
            fecharModal();
            await listarUnidades();
            mostrarNotificacao(
                idAtual ? "Unidade atualizada com sucesso!" : "Unidade cadastrada com sucesso!",
                "success"
            );
        } else {
            const erro = await res.text();
            console.error("Erro do servidor:", erro); // DEBUG
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
    
    if (!inicio || !fim) return;
    
    [inicio, fim].forEach(input => {
        input.addEventListener('input', calcularQuantidadeLote);
    });
}

function calcularQuantidadeLote() {
    const inicioEl = document.getElementById('lUnidadeInicio');
    const fimEl = document.getElementById('lUnidadeFim');
    const quantEl = document.getElementById('quantidadeLote');
    const alertEl = document.getElementById('alertaQuantidade');
    
    if (!inicioEl || !fimEl || !quantEl || !alertEl) return;
    
    const inicio = parseInt(inicioEl.value);
    const fim = parseInt(fimEl.value);
    
    if (inicio && fim && inicio <= fim) {
        const quantidade = fim - inicio + 1;
        quantEl.textContent = quantidade;
        alertEl.style.display = 'block';
    } else {
        alertEl.style.display = 'none';
    }
}

function abrirModalLote() {
    const modal = document.getElementById("modalLoteFundo");
    const alertEl = document.getElementById("alertaQuantidade");
    
    const campos = ['lEmpreendimento', 'lBloco', 'lUnidadeInicio', 'lUnidadeFim'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    
    if (alertEl) alertEl.style.display = "none";
    if (modal) modal.style.display = "flex";
}

function fecharModalLote() {
    const modal = document.getElementById("modalLoteFundo");
    if (modal) modal.style.display = "none";
}

async function salvarModalLote() {
    console.log("Função salvarModalLote chamada"); // DEBUG
    
    const empreendimento = document.getElementById("lEmpreendimento")?.value;
    const bloco = document.getElementById("lBloco")?.value;
    const inicio = parseInt(document.getElementById("lUnidadeInicio")?.value);
    const fim = parseInt(document.getElementById("lUnidadeFim")?.value);

    console.log("Valores Lote:", { empreendimento, bloco, inicio, fim }); // DEBUG

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

    console.log("Enviando lote:", dadosLote); // DEBUG

    try {
        const res = await fetch('/unidades/lote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLote)
        });

        console.log("Resposta lote status:", res.status); // DEBUG

        if (res.ok) {
            fecharModalLote();
            await listarUnidades();
            mostrarNotificacao(`${quantidade} unidades cadastradas com sucesso!`, "success");
        } else {
            const erro = await res.json();
            console.error("Erro lote:", erro); // DEBUG
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
            await listarUnidades();
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

    if (typeof XLSX === 'undefined') {
        mostrarNotificacao('Biblioteca de Excel não carregada. Recarregue a página.', 'error');
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

// Torna as funções globais acessíveis
window.abrirModalNovo = abrirModalNovo;
window.abrirModalEdicao = abrirModalEdicao;
window.fecharModal = fecharModal;
window.salvarModal = salvarModal;
window.abrirModalLote = abrirModalLote;
window.fecharModalLote = fecharModalLote;
window.salvarModalLote = salvarModalLote;
window.excluirUnidade = excluirUnidade;
window.filtrarTabela = filtrarTabela;
window.limparFiltros = limparFiltros;
window.exportarParaExcel = exportarParaExcel;
