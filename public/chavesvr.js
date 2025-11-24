/************************************************************
 * ChaveVR – Controle Geral (Modelo Excel VR)
 * Manipula 3 tabelas: Empreendimentos, Blocos e Unidades
 ************************************************************/

/************************************************************
 * HELPERS
 ************************************************************/
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }
function ce(tag) { return document.createElement(tag); }

/************************************************************
 * LOAD INICIAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", () => {
    carregarEmp();
    carregarBlocos();
    carregarUnidades();
});

/************************************************************
 * 1) EMPREENDIMENTOS
 ************************************************************/
async function carregarEmp() {
    const res = await fetch("/empreendimentos");
    const lista = await res.json();

    const tbody = qs("#tabelaEmp tbody");
    tbody.innerHTML = "";

    lista.forEach(e => addLinhaEmp(e));
}

function addLinhaEmp(obj = {}) {
    const tbody = qs("#tabelaEmp tbody");

    const tr = ce("tr");

    tr.innerHTML = `
        <td><input type="number" value="${obj.id || ""}" disabled /></td>
        <td><input value="${obj.nome || ""}"></td>
        <td><input value="${obj.cidade || ""}"></td>
        <td><input value="${obj.uf || ""}"></td>
        <td><input value="${obj.fase || ""}"></td>
        <td><input type="date" value="${obj.dataEntrega || ""}"></td>
        <td><input value="${obj.codigoInterno || ""}"></td>
        <td><input value="${obj.observacao || ""}"></td>
        <td><button class="btn-small btn-editar" onclick="removerLinha(this)">X</button></td>
    `;

    tbody.appendChild(tr);
}

async function salvarEmp() {
    const linhas = qsa("#tabelaEmp tbody tr");
    const lista = [];

    linhas.forEach(tr => {
        const c = tr.querySelectorAll("input");
        lista.push({
            id: c[0].value || null,
            nome: c[1].value,
            cidade: c[2].value,
            uf: c[3].value,
            fase: c[4].value,
            dataEntrega: c[5].value,
            codigoInterno: c[6].value,
            observacao: c[7].value
        });
    });

    await fetch("/empreendimentos/salvar", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(lista)
    });

    alert("Empreendimentos salvos!");
    carregarEmp();
    carregarBlocos();
    carregarUnidades();
}

/************************************************************
 * 2) BLOCOS
 ************************************************************/
async function carregarBlocos() {
    const resEmp = await fetch("/empreendimentos");
    const empreendimentos = await resEmp.json();

    const res = await fetch("/blocos");
    const lista = await res.json();

    const tbody = qs("#tabelaBlocos tbody");
    tbody.innerHTML = "";

    lista.forEach(b => addLinhaBloco(b, empreendimentos));
}

function addLinhaBloco(obj = {}, empreendimentos = null) {
    const tbody = qs("#tabelaBlocos tbody");
    const tr = ce("tr");

    tr.innerHTML = `
        <td><input type="number" value="${obj.id || ""}" disabled></td>
        <td>
            <select class="selEmpBloco"></select>
        </td>
        <td><input value="${obj.nome || ""}"></td>
        <td><input value="${obj.observacao || ""}"></td>
        <td><button class="btn-small btn-editar" onclick="removerLinha(this)">X</button></td>
    `;

    tbody.appendChild(tr);

    preencherSelectEmpBloco(tr, obj.empreendimento_id, empreendimentos);
}

function preencherSelectEmpBloco(tr, empId, lista) {
    const sel = tr.querySelector(".selEmpBloco");
    sel.innerHTML = "";

    lista.forEach(e => {
        const opt = ce("option");
        opt.value = e.id;
        opt.textContent = e.nome;
        if (empId == e.id) opt.selected = true;
        sel.appendChild(opt);
    });
}

async function salvarBlocos() {
    const linhas = qsa("#tabelaBlocos tbody tr");
    const lista = [];

    linhas.forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        const empSel = tr.querySelector("select");

        lista.push({
            id: inputs[0].value || null,
            empreendimento_id: empSel.value,
            nome: inputs[1].value,
            observacao: inputs[2].value
        });
    });

    await fetch("/blocos/salvar", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(lista)
    });

    alert("Blocos salvos!");
    carregarBlocos();
    carregarUnidades();
}

/************************************************************
 * 3) UNIDADES (CORRIGIDO)
 ************************************************************/
async function carregarUnidades() {
    const resEmp = await fetch("/empreendimentos");
    const empreendimentos = await resEmp.json();

    const resBl = await fetch("/blocos");
    const blocos = await resBl.json();

    const res = await fetch("/unidades");
    const lista = await res.json();

    const tbody = qs("#tabelaUnidades tbody");
    tbody.innerHTML = "";

    lista.forEach(u => addLinhaUnidade(u, empreendimentos, blocos));
}

/*** 🔥 CORREÇÃO DEFINITIVA — addLinhaUnidade ***/
async function addLinhaUnidade(obj = {}, empreendimentos = null, blocos = null) {

    // SE NÃO RECEBEU LISTAS, CARREGA AUTOMATICAMENTE
    if (!empreendimentos) {
        const resEmp = await fetch("/empreendimentos");
        empreendimentos = await resEmp.json();
    }

    if (!blocos) {
        const resBl = await fetch("/blocos");
        blocos = await resBl.json();
    }

    const tbody = qs("#tabelaUnidades tbody");
    const tr = ce("tr");

    tr.innerHTML = `
        <td><input type="number" value="${obj.id || ""}" disabled></td>

        <td><select class="selEmpUni"></select></td>
        <td><select class="selBlocoUni"></select></td>

        <td><input value="${obj.unidade || ""}"></td>

        <td>
            <select>
                <option>Em obra</option>
                <option>Ajuste de cliente</option>
                <option>Liberada</option>
                <option>Aprovada</option>
            </select>
        </td>

        <td>
            <select>
                <option>Liberada</option>
                <option>Bloqueada</option>
            </select>
        </td>

        <td>
            <select>
                <option>Sim</option>
                <option>Não</option>
            </select>
        </td>

        <td>
            <select>
                <option>Liberado</option>
                <option>Não liberado</option>
            </select>
        </td>

        <td>
            <select>
                <option>Entregue</option>
                <option>Não entregue</option>
            </select>
        </td>

        <td><input type="date" value="${obj.dataVistoria || ""}"></td>
        <td><input type="time" value="${obj.horaVistoria || ""}"></td>
        <td><input type="date" value="${obj.dataLiberacao || ""}"></td>

        <td><input value="${obj.agendadoPor || ""}"></td>
        <td><input value="${obj.observacao || ""}"></td>

        <td><button class="btn-small btn-editar" onclick="removerLinha(this)">X</button></td>
    `;

    tbody.appendChild(tr);

    preencherSelectEmpUnidade(tr, obj.empreendimento_id, empreendimentos);
    preencherSelectBlocoUnidade(tr, obj.bloco_id, blocos);
}

/************************************************************
 * Preencher selects de unidades
 ************************************************************/
function preencherSelectEmpUnidade(tr, empId, lista) {
    const sel = tr.querySelector(".selEmpUni");
    sel.innerHTML = "";
    lista.forEach(e => {
        const opt = ce("option");
        opt.value = e.id;
        opt.textContent = e.nome;
        if (empId == e.id) opt.selected = true;
        sel.appendChild(opt);
    });
}

function preencherSelectBlocoUnidade(tr, blocoId, blocos) {
    const sel = tr.querySelector(".selBlocoUni");
    sel.innerHTML = "";

    blocos.forEach(b => {
        const opt = ce("option");
        opt.value = b.id;
        opt.textContent = `${b.emp_nome} - ${b.nome}`;
        if (blocoId == b.id) opt.selected = true;
        sel.appendChild(opt);
    });
}

/************************************************************
 * Salvar unidades
 ************************************************************/
async function salvarUnidades() {
    const linhas = qsa("#tabelaUnidades tbody tr");
    const lista = [];

    linhas.forEach(tr => {
        const inputs = tr.querySelectorAll("input");
        const selects = tr.querySelectorAll("select");

        lista.push({
            id: inputs[0].value || null,
            empreendimento_id: selects[0].value,
            bloco_id: selects[1].value,
            unidade: inputs[1].value,
            situacao: selects[2].value,
            statusFinanceiro: selects[3].value,
            habitavel: selects[4].value,
            cvco: selects[5].value,
            chaves: selects[6].value,
            dataVistoria: inputs[2].value,
            horaVistoria: inputs[3].value,
            dataLiberacao: inputs[4].value,
            agendadoPor: inputs[5].value,
            observacao: inputs[6].value
        });
    });

    await fetch("/unidades/salvar", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(lista)
    });

    alert("Unidades salvas!");
    carregarUnidades();
}

/************************************************************
 * Remover Linha
 ************************************************************/
function removerLinha(btn) {
    btn.closest("tr").remove();
}
