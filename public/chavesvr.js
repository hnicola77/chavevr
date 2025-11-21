let entregas = [];
let editingId = null;

// Cadastro
const tbody = document.getElementById("tabelaEntregas");
const emptyMessage = document.getElementById("emptyMessage");

// Filtros cadastro
const filterEmpreendimento = document.getElementById("filterEmpreendimento");
const filterBloco = document.getElementById("filterBloco");
const filterUnidade = document.getElementById("filterUnidade");
const filterSituacao = document.getElementById("filterSituacao");
const filterChavesEntregues = document.getElementById("filterChavesEntregues");
const filterHabitavel = document.getElementById("filterHabitavel");

const btnExportar = document.getElementById("btnExportar");
const btnAplicarFiltros = document.getElementById("btnAplicarFiltros");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const btnAddLinha = document.getElementById("btnAddLinha");

// Tabs
const tabDashboard = document.getElementById("tabDashboard");
const tabCadastro = document.getElementById("tabCadastro");
const dashboardView = document.getElementById("dashboardView");
const cadastroView = document.getElementById("cadastroView");

// Dashboard
const dashEmpreendimento = document.getElementById("dashEmpreendimento");
const dashEmptyMessage = document.getElementById("dashEmptyMessage");
const dashContent = document.getElementById("dashContent");
const btnReloadDash = document.getElementById("btnReloadDash");
const dashTotalUnidades = document.getElementById("dashTotalUnidades");
const dashLiberado = document.getElementById("dashLiberado");
const dashAprovado = document.getElementById("dashAprovado");
const dashPendentes = document.getElementById("dashPendentes");
const dashChavesSim = document.getElementById("dashChavesSim");
const dashHabitavelSim = document.getElementById("dashHabitavelSim");
const dashTabelaSituacao = document.getElementById("dashTabelaSituacao");

// Modal edição
const modal = document.getElementById("modal");
const tituloModal = document.getElementById("tituloModal");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");
const btnSalvar = document.getElementById("btnSalvar");

const campoEmpreendimento = document.getElementById("empreendimento");
const campoBloco = document.getElementById("bloco");
const campoUnidade = document.getElementById("unidade");
const campoPavimento = document.getElementById("pavimento");
const campoSituacao = document.getElementById("situacao");
const campoStatusFinanceiro = document.getElementById("statusFinanceiro");
const campoAgendado = document.getElementById("agendado");
const campoAgendaVistoriaData = document.getElementById("agendaVistoriaData");
const campoAgendaVistoriaHora = document.getElementById("agendaVistoriaHora");
const campoHabitavel = document.getElementById("habitavel");
const campoChavesEntregues = document.getElementById("chavesEntregues");
const campoCvco = document.getElementById("cvco");
const campoMotivo = document.getElementById("motivo");
const labelMotivo = document.getElementById("labelMotivo");
const campoDataLiberacaoVistoria = document.getElementById("dataLiberacaoVistoria");
const campoObservacao = document.getElementById("observacao");

/* ==========================
   Funções utilitárias
   ========================== */

function formatarDataBr(iso) {
  if (!iso) return "";
  const partes = iso.split("-");
  if (partes.length !== 3) return iso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHoraBr(str) {
  if (!str) return "";
  const [data, hora] = str.split(" ");
  const dataBr = formatarDataBr(data);
  return hora ? `${dataBr} ${hora}` : dataBr;
}

/* ==========================
   Tabs
   ========================== */

function mostrarDashboard() {
  tabDashboard.classList.add("active");
  tabCadastro.classList.remove("active");
  dashboardView.classList.remove("hidden");
  cadastroView.classList.add("hidden");
}

function mostrarCadastro() {
  tabCadastro.classList.add("active");
  tabDashboard.classList.remove("active");
  cadastroView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
}

/* ==========================
   Cadastro - Listagem
   ========================== */

function montarQueryString() {
  const params = new URLSearchParams();

  if (filterEmpreendimento.value.trim()) {
    params.append("empreendimento", filterEmpreendimento.value.trim());
  }
  if (filterBloco.value.trim()) {
    params.append("bloco", filterBloco.value.trim());
  }
  if (filterUnidade.value.trim()) {
    params.append("unidade", filterUnidade.value.trim());
  }
  if (filterSituacao.value) {
    params.append("situacao", filterSituacao.value);
  }
  if (filterChavesEntregues.value) {
    params.append("chavesEntregues", filterChavesEntregues.value);
  }
  if (filterHabitavel.value) {
    params.append("habitavel", filterHabitavel.value);
  }

  const qs = params.toString();
  return qs ? "?" + qs : "";
}

async function carregarEntregas() {
  try {
    const qs = montarQueryString();
    const resp = await fetch("/api/entregas" + qs);
    if (!resp.ok) {
      console.error("Erro ao carregar entregas:", await resp.text());
      return;
    }
    entregas = await resp.json();
    renderTabela();
  } catch (err) {
    console.error("Erro geral ao carregar entregas:", err);
  }
}

function renderTabela() {
  tbody.innerHTML = "";

  if (!entregas || entregas.length === 0) {
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
  }

  entregas.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.empreendimento || ""}</td>
      <td>${e.bloco || ""}</td>
      <td>${e.unidade || ""}</td>
      <td>${e.pavimento || ""}</td>
      <td>${e.situacao || ""}</td>
      <td>${e.statusFinanceiro || ""}</td>
      <td>${e.habitavel || ""}</td>
      <td>${e.chavesEntregues || ""}</td>
      <td>${e.cvco || ""}</td>
      <td>${e.motivo || ""}</td>
      <td>${formatarDataHoraBr(e.agendaVistoria)}</td>
      <td>${formatarDataBr(e.dataLiberacaoVistoria)}</td>
      <td>${e.observacao || ""}</td>
      <td>
        <button class="btn small" data-acao="editar" data-id="${e.id}">Editar</button>
        <button class="btn small" data-acao="excluir" data-id="${e.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================
   Modal edição
   ========================== */

function abrirModal(entrega) {
  modal.classList.remove("hidden");
  editingId = entrega.id;
  tituloModal.textContent = "Editar Unidade";

  campoEmpreendimento.value = entrega.empreendimento || "";
  campoBloco.value = entrega.bloco || "";
  campoUnidade.value = entrega.unidade || "";
  campoPavimento.value = entrega.pavimento || "";
  campoSituacao.value = entrega.situacao || "";
  campoStatusFinanceiro.value = entrega.statusFinanceiro || "";
  campoAgendado.value = entrega.agendado || "";

  if (entrega.agendaVistoria) {
    const [data, hora] = entrega.agendaVistoria.split(" ");
    campoAgendaVistoriaData.value = data || "";
    campoAgendaVistoriaHora.value = hora || "";
  } else {
    campoAgendaVistoriaData.value = "";
    campoAgendaVistoriaHora.value = "";
  }

  campoHabitavel.value = entrega.habitavel || "";
  campoChavesEntregues.value = entrega.chavesEntregues || "";
  campoCvco.value = entrega.cvco || "";
  campoMotivo.value = entrega.motivo || "";
  campoDataLiberacaoVistoria.value = entrega.dataLiberacaoVistoria || "";
  campoObservacao.value = entrega.observacao || "";

  atualizarObrigatoriedadeMotivo();
}

function fecharModal() {
  modal.classList.add("hidden");
  editingId = null;
}

function atualizarObrigatoriedadeMotivo() {
  const situacao = (campoSituacao.value || "").toUpperCase();
  const obrigatorio = situacao && situacao !== "LIBERADO" && situacao !== "APROVADO";
  campoMotivo.required = !!obrigatorio;

  if (obrigatorio) {
    if (!labelMotivo.textContent.includes("*")) {
      labelMotivo.firstChild.textContent =
        "Motivo (obrigatório se não estiver LIBERADO/APROVADO) *";
    }
  } else {
    labelMotivo.firstChild.textContent =
      "Motivo (obrigatório se não estiver LIBERADO/APROVADO)";
  }
}

async function salvarEdicao() {
  const agenda = campoAgendaVistoriaData.value
    ? campoAgendaVistoriaData.value +
      (campoAgendaVistoriaHora.value ? " " + campoAgendaVistoriaHora.value : "")
    : "";

  const payload = {
    empreendimento: campoEmpreendimento.value.trim(),
    bloco: campoBloco.value.trim(),
    unidade: campoUnidade.value.trim(),
    pavimento: campoPavimento.value.trim(),
    statusFinanceiro: campoStatusFinanceiro.value,
    situacao: campoSituacao.value,
    agendado: campoAgendado.value.trim(),
    agendaVistoria: agenda,
    habitavel: campoHabitavel.value,
    liberacaoFinanceiro: "",
    chavesEntregues: campoChavesEntregues.value,
    cvco: campoCvco.value,
    motivo: campoMotivo.value.trim(),
    dataLiberacaoVistoria: campoDataLiberacaoVistoria.value,
    datasChamadasVistoria: "",
    observacao: campoObservacao.value.trim()
  };

  if (!payload.empreendimento || !payload.bloco || !payload.unidade || !payload.situacao) {
    alert("Preencha Empreendimento, Bloco, Unidade e Situação.");
    return;
  }

  const s = (payload.situacao || "").toUpperCase();
  if (s !== "LIBERADO" && s !== "APROVADO" && !payload.motivo) {
    alert("Informe o motivo quando a situação não for LIBERADO ou APROVADO.");
    return;
  }

  try {
    const resp = await fetch(`/api/entregas/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      alert(data.error || "Erro ao salvar edição.");
      return;
    }

    fecharModal();
    await carregarEntregas();
  } catch (err) {
    console.error("Erro ao salvar edição:", err);
    alert("Erro ao salvar edição.");
  }
}

/* ==========================
   Exclusão
   ========================== */

async function excluirEntrega(id) {
  if (!confirm("Deseja realmente excluir este registro?")) return;

  try {
    const resp = await fetch(`/api/entregas/${id}`, { method: "DELETE" });
    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      alert(data.error || "Erro ao excluir registro.");
      return;
    }

    await carregarEntregas();
  } catch (err) {
    console.error("Erro ao excluir registro:", err);
    alert("Erro ao excluir registro.");
  }
}

/* ==========================
   Criação inline na tabela
   ========================== */

function criarLinhaInlineNova() {
  if (tbody.querySelector("tr.inline-new")) return; // evita duplicação

  const tr = document.createElement("tr");
  tr.classList.add("inline-new");

  tr.innerHTML = `
    <td><input class="in-emp" placeholder="Empreendimento" /></td>
    <td><input class="in-bloco" placeholder="Bloco" /></td>
    <td><input class="in-unidade" placeholder="Unidade" /></td>
    <td><input class="in-pavimento" placeholder="Pavimento" /></td>
    <td>
      <select class="in-situacao">
        <option value="">Selecione</option>
        <option value="EM OBRA">EM OBRA</option>
        <option value="AJUSTES CLIENTE">AJUSTES CLIENTE</option>
        <option value="LIBERADO">LIBERADO</option>
        <option value="APROVADO">APROVADO</option>
      </select>
    </td>
    <td>
      <select class="in-status">
        <option value="">Selecione</option>
        <option value="Liberado">Liberado</option>
        <option value="Bloqueado">Bloqueado</option>
      </select>
    </td>
    <td>
      <select class="in-habitavel">
        <option value="">Selecione</option>
        <option value="SIM">SIM</option>
        <option value="NÃO">NÃO</option>
      </select>
    </td>
    <td>
      <select class="in-chaves">
        <option value="">Selecione</option>
        <option value="SIM">SIM</option>
        <option value="NÃO">NÃO</option>
      </select>
    </td>
    <td>
      <select class="in-cvco">
        <option value="">Selecione</option>
        <option value="SIM">SIM</option>
        <option value="NÃO">NÃO</option>
      </select>
    </td>
    <td>
      <input class="in-motivo" placeholder="Motivo (se não Liberado/Aprovado)" />
    </td>
    <td>
      <div style="display:flex;gap:4px;">
        <input type="date" class="in-agenda-data" />
        <input type="time" class="in-agenda-hora" />
      </div>
    </td>
    <td>
      <input class="in-data-lib" type="date" />
    </td>
    <td>
      <input class="in-obs" placeholder="Observação" />
    </td>
    <td>
      <span class="inline-hint">Saia da observação ou Enter para salvar</span>
    </td>
  `;

  tbody.appendChild(tr);

  const obs = tr.querySelector(".in-obs");
  obs.addEventListener("blur", () => salvarInline(tr));
  obs.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      salvarInline(tr);
    }
  });
}

async function salvarInline(tr) {
  if (tr.dataset.saving === "1") return;
  tr.dataset.saving = "1";

  const emp = tr.querySelector(".in-emp").value.trim();
  const bloco = tr.querySelector(".in-bloco").value.trim();
  const unidade = tr.querySelector(".in-unidade").value.trim();
  const pav = tr.querySelector(".in-pavimento").value.trim();
  const situacao = tr.querySelector(".in-situacao").value;
  const statusFin = tr.querySelector(".in-status").value;
  const habitavel = tr.querySelector(".in-habitavel").value;
  const chaves = tr.querySelector(".in-chaves").value;
  const cvco = tr.querySelector(".in-cvco").value;
  const motivo = tr.querySelector(".in-motivo").value.trim();
  const agData = tr.querySelector(".in-agenda-data").value;
  const agHora = tr.querySelector(".in-agenda-hora").value;
  const dataLib = tr.querySelector(".in-data-lib").value;
  const obs = tr.querySelector(".in-obs").value.trim();

  if (!emp || !bloco || !unidade || !situacao) {
    alert("Preencha Empreendimento, Bloco, Unidade e Situação.");
    tr.dataset.saving = "0";
    return;
  }

  const s = (situacao || "").toUpperCase();
  const precisaMotivo = s !== "LIBERADO" && s !== "APROVADO";
  if (precisaMotivo && !motivo) {
    alert("Informe o motivo quando a situação não for LIBERADO ou APROVADO.");
    tr.dataset.saving = "0";
    return;
  }

  const agenda = agData ? agData + (agHora ? " " + agHora : "") : "";

  const payload = {
    empreendimento: emp,
    bloco,
    unidade,
    pavimento: pav,
    statusFinanceiro: statusFin,
    situacao,
    agendado: "",
    agendaVistoria: agenda,
    habitavel,
    liberacaoFinanceiro: "",
    chavesEntregues: chaves,
    cvco,
    motivo,
    dataLiberacaoVistoria: dataLib,
    datasChamadasVistoria: "",
    observacao: obs
  };

  try {
    const resp = await fetch("/api/entregas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      alert(data.error || "Erro ao salvar nova unidade.");
      tr.dataset.saving = "0";
      return;
    }

    tr.remove();
    await carregarEntregas();
  } catch (err) {
    console.error("Erro ao salvar nova unidade:", err);
    alert("Erro ao salvar nova unidade.");
  } finally {
    tr.dataset.saving = "0";
  }
}

/* ==========================
   Dashboard
   ========================== */

async function carregarEmpreendimentosDashboard() {
  try {
    const resp = await fetch("/api/empreendimentos");
    if (!resp.ok) {
      console.error("Erro ao carregar empreendimentos:", await resp.text());
      return;
    }
    const lista = await resp.json();
    dashEmpreendimento.innerHTML =
      '<option value="">Selecione um empreendimento</option>';
    lista.forEach((nome) => {
      const opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nome;
      dashEmpreendimento.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro geral ao carregar empreendimentos:", err);
  }
}

async function carregarDashboard() {
  const emp = dashEmpreendimento.value;
  if (!emp) {
    dashContent.classList.add("hidden");
    dashEmptyMessage.textContent =
      "Selecione um empreendimento para visualizar o Dashboard.";
    dashEmptyMessage.classList.remove("hidden");
    return;
  }

  try {
    const resp = await fetch(
      "/api/entregas?empreendimento=" + encodeURIComponent(emp)
    );
    if (!resp.ok) {
      console.error("Erro ao carregar dados do dashboard:", await resp.text());
      return;
    }
    const rows = await resp.json();

    if (!rows || rows.length === 0) {
      dashContent.classList.add("hidden");
      dashEmptyMessage.textContent =
        "Nenhuma unidade cadastrada para este empreendimento.";
      dashEmptyMessage.classList.remove("hidden");
      return;
    }

    dashEmptyMessage.classList.add("hidden");
    dashContent.classList.remove("hidden");

    const total = rows.length;
    const liberado = rows.filter((r) => r.situacao === "LIBERADO").length;
    const aprovado = rows.filter((r) => r.situacao === "APROVADO").length;
    const pendentes = total - liberado - aprovado;
    const chavesSim = rows.filter((r) => r.chavesEntregues === "SIM").length;
    const habitavelSim = rows.filter((r) => r.habitavel === "SIM").length;

    dashTotalUnidades.textContent = total;
    dashLiberado.textContent = liberado;
    dashAprovado.textContent = aprovado;
    dashPendentes.textContent = pendentes;
    dashChavesSim.textContent = chavesSim;
    dashHabitavelSim.textContent = habitavelSim;

    // Tabela resumo por situação
    const mapa = {};
    rows.forEach((r) => {
      const sit = r.situacao || "Sem situação";
      mapa[sit] = (mapa[sit] || 0) + 1;
    });

    dashTabelaSituacao.innerHTML = "";
    Object.keys(mapa).forEach((sit) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${sit}</td><td>${mapa[sit]}</td>`;
      dashTabelaSituacao.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro geral ao carregar dashboard:", err);
  }
}

/* ==========================
   Exportar CSV
   ========================== */

function exportarCSV() {
  if (!entregas || entregas.length === 0) {
    alert("Não há registros para exportar.");
    return;
  }

  const header = [
    "Empreendimento",
    "Bloco",
    "Unidade",
    "Pavimento",
    "Situação",
    "Status Financeiro",
    "Habitável",
    "Chaves Entregues",
    "CVCO",
    "Motivo",
    "Agendado",
    "Agenda Vistoria",
    "Data Liberação Vistoria",
    "Observação"
  ];

  const linhas = entregas.map((e) => [
    e.empreendimento || "",
    e.bloco || "",
    e.unidade || "",
    e.pavimento || "",
    e.situacao || "",
    e.statusFinanceiro || "",
    e.habitavel || "",
    e.chavesEntregues || "",
    e.cvco || "",
    e.motivo || "",
    e.agendado || "",
    formatarDataHoraBr(e.agendaVistoria),
    formatarDataBr(e.dataLiberacaoVistoria),
    (e.observacao || "").replace(/\r?\n/g, " ")
  ]);

  const csv = [header, ...linhas]
    .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chavesvr_controle_entrega.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ==========================
   Eventos
   ========================== */

document.addEventListener("DOMContentLoaded", () => {
  // Dashboard é a aba inicial
  mostrarDashboard();
  carregarEmpreendimentosDashboard();
  carregarEntregas(); // tabela já fica pronta quando mudar de aba

  tabDashboard.addEventListener("click", () => {
    mostrarDashboard();
  });

  tabCadastro.addEventListener("click", () => {
    mostrarCadastro();
  });

  btnReloadDash.addEventListener("click", carregarDashboard);
  dashEmpreendimento.addEventListener("change", carregarDashboard);

  btnExportar.addEventListener("click", exportarCSV);
  btnAplicarFiltros.addEventListener("click", carregarEntregas);
  btnLimparFiltros.addEventListener("click", () => {
    filterEmpreendimento.value = "";
    filterBloco.value = "";
    filterUnidade.value = "";
    filterSituacao.value = "";
    filterChavesEntregues.value = "";
    filterHabitavel.value = "";
    carregarEntregas();
  });

  btnAddLinha.addEventListener("click", criarLinhaInlineNova);

  if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModal);
  if (btnCancelar) btnCancelar.addEventListener("click", fecharModal);
  if (btnSalvar) btnSalvar.addEventListener("click", salvarEdicao);
  if (campoSituacao) {
    campoSituacao.addEventListener("change", atualizarObrigatoriedadeMotivo);
  }

  // ações editar/excluir
  tbody.addEventListener("click", (e) => {
    const botao = e.target.closest("button");
    if (!botao) return;
    const acao = botao.dataset.acao;
    const id = parseInt(botao.dataset.id, 10);
    const entrega = entregas.find((x) => x.id === id);
    if (!entrega) return;

    if (acao === "editar") {
      abrirModal(entrega);
    } else if (acao === "excluir") {
      excluirEntrega(id);
    }
  });
});
