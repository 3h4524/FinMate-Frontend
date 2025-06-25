// Import API service
import apiService from './services/api.js';

// DOM Elements
const transactionList = document.getElementById('transactionList');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionForm = document.getElementById('transactionForm');
const transactionModal = document.getElementById('transactionModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const totalBalanceElement = document.getElementById('totalBalance');
const incomeAmountElement = document.getElementById('incomeAmount');
const expenseAmountElement = document.getElementById('expenseAmount');
const mainContent = document.querySelector('.main-content');

// State
let transactions = [];
let editingTransactionId = null;


// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
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