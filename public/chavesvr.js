// ... (Mantenha todo o código existente, como listarUnidades, preencherSelects, etc.)

// Dados fixos (Hardcoded) para preencher os selects
const EMPREENDIMENTOS_FIXOS = [
    // ... (Seus empreendimentos fixos)
    "Residencial Horizonte",
    "New Jersey",
    "Honolulu",
    "Plaza de Espanha",
    "Plaza Valencia",
    "Boulevard Fecile",
    "Federico Fellini"
];

const BLOCOS_FIXOS = [
    // ... (Seus blocos fixos)
    "Bloco 01",
    "Bloco 02",
    "Bloco 03",
];

let idEdicao = null;

// Garante que o ID da unidade que está sendo editada seja mantido.
let idAtual = null; 

// Executa ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    preencherSelects();
    listarUnidades();
});

/************************************************************
 * FUNÇÕES DE LISTAGEM E PREENCHIMENTO
 ************************************************************/

// Função para preencher os selects de Empreendimento e Bloco nos modais
function preencherSelects() {
    // Selects do Modal Individual (mEmpreendimento, mBloco)
    preencherSelect(document.getElementById("mEmpreendimento"), EMPREENDIMENTOS_FIXOS, "Selecione o Empreendimento");
    preencherSelect(document.getElementById("mBloco"), BLOCOS_FIXOS, "Selecione o Bloco");

    // NOVOS Selects do Modal em Lote (lEmpreendimento, lBloco)
    preencherSelect(document.getElementById("lEmpreendimento"), EMPREENDIMENTOS_FIXOS, "Selecione o Empreendimento");
    preencherSelect(document.getElementById("lBloco"), BLOCOS_FIXOS, "Selecione o Bloco");
}

function preencherSelect(selectElement, options, defaultText) {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(option => {
        selectElement.innerHTML += `<option value="${option}">${option}</option>`;
    });
}

// ... (Mantenha a função listarUnidades completa que lista todas as colunas)
async function listarUnidades() {
    try {
        const res = await fetch("/unidades");
        const unidades = await res.json();
        const tbody = document.getElementById("tabelaUnidades");
        tbody.innerHTML = "";

        if (unidades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">Nenhuma unidade cadastrada</td></tr>';
            return;
        }

        unidades.forEach(u => {
            const tr = document.createElement("tr");
            
            tr.innerHTML = `
                <td>${u.empreendimento}</td>
                <td>${u.bloco}</td>
                <td>${u.unidade}</td>
                <td>${u.situacao}</td>
                <td>${u.statusFinanceiro}</td>
                <td>${u.habitavel}</td>
                <td>${u.cvco}</td>
                <td>${u.chaves}</td>
                <td>${u.dataVistoria || '-'}</td>
                <td>${u.dataLiberacao || '-'}</td>
                <td>
                    <button class="btn-small btn-editar" onclick="abrirModalEdicao('${u.id}')">Editar</button>
                    <button class="btn-small btn-excluir" onclick="excluirUnidade('${u.id}')">Excluir</button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao listar unidades:", error);
    }
}


/************************************************************
 * FUNÇÕES MODAL INDIVIDUAL (Sem alteração na lógica de salvar)
 ************************************************************/
function abrirModalNovo() {
    // ... (Lógica de abertura e reset do modal individual)
    document.getElementById("tituloModal").textContent = "Nova Unidade";
    idAtual = null; // Reseta o ID para garantir que seja um novo cadastro
    document.getElementById("modalFundo").style.display = "flex";
    document.getElementById("mUnidade").readOnly = false;
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

// ... (abrirModalEdicao, fecharModal, salvarModal - Mantenha as funções existentes)
async function salvarModal() {
    // Coleta dados e salva individualmente (POST ou PUT)
    // ... (Mantenha sua função salvarModal completa e funcional)

    const empreendimento = document.getElementById("mEmpreendimento").value;
    const bloco = document.getElementById("mBloco").value;
    const unidade = document.getElementById("mUnidade").value;

    if (!empreendimento || !bloco || !unidade) {
        alert("Empreendimento, Bloco e Unidade são obrigatórios.");
        return;
    }

    const dados = {
        empreendimento: empreendimento,
        bloco: bloco,
        unidade: unidade,
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
            alert("Unidade salva com sucesso!");
        } else {
            alert("Erro ao salvar. Verifique o console.");
        }
    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
        alert("Erro na comunicação com o servidor.");
    }
}
function fecharModal() {
    document.getElementById("modalFundo").style.display = "none";
    idAtual = null;
}
// ... (excluirUnidade - Mantenha a função existente)
async function abrirModalEdicao(id) {
    try {
        const res = await fetch(`/unidades/${id}`);
        const u = await res.json();

        if (u) {
            document.getElementById("tituloModal").textContent = "Editar Unidade";
            idAtual = id;

            // Preenche os campos
            document.getElementById("mEmpreendimento").value = u.empreendimento;
            document.getElementById("mBloco").value = u.bloco;
            document.getElementById("mUnidade").value = u.unidade;
            document.getElementById("mUnidade").readOnly = true; // Não permite mudar o número da unidade

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
    }
}

async function excluirUnidade(id) {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) {
        return;
    }
    
    try {
        const res = await fetch(`/unidades/${id}`, { method: 'DELETE' });
        
        if (res.ok) {
            listarUnidades();
            alert("Unidade excluída com sucesso!");
        } else {
            alert("Erro ao excluir unidade.");
        }
    } catch (error) {
        console.error("Erro na comunicação com o servidor ao excluir:", error);
    }
}


/************************************************************
 * NOVAS FUNÇÕES MODAL EM LOTE
 ************************************************************/

function abrirModalLote() {
    // Reseta campos do lote
    document.getElementById("lEmpreendimento").value = "";
    document.getElementById("lBloco").value = "";
    document.getElementById("lUnidadeInicio").value = "";
    document.getElementById("lUnidadeFim").value = "";
    
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
        alert("Preencha o Empreendimento, Bloco e uma faixa numérica válida (Início deve ser menor ou igual a Fim).");
        return;
    }
    
    // Confirmação para evitar cadastros acidentais muito grandes
    if (fim - inicio > 100) {
        if (!confirm(`Você está prestes a cadastrar ${fim - inicio + 1} unidades. Tem certeza?`)) {
            return;
        }
    }

    const dadosLote = {
        empreendimento: empreendimento,
        bloco: bloco,
        inicio: inicio,
        fim: fim
    };

    try {
        const res = await fetch('/unidades/lote', { // NOVA ROTA
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosLote)
        });

        if (res.ok) {
            fecharModalLote();
            listarUnidades();
            alert(`Lote de ${fim - inicio + 1} unidades cadastrado com sucesso!`);
        } else {
            const erro = await res.json();
            alert(`Erro ao cadastrar lote: ${erro.message || 'Verifique o console.'}`);
        }
    } catch (error) {
        console.error("Erro na comunicação com o servidor (Lote):", error);
        alert("Erro na comunicação com o servidor.");
    }
}

