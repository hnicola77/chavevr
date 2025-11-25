/************************************************************
 * CHAVEVR – JAVASCRIPT PRINCIPAL (public/chavesvr.js)
 * Adaptado para Backend de Tabela Única (Strings)
 ************************************************************/

let listaUnidades = [];
let idEditando = null;

// Dados fixos (Hardcoded) para preencher os selects do modal
const EMPREENDIMENTOS_FIXOS = [
    "Residencial Horizonte",
    "New Jersey",
    "Honolulu",
    "Plaza de Espanha",
    "Plaza Valencia",
    "Boulevard Fecile",
    "Federico Fellini"
];

const BLOCOS_FIXOS = [
    "Torre A",
    "Torre B",
    "Bloco 01",
    "Bloco 02",
    "Bloco 03",
];

/************************************************************
 * LOAD INICIAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
    // Não lê IDs da URL (lógica antiga removida)
    preencherSelectsFixos();
    carregarUnidades();
});

// ... (Restante da função preencherSelectsFixos)
function preencherSelectsFixos() {
    
    // 1. Empreendimentos
    const selectEmp = document.getElementById("mEmpreendimento");
    selectEmp.innerHTML = '<option value="">Selecione o Empreendimento</option>';
    
    EMPREENDIMENTOS_FIXOS.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e;
        opt.textContent = e;
        selectEmp.appendChild(opt);
    });

    // 2. Blocos
    const selectBloco = document.getElementById("mBloco");
    selectBloco.innerHTML = '<option value="">Selecione o Bloco</option>';
    
    BLOCOS_FIXOS.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        selectBloco.appendChild(opt);
    });
}


/************************************************************
 * CARREGAR TABELA
 ************************************************************/
async function carregarUnidades() {
    try {
        const res = await fetch("/unidades");
        listaUnidades = await res.json();

        const tbody = document.getElementById("tabelaUnidades");
        tbody.innerHTML = "";

        if (listaUnidades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhuma unidade cadastrada.</td></tr>';
            return;
        }

        listaUnidades.forEach(u => {
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
                    <button class="btn-small btn-editar" onclick="abrirModalEditar(${u.id})">Editar</button>
                    <button class="btn-small btn-excluir" onclick="excluirUnidade(${u.id})">Excluir</button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar unidades:", error);
        // Não é necessário alerta aqui, pois o servidor pode estar reiniciando
    }
}

/************************************************************
 * MODAL – ABRIR PARA NOVA UNIDADE
 ************************************************************/
function abrirModalNovo() {
    idEditando = null;
    document.getElementById("tituloModal").innerText = "Nova Unidade";

    // Limpar campos
    document.getElementById("mEmpreendimento").value = "";
    document.getElementById("mBloco").value = "";
    document.getElementById("mUnidade").value = "";
    document.getElementById("mSituacao").value = "Em obra";
    document.getElementById("mFinanceiro").value = "Liberada";
    document.getElementById("mHabitavel").value = "Sim";
    document.getElementById("mCVCO").value = "Liberado";
    document.getElementById("mChaves").value = "Não entregue";
    document.getElementById("mDataVistoria").value = "";
    document.getElementById("mHoraVistoria").value = "";
    document.getElementById("mDataLiberacao").value = "";
    document.getElementById("mAgendadoPor").value = "";
    document.getElementById("mObservacao").value = "";

    document.getElementById("modalFundo").style.display = "flex";
}

/************************************************************
 * MODAL – ABRIR PARA EDIÇÃO
 ************************************************************/
function abrirModalEditar(id) {
    const u = listaUnidades.find(x => x.id == id);
    if (!u) return;

    idEditando = id;

    document.getElementById("tituloModal").innerText = "Editar Unidade";

    // Preenche com os valores de STRING do objeto
    document.getElementById("mEmpreendimento").value = u.empreendimento;
    document.getElementById("mBloco").value = u.bloco;
    document.getElementById("mUnidade").value = u.unidade;
    document.getElementById("mSituacao").value = u.situacao;
    document.getElementById("mFinanceiro").value = u.statusFinanceiro;
    document.getElementById("mHabitavel").value = u.habitavel;
    document.getElementById("mCVCO").value = u.cvco;
    document.getElementById("mChaves").value = u.chaves;
    document.getElementById("mDataVistoria").value = u.dataVistoria || "";
    document.getElementById("mHoraVistoria").value = u.horaVistoria || "";
    document.getElementById("mDataLiberacao").value = u.dataLiberacao || "";
    document.getElementById("mAgendadoPor").value = u.agendadoPor || "";
    document.getElementById("mObservacao").value = u.observacao || "";

    document.getElementById("modalFundo").style.display = "flex";
}

/************************************************************
 * MODAL – FECHAR
 ************************************************************/
function fecharModal() {
    document.getElementById("modalFundo").style.display = "none";
}

/************************************************************
 * SALVAR (NOVO OU EDITADO) - USANDO STRINGS
 ************************************************************/
async function salvarModal() {
    const unidade = {
        // Envia as strings diretamente para o servidor
        empreendimento: document.getElementById("mEmpreendimento").value, 
        bloco: document.getElementById("mBloco").value,
        unidade: document.getElementById("mUnidade").value,
        situacao: document.getElementById("mSituacao").value,
        statusFinanceiro: document.getElementById("mFinanceiro").value,
        habitavel: document.getElementById("mHabitavel").value,
        cvco: document.getElementById("mCVCO").value,
        chaves: document.getElementById("mChaves").value,
        dataVistoria: document.getElementById("mDataVistoria").value,
        horaVistoria: document.getElementById("mHoraVistoria").value,
        dataLiberacao: document.getElementById("mDataLiberacao").value,
        agendadoPor: document.getElementById("mAgendadoPor").value,
        observacao: document.getElementById("mObservacao").value
    };

    if (!unidade.empreendimento || !unidade.bloco || !unidade.unidade) {
        alert("Preencha Empreendimento, Bloco e Unidade.");
        return;
    }

    try {
        const metodo = idEditando ? "PUT" : "POST";
        const url = idEditando ? `/unidades/${idEditando}` : "/unidades";

        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(unidade)
        });

        if (!res.ok) {
            // Tenta ler o erro do servidor para o console
            let errorMsg = `Erro ${res.status} ao salvar.`;
            try {
                const errorBody = await res.json();
                errorMsg = errorBody.error || errorMsg;
            } catch (e) {
                // Se a resposta não for JSON (ex: HTML de erro), usa a mensagem padrão
            }
            throw new Error(errorMsg);
        }

        fecharModal();
        carregarUnidades();

    } catch (error) {
        console.error("Falha ao salvar. Detalhes:", error);
        alert("Erro ao salvar. Verifique o console."); //
    }
}

/************************************************************
 * EXCLUIR UNIDADE
 ************************************************************/
async function excluirUnidade(id) {
    if (!confirm("Deseja realmente excluir esta unidade?")) return;

    try {
        const res = await fetch(`/unidades/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`Erro ${res.status} ao excluir.`);
        
        carregarUnidades();

    } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Falha ao excluir. Verifique o console.");
    }
}

