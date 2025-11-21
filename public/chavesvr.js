// ===============================================================
//  CHAVEVR - FRONTEND COMPLETO (Versão A)
//  Suporte total a cadastro, edição, deleção, listagem, dashboard
//  Compatível com server_chavesvr.js
// ===============================================================

// ============================
// CONFIGURAÇÃO DA API
// ============================
const API = {
    listar: "/api/unidades",
    criar: "/api/unidades",
    editar: (id) => `/api/unidades/${id}`,
    deletar: (id) => `/api/unidades/${id}`
};


// ============================
// BUSCAR TODAS AS UNIDADES
// ============================
async function buscarUnidades() {
    try {
        const r = await fetch(API.listar);
        return await r.json();
    } catch (e) {
        console.error("Erro ao buscar unidades:", e);
        return [];
    }
}


// ============================
// ATUALIZAR DASHBOARD
// ============================
async function atualizarDashboard() {
    const unidades = await buscarUnidades();

    const total = unidades.length;
    const pendentes = unidades.filter(u => u.status === "Pendente").length;
    const liberadas = unidades.filter(u => u.status === "Liberada").length;
    const bloqueadas = unidades.filter(u => u.status === "Bloqueada").length;

    if (document.getElementById("totalUnidades"))
        document.getElementById("totalUnidades").innerText = total;

    if (document.getElementById("pendentes"))
        document.getElementById("pendentes").innerText = pendentes;

    if (document.getElementById("liberadas"))
        document.getElementById("liberadas").innerText = liberadas;

    if (document.getElementById("bloqueadas"))
        document.getElementById("bloqueadas").innerText = bloqueadas;

    atualizarTabela(unidades);
}


// ============================
// ATUALIZAR TABELA PRINCIPAL
// ============================
function atualizarTabela(lista) {
    const tbody = document.querySelector("#tableUnidades tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    lista.forEach(unidade => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${unidade.unidade}</td>
            <td>${unidade.empreendimento}</td>
            <td>${unidade.status}</td>
            <td>${unidade.obs || ""}</td>
            <td>
                <button class="btn small" onclick="abrirModalEdicao(${unidade.id})">Editar</button>
                <button class="btn danger small" onclick="deletarUnidade(${unidade.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ============================
// ABRIR MODAL DE CADASTRO
// ============================
function abrirModalCadastro() {
    document.getElementById("modal").classList.remove("hidden");
    limparFormulario();
}


// ============================
// ABRIR MODAL DE EDIÇÃO
// ============================
async function abrirModalEdicao(id) {
    const unidades = await buscarUnidades();
    const u = unidades.find(x => x.id === id);
    if (!u) return;

    document.getElementById("unidade").value = u.unidade;
    document.getElementById("empreendimento").value = u.empreendimento;
    document.getElementById("status").value = u.status;
    document.getElementById("obs").value = u.obs || "";

    document.getElementById("saveUnitBtn").setAttribute("data-edit", id);
    document.getElementById("modal").classList.remove("hidden");
}


// ============================
// LIMPAR FORMULÁRIO
// ============================
function limparFormulario() {
    document.getElementById("unidade").value = "";
    document.getElementById("empreendimento").value = "";
    document.getElementById("status").value = "Pendente";
    document.getElementById("obs").value = "";
    document.getElementById("saveUnitBtn").removeAttribute("data-edit");
}


// ============================
// FECHAR MODAL
// ============================
function fecharModal() {
    document.getElementById("modal").classList.add("hidden");
    limparFormulario();
}


// ============================
// SALVAR (CRIAR OU EDITAR)
// ============================
async function salvarUnidade() {
    const unidade = document.getElementById("unidade").value.trim();
    const empreendimento = document.getElementById("empreendimento").value.trim();
    const status = document.getElementById("status").value;
    const obs = document.getElementById("obs").value.trim();

    if (!unidade || !empreendimento) {
        alert("Preencha todos os campos!");
        return;
    }

    const payload = { unidade, empreendimento, status, obs };
    const editId = document.getElementById("saveUnitBtn").getAttribute("data-edit");

    let url = API.criar;
    let method = "POST";

    if (editId) {
        url = API.editar(editId);
        method = "PUT";
    }

    await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    fecharModal();
    atualizarDashboard();
}


// ============================
// DELETAR UNIDADE
// ============================
async function deletarUnidade(id) {
    if (!confirm("Deseja realmente excluir esta unidade?")) return;

    await fetch(API.deletar(id), { method: "DELETE" });
    atualizarDashboard();
}


// ============================
// INICIALIZAÇÃO
// ============================
document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("addUnitBtn"))
        document.getElementById("addUnitBtn").onclick = abrirModalCadastro;

    if (document.getElementById("saveUnitBtn"))
        document.getElementById("saveUnitBtn").onclick = salvarUnidade;

    if (document.getElementById("closeModalBtn"))
        document.getElementById("closeModalBtn").onclick = fecharModal;

    atualizarDashboard();
});
