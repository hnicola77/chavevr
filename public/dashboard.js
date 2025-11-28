let todasUnidades = [];
let unidadesFiltradas = [];

// Elementos do DOM
const filtroBuscaRapida = document.getElementById('filtroBuscaRapida');
const filtroEmpreendimento = document.getElementById('filtroEmpreendimento');
const filtroBloco = document.getElementById('filtroBloco');
const filtroSituacao = document.getElementById('filtroSituacao');
const filtroChaves = document.getElementById('filtroChaves');
const filtroFinanceiro = document.getElementById('filtroFinanceiro');
const filtroHabitavel = document.getElementById('filtroHabitavel');
const filtroVistoria = document.getElementById('filtroVistoria');
const filtroLiberacao = document.getElementById('filtroLiberacao');

const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
const btnLimparTudo = document.getElementById('btnLimparTudo');
const btnExportar = document.getElementById('btnExportar');

const corpoTabela = document.getElementById('corpoTabela');
const emptyMessage = document.getElementById('emptyMessage');

let chartSituacao = null;
let chartEntrega = null;

// ==================== CARREGAR UNIDADES ====================
async function carregarUnidades() {
  try {
    const resp = await fetch('/api/unidades');
    if (resp.status === 401 || resp.status === 403) {
      window.location.href = '/login.html';
      return;
    }
    if (!resp.ok) {
      console.error('Erro ao carregar unidades');
      return;
    }
    todasUnidades = await resp.json();
    unidadesFiltradas = [...todasUnidades];
    
    popularFiltros();
    atualizarDashboard();
  } catch (err) {
    console.error('Erro:', err);
  }
}

// ==================== POPULAR FILTROS ====================
function popularFiltros() {
  const empreendimentos = new Set();
  const blocos = new Set();
  const situacoes = new Set();
  const chaves = new Set();
  const financeiros = new Set();
  const habitaveis = new Set();
  const vistorias = new Set();
  const liberacoes = new Set();

  todasUnidades.forEach(u => {
    if (u.empreendimento) empreendimentos.add(u.empreendimento);
    if (u.bloco) blocos.add(u.bloco);
    if (u.situacao) situacoes.add(u.situacao);
    if (u.chaves) chaves.add(u.chaves);
    if (u.financeiro) financeiros.add(u.financeiro);
    if (u.habitavel) habitaveis.add(u.habitavel);
    if (u.vistoria) vistorias.add(u.vistoria);
    if (u.liberacao) liberacoes.add(u.liberacao);
  });

  popularSelect(filtroEmpreendimento, Array.from(empreendimentos).sort());
  popularSelect(filtroBloco, Array.from(blocos).sort());
  popularSelect(filtroSituacao, Array.from(situacoes).sort());
  popularSelect(filtroChaves, Array.from(chaves).sort());
  popularSelect(filtroFinanceiro, Array.from(financeiros).sort());
  popularSelect(filtroHabitavel, Array.from(habitaveis).sort());
  popularSelect(filtroVistoria, Array.from(vistorias).sort());
  popularSelect(filtroLiberacao, Array.from(liberacoes).sort());
}

function popularSelect(selectElement, valores) {
  if (!selectElement) return;
  
  const opcaoTodos = selectElement.querySelector('option[value=""]');
  selectElement.innerHTML = '';
  if (opcaoTodos) selectElement.appendChild(opcaoTodos);

  valores.forEach(valor => {
    const option = document.createElement('option');
    option.value = valor;
    option.textContent = valor;
    selectElement.appendChild(option);
  });
}

// ==================== APLICAR FILTROS ====================
function aplicarFiltros() {
  unidadesFiltradas = todasUnidades.filter(u => {
    // Busca rápida
    if (filtroBuscaRapida && filtroBuscaRapida.value.trim()) {
      const termo = filtroBuscaRapida.value.toLowerCase();
      const encontrado = 
        (u.bloco || '').toLowerCase().includes(termo) ||
        (u.unidade || '').toLowerCase().includes(termo) ||
        (u.empreendimento || '').toLowerCase().includes(termo);
      if (!encontrado) return false;
    }

    // Filtros por coluna
    if (filtroEmpreendimento && filtroEmpreendimento.value && u.empreendimento !== filtroEmpreendimento.value) {
      return false;
    }
    if (filtroBloco && filtroBloco.value && u.bloco !== filtroBloco.value) {
      return false;
    }
    if (filtroSituacao && filtroSituacao.value && u.situacao !== filtroSituacao.value) {
      return false;
    }
    if (filtroChaves && filtroChaves.value && u.chaves !== filtroChaves.value) {
      return false;
    }
    // ✨ NOVOS FILTROS
    if (filtroFinanceiro && filtroFinanceiro.value && u.financeiro !== filtroFinanceiro.value) {
      return false;
    }
    if (filtroHabitavel && filtroHabitavel.value && u.habitavel !== filtroHabitavel.value) {
      return false;
    }
    if (filtroVistoria && filtroVistoria.value && u.vistoria !== filtroVistoria.value) {
      return false;
    }
    if (filtroLiberacao && filtroLiberacao.value && u.liberacao !== filtroLiberacao.value) {
      return false;
    }

    return true;
  });

  atualizarDashboard();
}

// ==================== LIMPAR FILTROS ====================
function limparFiltros() {
  if (filtroBuscaRapida) filtroBuscaRapida.value = '';
  if (filtroEmpreendimento) filtroEmpreendimento.value = '';
  if (filtroBloco) filtroBloco.value = '';
  if (filtroSituacao) filtroSituacao.value = '';
  if (filtroChaves) filtroChaves.value = '';
  if (filtroFinanceiro) filtroFinanceiro.value = '';
  if (filtroHabitavel) filtroHabitavel.value = '';
  if (filtroVistoria) filtroVistoria.value = '';
  if (filtroLiberacao) filtroLiberacao.value = '';
  
  aplicarFiltros();
}

// ==================== ATUALIZAR DASHBOARD ====================
function atualizarDashboard() {
  atualizarCards();
  atualizarGraficos();
  renderizarTabela();
}

function atualizarCards() {
  const total = unidadesFiltradas.length;
  const entregues = unidadesFiltradas.filter(u => u.chaves === 'Entregue').length;
  const pendentes = unidadesFiltradas.filter(u => u.chaves === 'Não entregue' || u.chaves === 'Pendente').length;
  const liberadas = unidadesFiltradas.filter(u => u.liberacao === 'Liberada').length;
  const aprovadas = unidadesFiltradas.filter(u => u.situacao === 'Aprovada').length;

  document.getElementById('cardTotal').textContent = total;
  document.getElementById('cardEntregues').textContent = entregues;
  document.getElementById('cardEntreguesPercent').textContent = total > 0 ? `${((entregues/total)*100).toFixed(1)}%` : '0%';
  
  document.getElementById('cardPendentes').textContent = pendentes;
  document.getElementById('cardPendentesPercent').textContent = total > 0 ? `${((pendentes/total)*100).toFixed(1)}%` : '0%';
  
  document.getElementById('cardLiberadas').textContent = liberadas;
  document.getElementById('cardLiberadasPercent').textContent = total > 0 ? `${((liberadas/total)*100).toFixed(1)}%` : '0%';
  
  document.getElementById('cardAprovadas').textContent = aprovadas;
  document.getElementById('cardAprovadasPercent').textContent = total > 0 ? `${((aprovadas/total)*100).toFixed(1)}%` : '0%';
}

function atualizarGraficos() {
  // Gráfico de Situação
  const situacoes = {};
  unidadesFiltradas.forEach(u => {
    const sit = u.situacao || 'Sem situação';
    situacoes[sit] = (situacoes[sit] || 0) + 1;
  });

  const ctxSituacao = document.getElementById('chartSituacao');
  if (ctxSituacao) {
    if (chartSituacao) chartSituacao.destroy();
    
    chartSituacao = new Chart(ctxSituacao, {
      type: 'bar',
      data: {
        labels: Object.keys(situacoes),
        datasets: [{
          label: 'Quantidade',
          data: Object.values(situacoes),
          backgroundColor: [
            'rgba(234, 179, 8, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // Gráfico de Entrega
  const entregues = unidadesFiltradas.filter(u => u.chaves === 'Entregue').length;
  const naoEntregues = unidadesFiltradas.length - entregues;

  const ctxEntrega = document.getElementById('chartEntrega');
  if (ctxEntrega) {
    if (chartEntrega) chartEntrega.destroy();
    
    chartEntrega = new Chart(ctxEntrega, {
      type: 'doughnut',
      data: {
        labels: ['Entregue', 'Não Entregue'],
        datasets: [{
          data: [entregues, naoEntregues],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

function renderizarTabela() {
  if (!corpoTabela) return;
  
  corpoTabela.innerHTML = '';

  if (unidadesFiltradas.length === 0) {
    if (emptyMessage) emptyMessage.style.display = 'block';
    return;
  }

  if (emptyMessage) emptyMessage.style.display = 'none';

  unidadesFiltradas.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.empreendimento || ''}</td>
      <td>${u.bloco || ''}</td>
      <td>${u.unidade || ''}</td>
      <td>${u.situacao || ''}</td>
      <td>${u.financeiro || ''}</td>
      <td>${u.habitavel || ''}</td>
      <td>${u.chaves || ''}</td>
      <td>${u.vistoria || ''}</td>
      <td>${u.liberacao || ''}</td>
    `;
    corpoTabela.appendChild(tr);
  });
}

// ==================== EXPORTAR ====================
function exportarExcel() {
  if (unidadesFiltradas.length === 0) {
    alert('Nenhuma unidade para exportar.');
    return;
  }

  const header = [
    'Empreendimento',
    'Bloco',
    'Unidade',
    'Situação',
    'Financeiro',
    'Habitável',
    'Chaves',
    'Vistoria',
    'Liberação'
  ];

  const linhas = unidadesFiltradas.map(u => [
    u.empreendimento || '',
    u.bloco || '',
    u.unidade || '',
    u.situacao || '',
    u.financeiro || '',
    u.habitavel || '',
    u.chaves || '',
    u.vistoria || '',
    u.liberacao || ''
  ]);

  const csv = [header, ...linhas]
    .map(linha => linha.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chavevr_unidades.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== EVENTOS ====================
document.addEventListener('DOMContentLoaded', () => {
  carregarUnidades();

  // Busca rápida em tempo real
  if (filtroBuscaRapida) {
    filtroBuscaRapida.addEventListener('input', aplicarFiltros);
  }

  if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener('click', aplicarFiltros);
  }

  if (btnLimparTudo) {
    btnLimparTudo.addEventListener('click', limparFiltros);
  }

  if (btnExportar) {
    btnExportar.addEventListener('click', exportarExcel);
  }
});
