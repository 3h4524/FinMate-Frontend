// Import API service
import apiService from './services/api.js';

// DOM Elements
const userMenuButton = document.getElementById('userMenuButton');
const userMenuDropdown = document.getElementById('userMenuDropdown');
const dashboardGrid = document.getElementById('dashboardGrid');
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

// User Menu Toggle
if (userMenuButton) {
userMenuButton.addEventListener('click', function() {
    userMenuDropdown.classList.toggle('show');
});
}

// Close user menu when clicking outside
document.addEventListener('click', function(e) {
    if (userMenuButton && userMenuDropdown && !userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target)) {
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
    if (element) {
    element.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
    }
}

// Show error message
function showError(message) {
    if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    }
    if (successMessage) {
    successMessage.style.display = 'none';
    }
}

// Show success message
function showSuccess(message) {
    if (successMessage) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    }
    if (errorMessage) {
    errorMessage.style.display = 'none';
    }
}

// Check authentication - only returns true/false, no DOM manipulation or redirect
async function checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
            console.log('No token or user data found');
            return false;
        }

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok && data.code === 1000) {
            return true;
        } else {
            console.log('Token verification failed:', data.message || 'Unknown error');
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            return false;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        return false;
    }
}

// Call checkAuth and initialize page when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const mainContentElement = document.querySelector('.main-content');

    if (mainContentElement) mainContentElement.style.display = 'none';
    if (loadingSpinner) loadingSpinner.style.display = 'block';

    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        window.location.href = '/login.html';
        return;
    }

    await initializePage();

    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (mainContentElement) mainContentElement.style.display = 'flex';
});

// Initialize page
async function initializePage() {
    try {
        showLoading(dashboardGrid);
        showLoading(transactionList);

        await Promise.all([
            loadDashboardData(),
            loadRecentTransactions()
        ]).catch(error => {
            console.error('Error loading data:', error);
            showError('Failed to load data. Please try again later.');
        });

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

        window.addEventListener('click', (e) => {
            if (e.target === transactionModal) {
                hideTransactionModal();
            }
        });

        const userData = JSON.parse(localStorage.getItem('userData'));

        // Load profile sidebar (HTML structure) first to ensure it's in DOM
        let profileSidebarElement = null; // Declare a variable to hold the reference
        await fetch('profile-sidebar.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('profile-sidebar-container').innerHTML = html;
                profileSidebarElement = document.getElementById('profileSidebar'); // Get reference here

                // Attach event listener for the close button
                const closeProfileBtn = document.getElementById('closeProfileBtn');
                if (closeProfileBtn) {
                    closeProfileBtn.addEventListener('click', () => {
                        if (profileSidebarElement) {
                            profileSidebarElement.classList.remove('active');
                        }
                    });
                }
                // Initial update for profile sidebar (optional, loadAndDisplayUserProfile will do full update)
                const profileName = document.getElementById('fullName');
                const profileEmail = document.getElementById('email');
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileName && userData) profileName.value = userData.name || '';
                if (profileEmail && userData) profileEmail.value = userData.email || '';
                if (profileAvatar && userData) {
                    profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email.split('@')[0])}&background=388e3c&color=fff`;
                }
            });

        // Now load sidebar.html and attach event listener for view profile, using the already available profileSidebarElement
        fetch('sidebar.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('sidebar-container').innerHTML = html;
                const sidebarUserNameSpan = document.querySelector('.sidebar .user-info .user-name');
                if (sidebarUserNameSpan && userData) {
                    sidebarUserNameSpan.textContent = userData.name || userData.email.split('@')[0];
                }
                const sidebarAvatar = document.querySelector('.sidebar .user-info img');
                if (sidebarAvatar && userData) {
                    sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || userData.email.split('@')[0])}&background=388e3c&color=fff`;
                }

                // Attach event listener for the view profile button in sidebar.html
                const viewProfileBtn = document.getElementById('viewProfileBtn');
                if (viewProfileBtn) {
                    viewProfileBtn.addEventListener('click', () => {
                        if (profileSidebarElement) { // Use the stored reference
                            if (profileSidebarElement.classList.contains('active')) {
                                profileSidebarElement.classList.remove('active');
                            } else {
                                profileSidebarElement.classList.add('active');
                                // Load and display user profile from API when sidebar is opened
                                if (typeof loadAndDisplayUserProfile === 'function') {
                                    loadAndDisplayUserProfile();
                                } else {
                                    console.error("loadAndDisplayUserProfile function not found.");
                                }
                            }
                        } else {
                            console.error("Profile sidebar element not found after loading profile-sidebar.html");
                        }
                    });
                }
            });

        updateCurrentDate();

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

function updateDashboard(data) {
    if (totalBalanceElement) {
        totalBalanceElement.textContent = formatCurrency(data.balance || 0);
    }
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

function updateTransactionList(transactions) {
    if (transactionList) {
        transactionList.innerHTML = '';
    if (transactions.length === 0) {
            transactionList.innerHTML = '<p class="text-center text-gray-500">No recent transactions.</p>';
        return;
    }
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.classList.add('transaction-item');
            transactionItem.innerHTML = `
                <div class="transaction-icon">
                    <i class="fas fa-${transaction.type === 'income' ? 'plus-circle' : 'minus-circle'}"></i>
                </div>
                <div class="transaction-details">
                    <span class="transaction-category">${transaction.category}</span>
                    <span class="transaction-date">${formatDate(transaction.date)}</span>
                </div>
                <span class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}">
                    ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </span>
            `;
            transactionList.appendChild(transactionItem);
        });
    }
}

function logout() {
    apiService.logout();
}

// Update user info in sidebar (and header)
function updateUserInfo(userProfile) {
    const userNameElement = document.getElementById('userFullNameHeader');
    const sidebarUserNameElement = document.querySelector('.sidebar .user-info .user-name');
    const sidebarAvatarElement = document.querySelector('.sidebar .user-info img');
    
    const userName = userProfile.name || userProfile.email.split('@')[0];
    
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
    if (sidebarUserNameElement) {
        sidebarUserNameElement.textContent = userName;
    }
    if (sidebarAvatarElement) {
        sidebarAvatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=388e3c&color=fff`;
    }
}

// Function to handle fetching and rendering transactions (more general than just recent)
async function loadTransactions() {
    try {
        showLoading(transactionList);
        const transactionsData = await apiService.getTransactions();
        transactions = transactionsData;
        renderTransactions();
        updateBalanceSummary();
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Failed to load transactions.');
    }
}

function renderTransactions() {
    if (transactionList) {
        transactionList.innerHTML = '';
        if (transactions.length === 0) {
            transactionList.innerHTML = '<p class="text-center text-gray-500">No transactions to display.</p>';
            return;
        }
        transactions.forEach(transaction => {
            const transactionRow = document.createElement('tr');
            transactionRow.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">${formatCurrency(transaction.amount)}</td>
                <td>
                    <button onclick="editTransaction(${transaction.id})" class="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                    <button onclick="deleteTransaction(${transaction.id})" class="text-red-500 hover:text-red-700">Delete</button>
                </td>
            `;
            document.getElementById('transactionTableBody').appendChild(transactionRow);
        });
    }
}

function updateBalanceSummary() {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    if (totalBalanceElement) totalBalanceElement.textContent = formatCurrency(balance);
    if (incomeAmountElement) incomeAmountElement.textContent = formatCurrency(income);
    if (expenseAmountElement) expenseAmountElement.textContent = formatCurrency(expense);
}

function showTransactionModal(transaction = null) {
    if (transactionModal) transactionModal.classList.add('active');
    if (transactionForm) {
        if (transaction) {
            editingTransactionId = transaction.id;
            transactionForm.elements['description'].value = transaction.description;
            transactionForm.elements['amount'].value = transaction.amount;
            transactionForm.elements['type'].value = transaction.type;
            transactionForm.elements['category'].value = transaction.category;
            transactionForm.elements['date'].value = transaction.date;
        } else {
            editingTransactionId = null;
    transactionForm.reset();
            transactionForm.elements['date'].valueAsDate = new Date();
    }
    }
}

function hideTransactionModal() {
    if (transactionModal) transactionModal.classList.remove('active');
    editingTransactionId = null;
    if (transactionForm) transactionForm.reset();
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    showLoading(transactionForm);
    const transactionData = {
        description: transactionForm.elements['description'].value,
        amount: parseFloat(transactionForm.elements['amount'].value),
        type: transactionForm.elements['type'].value,
        category: transactionForm.elements['category'].value,
        date: transactionForm.elements['date'].value,
    };

    try {
        let result;
        if (editingTransactionId) {
            result = await apiService.updateTransaction(editingTransactionId, transactionData);
            showSuccess('Transaction updated successfully!');
        } else {
            result = await apiService.createTransaction(transactionData);
            showSuccess('Transaction added successfully!');
        }
        hideTransactionModal();
        await loadTransactions();
    } catch (error) {
        console.error('Transaction submission error:', error);
        showError(error.message || 'Failed to save transaction.');
    }
}

async function editTransaction(id) {
    const transactionToEdit = transactions.find(t => t.id === id);
    if (transactionToEdit) {
        showTransactionModal(transactionToEdit);
    }
}

async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
    try {
            showLoading(transactionList);
        await apiService.deleteTransaction(id);
            showSuccess('Transaction deleted successfully!');
        await loadTransactions();
    } catch (error) {
            console.error('Transaction deletion error:', error);
            showError(error.message || 'Failed to delete transaction.');
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
    }
}

async function loadAndDisplayUserProfile() {
    try {
        const response = await apiService.getUserProfile();
        if (!response) {
            console.error('Failed to load user profile');
            return;
        }

        const profileName = document.getElementById('fullName');
        const profileEmail = document.getElementById('email');
        const profileAvatar = document.getElementById('profileAvatar');
        
        if (profileName) profileName.value = response.name;
        if (profileEmail) profileEmail.value = response.email;
        if (profileAvatar) {
            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(response.name)}&background=388e3c&color=fff`;
        }
        const joinDateElement = document.getElementById('joinDate');
        if (joinDateElement && response.createdAt) {
            joinDateElement.value = formatDate(response.createdAt);
        }
        const phoneElement = document.getElementById('phone');
        if (phoneElement && response.phone) phoneElement.value = response.phone;

    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

function updateCurrentDate() {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const dateElement = document.querySelector('.header .date');
    if (dateElement) {
        dateElement.textContent = currentDate;
    }
} 