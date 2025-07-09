let transactions;
let goalProgress;
let user;

let filteredData;

const API_BASE_URL = 'http://localhost:8080';

// Initialize Chart.js
let chartInstance = null;
const ctx = document.getElementById('financialChart').getContext('2d');
let isChartVisible = true;
let currentChartType = 'bar';

let totalIncome = document.getElementById('totalIncome');
let totalExpense = document.getElementById('totalExpense');
let goalProgressPercentage = document.getElementById('goalProgressPercentage');

let noTransaction = document.getElementById('noTransaction');
let transactionIncludeTitle = document.getElementById('transactionIncludeTitle');

async function fetchGoalProgress() {
    console.log("fetching Goal Progress");
    try {
        const response = await apiRequest(`${API_BASE_URL}/goal_tracking/list`, {
            headers: {'userId': user.userId.toString()}
        });

        if (!response.ok) throw new Error("Failed to fetch Goal Progress");

        const data = await response.json();
        goalProgress = data.result.content;
    } catch (error) {
        console.log(error);
    }
}

async function fetchTransactions() {
    console.log("fetching Transactions");
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/transactions?userId=${user.userId}`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        const data = await response.json();
        transactions = data.result.content;
        console.log("fetch transactions", transactions);
    } catch (error) {
        console.log(error);
    }
}


function renderChart(type) {
    if (chartInstance) chartInstance.destroy();

    // Update canvas class for pie chart
    const canvas = document.getElementById('financialChart');
    canvas.classList.toggle('pie-chart', type === 'pie');

    const labels = filteredData.map(t => t.categoryName || t.userCategoryName);

    const backgroundColors = generateColors(labels.length)


    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Amount ($)',
            data: filteredData.map(t => t.amount),
            backgroundColor: type === 'pie' ? backgroundColors : '#6366F1',
            borderColor: '#6366F1',
            borderWidth: 1
        }]
    };

    chartInstance = new Chart(ctx, {
        type: type,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {position: 'top'},
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = type === 'pie' ? context.parsed : context.parsed.y;
                            return `$${value.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: type !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `$${value.toFixed(2)}`
                    }
                }
            } : {}
        }
    });
}

function updateTable() {
    const tableBody = document.getElementById('transactionTable');
    const viewMoreContainer = document.getElementById('viewMoreContainer');
    tableBody.innerHTML = '';
    if (filteredData.length === 0) {
        transactionIncludeTitle.classList.add('hidden');
        noTransaction.classList.remove('hidden');
        viewMoreContainer.classList.add('hidden');
    } else {
        noTransaction.classList.add('hidden');
        transactionIncludeTitle.classList.remove('hidden');
        viewMoreContainer.classList.remove('hidden');

        let filteredDataSortByDate = [...filteredData].sort((a, b) => {
            return new Date(b.transactionDate) - new Date(a.transactionDate);
        });

        filteredDataSortByDate.forEach((t, index) => {
            if (index < 5) {
                const row = document.createElement('tr');
                row.className = 'border-t text-sm text-gray-700';
                row.innerHTML = `
                    <td class="py-3">${index + 1}</td>
                    <td>${formatDate_ddMMyyyy(t.transactionDate)}</td>
                    <td>${t.categoryName ?? t.userCategoryName}</td>
                    <td>${t.type}</td>
                    <td>${formatCurrency(t.amount.toFixed(2))}</td>
                `;
                tableBody.appendChild(row);
            }
        });
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');

    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv.classList.contains('hidden')) {
        errorDiv.classList.add('hidden');
    }
}

function exportToCSV() {
    try {
        console.log("exportToCSV", filteredData);

        const csvContent = [
            ['Date', 'Category', 'Type', 'Amount'],
            ...filteredData.map(t => [t.transactionDate, t.categoryName || t.userCategoryName, t.type, formatCurrency(t.amount.toFixed(2))])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], {type: 'text/csv'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'financial_report.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        showError('Unable to export report. Please try again.');
    }
}

function toggleChart() {
    isChartVisible = !isChartVisible;
    const chartSection = document.getElementById('chartSection');
    const toggleBtn = document.getElementById('toggleChartBtn');
    chartSection.classList.toggle('hidden', !isChartVisible);
    toggleBtn.textContent = isChartVisible ? 'Hide Chart' : 'Show Chart';
}

function updateChartTypeButtons(selectedType) {
    const buttons = {
        line: document.getElementById('lineChartButton'),
        bar: document.getElementById('barChartButton'),
        pie: document.getElementById('pieChartButton')
    };
    Object.keys(buttons).forEach(type => {
        const button = buttons[type];
        if (type === selectedType) {
            button.classList.remove('text-gray-500', 'hover:text-blue-600', 'hover:bg-blue-50', 'bg-gray-100');
            button.classList.add('bg-indigo-600', 'text-white');
        } else {
            button.classList.remove('bg-indigo-600', 'text-white');
            button.classList.add('text-gray-500', 'hover:text-indigo-600', 'hover:bg-indigo-50', 'bg-gray-100');
        }
    });
}

function updateReport() {
    const timePeriod = document.getElementById('timePeriod').value;
    const filterType = document.getElementById('filterType').value;

    const today = new Date();
    let startDate, endDate;

    switch (timePeriod) {
        case 'day':
            startDate = new Date(today);
            endDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
    }

    // Filter data by date and type
    filteredData = transactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        const isWithinDateRange = transactionDate >= startDate && transactionDate <= endDate;
        const matchesType = filterType === 'all' || t.type.toLowerCase() === filterType;
        return isWithinDateRange && matchesType;
    });

    const totalIncomeResult = filteredData
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenseResult = filteredData
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

    totalIncome.textContent = formatCurrency(totalIncomeResult || 0);
    totalExpense.textContent = formatCurrency(totalExpenseResult || 0);

    try {
        if (isChartVisible) {
            renderChart(currentChartType);
        }
        updateTable();
    } catch (e) {
        showError('Visual representation unavailable. Displaying numerical data.');
        updateTable();
    }
}

// Event Listeners
document.getElementById('timePeriod').addEventListener('change', updateReport);
document.getElementById('filterType').addEventListener('change', updateReport);
document.getElementById('exportBtn').addEventListener('click', () => {
    exportToCSV(filteredData);
});
document.getElementById('toggleChartBtn').addEventListener('click', toggleChart);
document.getElementById('lineChartButton').addEventListener('click', () => {
    currentChartType = 'line';
    updateChartTypeButtons('line');
    updateReport();
});
document.getElementById('barChartButton').addEventListener('click', () => {
    currentChartType = 'bar';
    updateChartTypeButtons('bar');
    updateReport();
});
document.getElementById('pieChartButton').addEventListener('click', () => {
    currentChartType = 'pie';
    updateChartTypeButtons('pie');
    updateReport();
});

function initPercenGoalProgress() {
    const averageProgress = Math.round(goalProgress.reduce((sum, goal) => sum + goal.percentage, 0) / goalProgress.length);
    goalProgressPercentage.textContent = `${averageProgress || 0}%`;
}

async function initializeUI() {
    try {
        console.log('Initializing financial report page...');

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

        // Get user information
        user = getCurrentUser();
        console.log("Current user: ", user);

        // Fetch data and initialize UI
        await Promise.all([fetchTransactions(), fetchGoalProgress()]);
        initPercenGoalProgress();
        updateChartTypeButtons('bar');
        updateReport();

        console.log('Financial report page initialized successfully');
    } catch (err) {
        const error = 'Failed to initialize app: ' + err.message;
        console.error(error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM loaded, starting financial report page initialization...');

        // Check authentication
        if (typeof checkAuth !== 'undefined' && !checkAuth()) {
            console.log('Authentication check failed');
            return;
        }

        await initializeUI();
    } catch (error) {
        console.error('Error during financial report page initialization:', error);
    }
});

// Fallback for window load
window.addEventListener('load', async () => {
    try {
        // Only run if not already initialized
        if (!document.querySelector('#sidebar-container').hasChildNodes()) {
            console.log('Window loaded, initializing financial report page...');
            await initializeUI();
        }
    } catch (error) {
        console.error('Error during window load initialization:', error);
    }
});
