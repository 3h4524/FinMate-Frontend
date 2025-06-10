document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const dashboardGrid = document.getElementById('dashboardGrid');
    const transactionList = document.getElementById('transactionList');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // User Menu Toggle
    userMenuButton.addEventListener('click', function() {
        userMenuDropdown.classList.toggle('show');
    });

    // Close user menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
            userMenuDropdown.classList.remove('show');
        }
    });

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

    // Load dashboard data
    async function loadDashboardData() {
        try {
            const response = await fetch('http://localhost:8080/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load dashboard data');
            }

            const data = await response.json();
            updateDashboard(data);
        } catch (error) {
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
            const response = await fetch('http://localhost:8080/api/transactions/recent', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load transactions');
            }

            const transactions = await response.json();
            updateTransactionList(transactions);
        } catch (error) {
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
                        <span class="transaction-title">${transaction.description}</span>
                        <span class="transaction-date">${formatDate(transaction.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type.toLowerCase()}">
                    ${transaction.type === 'INCOME' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </li>
        `).join('');
    }

    // Logout function
    function logout() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }

    // Add logout event listener
    document.getElementById('logoutButton').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Check authentication
    function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Initialize
    checkAuth();
    loadDashboardData();
    loadRecentTransactions();
}); 