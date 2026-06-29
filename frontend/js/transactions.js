const API_BASE_URL = 'https://trackmoney.fly.dev/';

let allTransactions = [];
let categories = [];
let currentPageMonthly = 1;
const itemsPerPageMonthly = 6;
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let selectedTransaction = null;
let currentTab = 'monthly';
let txFormMode = 'create';
let txFormEditId = null;
let txFormType = 'expense';


async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

function getAuthToken() {
  return localStorage.getItem('auth_token') || '';
}


document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  attachModalListeners();
  setCurrentMonthYear();
});

function setCurrentMonthYear() {
  const now = new Date();
  currentMonth = now.getMonth() + 1;
  currentYear = now.getFullYear();

  const monthFilter = document.getElementById('monthFilter');
  if (monthFilter) {
    monthFilter.value = currentMonth;
  }
}

async function initializeApp() {
  try {
    await loadCategories();
    await loadTransactions();
    updateSummaryCards();
    renderRecentTransactions();
    initializeCharts();
    updateReports();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showStatusMessage('Erro ao carregar dados. Verifique a conexao com a API.', 'error');
  }
}


async function loadCategories() {
  try {
    const response = await apiRequest('/category/list');
    categories = response || [];
    populateCategorySelect();
  } catch (error) {
    console.error('Error loading categories:', error);
    categories = [
      { id: 1, name: 'Alimentacao' },
      { id: 2, name: 'Transporte' },
      { id: 3, name: 'Moradia' },
      { id: 4, name: 'Entretenimento' },
      { id: 5, name: 'Renda' },
      { id: 6, name: 'Freelance' },
      { id: 7, name: 'Bonus' },
      { id: 8, name: 'Outros' },
    ];
    populateCategorySelect();
  }
}

async function loadTransactions() {
  try {
    const response = await apiRequest(`/transactions/list?limit=100&page=1`);
    allTransactions = normalizeTransactions(response);
  } catch (error) {
    console.error('Error loading transactions:', error);
    allTransactions = [];
  }
}

function normalizeTransactions(apiData) {
  if (!apiData) return [];

  const items = apiData.items || apiData;

  return items.map(tx => ({
    id: tx.id,
    title: tx.title,
    amount: tx.value,
    type: tx.type?.toLowerCase() === 'income' || tx.type?.toLowerCase() === 'receita' ? 'income' : 'expense',
    date: formatApiDate(tx.transaction_date),
    category: getCategoryName(tx.category_id),
    description: tx.description,
    category_id: tx.category_id,
    raw: tx,
  }));
}

function formatApiDate(dateString) {
  if (!dateString) return formatDateBR(new Date());

  const date = new Date(dateString);
  return formatDateBR(date);
}

function formatDateBR(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseBRDate(str) {
  if (!str) return new Date(0);
  const [d, m, y] = str.split('/').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function getCategoryName(categoryId) {
  const cat = categories.find(c => c.id === categoryId);
  return cat ? cat.name : 'Sem categoria';
}

function populateCategorySelect() {
  const select = document.getElementById('txFormCategory');
  if (!select) return;

  select.innerHTML = categories.map(cat =>
    `<option value="${cat.id}">${cat.name}</option>`
  ).join('');
}


async function createTransactionAPI(data) {
  const payload = {
    title: data.title,
    value: data.amount,
    description: data.description || null,
    type: data.type === 'income' ? 'income' : 'expense',
    category_id: data.category_id,
    transaction_date: data.transaction_date || new Date().toISOString(),
  };

  const response = await apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response;
}

async function updateTransactionAPI(id, data) {
  const payload = {
    title: data.title,
    value: data.amount,
    description: data.description || null,
    type: data.type === 'income' ? 'income' : 'expense',
    category_id: data.category_id,
    transaction_date: data.transaction_date,
  };

  const response = await apiRequest(`/transactions/update/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return response;
}


async function deleteTransactionAPI(id) {
  const response = await apiRequest(`/transactions/delete/${id}`, {
    method: 'DELETE',
  });

  return response;
}


async function listTransactionsAPI(filters = {}) {
  const params = new URLSearchParams({
    limit: filters.limit || 100,
    page: filters.page || 1,
  });

  if (filters.type) params.append('type', filters.type);
  if (filters.category_id) params.append('category_id', filters.category_id);

  const response = await apiRequest(`/transactions/list?${params.toString()}`);
  return normalizeTransactions(response);
}


async function getMonthlyTransactionsAPI(month, year) {
  try {
    const response = await apiRequest(`/transactions/monthly_transactions?month=${month}&year=${year}`);
    return normalizeTransactions(response);
  } catch (error) {
    console.error('Error fetching monthly transactions:', error);
    return [];
  }
}

async function getMonthExpenseTransactionsAPI(month, year) {
  try {
    const response = await apiRequest(`/transactions/expense_month?month=${month}&year=${year}`);
    return normalizeTransactions(response);
  } catch (error) {
    console.error('Error fetching monthly transactions:', error);
    return [];
  }
}

async function getMonthIncomeTransactionsAPI(month, year) {
  try {
    const response = await apiRequest(`/transactions/income_month?month=${month}&year=${year}`);
    return normalizeTransactions(response);
  } catch (error) {
    console.error('Error fetching monthly transactions:', error);
    return [];
  }
}


async function updateSummaryCards() {
  try {
    // Busca transacoes do mes atual para calcular resumo
    const monthTx = await getMonthlyTransactionsAPI(currentMonth, currentYear);

    const receitas = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const despesas = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const saldo = receitas - despesas;

    const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

    document.getElementById('summaryIncome').textContent = fmt(receitas);
    document.getElementById('summaryBalance').textContent = fmt(saldo);
    document.getElementById('summaryExpense').textContent = fmt(despesas);

    // Update change labels
    const incomeChange = document.getElementById('summaryIncomeChange');
    const balanceChange = document.getElementById('summaryBalanceChange');
    const expenseChange = document.getElementById('summaryExpenseChange');

    incomeChange.textContent = saldo >= 0 ? 'Mes positivo' : 'Mes negativo';
    incomeChange.className = `summary-change ${receitas > 0 ? 'positive' : 'negative'}`;

    balanceChange.textContent = saldo >= 0 ? 'Mes em dia' : 'Atencao';
    balanceChange.className = `summary-change ${saldo >= 0 ? 'positive' : 'negative'}`;

    expenseChange.textContent = despesas > 0 ? `${monthTx.filter(t => t.type === 'expense').length} despesas` : 'Sem despesas';
  } catch (error) {
    console.error('Error updating summary cards:', error);
  }
}


function renderRecentTransactions() {
  const sorted = [...allTransactions]
    .sort((a, b) => parseBRDate(b.date) - parseBRDate(a.date))
    .slice(0, 5);

  let html = '';

  if (sorted.length === 0) {
    html = '<p style="color: var(--subtext); text-align: center; padding: 20px;">Nenhuma transacao encontrada</p>';
  } else {
    sorted.forEach((tx) => {
      const typeClass = tx.type === 'income' ? 'income' : 'expense';
      const prefix = tx.type === 'income' ? '+' : '-';
      const iconPath = tx.type === 'income'
        ? '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9H13V7.5h-2V11H8.5v2h2.5v3.5h2V13h2.5v-2z"/>'
        : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>';

      html += `
        <div class="transaction-item" onclick="openTransactionInfo(${tx.id}, event)">
          <div class="transaction-icon ${typeClass}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              ${iconPath}
            </svg>
          </div>
          <div class="transaction-info">
            <div class="transaction-name">${tx.title}</div>
            <div class="transaction-date">${tx.date}</div>
          </div>
          <div class="transaction-amount ${typeClass}-text">${prefix}R$ ${tx.amount.toFixed(2)}</div>
        </div>
      `;
    });
  }

  document.getElementById('recentTransactionsList').innerHTML = html;
}


function openAllTransactions() {
  document.getElementById('allTransactionsModal').classList.add('open');
  updateAllTransactions();
}

function closeAllTransactions() {
  const modal = document.getElementById('allTransactionsModal');
  const box = modal?.querySelector('.txn-modal-box');
  if (box) {
    box.classList.add('closing');
    setTimeout(() => {
      box.classList.remove('closing');
      modal?.classList.remove('open');
    }, 180);
    return;
  }
  modal?.classList.remove('open');
}

function openReports() {
  document.getElementById('allTransactionsModal')?.classList.remove('open');
  document.getElementById('reportsModal').classList.add('active');
  updateReports();
}

function closeReports() {
  const modal = document.getElementById('reportsModal');
  const content = modal?.querySelector('.modal-content');
  if (content) {
    content.classList.add('closing');
    setTimeout(() => {
      content.classList.remove('closing');
      modal?.classList.remove('active');
    }, 180);
    return;
  }
  modal?.classList.remove('active');
}

function openTransactionInfo(id, event) {
  if (event) event.stopPropagation();

  const tx = allTransactions.find(t => t.id === id);
  if (!tx) return;

  selectedTransaction = { ...tx };

  document.getElementById('allTransactionsModal')?.classList.remove('open');

  const typeLabel = tx.type === 'income' ? 'Receita' : 'Despesa';
  const typeClass = tx.type === 'income' ? 'income' : 'expense';
  const amountDisplay = (tx.type === 'income' ? '+R$ ' : '-R$ ') + tx.amount.toFixed(2);

  document.getElementById('transactionDetail').innerHTML = `
    <div class="transaction-detail-row">
      <span class="detail-label">Descricao</span>
      <span class="detail-value">${tx.title}</span>
    </div>
    <div class="transaction-detail-row">
      <span class="detail-label">Categoria</span>
      <span class="detail-value">${tx.category}</span>
    </div>
    <div class="transaction-detail-row">
      <span class="detail-label">Data</span>
      <span class="detail-value">${tx.date}</span>
    </div>
    <div class="transaction-detail-row">
      <span class="detail-label">Tipo</span>
      <span class="detail-value">${typeLabel}</span>
    </div>
    <div class="transaction-detail-row">
      <span class="detail-label">Valor</span>
      <span class="detail-value ${typeClass}">${amountDisplay}</span>
    </div>
    ${tx.description ? `
    <div class="transaction-detail-row">
      <span class="detail-label">Observacao</span>
      <span class="detail-value">${tx.description}</span>
    </div>
    ` : ''}
  `;
  document.getElementById('transactionActionsModal').classList.add('active');
}

function closeTransactionActions() {
  const modal = document.getElementById('transactionActionsModal');
  const box = modal?.querySelector('.modal-content');
  if (box) {
    box.classList.add('closing');
    setTimeout(() => {
      box.classList.remove('closing');
      modal?.classList.remove('active');
    }, 180);
    return;
  }
  modal?.classList.remove('active');
  selectedTransaction = null;
}


function criarTransacao() {
  openTxFormCreate();
}

function openTxFormCreate() {
  txFormMode = 'create';
  txFormEditId = null;
  txFormType = 'expense';

  document.getElementById('txFormTitle').textContent = 'Nova Transacao';
  document.getElementById('txFormSub').textContent = 'Preencha os dados abaixo';
  document.getElementById('txFormBtnLbl').textContent = 'Criar';

  document.getElementById('txFormName').value = '';
  document.getElementById('txFormAmount').value = '';
  document.getElementById('txFormDescription').value = '';
  document.getElementById('txFormDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('txFormCategory').value = categories[0]?.id || 1;

  txSelectType('expense');
  document.getElementById('txFormStatus').textContent = '';
  document.getElementById('txFormStatus').style.display = 'none';
  document.getElementById('txFormOverlay').classList.add('open');
}

function openTxFormEdit(id) {
  const tx = allTransactions.find(t => t.id === id);
  if (!tx) return;

  txFormMode = 'edit';
  txFormEditId = id;

  document.getElementById('txFormTitle').textContent = 'Editar Transacao';
  document.getElementById('txFormSub').textContent = 'Altere os dados abaixo';
  document.getElementById('txFormBtnLbl').textContent = 'Salvar';

  document.getElementById('txFormName').value = tx.title;
  document.getElementById('txFormAmount').value = tx.amount;
  document.getElementById('txFormDescription').value = tx.description || '';

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input
  const [day, month, year] = tx.date.split('/');
  document.getElementById('txFormDate').value = `${year}-${month}-${day}`;

  document.getElementById('txFormCategory').value = tx.category_id || categories[0]?.id || 1;

  txSelectType(tx.type === 'income' ? 'income' : 'expense');
  document.getElementById('txFormStatus').textContent = '';
  document.getElementById('txFormStatus').style.display = 'none';
  document.getElementById('txFormOverlay').classList.add('open');
}

function closeTxForm() {
  const overlay = document.getElementById('txFormOverlay');
  const box = overlay?.querySelector('.txn-modal-box, .cat-modal-box');
  if (box) {
    box.classList.add('closing');
    setTimeout(() => {
      box.classList.remove('closing');
      overlay?.classList.remove('open');
    }, 180);
    return;
  }
  overlay?.classList.remove('open');
}

function closeTxFormOverlay(e) {
  if (e.target.id === 'txFormOverlay') closeTxForm();
}

function txSelectType(type) {
  txFormType = type;
  document.getElementById('txTypeIncome').classList.toggle('active', type === 'income');
  document.getElementById('txTypeExpense').classList.toggle('active', type === 'expense');
}

function showStatusMessage(message, type = 'info') {
  const status = document.getElementById('txFormStatus');
  status.textContent = message;
  status.style.display = 'block';
  status.style.color = type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--accent)';
}

async function txFormSubmit() {
  const name = document.getElementById('txFormName').value.trim();
  const amount = parseFloat(document.getElementById('txFormAmount').value);
  const description = document.getElementById('txFormDescription').value.trim();
  const dateValue = document.getElementById('txFormDate').value;
  const categoryId = parseInt(document.getElementById('txFormCategory').value);

  if (!name) {
    showStatusMessage('Informe um titulo.', 'error');
    return;
  }

  if (!amount || amount <= 0) {
    showStatusMessage('Informe um valor valido.', 'error');
    return;
  }

  if (!dateValue) {
    showStatusMessage('Informe uma data.', 'error');
    return;
  }

  const submitBtn = document.querySelector('.cat-btn-submit');
  const submitLabel = submitBtn?.querySelector('#txFormBtnLbl');
  if (!submitBtn || !submitLabel) return;

  submitBtn.disabled = true;
  submitLabel.textContent = 'Salvando...';

  try {
    const transactionDate = new Date(dateValue).toISOString();

    const data = {
      title: name,
      amount: amount,
      description: description,
      type: txFormType,
      category_id: categoryId,
      transaction_date: transactionDate,
    };

    if (txFormMode === 'create') {
      const response = await createTransactionAPI(data);
      showStatusMessage('Transacao criada com sucesso!', 'success');
    } else if (txFormEditId) {
      const response = await updateTransactionAPI(txFormEditId, data);
      showStatusMessage('Transacao atualizada!', 'success');
    }

    setTimeout(async () => {
      closeTxForm();
      await loadTransactions();
      updateSummaryCards();
      renderRecentTransactions();
      updateMainChart();
      updateAllTransactions();
      updateReports();
    }, 500);

  } catch (error) {
    console.error('Error saving transaction:', error);
    showStatusMessage(`Erro: ${error.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitLabel.textContent = txFormMode === 'create' ? 'Criar' : 'Salvar';
  }
}

function attachModalListeners() {

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
      this.closest('.modal').classList.remove('active');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
      document.querySelectorAll('.txn-modal-overlay.open').forEach(modal => {
        modal.classList.remove('open');
      });
      document.querySelectorAll('.cat-modal-overlay.open').forEach(modal => {
        modal.classList.remove('open');
      });
    }
  });


  document.querySelectorAll('.modal-content, .txn-modal-box, .cat-modal-box').forEach(content => {
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  document.getElementById('allTransactionsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'allTransactionsModal') closeAllTransactions();
  });

  document.getElementById('transactionActionsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'transactionActionsModal') closeTransactionActions();
  });
}


async function updateAllTransactions() {
  const month = document.getElementById('monthFilterAll')?.value || '';
  const year = document.getElementById('yearFilterAll')?.value || '';
  const search = document.getElementById('searchTransactions')?.value.toLowerCase() || '';

  if (currentTab === 'monthly') {
    await updateMonthlyTransactions(month, year, search);
  } else {
    updateHistoryByMonth(month, year, search);
  }
}

async function updateMonthlyTransactions(month = '', year = '', search = '') {
  let filtered = [...allTransactions];

  if (month) {
    filtered = filtered.filter(tx => {
      const txMonth = tx.date.split('/')[1];
      return txMonth === month.padStart(2, '0');
    });
  }

  if (year) {
    filtered = filtered.filter(tx => tx.date.endsWith(year));
  }

  if (search) {
    filtered = filtered.filter(tx => tx.title.toLowerCase().includes(search));
  }

  filtered.sort((a, b) => parseBRDate(b.date) - parseBRDate(a.date));

  const totalPages = Math.ceil(filtered.length / itemsPerPageMonthly) || 1;
  const startIndex = (currentPageMonthly - 1) * itemsPerPageMonthly;
  const paginatedTx = filtered.slice(startIndex, startIndex + itemsPerPageMonthly);

  let html = '';

  if (paginatedTx.length === 0) {
    html = '<p style="color: var(--subtext); text-align: center; padding: 20px;">Nenhuma transacao encontrada</p>';
  } else {
    paginatedTx.forEach(tx => {
      const typeClass = tx.type === 'income' ? 'income' : 'expense';
      const badge = tx.type === 'income' ? 'RECEITA' : 'DESPESA';
      const prefix = tx.type === 'income' ? '+' : '-';
      const id = String(tx.id);

      html += `
        <div class="txn-card" onclick="openTransactionInfo(${tx.id}, event)">
          <div>
            <div class="txn-card-header">
              <span class="txn-badge ${typeClass}">${badge}</span>
              <span class="txn-card-id">#${id}</span>
            </div>
            <div class="txn-card-title">${tx.title}</div>
            <div class="txn-card-amount ${typeClass}">${prefix}R$ ${tx.amount.toFixed(2)}</div>
            <div class="txn-card-meta">${tx.date} - ${tx.category}</div>
          </div>
          <div class="txn-card-actions">
            <button class="txn-card-btn edit" onclick="event.stopPropagation(); openTxFormEdit(${tx.id})" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 3 21 8 8 21 3 21 3 16 16 3"></polyline>
              </svg>
            </button>
            <button class="txn-card-btn del" onclick="event.stopPropagation(); deletarTransacaoById(${tx.id})" title="Deletar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    });
  }

  document.getElementById('monthlyTransactionsList').innerHTML = html;
  document.getElementById('currentPageMonthly').textContent = currentPageMonthly;
  document.getElementById('totalPagesMonthly').textContent = totalPages;
}

function updateHistoryByMonth(month = '', year = '', search = '') {
  let source = [...allTransactions];

  if (month) {
    source = source.filter(tx => tx.date.split('/')[1] === String(month).padStart(2, '0'));
  }
  if (year) {
    source = source.filter(tx => tx.date.endsWith(year));
  }
  if (search) {
    const s = search.toLowerCase();
    source = source.filter(tx =>
      (tx.title || '').toLowerCase().includes(s) ||
      (tx.description || '').toLowerCase().includes(s) ||
      (tx.category || '').toLowerCase().includes(s)
    );
  }

  const groupedByMonth = {};

  source.forEach(tx => {
    const parts = tx.date.split('/');
    const monthYear = `${parts[1]}/${parts[2]}`;
    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }
    groupedByMonth[monthYear].push(tx);
  });

  let html = '';
  const sortedMonths = Object.keys(groupedByMonth).sort().reverse();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (sortedMonths.length === 0) {
    html = '<p style="color: var(--subtext); text-align: center; padding: 20px;">Nenhuma transacao encontrada</p>';
  } else {
    sortedMonths.forEach(monthYear => {
      const [month, year] = monthYear.split('/');
      const monthName = monthNames[parseInt(month) - 1];

      html += `<div class="month-group">
        <div class="month-header">${monthName} de ${year}</div>
        <div class="month-transactions">`;

      groupedByMonth[monthYear].forEach(tx => {
        const typeClass = tx.type === 'income' ? 'income' : 'expense';
        html += `
          <div class="txn-card" onclick="openTransactionInfo(${tx.id}, event)">
            <div class="txn-card-header">
              <span class="txn-badge ${typeClass}">${tx.type === 'income' ? 'RECEITA' : 'DESPESA'}</span>
            </div>
            <div class="txn-card-title">${tx.title}</div>
            <div class="txn-card-amount ${typeClass}">${tx.type === 'income' ? '+' : '-'}R$ ${tx.amount.toFixed(2)}</div>
            <div class="txn-card-meta">${tx.category}</div>
          </div>
        `;
      });

      html += `</div></div>`;
    });
  }

  document.getElementById('historyByMonth').innerHTML = html;
}

function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.txn-tab-content').forEach(el => {
    el.classList.remove('active');
  });

  document.querySelectorAll('.txn-tab-btn').forEach(el => {
    el.classList.remove('active');
  });

  if (tab === 'monthly') {
    document.getElementById('monthlyTab').classList.add('active');
    document.querySelectorAll('.txn-tab-btn')[0]?.classList.add('active');
    currentPageMonthly = 1;
    updateAllTransactions();
  } else {
    document.getElementById('allTab').classList.add('active');
    document.querySelectorAll('.txn-tab-btn')[1]?.classList.add('active');
    updateAllTransactions();
  }
}

function prevPageMonthly() {
  if (currentPageMonthly > 1) {
    currentPageMonthly--;
    updateAllTransactions();
  }
}

function nextPageMonthly() {
  const month = document.getElementById('monthFilterAll')?.value || '';
  const year = document.getElementById('yearFilterAll')?.value || '';
  const search = document.getElementById('searchTransactions')?.value.toLowerCase() || '';

  let filtered = [...allTransactions];
  if (month) filtered = filtered.filter(tx => tx.date.split('/')[1] === month.padStart(2, '0'));
  if (year) filtered = filtered.filter(tx => tx.date.endsWith(year));
  if (search) filtered = filtered.filter(tx => tx.title.toLowerCase().includes(search));

  const totalPages = Math.ceil(filtered.length / itemsPerPageMonthly) || 1;
  if (currentPageMonthly < totalPages) {
    currentPageMonthly++;
    updateAllTransactions();
  }
}


async function updateReports() {
  const month = parseInt(document.getElementById('monthFilter')?.value) || currentMonth;

  const monthTransactions = await getMonthExpenseTransactionsAPI(month, currentYear);
  
  updateTransactionsByDate(monthTransactions);
  updateCategoriesList(monthTransactions);
  updateReportsChart(monthTransactions);
}

function updateTransactionsByDate(transactions) {
  const groupedByDate = {};

  transactions.forEach(tx => {
    if (!groupedByDate[tx.date]) {
      groupedByDate[tx.date] = [];
    }
    groupedByDate[tx.date].push(tx);
  });

  const sortedDates = Object.keys(groupedByDate).sort().reverse();
  let html = '';

  if (sortedDates.length === 0) {
    html = '<p style="color: var(--subtext); text-align: center; padding: 10px;">Nenhuma transacao</p>';
  } else {
    sortedDates.forEach(date => {
      const dayTransactions = groupedByDate[date];
      const dayTotal = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      html += `
        <div class="report-item">
          <strong>${date}</strong> - R$ ${dayTotal.toFixed(2)}
        </div>
      `;
    });
  }

  document.getElementById('transactionsByDate').innerHTML = html;
}

function updateCategoriesList(transactions) {
  const categoryTotals = {};

  transactions.forEach(tx => {
    if (!categoryTotals[tx.category]) {
      categoryTotals[tx.category] = 0;
    }
    categoryTotals[tx.category] += tx.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  let html = '';

  if (sortedCategories.length === 0) {
    html = '<p style="color: var(--subtext); text-align: center; padding: 10px;">Sem categorias</p>';
  } else {
    sortedCategories.forEach(([category, amount]) => {
      html += `
        <div class="category-item">
          <span class="category-name">${category}</span>
          <span class="category-amount">R$ ${amount.toFixed(2)}</span>
        </div>
      `;
    });
  }

  document.getElementById('categoriesList').innerHTML = html;
}

function initializeCharts() {
  updateMainChart();
}

function updateMainChart() {
  const canvas = document.getElementById('mainChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const monthIncome = allTransactions.filter(tx => {
    const txMonth = parseBRDate(tx.date).getMonth() + 1;
    return txMonth === currentMonth && tx.type === 'income';
  });
  const chartData = prepareChartData(monthIncome);

  if (chartData.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'var(--subtext)';
    ctx.font = '14px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
    return;
  }

  drawPieChart(ctx, chartData, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 6);
  renderHtmlLegend('mainChartLegend', chartData);
}

async function updateReportsChart(transactions) {
  const month = parseInt(document.getElementById('monthFilter')?.value) || currentMonth;
  const monthTransactions = await getMonthExpenseTransactionsAPI(month, currentYear);
  const chartData = prepareChartData(monthTransactions);

  const canvas = document.getElementById('reportsChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (chartData.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'var(--subtext)';
    ctx.font = '14px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados', canvas.width / 2, canvas.height / 2);
    document.getElementById('reportsChartLegend').innerHTML = '';
    return;
  }

  drawPieChart(ctx, chartData, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10);
  renderHtmlLegend('reportsChartLegend', chartData);
}

function renderHtmlLegend(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const total = data.reduce((s, i) => s + i.value, 0) || 1;

  el.innerHTML = data.map(item => {
    const pct = ((item.value / total) * 100).toFixed(1);
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${item.color}"></span>
        <div class="legend-info">
          <span class="legend-label">${item.label}</span>
          <span class="legend-value">R$ ${item.value.toFixed(2)}</span>
        </div>
        <span class="legend-pct" style="color:${item.color}">${pct}%</span>
      </div>
    `;
  }).join('');
}

function prepareChartData(transactions) {
  const colors = [
    '#00D4FF', '#00E5A0', '#FF3D6B', '#F5A623',
    '#0099CC', '#FF6B9D', '#FFD700', '#1abc9c',
    '#e74c3c', '#9b59b6', '#3498db', '#2ecc71'
  ];

  return transactions.map((tx, index) => ({
    label: tx.title,
    value: tx.amount,
    color: colors[index % colors.length],
    type: tx.type
  }));
}

function drawPieChart(ctx, data, centerX, centerY, radius) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (total === 0) return;

  let currentAngle = -Math.PI / 2;

  data.forEach(item => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = item.color;
    ctx.fill();

    ctx.strokeStyle = '#0E1420';
    ctx.lineWidth = 2;
    ctx.stroke();

    const percentage = ((item.value / total) * 100).toFixed(0);
    if (percentage > 5) {
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#E8EDF5';
      ctx.font = 'bold 12px DM Sans';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(percentage + '%', labelX, labelY);
    }

    currentAngle += sliceAngle;
  });
}

let pendingDeleteId = null;

function deletarTransacaoById(id) {
  const tx = allTransactions.find(t => t.id === id);
  if (!tx) return;
  pendingDeleteId = id;
  const text = document.getElementById('deleteConfirmText');
  if (text) text.textContent = `Tem certeza que deseja deletar "${tx.title}"? Esta acao nao pode ser desfeita.`;
  document.getElementById('deleteConfirmModal')?.classList.add('open');
}

function closeDeleteConfirm() {
  const modal = document.getElementById('deleteConfirmModal');
  const box = modal?.querySelector('.txn-modal-box');
  if (box) {
    box.classList.add('closing');
    setTimeout(() => {
      box.classList.remove('closing');
      modal?.classList.remove('open');
    }, 180);
    return;
  }
  modal?.classList.remove('open');
  pendingDeleteId = null;
}

async function confirmDelete() {
  if (pendingDeleteId == null) return;
  const id = pendingDeleteId;
  closeDeleteConfirm();
  try {
    await deleteTransactionAPI(id);
    await loadTransactions();
    updateSummaryCards();
    renderRecentTransactions();
    updateMainChart();
    updateAllTransactions();
    updateReports();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    alert(`Erro ao deletar transacao: ${error.message}`);
  }
}

function editarTransacao(event) {
  if (event) event.stopPropagation();
  if (!selectedTransaction) return;

  const id = selectedTransaction.id;
  closeTransactionActions();
  openTxFormEdit(id);
}

function deletarTransacao(event) {
  if (event) event.stopPropagation();
  if (!selectedTransaction) return;

  const id = selectedTransaction.id;
  closeTransactionActions();
  deletarTransacaoById(id);
}

function voltarDashboard() {
  window.location.href = '/frontend/index.html';
}

function voltar() {
    const token = localStorage.getItem("auth_token");

    if (token) {
        window.location.href = "index.html#dashboard-view";
    } else {
        window.location.href = "index.html#auth-view";
    }
}

function openReportsFromCard() {
  openReports();
}


function formatDate(dateString) {
  const date = new Date(dateString);
  return formatDateBR(date);
}


let catFormType = 'expense';

function criarCategoria() {
  catFormType = 'expense';
  const nameEl = document.getElementById('catFormName');
  const descEl = document.getElementById('catFormDescription');
  const statusEl = document.getElementById('catFormStatus');
  if (nameEl) nameEl.value = '';
  if (descEl) descEl.value = '';
  if (statusEl) { statusEl.textContent = ''; statusEl.style.display = 'none'; }
  catSelectType('expense');
  document.getElementById('catFormOverlay')?.classList.add('open');
}

function closeCatForm() {
  const overlay = document.getElementById('catFormOverlay');
  const box = overlay?.querySelector('.cat-modal-box');
  if (box) {
    box.classList.add('closing');
    setTimeout(() => {
      box.classList.remove('closing');
      overlay?.classList.remove('open');
    }, 180);
    return;
  }
  overlay?.classList.remove('open');
}

function closeCatFormOverlay(e) {
  if (e.target.id === 'catFormOverlay') closeCatForm();
}

function catSelectType(type) {
  catFormType = type;
  document.getElementById('catTypeIncome')?.classList.toggle('active', type === 'income');
  document.getElementById('catTypeExpense')?.classList.toggle('active', type === 'expense');
}

function showCatStatus(message, type = 'info') {
  const status = document.getElementById('catFormStatus');
  if (!status) return;
  status.textContent = message;
  status.style.display = 'block';
  status.style.color = type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--accent)';
}

async function catFormSubmit() {
  const name = document.getElementById('catFormName').value.trim();
  const description = document.getElementById('catFormDescription').value.trim();

  if (!name) {
    showCatStatus('Informe um nome.', 'error');
    return;
  }

  const btn = document.querySelector('#catFormOverlay .cat-btn-submit');
  const lbl = document.getElementById('catFormBtnLbl');
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = 'Salvando...';

  try {
    await apiRequest('/category/create', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: description || null,
        type: catFormType,
      }),
    });
    showCatStatus('Categoria criada com sucesso!', 'success');
    setTimeout(async () => {
      closeCatForm();
      await loadCategories();
    }, 500);
  } catch (error) {
    console.error('Error creating category:', error);
    showCatStatus(`Erro: ${error.message}`, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = 'Criar';
  }
}

function irCategorias() {
  window.location.href = 'categories.html';
}
