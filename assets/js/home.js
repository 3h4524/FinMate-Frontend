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

// Modal Event Handlers
document.addEventListener('click', function(e) {
    const modal = document.getElementById('transactionModal');
    if (e.target === modal) {
        closeTransactionModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('transactionModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeTransactionModal();
        }
    }
}); 