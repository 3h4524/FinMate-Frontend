// API Configuration
const API_BASE_URL = 'http://localhost:8080/api/recurringTransactions';
let currentPage = 0;
let totalPages = 0;
let currentFilter = 'all';
let transactions = [];

// State for categories and Choices.js instances
const state = {
    categories: null,
    choicesInstances: new Map(),
    lastCategorySelectId: null
};

// Icon mapping
const iconMapping = {
    'bank-coin': '/assets/images/bank-coin.svg',
    'bank-fee': '/assets/images/bank-fee.svg',
    'car': '/assets/images/car.svg',
    'card': '/assets/images/card.svg',
    'coffee': '/assets/images/coffee.svg',
    'cost': '/assets/images/cost.svg',
    'electric-bill': '/assets/images/electric-bill.svg',
    'entertainment': '/assets/images/entertainment.svg',
    'financial-management': '/assets/images/financial-management.svg',
    'food': '/assets/images/food.svg',
    'game': '/assets/images/game.svg',
    'relax': '/assets/images/relax.svg',
    'shopping': '/assets/images/shopping.svg',
    'television': '/assets/images/television.svg',
    'travel': '/assets/images/travel.svg',
    'water-fee': '/assets/images/water-fee.svg',
    'world': '/assets/images/world.svg',
    'more': '/assets/images/more.svg'
};


const getTransactionIcon = (type) => {
    return type.toLowerCase() === 'income' ? 'income' : 'expense';
};

const getFrequencyText = (frequency) => {
    const frequencyMap = {
        'DAILY': 'Daily',
        'WEEKLY': 'Weekly',
        'MONTHLY': 'Monthly',
        'YEARLY': 'Yearly'
    };
    return frequencyMap[frequency] || 'Monthly';
};

const formatLabel = (iconName, categoryName) => {
    const iconPath = iconMapping[iconName];
    if (iconPath) {
        return `<img src="${iconPath}" class="category-icon-small" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px;">${categoryName}`;
    }
    return `📁 ${categoryName}`;
};

// API Functions
const fetchTransactions = async (page = 0, size = 4, sortBy = 'nextDate', sortDirection = 'DESC') => {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.error('User not found');
            return null;
        }
        const response = await apiRequest(
            `${API_BASE_URL}?userId=${user.userId}&page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
        );
        if (!response) return null;
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return null;
    }
};

const fetchTransactionById = async (recurringId) => {
    try {
        const user = getCurrentUser();
        const response = await apiRequest(`${API_BASE_URL}/${recurringId}?userId=${user.userId}`);
        if (!response) return null;
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return null;
    }
};

const createTransaction = async (transactionData) => {
    try {
        const user = getCurrentUser();
        transactionData.userId = user.userId;
        const response = await apiRequest(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        return response;
    } catch (error) {
        console.error('Error creating transaction:', error);
        throw error;
    }
};

const updateTransaction = async (recurringId, transactionData) => {
    try {
        const user = getCurrentUser();
        const response = await apiRequest(`${API_BASE_URL}/${recurringId}?userId=${user.userId}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
        return response;
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
};

const deleteTransactionRequest = async (recurringId) => {
    try {
        const user = getCurrentUser();
        const response = await apiRequest(`${API_BASE_URL}/${recurringId}?userId=${user.userId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
};

const fetchStats = async () => {
    try {
        const user = getCurrentUser();
        const response = await apiRequest(`http://localhost:8080/api/transactions/stats?userId=${user.userId}`);
        if (!response) return {totalIncome: 0, totalSpending: 0, incomeExpenseRatio: 0};
        const data = await response.json();
        const result = data.result || {};
        const totalIncome = result.totalIncome || 0;
        const totalSpending = result.totalExpense || 0;
        // Calculate Income/Expense ratio as percentage
        const incomeExpenseRatio = totalSpending > 0 ? (totalIncome / totalSpending) * 100 : totalIncome > 0 ? 100 : 0;
        return {totalIncome, totalSpending, incomeExpenseRatio};
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {totalIncome: 0, totalSpending: 0, incomeExpenseRatio: 0};
    }
};

const loadCategories = async () => {
    if (state.categories) {
        updateCategorySelects(state.categories);
        return;
    }
    const user = getCurrentUser();
    try {
        const [systemRes, userRes] = await Promise.all([
            apiRequest('http://localhost:8080/api/categories'),
            apiRequest(`http://localhost:8080/api/userCategories/${user.userId}`)
        ]);
        if (!systemRes || !userRes) return;
        const systemData = await systemRes.json();
        const userData = await userRes.json();
        state.categories = {
            system: systemData.result || [],
            user: userData.result || []
        };
        updateCategorySelects(state.categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        document.querySelectorAll('.categorySelect').forEach(select => {
            select.innerHTML = '<option value="">Error loading categories</option>';
        });
    }
};

const updateCategorySelects = (categories) => {
    const allChoices = [
        {label: 'Danh mục - Thu nhập', id: 'income', disabled: true},
        ...[...categories.system, ...categories.user]
            .filter(cat => cat.type === 'INCOME')
            .map(cat => ({
                value: cat.isSystem ? `system-${cat.categoryId}` : `user-${cat.categoryId}`,
                label: formatLabel(cat.icon, cat.categoryName),
                customProperties: {type: 'income'}
            })),
        {label: 'Danh mục - Chi tiêu', id: 'expense', disabled: true},
        ...[...categories.system, ...categories.user]
            .filter(cat => cat.type === 'EXPENSE')
            .map(cat => ({
                value: cat.isSystem ? `system-${cat.categoryId}` : `user-${cat.categoryId}`,
                label: formatLabel(cat.icon, cat.categoryName),
                customProperties: {type: 'expense'}
            })),
        {value: 'create-new', label: '➕ Tạo danh mục mới'}
    ];
    ['newCategory', 'updateCategory'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        let choices = state.choicesInstances.get(selectId);
        if (!choices) {
            choices = new Choices(select, {
                allowHTML: true,
                searchEnabled: true,
                itemSelectText: '',
                shouldSort: false
            });
            state.choicesInstances.set(selectId, choices);
        }
        choices.setChoices(allChoices, 'value', 'label', true);
    });
};

const createIconGrid = () => {
    const iconGrid = document.getElementById('iconGrid');
    if (!iconGrid) return;
    iconGrid.innerHTML = '';
    const iconOptions = Object.entries(iconMapping).map(([key, src]) => ({
        src,
        name: key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }));
    iconOptions.forEach(icon => {
        const iconButton = document.createElement('button');
        iconButton.type = 'button';
        iconButton.className = 'flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 icon-option';
        iconButton.dataset.icon = icon.src.split('/').pop().replace('.svg', '');
        iconButton.title = icon.name;
        iconButton.innerHTML = `
            <img src="${icon.src}" alt="${icon.name}" class="w-6 h-6 mb-1">
            <span class="text-xs text-gray-600 text-center">${icon.name}</span>
        `;
        iconButton.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(btn => {
                btn.classList.remove('border-indigo-500', 'bg-indigo-100');
                btn.classList.add('border-gray-200');
            });
            iconButton.classList.add('border-indigo-500', 'bg-indigo-100');
            iconButton.classList.remove('border-gray-200');
            document.getElementById('categoryIcon').value = iconButton.dataset.icon;
        });
        iconGrid.appendChild(iconButton);
    });
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
                color: formData.color
            })
        });
        if (!response) return;
        const data = await response.json();
        if (data.code === 1000) {
            state.categories = null; // Clear cache
            await loadCategories();
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
            return true;
        } else {
            throw new Error(data.message || 'Failed to create category');
        }
    } catch (error) {
        console.error('Error creating user category:', error);
        throw error;
    }
};

// Render Functions
const renderTransactions = (transactionsData) => {
    const container = document.getElementById('transactionsContainer');
    if (!transactionsData || !transactionsData.content || transactionsData.content.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-calendar-times text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No recurring transactions found</h3>
                <p class="text-gray-600">Start by creating your first recurring transaction</p>
                <button onclick="openNewTransactionModal()" class="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
                    <i class="fas fa-plus mr-2"></i>Create Transaction
                </button>
            </div>
        `;
        return;
    }
    transactions = transactionsData.content;
    totalPages = transactionsData.totalPages;
    const transactionsHTML = transactions.map(t => {
        const categoryName = t.categoryName || t.userCategoryName || 'No Category';
        const iconHtml = t.icon ? `<img src="${iconMapping[t.icon]}" class="w-4 h-4 inline-block mr-2">` : '<i class="fas fa-question mr-2"></i>';
        const isIncome = t.type.toLowerCase() === 'income';
        const bgColor = isIncome ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200';
        const iconBg = isIncome ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600';
        const statusColor = t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

        return `
            <div class="bg-gradient-to-br ${bgColor} border rounded-3xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105" data-type="${t.type.toLowerCase()}" data-active="${t.isActive}">
                <!-- Header -->
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-gradient-to-r ${iconBg} rounded-2xl flex items-center justify-center">
                        <i class="fas fa-${isIncome ? 'arrow-up' : 'arrow-down'} text-white text-lg"></i>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="openUpdateModal(${t.recurringId})" class="w-8 h-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-all duration-300">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="handleDeleteTransaction(${t.recurringId})" class="w-8 h-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-600 transition-all duration-300">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Category -->
                <div class="flex items-center mb-2">
                    ${iconHtml}
                    <span class="font-semibold text-gray-800">${categoryName}</span>
                </div>
                
                <!-- Note -->
                <div class="text-gray-600 text-sm mb-4">${t.note || 'No note'}</div>
                
                <!-- Amount -->
                <div class="mb-4">
                    <div class="text-2xl font-bold text-gray-900">${formatCurrency(t.amount)}</div>
                    <div class="text-sm text-gray-600">${getFrequencyText(t.frequency)}</div>
                </div>
                
                <!-- Dates -->
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-calendar w-4 mr-2"></i>
                        <span>Next: ${formatDate_ddMMyyyy(t.nextDate)}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-play w-4 mr-2"></i>
                        <span>Start: ${formatDate_ddMMyyyy(t.startDate)}</span>
                    </div>
                    ${t.endDate ? `
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-stop w-4 mr-2"></i>
                            <span>End: ${formatDate_ddMMyyyy(t.endDate)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Status -->
                <div class="flex items-center">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                        <i class="fas fa-circle text-xs mr-1"></i>
                        ${t.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    container.innerHTML = transactionsHTML;
    updatePagination();
};

const updateStats = async () => {
    const stats = await fetchStats();
    const totalIncomeElement = document.getElementById('totalIncome');
    const totalSpendingElement = document.getElementById('totalSpending');
    const incomeExpenseRatioElement = document.getElementById('incomeExpenseRatio');
    if (totalIncomeElement) {
        totalIncomeElement.textContent = formatCurrency(stats.totalIncome);
    }
    if (totalSpendingElement) {
        totalSpendingElement.textContent = formatCurrency(stats.totalSpending);
    }
    if (incomeExpenseRatioElement) {
        // Format ratio to 2 decimal places
        incomeExpenseRatioElement.textContent = `${stats.incomeExpenseRatio.toFixed(2)}%`;
        // Apply color based on ratio
        incomeExpenseRatioElement.style.color = stats.incomeExpenseRatio > 100 ? '#4CAF50' : '#D32F2F';
    }
};

const updatePagination = () => {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';

    // Update mobile buttons
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    nextBtn.onclick = () => changePage(currentPage + 1);

    // Update desktop pagination
    let pageNumbersHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    // Previous button for desktop
    if (currentPage > 0) {
        pageNumbersHTML += `
            <button onclick="changePage(${currentPage - 1})" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span class="sr-only">Previous</span>
                <i class="fas fa-chevron-left h-5 w-5"></i>
            </button>
        `;
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        pageNumbersHTML += `
            <button onclick="changePage(${i})" class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            isActive
                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
        }">
                ${i + 1}
            </button>
        `;
    }

    // Next button for desktop
    if (currentPage < totalPages - 1) {
        pageNumbersHTML += `
            <button onclick="changePage(${currentPage + 1})" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span class="sr-only">Next</span>
                <i class="fas fa-chevron-right h-5 w-5"></i>
            </button>
        `;
    }

    pageNumbers.innerHTML = pageNumbersHTML;
};

// Modal Functions
const openNewTransactionModal = async () => {
    const modal = document.getElementById('newTransactionModal');
    const form = document.getElementById('newTransactionForm');
    form.reset();
    const choices = state.choicesInstances.get('newCategory');
    if (choices) choices.setChoiceByValue('');
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('newStartDate').value = today;
    await loadCategories();
    modal.classList.remove('hidden');
};

const closeNewModal = () => {
    const modal = document.getElementById('newTransactionModal');
    const form = document.getElementById('newTransactionForm');
    modal.classList.add('hidden');
    form.reset();
    const choices = state.choicesInstances.get('newCategory');
    if (choices) choices.setChoiceByValue('');
};

const openUpdateModal = async (recurringId) => {
    const modal = document.getElementById('updateTransactionModal');
    const transactionData = await fetchTransactionById(recurringId);
    if (transactionData) {
        document.getElementById('updateRecurringId').value = transactionData.recurringId;
        document.getElementById('updateAmount').value = transactionData.amount;
        document.getElementById('updateNote').value = transactionData.note || '';
        document.getElementById('updateFrequency').value = transactionData.frequency;
        document.getElementById('updateStartDate').value = transactionData.startDate.split('T')[0];
        document.getElementById('updateEndDate').value = transactionData.endDate ? transactionData.endDate.split('T')[0] : '';
        document.getElementById('updateIsActive').value = transactionData.isActive.toString();
        const categoryValue = transactionData.categoryId
            ? `system-${transactionData.categoryId}`
            : transactionData.userCategoryId
                ? `user-${transactionData.userCategoryId}`
                : '';
        await loadCategories();
        const choices = state.choicesInstances.get('updateCategory');
        if (choices) choices.setChoiceByValue(categoryValue);
        modal.classList.remove('hidden');
    } else {
        alert('Failed to load transaction data');
    }
};

const closeUpdateModal = () => {
    const modal = document.getElementById('updateTransactionModal');
    const form = document.getElementById('updateTransactionForm');
    modal.classList.add('hidden');
    form.reset();
    const choices = state.choicesInstances.get('updateCategory');
    if (choices) choices.setChoiceByValue('');
};

const openCreateCategoryModal = (triggerSelectId) => {
    state.lastCategorySelectId = triggerSelectId;
    const form = document.getElementById('createCategoryForm');
    form.reset();
    document.getElementById('categoryIcon').value = '';
    document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
    createIconGrid();
    document.getElementById('createCategoryModal').classList.remove('hidden');
};

const closeCreateCategoryModal = () => {
    document.getElementById('createCategoryModal').classList.add('hidden');
    const form = document.getElementById('createCategoryForm');
    form.reset();
    if (state.lastCategorySelectId) {
        const select = document.getElementById(state.lastCategorySelectId);
        if (select) {
            const choices = state.choicesInstances.get(state.lastCategorySelectId);
            if (choices) choices.setChoiceByValue('');
        }
        state.lastCategorySelectId = null;
    }
};

// Event Handlers
const changePage = async (page) => {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    currentPage = page;
    await loadTransactions();
};

const filterTransactions = (filter) => {
    currentFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'text-indigo-600', 'bg-indigo-50');
        btn.classList.add('text-gray-600', 'bg-gray-50');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active', 'text-indigo-600', 'bg-indigo-50');
            btn.classList.remove('text-gray-600', 'bg-gray-50');
        }
    });
    const transactionCards = document.querySelectorAll('.transaction-card');
    transactionCards.forEach(card => {
        const type = card.dataset.type;
        const isActive = card.dataset.active === 'true';
        let show = false;
        switch (filter) {
            case 'all':
                show = true;
                break;
            case 'income':
                show = type === 'income';
                break;
            case 'expense':
                show = type === 'expense';
                break;
            case 'active':
                show = isActive;
                break;
        }
        card.style.display = show ? 'block' : 'none';
    });
};

const validateTransactionForm = (formId) => {
    const form = document.getElementById(formId);
    const amount = form.querySelector(`#${formId === 'newTransactionForm' ? 'newAmount' : 'updateAmount'}`).value;
    const category = form.querySelector(`#${formId === 'newTransactionForm' ? 'newCategory' : 'updateCategory'}`).value;
    const frequency = form.querySelector(`#${formId === 'newTransactionForm' ? 'newFrequency' : 'updateFrequency'}`).value;
    const startDate = form.querySelector(`#${formId === 'newTransactionForm' ? 'newStartDate' : 'updateStartDate'}`).value;
    const endDate = form.querySelector(`#${formId === 'newTransactionForm' ? 'newEndDate' : 'updateEndDate'}`).value;
    let isValid = true;
    if (!amount || parseFloat(amount) <= 0) {
        alert('Amount must be a positive number');
        isValid = false;
    }
    if (!category) {
        alert('Please select a category');
        isValid = false;
    }
    if (!frequency) {
        alert('Please select a frequency');
        isValid = false;
    }
    if (!startDate) {
        alert('Start date is required');
        isValid = false;
    } else {
        const today = new Date().toISOString().split('T')[0];
        if (new Date(startDate) < new Date(today)) {
            alert('Start date must be today or in the future');
            isValid = false;
        }
    }
    if (!endDate) {
        alert('End date is required');
        isValid = false;
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        alert('End date must be after start date');
        isValid = false;
    }
    return isValid;
};

const handleNewTransaction = async (e) => {
    e.preventDefault();
    if (!validateTransactionForm('newTransactionForm')) return;
    const categoryValue = document.getElementById('newCategory').value;
    let categoryId = null, userCategoryId = null;
    if (categoryValue) {
        const [type, id] = categoryValue.split('-');
        if (type === 'system') categoryId = parseInt(id);
        else if (type === 'user') userCategoryId = parseInt(id);
    }
    const transactionData = {
        userId: getCurrentUser().userId,
        categoryId,
        userCategoryId,
        amount: parseFloat(document.getElementById('newAmount').value),
        note: document.getElementById('newNote').value || null,
        frequency: document.getElementById('newFrequency').value,
        startDate: document.getElementById('newStartDate').value,
        endDate: document.getElementById('newEndDate').value,
    };
    try {
        const response = await createTransaction(transactionData);
        if (response && response.ok) {
            closeNewModal();
            await loadTransactions();
            alert('Transaction created successfully!');
        } else {
            const errorData = await response.json();
            alert(`Failed to create transaction: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert('Error creating transaction: ' + error.message);
    }
};

const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    if (!validateTransactionForm('updateTransactionForm')) return;
    const recurringId = document.getElementById('updateRecurringId').value;
    const categoryValue = document.getElementById('updateCategory').value;
    let categoryId = null, userCategoryId = null;
    if (categoryValue) {
        const [type, id] = categoryValue.split('-');
        if (type === 'system') categoryId = parseInt(id);
        else if (type === 'user') userCategoryId = parseInt(id);
    }
    const transactionData = {
        userId: getCurrentUser().userId,
        categoryId,
        userCategoryId,
        amount: parseFloat(document.getElementById('updateAmount').value),
        note: document.getElementById('updateNote').value || null,
        frequency: document.getElementById('updateFrequency').value,
        startDate: document.getElementById('updateStartDate').value,
        endDate: document.getElementById('updateEndDate').value,
        isActive: document.getElementById('updateIsActive').value === 'true'
    };
    try {
        const response = await updateTransaction(recurringId, transactionData);
        if (response && response.ok) {
            closeUpdateModal();
            await loadTransactions();
            alert('Transaction updated successfully!');
        } else {
            const errorData = await response.json();
            alert(`Failed to update transaction: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert('Error updating transaction: ' + error.message);
    }
};

const handleDeleteTransaction = async (recurringId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        const response = await deleteTransactionRequest(recurringId);
        if (response && response.ok) {
            await loadTransactions();
            alert('Transaction deleted successfully!');
        } else {
            alert('Failed to delete transaction');
        }
    } catch (error) {
        alert('Error deleting transaction');
    }
};

const searchTransactions = (query) => {
    const transactionCards = document.querySelectorAll('.transaction-card');
    transactionCards.forEach(card => {
        const categoryElement = card.querySelector('.transaction-type');
        const noteElement = card.querySelector('.transaction-name');
        const categoryText = categoryElement ? categoryElement.textContent.toLowerCase() : '';
        const noteText = noteElement ? noteElement.textContent.toLowerCase() : '';
        const matches = categoryText.includes(query.toLowerCase()) || noteText.includes(query.toLowerCase());
        card.style.display = matches ? 'block' : 'none';
    });
};

// Load Functions
const loadTransactions = async () => {
    const transactionsData = await fetchTransactions(currentPage);
    if (transactionsData) {
        renderTransactions(transactionsData);
        await updateStats();
    }
};

// Initialize Event Listeners
const initEventListeners = () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTransactions(e.target.value);
        });
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterTransactions(e.target.dataset.filter);
            });
        });
    }

    const newTransactionForm = document.getElementById('newTransactionForm');
    if (newTransactionForm) {
        newTransactionForm.addEventListener('submit', handleNewTransaction);
    }

    const updateTransactionForm = document.getElementById('updateTransactionForm');
    if (updateTransactionForm) {
        updateTransactionForm.addEventListener('submit', handleUpdateTransaction);
    }

    const createCategoryForm = document.getElementById('createCategoryForm');
    if (createCategoryForm) {
        createCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userCategoryName = document.getElementById('categoryName').value.trim();
            const type = document.getElementById('categoryType').value;
            const icon = document.getElementById('categoryIcon').value;
            const color = document.getElementById('categoryColor').value;
            if (!userCategoryName) {
                alert('Category name is required');
                return;
            }
            if (!type) {
                alert('Please select a category type');
                return;
            }
            if (!icon) {
                alert('Please select an icon');
                return;
            }
            const submitBtn = document.getElementById('submitCategoryBtn');
            submitBtn.textContent = '⏳ Saving...';
            submitBtn.disabled = true;
            try {
                const success = await createUserCategory({userCategoryName, type, icon, color});
                if (success) closeCreateCategoryModal();
            } catch (error) {
                alert('Error creating category: ' + error.message);
            } finally {
                submitBtn.textContent = 'Save Category';
                submitBtn.disabled = false;
            }
        });
    }

    const closeCreateCategoryModalBtn = document.getElementById('closeCreateCategoryModalBtn');
    if (closeCreateCategoryModalBtn) {
        closeCreateCategoryModalBtn.addEventListener('click', closeCreateCategoryModal);
    }

    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', closeCreateCategoryModal);
    }

    const createCategoryModal = document.getElementById('createCategoryModal');
    if (createCategoryModal) {
        createCategoryModal.addEventListener('click', (e) => {
            if (e.target === createCategoryModal) closeCreateCategoryModal();
        });
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('categorySelect') && e.target.value === 'create-new') {
            openCreateCategoryModal(e.target.id);
            const choices = state.choicesInstances.get(e.target.id);
            if (choices) choices.setChoiceByValue('');
        }
    });
};

// Initialize
const init = async () => {
    try {
        console.log('Initializing recurring transaction page...');

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

        // Load page data
        await loadCategories();
        await loadTransactions();

        console.log('Recurring transaction page initialized successfully');
    } catch (error) {
        console.error('Error initializing recurring transaction page:', error);
    }
};

document.addEventListener('DOMContentLoaded', init);

// Auto-refresh every 5 minutes
setInterval(loadTransactions, 5 * 60 * 1000);