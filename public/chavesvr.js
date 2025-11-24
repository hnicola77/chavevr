/************************************************************
 * CHAVEVR – JAVASCRIPT PRINCIPAL (FINAL)
 * Cadastro → Modal (2 colunas) → Edição → Exclusão
 ************************************************************/

let listaUnidades = [];
let idEditando = null;

/************************************************************
 * LOAD INICIAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
    carregarUnidades();
    preencherSelectsFixos();
});

/************************************************************
 * SELECT FIXO – EMPREENDIMENTOS E BLOCOS
 ************************************************************/
function preencherSelectsFixos() {
    const empreendimentos = [
        "New Jersey",
        "Honolulu",
        "Plaza de Espanha",
        "Plaza Valencia",
        "Boulevard Fecile",
        "Federico Fellini"
    ];

    const blocos = Array.from({ length: 70 }, (_, i) => `Bloco ${i + 1}`);

    document.querySelectorAll("#mEmpreendimento").forEach(sel => {
        sel.innerHTML = "";
        empreendimentos.forEach(e => {
            const opt = document.createElement("option");
            opt.value = e;
            opt.textContent = e;
            sel.appendChild(opt);
        });
    });

    document.querySelectorAll("#mBloco").forEach(sel => {
        sel.innerHTML = "";
        blocos.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b;
            opt.textContent = b;
            sel.appendChild(opt);
        });
    });
}

/************************************************************
 * CARREGAR TABELA
 ************************************************************/
async function carregarUnidades() {
    const res = await fetch("/unidades");
    listaUnidades = await res.json();

    const tbody = document.getElementById("tabelaUnidades");
    tbody.innerHTML = "";

    listaUnidades.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.empreendimento}</td>
            <td>${u.bloco}</td>
            <td>${u.unidade}</td>
            <td>${u.situacao}</td>
            <td>${u.statusFinanceiro}</td>
            <td>${u.chaves}</td>
            <td>
                <button class="btn-small btn-editar" onclick="abrirModalEditar(${u.id})">Editar</button>
                <button class="btn-small btn-excluir" onclick="excluirUnidade(${u.id})">Excluir</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/************************************************************
 * MODAL – ABRIR PARA NOVA UNIDADE
 ************************************************************/
function abrirModalNovo() {
    idEditando = null;
    document.getElementById("tituloModal").innerText = "Nova Unidade";

    // limpar campos
    mEmpreendimento.value = "";
    mBloco.value = "";
    mUnidade.value = "";
    mSituacao.value = "Em obra";
    mFinanceiro.value = "Liberada";
    mHabitavel.value = "Sim";
    mCVCO.value = "Liberado";
    mChaves.value = "Não entregue";
    mDataVistoria.value = "";
    mHoraVistoria.value = "";
    mDataLiberacao.value = "";
    mAgendadoPor.value = "";
    mObservacao.value = "";

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

    mEmpreendimento.value = u.empreendimento;
    mBloco.value = u.bloco;
    mUnidade.value = u.unidade;
    mSituacao.value = u.situacao;
    mFinanceiro.value = u.statusFinanceiro;
    mHabitavel.value = u.habitavel;
    mCVCO.value = u.cvco;
    mChaves.value = u.chaves;
    mDataVistoria.value = u.dataVistoria || "";
    mHoraVistoria.value = u.horaVistoria || "";
    mDataLiberacao.value = u.dataLiberacao || "";
    mAgendadoPor.value = u.agendadoPor || "";
    mObservacao.value = u.observacao || "";

    document.getElementById("modalFundo").style.display = "flex";
}

/************************************************************
 * MODAL – FECHAR
 ************************************************************/
function fecharModal() {
    document.getElementById("modalFundo").style.display = "none";
}

/************************************************************
 * SALVAR (NOVO OU EDITADO)
 ************************************************************/
async function salvarModal() {
    const unidade = {
        empreendimento: mEmpreendimento.value,
        bloco: mBloco.value,
        unidade: mUnidade.value,
        situacao: mSituacao.value,
        statusFinanceiro: mFinanceiro.value,
        habitavel: mHabitavel.value,
        cvco: mCVCO.value,
        chaves: mChaves.value,
        dataVistoria: mDataVistoria.value,
        horaVistoria: mHoraVistoria.value,
        dataLiberacao: mDataLiberacao.value,
        agendadoPor: mAgendadoPor.value,
        observacao: mObservacao.value
    };

    // EDITAR
    if (idEditando) {
        await fetch(`/unidades/${idEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(unidade)
        });

    // NOVO
    } else {
        await fetch("/unidades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(unidade)
        });
    }

    fecharModal();
    carregarUnidades();
}

/************************************************************
 * EXCLUIR UNIDADE
 ************************************************************/
async function excluirUnidade(id) {
    if (!confirm("Deseja realmente excluir esta unidade?")) return;

    await fetch(`/unidades/${id}`, { method: "DELETE" });

    carregarUnidades();
}
