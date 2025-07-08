const API_BASE_URL = 'http://localhost:8080/api/transactions';
const RECURRING_API_BASE_URL = 'http://localhost:8080/api/recurringTransactions';

<<<<<<< HEAD
=======
const token = sessionStorage.getItem('authToken');

>>>>>>> origin/update_profile
// Fallback functions if helper files are not loaded
if (typeof apiRequest === 'undefined') {
  window.apiRequest = async (url, options = {}) => {
    try {
<<<<<<< HEAD
      const token = localStorage.getItem('authToken');
=======
      const token = sessionStorage.getItem('authToken');
>>>>>>> origin/update_profile
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };
      
      const response = await fetch(url, { ...defaultOptions, ...options });
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      return null;
    }
  };
}

if (typeof getCurrentUser === 'undefined') {
  window.getCurrentUser = () => {
    try {
<<<<<<< HEAD
      const user = localStorage.getItem('currentUser');
=======
      const user = sessionStorage.getItem('currentUser');
>>>>>>> origin/update_profile
      return user ? JSON.parse(user) : { userId: 1 }; // fallback user
    } catch (error) {
      console.error('Error getting current user:', error);
      return { userId: 1 };
    }
  };
}

if (typeof loadSideBarSimple === 'undefined') {
  window.loadSideBarSimple = () => {
    console.log('Sidebar loading function not available');
  };
}

if (typeof loadHeaderSimple === 'undefined') {
  window.loadHeaderSimple = () => {
    console.log('Header loading function not available');
  };
}

const state = {
  choicesInstances: new Map(),
  currentWallet: null,
  editingTransactionId: null,
  currentPage: 0,
  totalPages: 0,
  categories: null,
  lastCategorySelectId: null,
  currentTransaction: null,
  currentTab: 'transactions',
};

const DOM = {
  balanceAmount: document.getElementById('balanceAmount'),
  balanceCurrency: document.getElementById('balanceCurrency'),
  walletLoading: document.getElementById('walletLoading'),
  walletBalance: document.getElementById('walletBalance'),
  walletError: document.getElementById('walletError'),
  walletModal: document.getElementById('walletModal'),
  walletForm: document.getElementById('walletForm'),
  newBalanceInput: document.getElementById('newBalance'),
  currencySelect: document.getElementById('currency'),
  currentBalanceDisplay: document.getElementById('currentBalanceDisplay'),
  editWalletBtn: document.getElementById('editWalletBtn'),
  closeWalletModalBtn: document.getElementById('closeWalletModalBtn'),
  cancelWalletBtn: document.getElementById('cancelWalletBtn'),
  updateWalletBtn: document.getElementById('updateWalletBtn'),
  createCategoryModal: document.getElementById('createCategoryModal'),
  createCategoryForm: document.getElementById('createCategoryForm'),
  closeCreateCategoryModalBtn: document.getElementById('closeCreateCategoryModalBtn'),
  cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
  submitCategoryBtn: document.getElementById('submitCategoryBtn'),
  transactionModal: document.getElementById('transactionModal'),
  transactionForm: document.getElementById('transactionForm'),
  modalTitle: document.getElementById('modalTitle'),
  createBtn: document.getElementById('createBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  submitBtn: document.getElementById('submitBtn'),
  searchModal: document.getElementById('searchModal'),
  searchForm: document.getElementById('searchForm'),
  searchBtn: document.getElementById('searchBtn'),
  closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
  cancelSearchBtn: document.getElementById('cancelSearchBtn'),
  submitSearchBtn: document.getElementById('submitSearchBtn'),
  transactionTableBody: document.getElementById('transactionTableBody'),
  paginationDiv: document.getElementById('paginationDiv'),
  pageNumbers: document.getElementById('pageNumbers'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  recurringBtn: document.getElementById('recurringBtn'),
  transactionsContent: document.getElementById('transactions-content'),
  logoutBtn: document.getElementById('logoutBtn'),
};

const iconOptions = [
  { src: ' /assets/images/bank-coin.svg', name: 'Bank Coin' },
  { src: ' /assets/images/bank-fee.svg', name: 'Bank Fee' },
  { src: ' /assets/images/car.svg', name: 'Car' },
  { src: ' /assets/images/card.svg', name: 'Card' },
  { src: ' /assets/images/coffee.svg', name: 'Coffee' },
  { src: ' /assets/images/cost.svg', name: 'Cost' },
  { src: ' /assets/images/electric-bill.svg', name: 'Electric Bill' },
  { src: ' /assets/images/entertainment.svg', name: 'Entertainment' },
  { src: ' /assets/images/financial-management.svg', name: 'Financial' },
  { src: ' /assets/images/food.svg', name: 'Food' },
  { src: ' /assets/images/game.svg', name: 'Game' },
  { src: ' /assets/images/relax.svg', name: 'Relax' },
  { src: ' /assets/images/shopping.svg', name: 'Shopping' },
  { src: ' /assets/images/television.svg', name: 'TV' },
  { src: ' /assets/images/travel.svg', name: 'Travel' },
  { src: ' /assets/images/water-fee.svg', name: 'Water Bill' },
  { src: ' /assets/images/world.svg', name: 'World' },
  { src: ' /assets/images/more.svg', name: 'More' },
];

const iconMapping = iconOptions.reduce((map, icon) => {
  const key = icon.src.split('/').pop().replace('.svg', '');
  map[key] = icon.src;
  return map;
}, {});

const createIconGrid = () => {
  const iconGrid = document.getElementById('iconGrid');
  if (!iconGrid) return;
  iconGrid.innerHTML = '';
  iconOptions.forEach((icon) => {
    const iconButton = document.createElement('button');
    iconButton.type = 'button';
    iconButton.className = 'icon-option flex flex-col items-center p-2 border-2 border-transparent rounded-lg bg-white hover:border-purple-300 hover:bg-purple-50 transition';
    iconButton.dataset.icon = icon.src.split('/').pop().replace('.svg', '');
    iconButton.title = icon.name;
    iconButton.innerHTML = `
            <img src="${icon.src}" alt="${icon.name}" class="w-6 h-6 mb-1">
            <span class="text-xs text-gray-500">${icon.name}</span>
        `;
    iconButton.addEventListener('click', () => {
      document.querySelectorAll('.icon-option').forEach((btn) => btn.classList.remove('border-purple-500', 'bg-purple-100'));
      iconButton.classList.add('border-purple-500', 'bg-purple-100');
      document.getElementById('categoryIcon').value = iconButton.dataset.icon;
    });
    iconGrid.appendChild(iconButton);
  });
};

const getIconSymbol = (iconName) => {
  if (!iconName) return '📁';
  const iconPath = iconMapping[iconName];
  if (iconPath) {
    return `<img src="${iconPath}" alt="${iconName}" class="category-icon-small">`;
  }
  return '📁';
};

const formatLabel = (iconName, categoryName) => {
  const iconPath = iconMapping[iconName];
  if (iconPath) {
    return `<img src="${iconPath}" class="category-icon-small w-4 h-4 mr-1.5">${categoryName}`;
  }
  return `📁 ${categoryName}`;
};

const formatAmount = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

const showElement = (element) => element.classList.remove('hidden');
const hideElement = (element) => element.classList.add('hidden');
const showSuccess = (message) => alert(message);
const showError = (message) => alert(message);
const showLoading = () => {
  const loadingDiv = state.currentTab === 'transactions' ? document.getElementById('loadingDiv') : document.getElementById('recurringLoading');
  showElement(loadingDiv);
  const tableBody = state.currentTab === 'transactions' ? DOM.transactionTableBody : DOM.recurringTableBody;
  tableBody.innerHTML = '';
  const paginationDiv = state.currentTab === 'transactions' ? DOM.paginationDiv : DOM.recurringPaginationDiv;
  hideElement(paginationDiv);
};
const hideLoading = () => {
  const loadingDiv = state.currentTab === 'transactions' ? document.getElementById('loadingDiv') : document.getElementById('recurringLoading');
  hideElement(loadingDiv);
};
const showModal = (modal) => modal.classList.remove('hidden');
const hideModal = (modal) => modal.classList.add('hidden');
const resetForm = (form, options = {}) => {
  const { resetChoices = true, defaultValues = {}, callback } = options;
  form.reset();
  Object.entries(defaultValues).forEach(([id, value]) => {
    const element = form.querySelector(`#${id}`);
    if (element) element.value = value;
  });
  form.querySelectorAll('.error-message').forEach((span) => (span.textContent = ''));
  if (resetChoices) {
    const select = form.querySelector('.categorySelect');
    if (select) {
      const choices = state.choicesInstances.get(select.id || select.name);
      if (choices) choices.setChoiceByValue('');
    }
  }
  if (callback) callback(form);
};

const validateTransactionForm = () => {
  let isValid = true;
  const fields = {
    amount: document.getElementById('amount'),
    transactionDate: document.getElementById('transactionDate'),
    categorySelect: document.getElementById('category-edit'),
    recurringPattern: document.getElementById('recurringPattern'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
  };

  document.querySelectorAll('.error-message').forEach((span) => (span.textContent = ''));

  if (!fields.amount.value || isNaN(parseFloat(fields.amount.value)) || parseFloat(fields.amount.value) <= 0) {
    document.getElementById('amountError').textContent = 'Số tiền phải là số và lớn hơn 0';
    isValid = false;
  }

  if (!state.editingTransactionId && !fields.recurringPattern.value && !fields.transactionDate.value) {
    document.getElementById('transactionDateError').textContent = 'Vui lòng chọn ngày giao dịch';
    isValid = false;
  }

  if (!fields.categorySelect.value) {
    document.getElementById('categoryEditError').textContent = 'Vui lòng chọn danh mục';
    isValid = false;
  }

  if (!state.editingTransactionId && fields.recurringPattern.value) {
    const today = new Date().toISOString().split('T')[0];
    if (!fields.startDate.value) {
      document.getElementById('startDateError').textContent = 'Vui lòng chọn ngày bắt đầu';
      isValid = false;
    } else if (fields.startDate.value < today) {
      document.getElementById('startDateError').textContent = 'Ngày bắt đầu phải từ hôm nay trở đi';
      isValid = false;
    }
    if (!fields.endDate.value) {
      document.getElementById('endDateError').textContent = 'Vui lòng chọn ngày kết thúc';
      isValid = false;
    }
    if (fields.endDate.value && fields.startDate.value && new Date(fields.endDate.value) < new Date(fields.startDate.value)) {
      document.getElementById('endDateError').textContent = 'Ngày kết thúc phải sau ngày bắt đầu';
      isValid = false;
    }
  }

  return isValid;
};

const validateWalletForm = () => {
  if (
    !DOM.newBalanceInput.value ||
    isNaN(parseFloat(DOM.newBalanceInput.value)) ||
    parseFloat(DOM.newBalanceInput.value) < 0
  ) {
    document.getElementById('newBalanceError').textContent = 'Số dư phải là số và không âm';
    return false;
  }
  if (!DOM.currencySelect.value) {
    showError('Vui lòng chọn loại tiền tệ');
    return false;
  }
  return true;
};

const validateCategoryForm = () => {
  const fields = {
    categoryName: document.getElementById('categoryName'),
    categoryType: document.getElementById('categoryType'),
    categoryIcon: document.getElementById('categoryIcon'),
  };
  if (!fields.categoryName.value.trim()) {
    showError('Tên danh mục không được để trống');
    return false;
  }
  if (!fields.categoryType.value) {
    showError('Vui lòng chọn loại danh mục');
    return false;
  }
  if (!fields.categoryIcon.value) {
    showError('Vui lòng chọn biểu tượng');
    return false;
  }
  return true;
};

const loadWalletBalance = async () => {
  if (!checkAuth()) return;
  const user = getCurrentUser();
  try {
    showElement(DOM.walletLoading);
    hideElement(DOM.walletBalance);
    hideElement(DOM.walletError);
    const response = await apiRequest(`http://localhost:8080/api/wallet?userId=${user.userId}`);
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      state.currentWallet = data.result;
      DOM.balanceAmount.textContent = formatAmount(state.currentWallet.balance);
      DOM.balanceCurrency.textContent = state.currentWallet.currency;
      DOM.currentBalanceDisplay.textContent =
        formatAmount(state.currentWallet.balance) + ' ' + state.currentWallet.currency;
      hideElement(DOM.walletLoading);
      showElement(DOM.walletBalance);
    } else {
      throw new Error(data.message || 'Failed to load wallet');
    }
  } catch (error) {
    console.error('Error loading wallet:', error);
    hideElement(DOM.walletLoading);
    showElement(DOM.walletError);
  }
};

const updateWalletBalance = async (newBalance, currency) => {
  if (!checkAuth()) return false;
  const user = getCurrentUser();
  try {
    const response = await apiRequest('http://localhost:8080/api/wallet', {
      method: 'PUT',
      body: JSON.stringify({
        userId: user.userId,
        balance: parseFloat(newBalance),
        currency,
      }),
    });
    if (!response) return false;
    const data = await response.json();
    if (data.code === 1000) {
      state.currentWallet = data.result;
      DOM.balanceAmount.textContent = formatAmount(data.result.balance);
      DOM.balanceCurrency.textContent = data.result.currency;
      DOM.currentBalanceDisplay.textContent =
        formatAmount(data.result.balance) + ' ' + data.result.currency;
      showSuccess('Cập nhật số dư ví thành công!');
      if (state.currentTab === 'transactions') {
        loadTransactions();
      }
      return true;
    } else {
      throw new Error(data.message || 'Không thể cập nhật số dư ví');
    }
  } catch (error) {
    console.error('Error updating wallet:', error);
    showError(error.message || 'Lỗi khi cập nhật wallet');
    return false;
  }
};

const loadTransactions = async (searchParams = {}) => {
  const user = getCurrentUser();
  showLoading();
  try {
    const params = new URLSearchParams({
      userId: user.userId,
      page: state.currentPage,
      size: 10,
      sortBy: 'transactionDate',
      sortDirection: 'DESC',
      ...searchParams,
    });
    const response = await apiRequest(`${API_BASE_URL}?${params}`);
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      renderTransactions(data.result.content || []);
      renderPagination(data.result.totalPages || 0, 'transactions');
      await loadWalletBalance();
      await updateStats();
    } else {
      showError(`Lỗi: ${data.message || 'Không thể tải giao dịch'}`);
      DOM.transactionTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center py-12 text-gray-500">Không có giao dịch nào</td></tr>';
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    showError('Lỗi khi tải danh sách giao dịch');
    DOM.transactionTableBody.innerHTML =
      '<tr><td colspan="5" class="text-center py-12 text-gray-500">Không có giao dịch nào</td></tr>';
  } finally {
    hideLoading();
  }
};


const createTransaction = async (formData) => {
  const user = getCurrentUser();
  try {
    let url = formData.recurringPattern ? RECURRING_API_BASE_URL : API_BASE_URL;
    let body;
    if (formData.recurringPattern) {
      body = {
        userId: user.userId,
        categoryId: formData.categoryId || null,
        userCategoryId: formData.userCategoryId || null,
        amount: parseFloat(formData.amount),
        note: formData.note || null,
        frequency: formData.recurringPattern,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: true,
      };
    } else {
      body = {
        userId: user.userId,
        categoryId: formData.categoryId || null,
        userCategoryId: formData.userCategoryId || null,
        amount: parseFloat(formData.amount),
        note: formData.note || null,
        transactionDate: formData.transactionDate,
        paymentMethod: formData.paymentMethod || null,
        location: formData.location || null,
      };
    }
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      showSuccess(formData.recurringPattern ? 'Tạo giao dịch định kỳ thành công!' : 'Tạo giao dịch thành công!');
      hideModal(DOM.transactionModal);
      resetForm(DOM.transactionForm);

      loadTransactions();
    } else {
      showError(`Lỗi: ${data.message || 'Không thể tạo giao dịch'}`);
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    showError('Lỗi khi tạo giao dịch');
  }
};

const updateTransaction = async (transactionId, formData) => {
  const user = getCurrentUser();
  try {
    const url = `${API_BASE_URL}/${transactionId}?userId=${user.userId}`;
    const body =
    {
      categoryId: formData.categoryId || null,
      userCategoryId: formData.userCategoryId || null,
      amount: parseFloat(formData.amount),
      note: formData.note || null,
      transactionDate: formData.transactionDate,
      paymentMethod: formData.paymentMethod || null,
      location: formData.location || null,
    };
    const response = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      showSuccess('Cập nhật giao dịch thành công!');
      hideModal(DOM.transactionModal);
      resetForm(DOM.transactionForm);
      loadTransactions();
      await loadWalletBalance();
    } else {
      throw new Error(data.message || 'Không thể cập nhật giao dịch');
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    showError(error.message || 'Lỗi khi cập nhật giao dịch');
  }
};

const deleteTransaction = async (transactionId) => {
  if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
  const user = getCurrentUser();
  try {
    const url = `${API_BASE_URL}/${transactionId}?userId=${user.userId}`;
    const response = await apiRequest(url, {
      method: 'DELETE',
    });
    if (!response) return;
    if (response.ok) {
      showSuccess('Xóa giao dịch thành công!');

      loadTransactions();

      await loadWalletBalance();
    } else {
      const data = await response.json();
      showError(`Lỗi: ${data.message || 'Không thể xóa giao dịch'}`);
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    showError('Lỗi khi xóa giao dịch');
  }
};

const searchTransactions = async () => {
  const user = getCurrentUser();
  const [type, id] = document.getElementById('category-search').value.split('-');
  const searchParams = {
    categoryId: type === 'system' ? id : null,
    userCategoryId: type === 'user' ? id : null,
    minAmount: document.getElementById('minAmount').value
      ? parseFloat(document.getElementById('minAmount').value)
      : null,
    maxAmount: document.getElementById('maxAmount').value
      ? parseFloat(document.getElementById('maxAmount').value)
      : null,
    startDate: document.getElementById('searchStartDate').value || null,
    endDate: document.getElementById('searchEndDate').value || null,
    paymentMethod: document.getElementById('paymentMethodSearch').value || null,
    location: document.getElementById('locationSearch').value || null,
    note: document.getElementById('noteSearch').value || null,
    isRecurring:
      document.getElementById('isRecurringSearch').value === ''
        ? null
        : document.getElementById('isRecurringSearch').value === 'true',
  };
  showLoading();
  try {
    const response = await apiRequest(`${API_BASE_URL}/search`, {
      method: 'POST',
      body: JSON.stringify({
        userId: user.userId,
        ...searchParams,
        page: state.currentPage,
        size: 10,
        sortBy: 'transactionDate',
        sortDirection: 'DESC',
      }),
    });
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      renderTransactions(data.result.content || []);
      renderPagination(data.result.totalPages || 0, 'transactions');
      hideModal(DOM.searchModal);
      resetForm(DOM.searchForm);
      await loadWalletBalance();
    } else {
      showError(`Lỗi: ${data.message || 'Không thể tìm kiếm giao dịch'}`);
      DOM.transactionTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center py-12 text-gray-500">Không có giao dịch nào</td></tr>';
    }
  } catch (error) {
    console.error('Error searching transactions:', error);
    showError('Lỗi khi tìm kiếm giao dịch');
    DOM.transactionTableBody.innerHTML =
      '<tr><td colspan="5" class="text-center py-12 text-gray-500">Không có giao dịch nào</td></tr>';
  } finally {
    hideLoading();
  }
};

const searchRecurringTransactions = async () => {
  const user = getCurrentUser();
  const [type, id] = document.getElementById('category-search').value.split('-');
  const searchParams = {
    categoryId: type === 'system' ? id : null,
    userCategoryId: type === 'user' ? id : null,
    minAmount: document.getElementById('minAmount').value
      ? parseFloat(document.getElementById('minAmount').value)
      : null,
    maxAmount: document.getElementById('maxAmount').value
      ? parseFloat(document.getElementById('maxAmount').value)
      : null,
    startDate: document.getElementById('searchStartDate').value || null,
    endDate: document.getElementById('searchEndDate').value || null,
    note: document.getElementById('noteSearch').value || null,
  };
  showLoading();
  try {
    const response = await apiRequest(`${RECURRING_API_BASE_URL}/search`, {
      method: 'POST',
      body: JSON.stringify({
        userId: user.userId,
        ...searchParams,
        page: state.currentPage,
        size: 10,
        sortBy: 'startDate',
        sortDirection: 'DESC',
      }),
    });
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      renderRecurringTransactions(data.result.content || []);
      renderPagination(data.result.totalPages || 0, 'recurring');
      hideModal(DOM.searchModal);
      resetForm(DOM.searchForm);
      await loadWalletBalance();
    } else {
      showError(`Lỗi: ${data.message || 'Không thể tìm kiếm giao dịch định kỳ'}`);
      DOM.recurringTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center py-12 text-gray-500">Không có giao dịch định kỳ nào</td></tr>';
    }
  } catch (error) {
    console.error('Error searching recurring transactions:', error);
    showError('Lỗi khi tìm kiếm giao dịch định kỳ');
    DOM.recurringTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center py-12 text-gray-500">Không có giao dịch định kỳ nào</td></tr>';
  } finally {
    hideLoading();
  }
};

const renderTransactions = (transactions) => {
  DOM.transactionTableBody.innerHTML = '';
  if (transactions.length === 0) {
    DOM.transactionTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-12 text-gray-500">Không có giao dịch nào</td></tr>';
    return;
  }
  transactions.forEach((transaction) => {
    if (!transaction.transactionId) {
      console.error('Missing transactionId for transaction:', transaction);
      return;
    }
    const transactionType = transaction.categoryId ? transaction.type || 'EXPENSE' : transaction.type || 'EXPENSE';
    const categoryIcon = transaction.icon;
    const categoryName = transaction.categoryName || transaction.userCategoryName;
    const iconHtml = categoryIcon ? getIconSymbol(categoryIcon) : '<i class="fas fa-question"></i>';
    const amountSign = transactionType === 'INCOME' ? '+' : '-';
    const amountClass = transactionType === 'INCOME' ? 'text-green-600' : 'text-red-600';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-green-50 transition';
    tr.innerHTML = `
            <td class="px-6 py-4">${formatDate(transaction.transactionDate)}</td>
            <td class="px-6 py-4">${iconHtml} ${categoryName}</td>
            <td class="px-6 py-4"><span class="${amountClass} font-semibold">${amountSign} ${formatAmount(transaction.amount)}</span></td>
            <td class="px-6 py-4"><div class="max-w-xs truncate" title="${transaction.note || ''}">${transaction.note || '-'}</div></td>
            <td class="px-6 py-4 text-right">
                <button class="action-btn text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition" data-id="${transaction.transactionId}" data-type="transaction">
                    <svg width="16" height="16" stroke="currentColor" fill="none" viewBox="0 0 16 16">
                        <path stroke-linecap="round" stroke-linejoin="2" stroke-width="2" d="M10.586 2.586l2.828 2.828m-1.414-2.828a1 1 0 011.414 1.414L4 12H2V8l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="action-btn text-red-600 hover:bg-red-100 p-2" data-id="${transaction.transactionId}" data-type="delete" data-action-type="transaction">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H3"></path>
                    </svg>
                </button>
            </td>
        `;
    DOM.transactionTableBody.appendChild(tr);
  });
};

const renderRecurringTransactions = (transactions) => {
  DOM.recurringTableBody.innerHTML = '';
  if (transactions.length === 0) {
    DOM.recurringTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-gray-500">Không có giao dịch định kỳ nào</td></tr>';
    return;
  }
  transactions.forEach((transaction) => {
    if (!transaction.id) {
      console.error('Missing id for recurring transaction:', transaction);
      return;
    }
    const transactionType = transaction.categoryId ? transaction.type || 'EXPENSE' : transaction.type || 'EXPENSE';
    const categoryIcon = transaction.categoryId;
    const categoryName = transaction.categoryName || transaction.userCategoryName;
    const iconHtml = categoryIcon ? getIconSymbol(categoryIcon) : '<i class="fas fa-question"></i>';
    const amountSign = transactionType === 'INCOME' ? '+' : '-';
    const amountClass = transactionType === 'INCOME' ? 'text-green-600' : 'text-red-600';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-green-50 transition';
    tr.innerHTML = `
            <td class="px-6 py-4">${formatDate(transaction.startDate)}</td>
            <td class="px-6 py-4">${formatDate(transaction.endDate)}</td>
            <td class="px-6 py-4">${iconHtml} ${categoryName}</td>
            <td class="px-6 py-4 text-left"><span class="${amountClass} font-semibold">${amountSign} ${formatAmount(transaction.amount)}</span></td>
            <td class="px-6 py-4">${transaction.frequency}</td>
            <td class="px-6 py-4 text-right">
                <button class="action-btn text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition" data-id="${transaction.id}" data-type="recurring">
                    <svg width="16" height="16" stroke="currentColor" fill="none" viewBox="0 0 16 16">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.586 2.586l2.828 2.828m-1.414-2.828a1 1 0 011.414 1.414L4 12H2v2l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="action-btn text-red-600 hover:bg-red-100 p-2 rounded-lg transition" data-id="${transaction.id}" data-type="delete" data-action-type="recurring">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H3"></path>
                    </svg>
                </button>
            </td>
        `;
    DOM.recurringTableBody.appendChild(tr);
  });
};

const renderPagination = (total, type) => {
  state.totalPages = total;
  const pageNumbers = type === 'transactions' ? DOM.pageNumbers : DOM.recurringPageNumbers;
  const paginationDiv = type === 'transactions' ? DOM.paginationDiv : DOM.recurringPaginationDiv;
  const prevBtn = type === 'transactions' ? DOM.prevBtn : DOM.recurringPrevBtn;
  const nextBtn = type === 'transactions' ? DOM.nextBtn : DOM.recurringNextBtn;
  pageNumbers.innerHTML = '';
  if (total <= 1) {
    hideElement(paginationDiv);
    return;
  }
  showElement(paginationDiv);
  prevBtn.disabled = state.currentPage === 0;
  nextBtn.disabled = state.currentPage === state.totalPages - 1;
  const maxPagesToShow = 5;
  let startPage = Math.max(0, state.currentPage - 2);
  let endPage = Math.min(state.totalPages, startPage + maxPagesToShow);
  if (endPage - startPage < maxPagesToShow) {
    startPage = Math.max(0, endPage - maxPagesToShow);
  }
  for (let i = startPage; i < endPage; i++) {
    const btn = document.createElement('button');
    btn.className = `px-4 py-3 rounded-lg font-semibold ${i === state.currentPage ? 'bg-green-600 text-white shadow-md' : 'bg-white border-2 border-gray-200 hover:bg-green-50 hover:border-green-600'}`;
    btn.textContent = i + 1;
    btn.addEventListener('click', () => {
      state.currentPage = i;
      if (type === 'transactions') {
        loadTransactions();
      } else {
        loadRecurringTransactions();
      }
    });
    pageNumbers.appendChild(btn);
  }
};

const loadCategories = async () => {
  if (state.categories) {
    updateCategorySelects();
    return;
  }
  if (!checkAuth()) return;
  const user = getCurrentUser();
  try {
    const [systemRes, userRes] = await Promise.all([
      apiRequest('http://localhost:8080/api/categories'),
      apiRequest(`http://localhost:8080/api/userCategories/${user.userId}`),
    ]);
    if (!systemRes || !userRes) return;
    const systemData = await systemRes.json();
    const userData = await userRes.json();
    state.categories = {
      system: systemData.result || [],
      user: userData.result || [],
    };
    updateCategorySelects();
  } catch (error) {
    console.error('Error loading categories:', error);
    document.querySelectorAll('.categorySelect').forEach((select) => {
      select.innerHTML = '<option value="">Error loading categories</option>';
    });
  }
};

const updateCategorySelects = () => {
  const allChoices = [
    { label: 'Danh mục - Thu nhập', id: 'income', disabled: true },
    ...[...state.categories.system, ...state.categories.user]
      .filter((cat) => cat.type === 'INCOME')
      .map((cat) => ({
        value: cat.isSystem ? `system-${cat.categoryId}` : `user-${cat.categoryId}`,
        label: formatLabel(cat.icon, cat.categoryName),
        customProperties: { type: 'income' },
      })),
    { label: 'Danh mục - Chi tiêu', id: 'expense', disabled: true },
    ...[...state.categories.system, ...state.categories.user]
      .filter((cat) => cat.type === 'EXPENSE')
      .map((cat) => ({
        value: cat.isSystem ? `system-${cat.categoryId}` : `user-${cat.categoryId}`,
        label: formatLabel(cat.icon, cat.categoryName),
        customProperties: { type: 'expense' },
      })),
    { value: 'create-new', label: '➕ Tạo danh mục mới' },
  ];
  document.querySelectorAll('.categorySelect').forEach((select) => {
    const selectKey = select.id || select.name || Math.random().toString();
    let choices = state.choicesInstances.get(selectKey);
    if (!choices) {
      choices = new Choices(select, {
        allowHTML: true,
        searchEnabled: true,
        itemSelectText: '',
        shouldSort: false,
      });
      state.choicesInstances.set(selectKey, choices);
    }
    choices.setChoices(allChoices, 'value', 'label', true);
    choices.containerOuter.element.addEventListener('change', (e) => {
      if (e.target.value === 'create-new') {
        openCreateCategoryModal(selectKey);
      }
    });
  });
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
const debouncedLoadCategories = debounce(loadCategories, 300);

const openCreateCategoryModal = (triggerSelectId) => {
  state.lastCategorySelectId = triggerSelectId;
  resetForm(DOM.createCategoryForm);
  document.getElementById('categoryIcon').value = '';
  document.querySelectorAll('.icon-option').forEach((btn) => btn.classList.remove('border-blue-500', 'bg-blue-100'));
  createIconGrid();
  showModal(DOM.createCategoryModal);
};

const closeCreateCategoryModal = () => {
  hideModal(DOM.createCategoryModal);
  resetForm(DOM.createCategoryForm);
  if (state.lastCategorySelectId) {
    const select = document.getElementById(state.lastCategorySelectId);
    if (select) {
      const choices = state.choicesInstances.get(state.lastCategorySelectId);
      if (choices) choices.setChoiceByValue('');
    }
    state.lastCategorySelectId = null;
  }
};

const createUserCategory = async (formData) => {
  const user = getCurrentUser();
  try {
    const response = await apiRequest('http://localhost:8080/api/userCategories', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.userId,
        userCategoryName: formData.userCategoryName,
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
      }),
    });
    if (!response) return;
    const data = await response.json();
    if (data.code === 1000) {
      showSuccess('Tạo danh mục thành công!');
      state.categories = null;
      closeCreateCategoryModal();
      await debouncedLoadCategories();
      if (state.lastCategorySelectId) {
        const select = document.getElementById(state.lastCategorySelectId);
        if (select) {
          const choices = state.choicesInstances.get(state.lastCategorySelectId);
          if (choices) {
            const newCategoryId = `user-${data.result.categoryId}`;
            choices.setChoiceByValue(newCategoryId);
          }
        }
        state.lastCategorySelectId = null;
      }
    } else {
      showError(`Lỗi: ${data.message || 'Không thể tạo danh mục'}`);
    }
  } catch (error) {
    console.error('Error creating category:', error);
    showError('Lỗi khi tạo danh mục');
  }
};

const switchTab = (tab) => {
  state.currentTab = tab;
  state.currentPage = 0;
  if (tab === 'transactions') {
    showElement(DOM.transactionsContent);
    hideElement(DOM.recurringContent);
    document.getElementById('headerTitle').textContent = 'Transaction Management';
    loadTransactions();
  } else if (tab === 'recurring') {
    hideElement(DOM.transactionsContent);
    showElement(DOM.recurringContent);
    document.getElementById('headerTitle').textContent = 'Recurring Transactions';
    loadRecurringTransactions();
  }
};

const openTransactionModal = async (transaction = null) => {
  state.editingTransactionId = transaction ? transaction.id || transaction.transactionId : null;
  state.currentTransaction = transaction;
  DOM.modalTitle.textContent = transaction ? 'Edit Transaction' : 'Create New Transaction';
  const transactionDateField = document.getElementById('transactionDate');
  const recurringPatternDiv = DOM.transactionForm.querySelector('.recurring-fields');

  resetForm(DOM.transactionForm, { resetChoices: true });

  if (transaction) {
    const [type, id] = transaction.categoryId
      ? [`system-${transaction.categoryId}`, transaction.categoryId]
      : [`user-${transaction.userCategoryId}`, transaction.userCategoryId];
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('note').value = transaction.note || '';
    const choices = state.choicesInstances.get('category-edit');
    if (choices) choices.setChoiceByValue(type ? type : '');

    document.getElementById('transactionDate').value = transaction.transactionDate
      ? transaction.transactionDate.split('T')[0]
      : '';
    document.getElementById('paymentMethod').value = transaction.paymentMethod || '';
    document.getElementById('location').value = transaction.location || '';
    transactionDateField.disabled = false;

    // Hide recurring pattern when editing
    hideElement(recurringPatternDiv);
    document.getElementById('recurringPattern').value = '';
  } else {
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    // Show recurring pattern when creating new
    showElement(recurringPatternDiv);
    transactionDateField.disabled = false;
  }

  showModal(DOM.transactionModal);
  await loadCategories();
};

const initEventListeners = () => {
  console.log('Initializing event listeners...');
  
  // Wallet Modal
  if (DOM.editWalletBtn) {
    DOM.editWalletBtn.addEventListener('click', () => {
      showModal(DOM.walletModal);
      if (DOM.newBalanceInput) DOM.newBalanceInput.value = state.currentWallet ? state.currentWallet.balance : '';
      if (DOM.currencySelect) DOM.currencySelect.value = state.currentWallet ? state.currentWallet.currency : 'VND';
    });
  } else {
    console.error('editWalletBtn not found');
  }

  DOM.closeWalletModalBtn.addEventListener('click', () => hideModal(DOM.walletModal));
  DOM.cancelWalletBtn.addEventListener('click', () => hideModal(DOM.walletModal));
  DOM.walletForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateWalletForm()) return;
    const success = await updateWalletBalance(DOM.newBalanceInput.value, DOM.currencySelect.value);
    if (success) hideModal(DOM.walletModal);
  });

  // Transaction Modal
  if (DOM.createBtn) {
    DOM.createBtn.addEventListener('click', () => openTransactionModal());
  } else {
    console.error('createBtn not found');
  }
  
  if (DOM.closeModalBtn) {
    DOM.closeModalBtn.addEventListener('click', () => hideModal(DOM.transactionModal));
  }
  
  if (DOM.cancelBtn) {
    DOM.cancelBtn.addEventListener('click', () => hideModal(DOM.transactionModal));
  }
  DOM.transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateTransactionForm()) return;
    const [type, id] = document.getElementById('category-edit').value.split('-');
    const formData = {
      categoryId: type === 'system' ? id : null,
      userCategoryId: type === 'user' ? id : null,
      amount: document.getElementById('amount').value,
      transactionDate: document.getElementById('transactionDate').value,
      paymentMethod: document.getElementById('paymentMethod').value,
      location: document.getElementById('location').value,
      note: document.getElementById('note').value,
      recurringPattern: document.getElementById('recurringPattern').value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
    };
    if (state.editingTransactionId) {
      await updateTransaction(state.editingTransactionId, formData);
    } else {
      await createTransaction(formData);
    }
  });

  document.getElementById('recurringPattern').addEventListener('change', (e) => {
    const recurringDates = DOM.transactionForm.querySelector('.recurring-dates');
    const transactionDateField = document.getElementById('transactionDate');
    if (e.target.value) {
      showElement(recurringDates);
      transactionDateField.disabled = true;
    } else {
      hideElement(recurringDates);
      transactionDateField.disabled = false;
    }
  });

  // Search Modal
  if (DOM.searchBtn) {
    DOM.searchBtn.addEventListener('click', () => {
      showModal(DOM.searchModal);
      loadCategories();
    });
  } else {
    console.error('searchBtn not found');
  }
  DOM.closeSearchModalBtn.addEventListener('click', () => hideModal(DOM.searchModal));
  DOM.cancelSearchBtn.addEventListener('click', () => hideModal(DOM.searchModal));
  DOM.searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.currentTab === 'transactions') {
      await searchTransactions();
    } else {
      await searchRecurringTransactions();
    }
  });

  // Category Modal
  DOM.closeCreateCategoryModalBtn.addEventListener('click', () => closeCreateCategoryModal());
  DOM.cancelCategoryBtn.addEventListener('click', () => closeCreateCategoryModal());
  DOM.createCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateCategoryForm()) return;
    const formData = {
      userCategoryName: document.getElementById('categoryName').value,
      type: document.getElementById('categoryType').value,
      icon: document.getElementById('categoryIcon').value,
      color: document.getElementById('categoryColor').value,
    };
    await createUserCategory(formData);
  });

  // Table Actions
  DOM.transactionTableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    const type = btn.dataset.type;
    const actionType = btn.dataset.actionType;
    if (type === 'transaction') {
      const response = await apiRequest(`${API_BASE_URL}/${id}?userId=${getCurrentUser().userId}`);
      if (!response) return;
      const data = await response.json();
      if (data.code === 1000) {
        openTransactionModal(data.result, false);
      }
    } else if (type === 'delete' && actionType === 'transaction') {
      await deleteTransaction(id);
    }
  });


  // Pagination
  DOM.prevBtn.addEventListener('click', () => {
    if (state.currentPage > 0) {
      state.currentPage--;
      loadTransactions();
    }
  });
  DOM.nextBtn.addEventListener('click', () => {
    if (state.currentPage < state.totalPages - 1) {
      state.currentPage++;
      loadTransactions();
    }
  });


  // Logout
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener('click', async () => {
      await handleLogout();
    });
  }
};

const init = async () => {
  try {
    console.log('Initializing transaction page...');
    
    // Debug: Check if DOM elements exist
    console.log('DOM Elements check:');
    console.log('createBtn:', DOM.createBtn);
    console.log('searchBtn:', DOM.searchBtn);
    console.log('editWalletBtn:', DOM.editWalletBtn);
    console.log('transactionTableBody:', DOM.transactionTableBody);
    
    // Load sidebar and header first
    if (typeof loadSideBarSimple === 'function') {
      loadSideBarSimple();
    } else {
      console.error('loadSideBarSimple function not found');
    }
    
    if (typeof loadHeaderSimple === 'function') {
      loadHeaderSimple();
    } else {
      console.error('loadHeaderSimple function not found');
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Load wallet first
    await loadWalletBalance();
    
    // Load data
    await loadCategories();
    await loadTransactions();
    await updateStats();
    
    console.log('Transaction page initialized successfully');
  } catch (error) {
    console.error('Error initializing transaction page:', error);
  }
};

document.addEventListener('DOMContentLoaded', init);


const fetchStats = async () => {
  try {
    const user = getCurrentUser();
    const response = await apiRequest(`http://localhost:8080/api/transactions/stats?userId=${user.userId}`);
    if (!response) return { totalIncome: 0, totalSpending: 0, incomeExpenseRatio: 0 };
    const data = await response.json();
    const result = data.result || {};
    const totalIncome = result.totalIncome || 0;
    const totalSpending = result.totalExpense || 0;
    const incomeExpenseRatio = totalIncome > 0 ? (totalIncome / totalSpending) * 100 : totalSpending > 0 ? Infinity : 0;
    return { totalIncome, totalSpending, incomeExpenseRatio };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalIncome: 0, totalSpending: 0, incomeExpenseRatio: 0 };
  }
};

const updateStats = async () => {
  const stats = await fetchStats();
  const totalIncomeElement = document.getElementById('totalIncome');
  const totalSpendingElement = document.getElementById('totalSpending');
  const incomeExpenseRatioElement = document.getElementById('incomeExpenseRatio');
  if (totalIncomeElement) {
    totalIncomeElement.textContent = formatAmount(stats.totalIncome);
  }
  if (totalSpendingElement) {
    totalSpendingElement.textContent = formatAmount(stats.totalSpending);
  }
  if (incomeExpenseRatioElement) {
    incomeExpenseRatioElement.textContent = stats.incomeExpenseRatio === Infinity
      ? 'N/A'
      : `${stats.incomeExpenseRatio.toFixed(2)}%`;
    incomeExpenseRatioElement.style.color = stats.incomeExpenseRatio === Infinity || stats.incomeExpenseRatio < 100
      ? '#D32F2F'
      : '#4CAF50';
  }
};