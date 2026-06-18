// Registrar plugin de rótulos do Chart.js
Chart.register(ChartDataLabels);

// Estado Global do Frontend
let appData = {
  summary: {},
  pivot_status_sit_cob: {},
  qty_by_sit_cob: {},
  contracts: [],
  filteredContracts: [],
  currentPage: 1,
  pageSize: 15,
  sortField: 'nome',
  sortOrder: 'asc'
};

// Gráficos Globais (instâncias do Chart.js para permitir atualização)
let chartStatusSitCob = null;
let chartQtySitCob = null;

// Elementos de Navegação e Layout
const currentSectionEmpty = document.getElementById('section-empty-state');
const currentSectionDash = document.getElementById('section-dashboard');
const currentSectionContracts = document.getElementById('section-contracts-list');

const navDashboard = document.getElementById('nav-dashboard');
const navContracts = document.getElementById('nav-contracts');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const currentDateSpan = document.getElementById('current-date');

// Elementos de Upload e Modais
const btnTriggerUpload = document.getElementById('btn-trigger-upload');
const uploadModal = document.getElementById('upload-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelUpload = document.getElementById('btn-cancel-upload');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const selectedFileName = document.getElementById('selected-file-name');
const btnUploadSubmit = document.getElementById('btn-upload-submit');

const modalDropzone = document.getElementById('modal-dropzone');
const modalFileInput = document.getElementById('modal-file-input');
const modalSelectedFileName = document.getElementById('modal-selected-file-name');
const btnModalUploadSubmit = document.getElementById('btn-modal-upload-submit');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Elementos de Tabela e Controles
const searchInput = document.getElementById('search-input');
const filterSitcob = document.getElementById('filter-sitcob');
const filterStatus = document.getElementById('filter-status');
const btnClearFilters = document.getElementById('btn-clear-filters');
const contractsTableBody = document.getElementById('contracts-table-body');

const pagStart = document.getElementById('pag-start');
const pagEnd = document.getElementById('pag-end');
const pagTotal = document.getElementById('pag-total');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');
const paginationPages = document.getElementById('pagination-pages');

// ==========================================
// 1. INICIALIZAÇÃO E DATA DE HOJE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupCurrentDate();
  setupNavigation();
  setupUploadEvents();
  setupTableEvents();
  setupSidebarToggle();
  setupExportEvents();

  // A aplicação sempre inicia na tela de upload limpa (sem carregar dados automaticamente)
  mostrarTelaInicial();
});

function mostrarTelaInicial() {
  const appContainer = document.querySelector('.app-container');
  const mainHeader = document.querySelector('.main-header');

  appContainer.classList.add('no-sidebar');
  mainHeader.style.display = 'none';

  currentSectionEmpty.classList.add('active');
  currentSectionDash.classList.remove('active');
  currentSectionContracts.classList.remove('active');
}

function setupCurrentDate() {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  currentDateSpan.textContent = new Date().toLocaleDateString('pt-BR', options);
}

// ==========================================
// 2. CONTROLE DE NAVEGAÇÃO DE ABAS
// ==========================================
function setupNavigation() {
  navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    if (!appData.contracts || appData.contracts.length === 0) return;
    switchTab('dashboard');
  });

  navContracts.addEventListener('click', (e) => {
    e.preventDefault();
    if (!appData.contracts || appData.contracts.length === 0) return;
    switchTab('contracts');
  });
}

// ==========================================
// 2A. CONTROLE DE SIDEBAR MINIMIZÁVEL E MOBILE
// ==========================================
function setupSidebarToggle() {
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const appContainer = document.querySelector('.app-container');

  // Toggle da sidebar em Desktop (Minimizar)
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      appContainer.classList.toggle('sidebar-collapsed');
      
      const icon = btnToggleSidebar.querySelector('i');
      if (appContainer.classList.contains('sidebar-collapsed')) {
        icon.className = 'fa-solid fa-chevron-right';
        btnToggleSidebar.setAttribute('title', 'Expandir Menu');
      } else {
        icon.className = 'fa-solid fa-chevron-left';
        btnToggleSidebar.setAttribute('title', 'Minimizar Menu');
      }

      // Forçar atualização do tamanho dos gráficos após transição da sidebar
      setTimeout(() => {
        if (chartStatusSitCob) chartStatusSitCob.resize();
        if (chartQtySitCob) chartQtySitCob.resize();
      }, 300); // 300ms bate com a transição CSS da sidebar
    });
  }

  // Toggle do menu mobile (Abrir drawer)
  if (btnMobileMenu) {
    btnMobileMenu.addEventListener('click', () => {
      appContainer.classList.add('mobile-sidebar-open');
    });
  }

  // Clicar fora para fechar menu no mobile
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      appContainer.classList.remove('mobile-sidebar-open');
    });
  }

  // Fechar menu mobile ao clicar em um link da sidebar
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .btn-upload-sidebar');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      appContainer.classList.remove('mobile-sidebar-open');
    });
  });
}

function exibirSidebarEHeader() {
  const appContainer = document.querySelector('.app-container');
  const mainHeader = document.querySelector('.main-header');

  appContainer.classList.remove('no-sidebar');
  mainHeader.style.display = '';

  // Atualizar data no header após exibir
  setupCurrentDate();
}

function switchTab(tabName) {
  const btnExport = document.getElementById('btn-export-dashboard');

  if (tabName === 'dashboard') {
    navDashboard.classList.add('active');
    navContracts.classList.remove('active');
    pageTitle.textContent = "Dashboard Operacional";
    pageSubtitle.textContent = "Acompanhamento de ajuizamentos de contratos";

    currentSectionEmpty.classList.remove('active');
    currentSectionDash.classList.add('active');
    currentSectionContracts.classList.remove('active');

    // Mostrar botão de exportação se houver dados carregados
    if (btnExport && appData.contracts && appData.contracts.length > 0) {
      btnExport.style.display = 'inline-flex';
    } else if (btnExport) {
      btnExport.style.display = 'none';
    }

    // Forçar atualização do tamanho dos gráficos
    if (chartStatusSitCob) chartStatusSitCob.resize();
    if (chartQtySitCob) chartQtySitCob.resize();
  } else if (tabName === 'contracts') {
    navDashboard.classList.remove('active');
    navContracts.classList.add('active');
    pageTitle.textContent = "Lista de Contratos";
    pageSubtitle.textContent = "Gerenciamento individual dos processos de kits";

    currentSectionEmpty.classList.remove('active');
    currentSectionDash.classList.remove('active');
    currentSectionContracts.classList.add('active');

    // Ocultar botão de exportação na aba de contratos
    if (btnExport) {
      btnExport.style.display = 'none';
    }

    // Atualizar tabela
    appData.currentPage = 1;
    filtrarEAplicarContratos();
  }
}

// ==========================================
// 3. CARREGAR DADOS DO BACKEND
// ==========================================
async function carregarDadosAtuais() {
  mostrarLoading("Buscando dados locais...");
  try {
    const response = await fetch('/api/dados-atuais');
    const resData = await response.json();

    if (resData.hasData) {
      salvarDadosNoEstado(resData);
      exibirSidebarEHeader();
      renderDashboard();
      switchTab('dashboard');
    }
  } catch (error) {
    console.error("Erro ao carregar dados atuais (modo update):", error);
  } finally {
    esconderLoading();
  }
}

function salvarDadosNoEstado(data) {
  appData.summary = data.summary;
  appData.pivot_status_sit_cob = data.pivot_status_sit_cob;
  appData.qty_by_sit_cob = data.qty_by_sit_cob;
  appData.contracts = data.contracts;
  appData.filteredContracts = [...data.contracts];
}

// ==========================================
// 4. LOGICA DE UPLOAD DE ARQUIVOS
// ==========================================
function setupUploadEvents() {
  // Controle de abertura e fechamento do Modal de Atualização (botão da sidebar)
  btnTriggerUpload.addEventListener('click', () => {
    uploadModal.classList.add('active');
  });

  btnCloseModal.addEventListener('click', fecharModalUpload);
  btnCancelUpload.addEventListener('click', fecharModalUpload);

  window.addEventListener('click', (e) => {
    if (e.target === uploadModal) {
      fecharModalUpload();
    }
  });

  // Botão da tela inicial: abre o seletor de arquivo
  const btnBrowseFile = document.getElementById('btn-browse-file');
  if (btnBrowseFile) {
    btnBrowseFile.addEventListener('click', () => fileInput.click());
  }

  // Seletor de arquivo da tela inicial
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      selectedFileName.textContent = file.name;
      selectedFileName.style.display = 'inline-block';
      // Disparar envio automaticamente após seleção
      enviarArquivo(file);
    }
  });

  // Configurar dropzone do modal de atualização
  setupDropzone(modalDropzone, modalFileInput, modalSelectedFileName, btnModalUploadSubmit);

  // Ações de envio do modal
  btnModalUploadSubmit.addEventListener('click', () => enviarArquivo(modalFileInput.files[0]));
}

function fecharModalUpload() {
  uploadModal.classList.remove('active');
  // Resetar arquivos selecionados no modal
  modalFileInput.value = '';
  modalSelectedFileName.textContent = 'Nenhum arquivo selecionado';
  modalSelectedFileName.style.display = 'none';
  btnModalUploadSubmit.disabled = true;
}

function setupDropzone(dz, input, nameSpan, submitBtn) {
  // Clique para abrir gerenciador de arquivos
  dz.addEventListener('click', () => input.click());

  // Alteração de arquivo
  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      tratarArquivoSelecionado(input.files[0], nameSpan, submitBtn);
    }
  });

  // Efeitos de arrastar arquivo por cima
  ['dragenter', 'dragover'].forEach(eventName => {
    dz.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dz.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dz.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dz.classList.remove('dragover');
    }, false);
  });

  // Drop do arquivo
  dz.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      input.files = dt.files;
      tratarArquivoSelecionado(file, nameSpan, submitBtn);
    } else {
      alert("Apenas arquivos do formato Excel (.xlsx ou .xls) são aceitos!");
    }
  });
}

function tratarArquivoSelecionado(file, nameSpan, submitBtn) {
  nameSpan.textContent = file.name;
  nameSpan.style.display = 'inline-block';
  submitBtn.disabled = false;
}

async function enviarArquivo(file) {
  if (!file) return;

  mostrarLoading("Processando e analisando arquivo Excel...");
  fecharModalUpload();

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const resData = await response.json();
    if (response.ok && resData.success) {
      salvarDadosNoEstado(resData);
      // Exibir sidebar e header ao carregar dados pela primeira vez
      exibirSidebarEHeader();
      renderDashboard();
      switchTab('dashboard');

      // Limpar campos de upload
      fileInput.value = '';
      selectedFileName.textContent = 'Nenhum arquivo selecionado';
      selectedFileName.style.display = 'none';
    } else {
      alert("Erro ao ler planilha: " + (resData.error || "Formato de arquivo incompatível."));
    }
  } catch (error) {
    console.error("Erro no envio do arquivo:", error);
    alert("Falha de conexão com o servidor backend.");
  } finally {
    esconderLoading();
  }
}

// ==========================================
// 5. RENDERIZAÇÃO DO DASHBOARD E GRÁFICOS
// ==========================================
function renderDashboard() {
  const sum = appData.summary;

  // Atualizar cards de KPI com animação
  animarNumero('kpi-total', sum.total);
  animarNumero('kpi-completos', sum.kits_completos);
  animarNumero('kpi-pendentes', sum.doc_pendente);
  animarNumero('kpi-ainiciar', sum.a_iniciar);
  animarNumero('kpi-naolocalizado', sum.nao_localizado);
  animarNumero('kpi-ancora', sum.pendencia_ancora);

  // Atualizar barras de progresso
  document.getElementById('progress-val-realizados').textContent = `${sum.percent_realizados}%`;
  document.getElementById('bar-realizados').style.width = `${sum.percent_realizados}%`;

  document.getElementById('progress-val-ainiciar').textContent = `${sum.percent_a_iniciar}%`;
  document.getElementById('bar-ainiciar').style.width = `${sum.percent_a_iniciar}%`;

  // Renderizar ou atualizar Gráficos
  renderizarGraficos();
}

function animarNumero(id, targetVal) {
  const el = document.getElementById(id);
  let currentVal = 0;
  const duration = 800; // ms
  const stepTime = 15;
  const steps = duration / stepTime;
  const increment = targetVal / steps;

  if (targetVal === 0) {
    el.textContent = '0';
    return;
  }

  const timer = setInterval(() => {
    currentVal += increment;
    if (currentVal >= targetVal) {
      el.textContent = Math.round(targetVal);
      clearInterval(timer);
    } else {
      el.textContent = Math.round(currentVal);
    }
  }, stepTime);
}

function renderizarGraficos(canvasStatusEl = null, canvasQtyEl = null, renderOptions = {}) {
  const targetCanvasStatus = canvasStatusEl || document.getElementById('chart-status-sitcob');
  const targetCanvasQty = canvasQtyEl || document.getElementById('chart-qty-sitcob');

  if (!targetCanvasStatus || !targetCanvasQty) return null;

  const isDefault = (!canvasStatusEl && !canvasQtyEl);

  // Destruir gráficos anteriores se existirem (apenas no modo default)
  if (isDefault) {
    if (chartStatusSitCob) chartStatusSitCob.destroy();
    if (chartQtySitCob) chartQtySitCob.destroy();
  }

  // 1. GRÁFICO 1: Status X Situação de Cobrança (Barras Empilhadas)
  const ctxStatus = targetCanvasStatus.getContext('2d');

  // Criar gradientes verticais para as barras (de cima para baixo)
  const gradAIniciar = ctxStatus.createLinearGradient(0, 0, 0, 300);
  gradAIniciar.addColorStop(0, '#3B82F6');
  gradAIniciar.addColorStop(1, '#1D4ED8');

  const gradDocPendente = ctxStatus.createLinearGradient(0, 0, 0, 300);
  gradDocPendente.addColorStop(0, '#F59E0B');
  gradDocPendente.addColorStop(1, '#B45309');

  const gradKitOk = ctxStatus.createLinearGradient(0, 0, 0, 300);
  gradKitOk.addColorStop(0, '#10B981');
  gradKitOk.addColorStop(1, '#047857');

  const gradNaoLocalizado = ctxStatus.createLinearGradient(0, 0, 0, 300);
  gradNaoLocalizado.addColorStop(0, '#9CA3AF');
  gradNaoLocalizado.addColorStop(1, '#4B5563');

  const gradPendenciaAncora = ctxStatus.createLinearGradient(0, 0, 0, 300);
  gradPendenciaAncora.addColorStop(0, '#EF4444');
  gradPendenciaAncora.addColorStop(1, '#B91C1C');

  // Extrair dados do pivot
  const categories = ['CC3', 'M08', 'PJ4'];

  // Mapear dados para cada status
  const datasets = [
    {
      label: 'A Iniciar',
      data: categories.map(cat => appData.pivot_status_sit_cob[cat]['A INICIAR']),
      backgroundColor: gradAIniciar,
      borderRadius: 4
    },
    {
      label: 'Doc. Pendente',
      data: categories.map(cat => appData.pivot_status_sit_cob[cat]['DOCS PARCIAL']),
      backgroundColor: gradDocPendente,
      borderRadius: 4
    },
    {
      label: 'Kit OK',
      data: categories.map(cat => appData.pivot_status_sit_cob[cat]['KIT OK']),
      backgroundColor: gradKitOk,
      borderRadius: 4
    },
    {
      label: 'Não Localizado',
      data: categories.map(cat => appData.pivot_status_sit_cob[cat]['NENHUM DOCUMENTO']),
      backgroundColor: gradNaoLocalizado,
      borderRadius: 4
    },
    {
      label: 'Pendência Âncora',
      data: categories.map(cat => appData.pivot_status_sit_cob[cat]['PENDÊNCIA ÂNCORA']),
      backgroundColor: gradPendenciaAncora,
      borderRadius: 4
    }
  ];

  const chartStatusConfig = {
    type: 'bar',
    data: {
      labels: categories,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { family: 'Inter', weight: 500 } }
        },
        y: {
          stacked: true,
          grid: { color: '#E4E3DD' },
          ticks: { font: { family: 'Inter' } }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 20 }
        },
        tooltip: {
          titleFont: { family: 'Outfit', size: 14 },
          bodyFont: { family: 'Inter', size: 13 }
        },
        // Rótulos numéricos brancos dentro de cada segmento da barra
        datalabels: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            weight: 'bold',
            size: 14
          },
          textShadowBlur: 4,
          textShadowColor: 'rgba(0,0,0,0.4)',
          anchor: 'center',
          align: 'center',
          formatter: (value) => value > 0 ? value : null,
          display: (context) => {
            const value = context.dataset.data[context.dataIndex];
            // Calcular o total empilhado daquela categoria para
            // saber o percentual relativo do segmento
            const catIdx = context.dataIndex;
            let stackTotal = 0;
            context.chart.data.datasets.forEach(ds => {
              stackTotal += (ds.data[catIdx] || 0);
            });
            // Exibir rótulo somente se o segmento representa >= 3% da coluna total
            // e tem valor >= 2 (evita rótulo em faixas de 0 ou 1 unidade)
            const pctOfStack = stackTotal > 0 ? (value / stackTotal) * 100 : 0;
            return value >= 2 && pctOfStack >= 3;
          }
        }
      }
    }
  };

  if (renderOptions.animation === false) {
    chartStatusConfig.options.animation = false;
  }

  const createdChartStatus = new Chart(ctxStatus, chartStatusConfig);

  // 2. GRÁFICO 2: Volume por carteira de cobrança (Rosca/Donut) com percentuais
  const ctxQty = targetCanvasQty.getContext('2d');
  const qtyData = categories.map(cat => appData.qty_by_sit_cob[cat]);
  const totalGeral = qtyData.reduce((acc, v) => acc + v, 0);

  // Criar gradientes diagonais para o gráfico de rosca
  const gradCC3 = ctxQty.createLinearGradient(0, 0, 200, 200);
  gradCC3.addColorStop(0, '#1E88E5');
  gradCC3.addColorStop(1, '#64B5F6');

  const gradM08 = ctxQty.createLinearGradient(0, 0, 200, 200);
  gradM08.addColorStop(0, '#F05A7E');
  gradM08.addColorStop(1, '#FFA38F');

  const gradPJ4 = ctxQty.createLinearGradient(0, 0, 200, 200);
  gradPJ4.addColorStop(0, '#0C0D21');
  gradPJ4.addColorStop(1, '#2E3159');

  const chartQtyConfig = {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: qtyData,
        backgroundColor: [
          gradCC3,
          gradM08,
          gradPJ4
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Inter', size: 12 }, boxWidth: 12, padding: 15 }
        },
        tooltip: {
          titleFont: { family: 'Outfit', size: 14 },
          bodyFont: { family: 'Inter', size: 13 },
          callbacks: {
            label: (context) => {
              const pct = totalGeral > 0 ? ((context.parsed / totalGeral) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${context.parsed} (${pct}%)`;
            }
          }
        },
        // Percentuais brancos dentro de cada fatia da rosca
        datalabels: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            weight: 'bold',
            size: 13
          },
          anchor: 'center',
          align: 'center',
          formatter: (value) => {
            if (totalGeral === 0 || value === 0) return null;
            const pct = ((value / totalGeral) * 100).toFixed(1);
            return `${pct}%`;
          },
          display: (context) => {
            // Só mostrar percentual se a fatia tiver pelo menos 3% do total
            const val = context.dataset.data[context.dataIndex];
            return (val / totalGeral) * 100 >= 3;
          }
        }
      }
    }
  };

  if (renderOptions.animation === false) {
    chartQtyConfig.options.animation = false;
  }

  const createdChartQty = new Chart(ctxQty, chartQtyConfig);

  if (isDefault) {
    chartStatusSitCob = createdChartStatus;
    chartQtySitCob = createdChartQty;
  }

  return { chartStatus: createdChartStatus, chartQty: createdChartQty };
}


// ==========================================
// 6. GERENCIAMENTO E FILTROS DA TABELA
// ==========================================
function setupTableEvents() {
  // Inputs de Filtros
  searchInput.addEventListener('input', () => {
    appData.currentPage = 1;
    filtrarEAplicarContratos();
  });

  filterSitcob.addEventListener('change', () => {
    appData.currentPage = 1;
    filtrarEAplicarContratos();
  });

  filterStatus.addEventListener('change', () => {
    appData.currentPage = 1;
    filtrarEAplicarContratos();
  });

  btnClearFilters.addEventListener('click', () => {
    searchInput.value = '';
    filterSitcob.value = '';
    filterStatus.value = '';
    appData.currentPage = 1;
    filtrarEAplicarContratos();
  });

  // Botões de Paginação
  btnPrevPage.addEventListener('click', () => {
    if (appData.currentPage > 1) {
      appData.currentPage--;
      renderizarTabelaContratos();
    }
  });

  btnNextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(appData.filteredContracts.length / appData.pageSize);
    if (appData.currentPage < totalPages) {
      appData.currentPage++;
      renderizarTabelaContratos();
    }
  });

  // Cabeçalhos de Ordenação
  document.querySelectorAll('.contracts-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (appData.sortField === field) {
        appData.sortOrder = appData.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        appData.sortField = field;
        appData.sortOrder = 'asc';
      }
      
      // Atualizar ícone de ordenação
      document.querySelectorAll('.contracts-table th i').forEach(icon => {
        icon.className = 'fa-solid fa-sort';
      });
      const icon = th.querySelector('i');
      icon.className = appData.sortOrder === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
      
      ordenarContratos();
      renderizarTabelaContratos();
    });
  });
}

function filtrarEAplicarContratos() {
  const sText = searchInput.value.toLowerCase().trim();
  const fCob = filterSitcob.value.toUpperCase();
  const fStat = filterStatus.value.toUpperCase();

  appData.filteredContracts = appData.contracts.filter(c => {
    // 1. Filtro de Busca por Texto
    const searchMatch = !sText || 
      String(c.contrato).toLowerCase().includes(sText) ||
      String(c.nome).toLowerCase().includes(sText) ||
      String(c.cpf_cnpj).toLowerCase().includes(sText) ||
      String(c.grupo).toLowerCase().includes(sText) ||
      String(c.cota).toLowerCase().includes(sText) ||
      String(c.obs).toLowerCase().includes(sText);

    // 2. Filtro de Cobrança (SIT COB)
    const cobMatch = !fCob || String(c.sit_cob).toUpperCase().trim() === fCob;

    // 3. Filtro de Situação (Status)
    const statMatch = !fStat || String(c.situacao).toUpperCase().trim() === fStat;

    return searchMatch && cobMatch && statMatch;
  });

  ordenarContratos();
  renderizarTabelaContratos();
}

function ordenarContratos() {
  const field = appData.sortField;
  const order = appData.sortOrder === 'asc' ? 1 : -1;

  appData.filteredContracts.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Tratar valores nulos ou vazios
    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';

    // Se forem numéricos
    if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
      return (Number(valA) - Number(valB)) * order;
    }

    // Se forem strings
    return String(valA).localeCompare(String(valB), 'pt-BR', { sensitivity: 'base' }) * order;
  });
}

function renderizarTabelaContratos() {
  const tbody = contractsTableBody;
  tbody.innerHTML = '';

  const totalRecords = appData.filteredContracts.length;
  const totalPages = Math.ceil(totalRecords / appData.pageSize) || 1;

  // Garantir que a página atual seja válida
  if (appData.currentPage > totalPages) appData.currentPage = totalPages;
  if (appData.currentPage < 1) appData.currentPage = 1;

  // Fatiar array para exibir a página atual
  const startIndex = (appData.currentPage - 1) * appData.pageSize;
  const endIndex = Math.min(startIndex + appData.pageSize, totalRecords);

  // Atualizar contadores no rodape da tabela
  pagStart.textContent = totalRecords === 0 ? 0 : startIndex + 1;
  pagEnd.textContent = endIndex;
  pagTotal.textContent = totalRecords;

  // Botões de Paginação Estado
  btnPrevPage.disabled = appData.currentPage === 1;
  btnNextPage.disabled = appData.currentPage === totalPages;

  // Renderizar botões de página numerados
  renderizarNumerosPagina(totalPages);

  if (totalRecords === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 40px;">Nenhum contrato encontrado com os filtros selecionados.</td></tr>`;
    return;
  }

  // Iterar e renderizar linhas
  for (let i = startIndex; i < endIndex; i++) {
    const c = appData.filteredContracts[i];
    const tr = document.createElement('tr');

    // Determinar badge CSS baseado no status
    let statusClass = 'a-iniciar';
    let statusTxt = c.situacao || 'A INICIAR';
    const cleanStatus = String(c.situacao || '').toUpperCase().trim();

    if (cleanStatus === 'KIT OK') {
      statusClass = 'kit-ok';
      statusTxt = 'Kit OK';
    } else if (cleanStatus === 'DOCS PARCIAL') {
      statusClass = 'docs-parcial';
      statusTxt = 'Doc. Pendente';
    } else if (cleanStatus === 'NENHUM DOCUMENTO') {
      statusClass = 'nenhum-documento';
      statusTxt = 'Não Localizado';
    } else if (cleanStatus === 'PENDÊNCIA ÂNCORA') {
      statusClass = 'pendencia-ancora';
      statusTxt = 'Pendência Âncora';
    } else if (cleanStatus === 'PAGO') {
      statusClass = 'pago';
      statusTxt = 'Pago';
    } else {
      statusClass = 'a-iniciar';
      statusTxt = 'A Iniciar';
    }

    tr.innerHTML = `
      <td class="cell-bold">${c.contrato}</td>
      <td>${c.grupo} / ${c.cota}</td>
      <td class="cell-bold">${c.nome}</td>
      <td>${c.cpf_cnpj || '---'}</td>
      <td><span class="cell-bold">${c.sit_cob || 'N/A'}</span></td>
      <td><span class="status-badge ${statusClass}">${statusTxt}</span></td>
      <td style="font-size: 13px; color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.obs}">
        ${c.obs || '<em style="opacity: 0.5;">Sem observações</em>'}
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function renderizarNumerosPagina(totalPages) {
  paginationPages.innerHTML = '';
  
  // Renderizar no máximo 5 páginas ao redor da página atual
  const maxButtons = 5;
  let startPage = Math.max(1, appData.currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = `btn-page-number ${i === appData.currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      appData.currentPage = i;
      renderizarTabelaContratos();
    });
    paginationPages.appendChild(btn);
  }
}

// ==========================================
// 7. UTILS: SPINNERS E OVERLAYS
// ==========================================
function mostrarLoading(text) {
  loadingText.textContent = text;
  loadingOverlay.classList.add('active');
}

function esconderLoading() {
  loadingOverlay.classList.remove('active');
}

// ==========================================
// 8. FUNCIONALIDADES DE EXPORTAÇÃO PARA IMAGEM
// ==========================================
function setupExportEvents() {
  const btnExport = document.getElementById('btn-export-dashboard');
  if (btnExport) {
    btnExport.addEventListener('click', exportarDashboardParaJPEG);
  }
}

async function exportarDashboardParaJPEG() {
  // Garantir que todas as fontes (Google Fonts) estejam carregadas no navegador antes da renderização
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // 1. Mostrar loading overlay
  mostrarLoading("Exportando dashboard para imagem horizontal de alta qualidade...");

  // Aguardar um instante para garantir que a tela renderize o loading overlay
  await new Promise(resolve => setTimeout(resolve, 150));

  let exportCharts = null;
  let exportWrapper = null;

  try {
    // 2. Elementos a clonar
    const headerElement = document.querySelector('.main-header');
    const dashboardElement = document.getElementById('section-dashboard');

    if (!headerElement || !dashboardElement) {
      throw new Error("Elementos da dashboard não encontrados para exportação.");
    }

    // 3. Clonar cabeçalho e dashboard
    const headerClone = headerElement.cloneNode(true);
    const dashboardClone = dashboardElement.cloneNode(true);

    // Forçar opacidade completa e desativar animações/transições para evitar transparência por fade-in
    headerClone.style.animation = 'none';
    headerClone.style.transition = 'none';
    headerClone.style.opacity = '1';
    headerClone.style.transform = 'none';

    dashboardClone.style.animation = 'none';
    dashboardClone.style.transition = 'none';
    dashboardClone.style.opacity = '1';
    dashboardClone.style.transform = 'none';

    // 4. Remover o botão de exportação no cabeçalho clonado para não aparecer na imagem
    const exportBtnInClone = headerClone.querySelector('#btn-export-dashboard');
    if (exportBtnInClone) {
      exportBtnInClone.remove();
    }

    // 5. Criar um container temporário fora da tela
    exportWrapper = document.createElement('div');
    exportWrapper.id = 'temp-export-wrapper';
    
    // Aplicar estilos básicos para posicionamento fora da tela
    exportWrapper.style.position = 'absolute';
    exportWrapper.style.left = '-9999px';
    exportWrapper.style.top = '0';
    exportWrapper.style.fontFamily = "var(--font-body), sans-serif";
    
    // 6. Injetar folha de estilo específica para forçar o layout horizontal e consistência tipográfica Mac/Windows
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      #temp-export-wrapper {
        width: 1600px !important;
        height: auto !important;
        min-height: 900px !important;
        padding: 30px !important;
        background-color: #F2F2F2 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 20px !important;
        box-sizing: border-box !important;
      }
      #temp-export-wrapper * {
        font-family: var(--font-body), sans-serif !important;
        box-sizing: border-box !important;
      }
      #temp-export-wrapper h1,
      #temp-export-wrapper h2,
      #temp-export-wrapper h3,
      #temp-export-wrapper h4,
      #temp-export-wrapper h5,
      #temp-export-wrapper h6 {
        font-family: var(--font-title), sans-serif !important;
      }
      #temp-export-wrapper .main-header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #temp-export-wrapper #section-dashboard {
        display: flex !important;
        flex-direction: column !important;
        gap: 20px !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #temp-export-wrapper .kpi-grid {
        display: grid !important;
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 16px !important;
        width: 100% !important;
      }
      #temp-export-wrapper .kpi-sub-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1.5fr 1.5fr !important;
        gap: 16px !important;
        width: 100% !important;
      }
      #temp-export-wrapper .charts-grid {
        display: grid !important;
        grid-template-columns: 2fr 1fr !important;
        gap: 20px !important;
        width: 100% !important;
        align-items: stretch !important;
      }
      #temp-export-wrapper .chart-card {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        height: 100% !important;
        padding: 20px !important;
        box-sizing: border-box !important;
      }
      #temp-export-wrapper .chart-wrapper-bar,
      #temp-export-wrapper .chart-wrapper {
        min-height: 550px !important;
        height: 550px !important;
        max-height: 550px !important;
        width: 100% !important;
        position: relative !important;
      }
    `;
    exportWrapper.appendChild(styleEl);
    
    // Anexar os clones ao container
    exportWrapper.appendChild(headerClone);
    exportWrapper.appendChild(dashboardClone);
    
    // Adicionar o container temporário ao body para que o CSS global e a folha de estilo interna sejam aplicados
    document.body.appendChild(exportWrapper);

    // 7. Obter referências dos canvases clonados e inicializar gráficos neles sem animação
    const clonedCanvasStatus = dashboardClone.querySelector('#chart-status-sitcob');
    const clonedCanvasQty = dashboardClone.querySelector('#chart-qty-sitcob');
    
    if (clonedCanvasStatus && clonedCanvasQty) {
      exportCharts = renderizarGraficos(clonedCanvasStatus, clonedCanvasQty, { animation: false });
    }

    // Pequeno delay para garantir que o navegador processe e desenhe os gráficos nos canvases
    await new Promise(resolve => setTimeout(resolve, 150));

    // 8. Chamar o html2canvas com configurações de alta resolução e dimensões fixas horizontais
    const canvas = await html2canvas(exportWrapper, {
      scale: 3,                   // Triplica a densidade de pixels para alta resolução (HD)
      useCORS: true,              // Permite carregar recursos com CORS
      logging: false,             // Desliga logs desnecessários no console
      backgroundColor: '#F2F2F2',  // Cor do fundo do JPEG para evitar fundo preto ou transparente
      windowWidth: 1600,          // Força a largura de renderização simulada
      windowHeight: exportWrapper.scrollHeight, // Força a altura dinâmica calculada do wrapper
      scrollX: 0,                 // Previne bugs de rolagem da página na imagem no Windows (deslocamento)
      scrollY: 0,
      x: 0,
      y: 0
    });

    // 9. Converter o canvas para JPEG com 95% de qualidade
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // 10. Gerar o nome do arquivo com a data atual (YYYY-MM-DD)
    const dataAtual = new Date().toISOString().split('T')[0];
    const fileName = `dashboard_ajuizamento_${dataAtual}.jpg`;

    // 11. Criar elemento de link temporário e simular o clique para download
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

  } catch (error) {
    console.error("Erro ao exportar dashboard:", error);
    alert("Ocorreu um erro ao gerar a imagem JPEG do dashboard: " + error.message);
  } finally {
    // 12. Limpar instâncias temporárias de gráficos para evitar vazamento de memória
    if (exportCharts) {
      if (exportCharts.chartStatus) exportCharts.chartStatus.destroy();
      if (exportCharts.chartQty) exportCharts.chartQty.destroy();
    }
    // 13. Limpar o container temporário do DOM
    if (exportWrapper && exportWrapper.parentNode) {
      document.body.removeChild(exportWrapper);
    }
    // 14. Ocultar o spinner de carregamento
    esconderLoading();
  }
}
