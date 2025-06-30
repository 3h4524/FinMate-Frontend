// Home page JavaScript - Dashboard functionality only

// Load page components and initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializePageComponents();
    loadDashboardData();
    setupTransactionForm();
});

// Load header and sidebar components
async function initializePageComponents() {
    try {
        // Load header
        const headerResponse = await fetch('../header.html');
        const headerHtml = await headerResponse.text();
        document.getElementById('header-container').innerHTML = headerHtml;

        // Load sidebar using proper method from sidebar.js
        if (typeof loadSideBarSimple === 'function') {
            await loadSideBarSimple('Loading...');
        } else {
            console.error('loadSideBarSimple function not available');
        }

        // Initialize header immediately after loading
        if (typeof initHeader === 'function') {
            initHeader();
        }

        // Set active sidebar item for dashboard
        setTimeout(() => {
            setActiveSidebarItem('dashboard');
        }, 100);

        console.log('Page components initialized successfully');

    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Set active sidebar item
function setActiveSidebarItem(pageId) {
    const sidebarItems = document.querySelectorAll('.sidebar-item[data-page]');
    sidebarItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
}

// Dashboard Data Loading Functions
function loadDashboardData() {
    loadWalletData();
    loadRecentTransactions();
    loadCategoryBreakdown();
    updateDashboard();
}

async function loadWalletData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const response = await fetch('/api/wallets', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const wallets = await response.json();
            if (wallets.length > 0) {
                const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
                document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
            }
        }
    } catch (error) {
        console.error('Error loading wallet data:', error);
    }
}

async function loadRecentTransactions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const response = await fetch('/api/transactions?limit=3', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const transactions = await response.json();
            updateRecentTransactionsDisplay(transactions);
        }
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

function updateRecentTransactionsDisplay(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container || !transactions || transactions.length === 0) {
        return;
    }

    container.innerHTML = '';
    
    transactions.forEach(transaction => {
        const emoji = getCategoryEmoji(transaction.categoryId);
        const transactionElement = document.createElement('div');
        transactionElement.className = 'flex items-center space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-100';
        
        transactionElement.innerHTML = `
            <div class="w-12 h-12 lg:w-14 lg:h-14 bg-gray-100 rounded-full flex items-center justify-center text-lg lg:text-xl">
                ${emoji}
            </div>
            <div class="flex-1">
                <p class="font-semibold text-gray-800 text-base lg:text-lg">${transaction.description}</p>
                <p class="text-gray-500 text-sm lg:text-base">${transaction.categoryName || 'General'}</p>
                <p class="text-xs lg:text-sm text-gray-400">${formatDate(transaction.date)}</p>
            </div>
            <p class="font-bold text-lg lg:text-xl ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${transaction.amount >= 0 ? '+' : ''}${formatCurrency(transaction.amount)}
            </p>
        `;
        
        container.appendChild(transactionElement);
    });
}

function getCategoryEmoji(categoryId) {
    const emojiMap = {
        1: '🍽️', // Food & Dining
        2: '🛒', // Shopping
        3: '🚗', // Transportation
        4: '🏠', // Utilities
        5: '🎬', // Entertainment
        6: '💼', // Salary
        7: '💻', // Freelance
        8: '📈', // Investment
        default: '💰'
    };
    return emojiMap[categoryId] || emojiMap.default;
}

function loadCategoryBreakdown() {
    // This would load actual category spending data from API
    // For now using placeholder data
    console.log('Loading category breakdown...');
}

function updateDashboard() {
    // Update dashboard with real data
    calculateSummary();
    console.log('Dashboard updated');
}

function calculateSummary() {
    const totalIncomeElement = document.getElementById('totalIncome');
    const totalExpensesElement = document.getElementById('totalExpenses');
    const summarySavingsElement = document.getElementById('summarySavings');
    
    if (totalIncomeElement && totalExpensesElement && summarySavingsElement) {
        const income = parseFloat(totalIncomeElement.textContent.replace(/[^0-9.-]+/g,""));
        const expenses = parseFloat(totalExpensesElement.textContent.replace(/[^0-9.-]+/g,""));
        const savings = income - expenses;
        
        summarySavingsElement.textContent = formatCurrency(savings);
    }
}

// Transaction Modal Functions
function openAddIncomeModal() {
    document.getElementById('transactionType').value = 'income';
    document.getElementById('transactionModal').classList.remove('hidden');
}

function openAddExpenseModal() {
    document.getElementById('transactionType').value = 'expense';
    document.getElementById('transactionModal').classList.remove('hidden');
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.add('hidden');
    document.getElementById('transactionForm').reset();
}

function exportReport() {
    alert('Export functionality will be implemented soon!');
}

// Transaction Form Handling
function setupTransactionForm() {
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
}

async function handleTransactionSubmit(e) {
    e.preventDefault();

    const formData = {
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        categoryId: getCategoryIdByName(document.getElementById('transactionCategory').value),
        description: document.getElementById('transactionDescription').value,
        date: new Date().toISOString().split('T')[0]
    };

    // Adjust amount for expenses (make negative)
    if (formData.type === 'expense') {
        formData.amount = -Math.abs(formData.amount);
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            return;
        }

        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: formData.amount,
                categoryId: formData.categoryId,
                description: formData.description,
                date: formData.date
            })
        });

        if (response.ok) {
            closeTransactionModal();
            alert('Transaction added successfully!');
            loadDashboardData(); // Refresh dashboard
        } else {
            const error = await response.text();
            alert('Error adding transaction: ' + error);
        }
    } catch (error) {
        console.error('Error submitting transaction:', error);
        alert('Error adding transaction. Please try again.');
    }
}

function getCategoryIdByName(categoryName) {
    const categoryMap = {
        'food': 1,
        'shopping': 2,
        'transportation': 3,
        'utilities': 4,
        'entertainment': 5,
        'salary': 6,
        'freelance': 7,
        'investment': 8
    };
    return categoryMap[categoryName] || 1;
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show loading state
function showLoading(element) {
    element.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Initialize page
async function initializePage() {
    try {
        // Show loading state
        showLoading(dashboardGrid);
        showLoading(transactionList);


        // Show main content
        mainContent.style.display = 'flex';
        
        // Load data
        await Promise.all([
            loadDashboardData(),
            loadRecentTransactions()
        ]).catch(error => {
            console.error('Error loading data:', error);
            showError('Failed to load data. Please try again later.');
        });

        // Add event listeners
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                showTransactionModal();
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', hideTransactionModal);
        }

        if (transactionForm) {
            transactionForm.addEventListener('submit', handleTransactionSubmit);
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === transactionModal) {
                hideTransactionModal();
            }
        });

        // Update user info in sidebar
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            updateUserInfo(userData);
        }
    } catch (error) {
        console.error('Page initialization error:', error);
        showError('Failed to initialize page. Please try again later.');
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await apiService.getUserProfile();
        if (!response) {
            return;
        }
        updateDashboard(response);
    } catch (error) {
        console.error('Dashboard data error:', error);
        showError('Failed to load dashboard data. Please try again later.');
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update dashboard cards
    dashboardGrid.innerHTML = `
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3 class="dashboard-card-title">Total Balance</h3>
            </div>
            <div class="dashboard-card-value">${formatCurrency(data.totalBalance)}</div>
            <div class="dashboard-card-description">Your current balance</div>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3 class="dashboard-card-title">Monthly Income</h3>
            </div>
            <div class="dashboard-card-value">${formatCurrency(data.monthlyIncome)}</div>
            <div class="dashboard-card-description">Income this month</div>
        </div>
        <div class="dashboard-card">
            <div class="dashboard-card-header">
                <h3 class="dashboard-card-title">Monthly Expenses</h3>
            </div>
            <div class="dashboard-card-value">${formatCurrency(data.monthlyExpenses)}</div>
            <div class="dashboard-card-description">Expenses this month</div>
        </div>
    `;
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        const transactions = await apiService.getTransactions();
        if (!transactions) {
            return;
        }
        updateTransactionList(transactions);
    } catch (error) {
        console.error('Transactions error:', error);
        showError('Failed to load recent transactions. Please try again later.');
    }
}

// Update transaction list
function updateTransactionList(transactions) {
    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="no-transactions">
                <p>No recent transactions</p>
            </div>
        `;
        return;
    }

    transactionList.innerHTML = transactions.map(transaction => `
        <li class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon ${transaction.type.toLowerCase()}">
                    <i class="fas fa-${transaction.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type.toLowerCase()}">
                ${formatCurrency(transaction.amount)}
            </div>
        </li>
    `).join('');
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);

// Load transactions
async function loadTransactions() {
    try {
        transactions = await apiService.getTransactions();
        renderTransactions();
        updateBalanceSummary();
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    }
}

// Render transactions
function renderTransactions() {
    if (!transactionList) return;

    transactionList.innerHTML = transactions.map(transaction => `
        <div class="transaction-item" data-id="${transaction.id}">
            <div class="transaction-info">
                <div class="transaction-title">${transaction.title}</div>
                <div class="transaction-category">${transaction.category}</div>
            </div>
            <div class="transaction-amount ${transaction.type === 'INCOME' ? 'income' : 'expense'}">
                ${transaction.type === 'INCOME' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
            </div>
            <div class="transaction-actions">
                <button class="edit-btn" onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Update balance summary
function updateBalanceSummary() {
    if (!totalBalanceElement || !incomeAmountElement || !expenseAmountElement) return;

    const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpense;

    totalBalanceElement.textContent = `$${totalBalance.toFixed(2)}`;
    incomeAmountElement.textContent = `$${totalIncome.toFixed(2)}`;
    expenseAmountElement.textContent = `$${totalExpense.toFixed(2)}`;
}

// Show transaction modal
function showTransactionModal(transaction = null) {
    if (!transactionModal || !transactionForm) return;

    editingTransactionId = transaction ? transaction.id : null;

    // Reset form
    transactionForm.reset();

    // Fill form if editing
    if (transaction) {
        document.getElementById('transactionTitle').value = transaction.title;
        document.getElementById('transactionAmount').value = Math.abs(transaction.amount);
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionCategory').value = transaction.category;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionDescription').value = transaction.description || '';
    }

    transactionModal.style.display = 'block';
}

// Hide transaction modal
function hideTransactionModal() {
    if (!transactionModal) return;
    transactionModal.style.display = 'none';
    editingTransactionId = null;
}

// Handle transaction form submission
async function handleTransactionSubmit(e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('transactionTitle').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        type: document.getElementById('transactionType').value,
        category: document.getElementById('transactionCategory').value,
        date: document.getElementById('transactionDate').value,
        description: document.getElementById('transactionDescription').value
    };

    try {
        if (editingTransactionId) {
            await apiService.updateTransaction(editingTransactionId, formData);
            showNotification('Transaction updated successfully', 'success');
        } else {
            await apiService.createTransaction(formData);
            showNotification('Transaction added successfully', 'success');
        }

        hideTransactionModal();
        await loadTransactions();
    } catch (error) {
        console.error('Error saving transaction:', error);
        showNotification(error.message || 'Error saving transaction', 'error');
    }
}

// Edit transaction
async function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        showTransactionModal(transaction);
    }
}

// Delete transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await apiService.deleteTransaction(id);
        showNotification('Transaction deleted successfully', 'success');
        await loadTransactions();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showNotification(error.message || 'Error deleting transaction', 'error');
    }
}

// Notification functions
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    if (!notification || !messageElement) return;
    
    // Remove existing classes
    notification.classList.remove('success', 'error', 'info');
    // Add new type class
    notification.classList.add(type);
    
    messageElement.textContent = message;
    notification.classList.add('show');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
} 
