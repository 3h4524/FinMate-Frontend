let budgetChart = null;
let chartType = 'bar';
let user;
const pageSize = 1000;
const API_BASE_URL = 'http://localhost:8080';
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
let systemCategories = [];

// Constants
const CHART_TYPES = {
    BAR: 'bar',
    LINE: 'line',
    PIE: 'pie'
};

const PERIOD_TYPES = {
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY'
};

const STATUS_CLASSES = {
    SUCCESS: 'bg-green-100 text-green-600',
    WARNING: 'bg-yellow-100 text-yellow-600',
    ERROR: 'bg-red-100 text-red-600'
};

const PROGRESS_CLASSES = {
    SUCCESS: 'bg-gradient-to-r from-green-500 to-teal-600',
    WARNING: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    ERROR: 'bg-gradient-to-r from-red-500 to-pink-600'
};

// INITIALIZATION
async function initializeUI() {
    try {
        await fetchUser();
        if (!user?.userId) return;

        await Promise.all([
            loadSystemCategories(),
            loadUserCategories()
        ]);

        await Promise.all([
            loadBudgetOverview(),
            monitorBudgets(0),
            loadAnalysis(0)
        ]);

        setDefaultModalDates();
        addBudgetCategory();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Error', 'Failed to initialize application', 'error');
    }
}

async function fetchUser() {
    try {
        user = await getCurrentUser();
        if (!user?.userId) {
            throw new Error('User not authenticated');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        showNotification('Error', 'Please log in to continue.', 'error');
        window.location.href = '/';
    }
}

// MODAL MANAGEMENT
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const content = modal.querySelector('.modal-content');
    if (content) {
        setTimeout(() => content.classList.add('show'), 10);
    }

    if (modalId === 'createBudgetModal') {
        setDefaultModalDates();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const content = modal.querySelector('.modal-content');
    if (content) {
        content.classList.remove('show');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);

    resetModalForm(modalId);
}

function resetModalForm(modalId) {
    const modalConfig = {
        createBudgetModal: {
            formId: 'create-budget-form',
            listId: 'category-list',
            callback: addBudgetCategory
        },
        updateBudgetModal: {
            formId: 'update-budget-form',
            listId: 'update-category-list'
        }
    };

    const config = modalConfig[modalId];
    if (!config) return;

    const { formId, listId, callback } = config;
    const form = document.getElementById(formId);
    const list = document.getElementById(listId);

    if (form) form.reset();
    if (list) list.innerHTML = '';
    if (callback) callback();
}

// FORM HANDLING
async function submitBudgetForm(formId, budgetId = null) {
    const form = document.getElementById(formId);
    if (!form) return;

    const formData = new FormData(form);
    const data = {
        periodType: formData.get('periodType'),
        startDate: formData.get('startDate'),
        threshold: parseInt(formData.get('threshold')),
        categories: formData.getAll('categories[]').map((category, index) => ({
            category,
            amount: parseFloat(formData.getAll('amounts[]')[index])
        }))
    };

    if (!validateBudgetData(data)) return;
    if (!user?.userId) {
        showNotification('Error', 'User not authenticated. Please log in.', 'error');
        return;
    }

    try {
        await Promise.all(data.categories.map(cat => saveBudgetCategory(cat, data, budgetId)));
        showNotification('Success', `Budget plan ${budgetId ? 'updated' : 'created'} successfully!`, 'success');

    } catch (err) {
        if (err.message === 'You have reached the 3 budget limit for regular users.') PremiumModal.show(err.message);
        else
            showNotification("Error", err.message, 'error');
    } finally {
        form.reset();
        closeModal(budgetId ? 'updateBudgetModal' : 'createBudgetModal');
        document.getElementById('analysisPeriod').value = 'all';
        await loadBudgetOverview();
        await loadAnalysis();
    }
}

function validateBudgetData(data) {
    const startDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
        showNotification('Error', 'Start date must be today or in the future.', 'error');
        return false;
    }
    if (!data.periodType) {
        showNotification('Error', 'Please select a budget period.', 'error');
        return false;
    }
    if (data.categories.some(cat => !cat.category || cat.amount <= 0)) {
        showNotification('Error', 'Please fill in all categories and valid amounts.', 'error');
        return false;
    }
    return true;
}

async function saveBudgetCategory(cat, data, budgetId) {
    const isCustom = cat.category.startsWith('custom_');
    const categoryId = isCustom ? null : parseInt(cat.category);
    const userCategoryId = isCustom ? parseInt(cat.category.replace('custom_', '')) : null;
    const budgetData = {
        userId: user.userId,
        categoryId,
        userCategoryId,
        amount: cat.amount,
        periodType: data.periodType,
        startDate: data.startDate,
        notificationThreshold: data.threshold
    };

    const url = budgetId ? `${API_BASE_URL}/budget/${budgetId}` : `${API_BASE_URL}/budget`;
    const method = budgetId ? 'PUT' : 'POST';
    const response = await apiRequest(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "userId": user.userId.toString()
        },
        body: JSON.stringify(budgetData)
    });

    const responseData = await response.json();
    if (!response.ok || responseData.code !== 1000) {
        throw new Error(responseData.message);
    }
}

function calculateEndDate(startDate, periodType) {
    const start = new Date(startDate);
    const end = new Date(start);
    if (periodType === PERIOD_TYPES.WEEKLY) {
        end.setDate(start.getDate() + 6);
    } else if (periodType === PERIOD_TYPES.MONTHLY) {
        end.setMonth(start.getMonth() + 1);
        end.setDate(start.getDate() - 1);
    }
    return end;
}

// CATEGORY MANAGEMENT
async function loadSystemCategories() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/categories`, {
            headers: { "userId": user.userId.toString() }
        });

        const data = await response.json();
        if (response.ok && data.result) {
            systemCategories = data.result
                .filter(category => category.type === 'EXPENSE')
                .map(category => ({
                    id: category.categoryId,
                    name: category.categoryName
                }));
        } else {
            showNotification('Error', 'Failed to load system categories.', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Network error while loading system categories.', 'error');
    }
}

async function loadUserCategories() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/userCategories/${user.userId}`, {
            headers: { "userId": user.userId.toString() }
        });

        const data = await response.json();
        if (response.ok && data.result) {
            customCategories = data.result
                .filter(category => category.type === 'EXPENSE')
                .map(category => ({
                    id: category.categoryId,
                    name: category.categoryName
                }));
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
        } else {
            showNotification('Error', 'Failed to load user categories.', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Network error while loading user categories.', 'error');
    }
}

function addBudgetCategory(type = 'create', selectedCategory = null, amount = null) {
    const categoryList = document.getElementById(type === 'create' ? 'category-list' : 'update-category-list');
    if (!categoryList) return;

    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 mb-3';

    const systemOptions = systemCategories.map(cat =>
        `<option value="${cat.id}" ${selectedCategory == cat.id ? 'selected' : ''}>${cat.name}</option>`
    ).join('');

    const customOptions = customCategories.map(cat =>
        `<option value="custom_${cat.id}" ${selectedCategory === 'custom_' + cat.id ? 'selected' : ''}>${cat.name}</option>`
    ).join('');

    row.innerHTML = `
        <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition" required>
            <option value="">Select category</option>
            ${systemOptions}
            ${customOptions}
        </select>
        <input type="number" name="amounts[]" step="0.01" min="0" 
               ${amount ? `value="${amount}"` : 'placeholder="Amount (₫)"'} 
               class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition" required>
        <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition" 
                onclick="removeBudgetCategory(this, '${type}')">×</button>
    `;

    categoryList.appendChild(row);
}

function removeBudgetCategory(button, type = 'create') {
    const categoryList = document.getElementById(type === 'create' ? 'category-list' : 'update-category-list');
    if (categoryList.children.length > 1) {
        button.parentElement.remove();
    } else {
        showNotification('Error', 'At least one category is required.', 'error');
    }
}

// BUDGET OVERVIEW
async function loadBudgetOverview() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/budget/list?page=0&size=${pageSize}`, {
            headers: { "userId": user.userId.toString() }
        });

        const data = await response.json();
        const budgets = data.result?.content || [];

        if (budgets.length > 0) {
            updateBudgetOverview(budgets);
        } else {
            resetBudgetOverview();
        }
    } catch (error) {
        console.error("Error loading budget overview:", error);
    }
}

function updateBudgetOverview(budgets) {
    const stats = calculateBudgetStats(budgets);
    const overallProgress = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget * 100) : 0;

    // Update overview elements
    updateElement('activeBudgets', budgets.length);
    updateElement('totalBudgetAmount', formatCurrency(stats.totalBudget));
    updateElement('totalSpentAmount', formatCurrency(stats.totalSpent));
    updateElement('totalRemainingAmount', formatCurrency(stats.remaining));
    updateElement('overallProgressPercent', `${overallProgress.toFixed(1)}%`);
    updateElement('overBudgetCount', stats.overBudgetCount);
    updateElement('nearLimitCount', stats.nearLimitCount);

    // Update progress bar
    const progressBar = document.getElementById('overallProgressBar');
    if (progressBar) {
        progressBar.style.width = `${Math.min(overallProgress, 100)}%`;
        progressBar.className = getProgressBarClass(overallProgress);
    }
}

function calculateBudgetStats(budgets) {
    let totalBudget = 0;
    let totalSpent = 0;
    let overBudgetCount = 0;
    let nearLimitCount = 0;

    budgets.forEach(budget => {
        totalBudget += budget.amount;
        totalSpent += budget.currentSpending || 0;

        const usagePercent = budget.percentageUsed;
        if (usagePercent >= 100) {
            overBudgetCount++;
        } else if (usagePercent >= budget.notificationThreshold) {
            nearLimitCount++;
        }
    });

    return {
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
        overBudgetCount,
        nearLimitCount
    };
}

function resetBudgetOverview() {
    const elements = [
        'activeBudgets', 'totalBudgetAmount', 'totalSpentAmount',
        'totalRemainingAmount', 'overallProgressPercent', 'overBudgetCount', 'nearLimitCount'
    ];

    elements.forEach(id => updateElement(id, '0'));

    const progressBar = document.getElementById('overallProgressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

function getProgressBarClass(progress) {
    const baseClass = 'h-2 rounded-full transition-all duration-300';
    if (progress >= 100) {
        return `bg-gradient-to-r from-red-500 to-red-600 ${baseClass}`;
    } else if (progress >= 80) {
        return `bg-gradient-to-r from-yellow-500 to-orange-500 ${baseClass}`;
    } else {
        return `bg-gradient-to-r from-blue-500 to-purple-600 ${baseClass}`;
    }
}

// BUDGET MONITORING
async function monitorBudgets(silent = false) {
    const monitorTableBody = document.getElementById("monitor-table-body");
    if (!monitorTableBody) return;

    showLoadingState(monitorTableBody, 'Loading budgets...');

    try {
        const response = await apiRequest(`${API_BASE_URL}/budget/list?page=0&size=${pageSize}`, {
            headers: { "userId": user.userId.toString() }
        });

        const data = await response.json();
        const budgets = data.result?.content || [];

        if (budgets.length > 0) {
            renderBudgetCards(budgets, monitorTableBody, silent);
        } else {
            showNoDataMessage(monitorTableBody, 'No budgets found.');
        }
    } catch (error) {
        console.error("Error:", error);
        showErrorMessage(monitorTableBody, 'Error loading budgets. Please try again.');
        showNotification('Error', 'Error loading budgets. Please try again.', 'error');
    }
}

function renderBudgetCards(budgets, container, silent) {
    container.innerHTML = '';
    const template = document.getElementById('budgetCardTemplate')?.children[0];
    if (!template) return;

    const overBudgets = [];
    const nearBudgets = [];

    budgets.forEach(budget => {
        const card = createBudgetCard(budget, template, overBudgets, nearBudgets);
        container.appendChild(card);
    });

    if (!silent) {
        showBudgetNotifications(overBudgets, nearBudgets);
    }
}

function createBudgetCard(budget, template, overBudgets, nearBudgets) {
    const usagePercent = budget.percentageUsed.toFixed(2);
    const remaining = budget.amount - (budget.currentSpending || 0);

    const { progressClass, statusText, statusClass } = getBudgetStatus(usagePercent, budget.notificationThreshold);
    const cardClass = budget.periodType === PERIOD_TYPES.WEEKLY ? 'border-l-4 border-blue-500' : 'border-l-4 border-purple-500';

    if (usagePercent >= 100) {
        overBudgets.push(budget.categoryName || budget.userCategoryName);
    } else if (usagePercent >= budget.notificationThreshold) {
        nearBudgets.push(budget.categoryName || budget.userCategoryName);
    }

    const card = template.cloneNode(true);
    card.className = `p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${cardClass}`;
    card.classList.remove('hidden');
    updateCardContent(card, budget, usagePercent, remaining, progressClass, statusText, statusClass);

    return card;
}

function getBudgetStatus(usagePercent, threshold) {
    if (usagePercent >= 100) {
        return {
            progressClass: PROGRESS_CLASSES.ERROR,
            statusText: 'Over Budget',
            statusClass: STATUS_CLASSES.ERROR
        };
    } else if (usagePercent >= threshold) {
        return {
            progressClass: PROGRESS_CLASSES.WARNING,
            statusText: 'Near Limit',
            statusClass: STATUS_CLASSES.WARNING
        };
    } else {
        return {
            progressClass: PROGRESS_CLASSES.SUCCESS,
            statusText: 'On Track',
            statusClass: STATUS_CLASSES.SUCCESS
        };
    }
}

function updateCardContent(card, budget, usagePercent, remaining, progressClass, statusText, statusClass) {
    const elements = {
        '#cardCategory': budget.categoryName || budget.userCategoryName,
        '#cardPeriod': budget.periodType === PERIOD_TYPES.WEEKLY ? 'Weekly' : 'Monthly',
        '#cardUsage': `Usage: ${usagePercent}%`,
        '#cardRemaining': `Remaining: ${formatCurrency(remaining)}`
    };

    Object.entries(elements).forEach(([selector, text]) => {
        const element = card.querySelector(selector);
        if (element) element.textContent = text;
    });

    const statusEl = card.querySelector('#cardStatus');
    if (statusEl) {
        statusEl.textContent = statusText;
        statusEl.className = `px-2 py-1 text-xs font-medium rounded-full ${statusClass}`;
    }

    const progressEl = card.querySelector('#cardProgress');
    if (progressEl) {
        progressEl.className = `${progressClass} h-full rounded-full transition-all duration-300`;
        progressEl.style.width = `${Math.min(usagePercent, 100)}%`;
    }

    addCardEventListeners(card, budget);
}

function addCardEventListeners(card, budget) {
    const viewBtn = card.querySelector('#cardViewBtn');
    const editBtn = card.querySelector('#cardEditBtn');
    const deleteBtn = card.querySelector('#cardDeleteBtn');

    if (viewBtn) {
        viewBtn.onclick = () => viewBudgetDetails(
            budget.id,
            budget.categoryName || budget.userCategoryName,
            budget.amount,
            budget.currentSpending,
            budget.notificationThreshold,
            budget.startDate,
            budget.endDate,
            budget.periodType
        );
    }

    if (editBtn) {
        editBtn.onclick = () => openUpdateModal(
            budget.id,
            budget.periodType,
            budget.startDate,
            budget.notificationThreshold,
            budget.categoryName || budget.userCategoryName,
            budget.amount,
            budget.categoryId || 'custom_' + budget.userCategoryId
        );
    }

    if (deleteBtn) {
        deleteBtn.onclick = () => deleteBudget(budget.id);
    }
}

function showBudgetNotifications(overBudgets, nearBudgets) {
    if (overBudgets.length > 0) {
        showNotification('Warning', `Over budget: ${overBudgets.join(', ')}`, 'error');
    }
    if (nearBudgets.length > 0) {
        showNotification('Warning', `Near limit: ${nearBudgets.join(', ')}`, 'warning');
    }
}
// BUDGET DETAILS & ACTIONS
function viewBudgetDetails(id, categoryName, amount, currentSpending, threshold, startDate, endDate, periodType) {
    const usagePercent = (currentSpending / amount * 100).toFixed(2) || 0;
    const remaining = amount - (currentSpending || 0);

    const details = {
        'detailCategory': categoryName,
        'detailBudget': formatCurrency(amount),
        'detailSpending': formatCurrency(currentSpending || 0),
        'detailUsage': `${usagePercent}%`,
        'detailThreshold': `${threshold}%`,
        'detailStartDate': startDate,
        'detailEndDate': endDate,
        'detailPeriod': periodType === PERIOD_TYPES.WEEKLY ? 'Weekly' : 'Monthly',
        'detailRemaining': formatCurrency(remaining)
    };

    Object.entries(details).forEach(([id, value]) => {
        updateElement(id, value);
    });

    openModal('budgetDetailsModal');
}

async function openUpdateModal(budgetId, periodType, startDate, threshold, categoryName, amount, categoryId) {
    const idInput = document.getElementById('update-budget-id');
    if (idInput) idInput.value = budgetId;
    const periodSelect = document.getElementById('update-periodType');
    if (periodSelect) periodSelect.value = periodType || '';
    const startDateInput = document.getElementById('update-startDate');
    if (startDateInput) startDateInput.value = startDate || '';
    const thresholdInput = document.getElementById('update-threshold');
    if (thresholdInput) thresholdInput.value = threshold || '';
    const categoryList = document.getElementById('update-category-list');
    if (categoryList) {
        categoryList.innerHTML = '';
        addBudgetCategory('update', categoryId, amount);
    }
    openModal('updateBudgetModal');
}

async function deleteBudget(budgetId) {
    const modal = document.getElementById('deleteConfirmModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (!modal || !confirmBtn) return;
    openModal('deleteConfirmModal');
    const deleteHandler = async () => {
        try {
            const response = await apiRequest(`${API_BASE_URL}/budget/${budgetId}`, {
                method: "DELETE",
                headers: { "userId": user.userId.toString() }
            });

            if (response.ok) {
                showNotification('Success', 'Budget deleted successfully!', 'success');
                await loadBudgetOverview();
                await loadAnalysis();
            } else {
                const errorData = await response.json();
                showNotification('Error', `Error deleting budget: ${errorData.message || "Unknown error"}`, 'error');
            }
        } catch (error) {
            console.error("Error:", error);
            showNotification('Error', 'Network error. Please check your connection.', 'error');
        } finally {
            closeModal('deleteConfirmModal');
            confirmBtn.removeEventListener('click', deleteHandler);
        }
    };

    confirmBtn.addEventListener('click', deleteHandler);
}

// ANALYSIS & CHARTS
function getAnalysisUrl(period) {
    const baseUrl = `${API_BASE_URL}/budget/analysis?page=0&size=${pageSize}`;
    return period === 'all' ? baseUrl : `${baseUrl}&period=${period}`;
}

async function loadAnalysis() {
    const table = document.getElementById("analysis-table");
    const period = document.getElementById("analysisPeriod")?.value || 'all';
    if (!table) return;
    showLoadingState(table, 'Loading analysis...', 'tr');
    resetSummaryStats();
    try {
        const url = getAnalysisUrl(period);
        const response = await apiRequest(url, {
            headers: { "userId": user.userId.toString() }
        });

        const data = await response.json();
        const budgets = data.result?.content || [];

        if (budgets.length > 0) {
            showChartAndGrid();
            const { chartLabels, plannedData, actualData, totalBudgeted, totalSpent } = processAnalysisData(budgets);
            renderAnalysisTable(budgets);
            updateSummaryStats(totalBudgeted, totalSpent);
            createChart(chartLabels, plannedData, actualData, period);
        } else {
            showNoDataMessage();
        }
    } catch (error) {
        console.error("Error:", error);
        showErrorMessage();
    }
}

function processAnalysisData(budgets) {
    const chartLabels = [];
    const plannedData = [];
    const actualData = [];
    let totalBudgeted = 0;
    let totalSpent = 0;

    budgets.forEach(budget => {
        totalBudgeted += budget.plannedAmount;
        totalSpent += budget.actualSpending || 0;
        chartLabels.push(budget.categoryName || budget.userCategoryName);
        plannedData.push(budget.plannedAmount);
        actualData.push(budget.actualSpending || 0);
    });

    return { chartLabels, plannedData, actualData, totalBudgeted, totalSpent };
}

function renderAnalysisTable(budgets) {
    const table = document.getElementById("analysis-table");
    if (!table) return;

    table.innerHTML = '';
    budgets.forEach(budget => {
        const usagePercent = (budget.actualSpending / budget.plannedAmount * 100).toFixed(2) || 0;
        const variance = budget.plannedAmount - (budget.actualSpending || 0);
        const { statusText, statusClass } = getAnalysisStatus(usagePercent, budget.notificationThreshold);

        const row = document.createElement('tr');
        row.className = budget.periodType === PERIOD_TYPES.WEEKLY ? 'weekly-row' : 'monthly-row';
        row.innerHTML = `
            <td class="p-3">${budget.categoryName || budget.userCategoryName}</td>
            <td class="p-3">${formatCurrency(budget.plannedAmount)}</td>
            <td class="p-3">${formatCurrency(budget.actualSpending || 0)}</td>
            <td class="p-3 ${variance < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(variance)}</td>
            <td class="p-3"><span class="px-3 py-1 rounded-full ${statusClass}">${statusText}</span></td>
        `;
        table.appendChild(row);
    });
}

function getAnalysisStatus(usagePercent, threshold) {
    if (usagePercent >= 100) {
        return {
            statusText: 'Over Budget',
            statusClass: STATUS_CLASSES.ERROR
        };
    } else if (usagePercent >= threshold) {
        return {
            statusText: 'Near Limit',
            statusClass: STATUS_CLASSES.WARNING
        };
    } else {
        return {
            statusText: 'On Track',
            statusClass: STATUS_CLASSES.SUCCESS
        };
    }
}

function updateSummaryStats(totalBudgeted, totalSpent) {
    const variance = totalBudgeted - totalSpent;
    const spendingRate = ((totalSpent / totalBudgeted) * 100).toFixed(1);

    updateElement('totalBudgeted', formatCurrency(totalBudgeted));
    updateElement('totalSpent', formatCurrency(totalSpent));
    updateElement('varianceAmount', formatCurrency(variance));
    updateElement('spendingRate', `${spendingRate}%`);

    const varianceEl = document.getElementById('varianceAmount');
    const spendingEl = document.getElementById('spendingRate');

    if (varianceEl) {
        varianceEl.className = `font-bold text-lg ${variance < 0 ? 'text-red-600' : 'text-green-600'}`;
    }

    if (spendingEl) {
        spendingEl.className = `font-bold text-lg ${spendingRate >= 100 ? 'text-red-600' : spendingRate >= 80 ? 'text-yellow-600' : 'text-green-600'}`;
    }
}

function resetSummaryStats() {
    const elements = ['totalBudgeted', 'totalSpent', 'varianceAmount', 'spendingRate'];
    elements.forEach(id => updateElement(id, '0'));
    updateElement('spendingRate', '0%');
}

function createChart(chartLabels, plannedData, actualData, period) {
    if (budgetChart) budgetChart.destroy();

    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const chartConfig = chartType === CHART_TYPES.PIE
        ? createPieChartConfig(plannedData, actualData, period)
        : createBarLineChartConfig(chartLabels, plannedData, actualData, period);

    budgetChart = new Chart(ctx, chartConfig);
}

function createPieChartConfig(plannedData, actualData, period) {
    const totalBudgeted = plannedData.reduce((sum, val) => sum + val, 0);
    const totalSpent = actualData.reduce((sum, val) => sum + val, 0);

    return {
        type: 'pie',
        data: {
            labels: ['Total Budget', 'Total Spent'],
            datasets: [{
                data: [totalBudgeted, totalSpent],
                backgroundColor: ['rgba(46, 125, 50, 0.8)', 'rgba(211, 47, 47, 0.8)'],
                borderColor: ['rgba(46, 125, 50, 1)', 'rgba(211, 47, 47, 1)'],
                borderWidth: 2
            }]
        },
        options: getChartOptions(`Budget Overview - ${getPeriodText(period)}`)
    };
}

function createBarLineChartConfig(chartLabels, plannedData, actualData, period) {
    const isLine = chartType === CHART_TYPES.LINE;
    const config = {
        type: isLine ? 'line' : 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Planned Budget',
                    data: plannedData,
                    backgroundColor: isLine ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.6)',
                    borderColor: 'rgba(46, 125, 50, 1)',
                    borderWidth: 3,
                    fill: isLine ? true : chartType !== CHART_TYPES.LINE,
                    tension: isLine ? 0.4 : 0,
                    pointBackgroundColor: 'rgba(46, 125, 50, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: isLine ? 7 : 0,
                    pointHoverRadius: isLine ? 10 : 0,
                    pointStyle: 'circle',
                    pointBorderWidth: 2,
                    cubicInterpolationMode: isLine ? 'monotone' : undefined
                },
                {
                    label: 'Actual Spending',
                    data: actualData,
                    backgroundColor: isLine ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.6)',
                    borderColor: 'rgba(211, 47, 47, 1)',
                    borderWidth: 3,
                    fill: isLine ? true : chartType !== CHART_TYPES.LINE,
                    tension: isLine ? 0.4 : 0,
                    pointBackgroundColor: 'rgba(211, 47, 47, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: isLine ? 7 : 0,
                    pointHoverRadius: isLine ? 10 : 0,
                    pointStyle: 'circle',
                    pointBorderWidth: 2,
                    cubicInterpolationMode: isLine ? 'monotone' : undefined
                }
            ]
        },
        options: getChartOptions(`Budget vs Actual by Category - ${getPeriodText(period)}`, true)
    };
    return config;
}

function getChartOptions(title, showScales = false) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || context.label || '';
                        const value = context.parsed.y || context.parsed;
                        return `${label}: ${formatCurrency(value)}`;
                    }
                }
            }
        }
    };

    if (showScales) {
        options.scales = {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Amount ($)' },
                ticks: {
                    callback: function (value) {
                        return formatCurrency(value);
                    }
                }
            },
            x: {
                title: { display: true, text: 'Categories' }
            }
        };
    }

    return options;
}

function getPeriodText(period) {
    return period === 'all' ? 'All Periods' : period === PERIOD_TYPES.WEEKLY ? 'Weekly' : 'Monthly';
}

function toggleChartType() {
    const chartIcon = document.getElementById('chartIcon');
    const chartTypeLabel = document.getElementById('chartTypeLabel');

    if (chartType === CHART_TYPES.BAR) {
        chartType = CHART_TYPES.LINE;
        chartIcon.className = 'fas fa-chart-line';
        chartTypeLabel.textContent = 'Line Chart';
    } else if (chartType === CHART_TYPES.LINE) {
        chartType = CHART_TYPES.PIE;
        chartIcon.className = 'fas fa-chart-pie';
        chartTypeLabel.textContent = 'Pie Chart';
    } else {
        chartType = CHART_TYPES.BAR;
        chartIcon.className = 'fas fa-chart-bar';
        chartTypeLabel.textContent = 'Bar Chart';
    }
    loadAnalysis();
}

// UTILITY FUNCTIONS
function showNotification(title, message, type) {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const notificationCard = document.createElement("div");
    const typeClasses = {
        error: 'bg-red-50 text-red-800',
        warning: 'bg-yellow-50 text-yellow-800',
        success: 'bg-green-50 text-green-800'
    };

    notificationCard.className = `mb- notification-slide-in ${typeClasses[type] || typeClasses.success}`;

    const iconPaths = {
        error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
        warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
    };

    const iconColors = {
        error: 'text-red-600',
        warning: 'text-yellow-600',
        success: 'text-green-600'
    };

    notificationCard.innerHTML = `
        <div class="rounded-lg p-3 shadow-sm transition-all duration-300 text-sm">
            <div class="flex items-start space-x-2">
                <svg class="w-4 h-4 mt-0.5 ${iconColors[type] || iconColors.success}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${iconPaths[type] || iconPaths.success}
                </svg>
                <div class="flex-1">
                    <h3 class="font-semibold leading-snug">${title}</h3>
                    <p class="mt-0.5 leading-snug">${message}</p>
                </div>
            </div>
        </div>
    `;

    toastContainer.appendChild(notificationCard);

    setTimeout(() => {
        notificationCard.classList.remove('notification-slide-in');
        notificationCard.classList.add('notification-slide-out');
        setTimeout(() => notificationCard.remove(), 300);
    }, 4000);
}

async function refreshAllData() {
    try {
        await Promise.all([
            loadBudgetOverview(),
            loadAnalysis()
        ]);
        showNotification('Success', 'Data refreshed successfully!', 'success');
    } catch (error) {
        console.error("Error refreshing data:", error);
        showNotification('Error', 'Failed to refresh data.', 'error');
    }
}

function setDefaultModalDates() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) startDateInput.value = formatted;
    const updateStartDateInput = document.getElementById('update-startDate');
    if (updateStartDateInput) updateStartDateInput.value = formatted;
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showLoadingState(container, message, elementType = 'div') {
    container.innerHTML = `<${elementType} class="p-3 text-center"><i class="fas fa-spinner fa-spin"></i> ${message}</${elementType}>`;
}

function showNoDataMessage(container = null, message = 'No budget data for the selected period.') {
    if (container) {
        container.innerHTML = `<div class="col-span-full p-3 text-center text-gray-500">${message}</div>`;
    } else {
        const table = document.getElementById("analysis-table");
        if (table) {
            table.innerHTML = `<tr><td colspan="6" class="p-3 text-gray-500">${message}</td></tr>`;
        }
    }

    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }

    const chartContainer = document.querySelector('.h-80');
    const gridContainer = document.querySelector('.grid');

    if (chartContainer) chartContainer.classList.add('hidden');
    if (gridContainer) gridContainer.classList.add('hidden');

    if (!container) {
        showNotification('Info', 'No data available for the selected period.', 'warning');
    }
}

function showErrorMessage(container = null) {
    const message = 'Error loading data. Please try again.';

    if (container) {
        container.innerHTML = `<div class="col-span-full p-3 text-center text-red-600">${message}</div>`;
    } else {
        const table = document.getElementById("analysis-table");
        if (table) {
            table.innerHTML = `<tr><td colspan="6" class="p-3 text-red-600">${message}</td></tr>`;
        }
    }

    if (budgetChart) {
        budgetChart.destroy();
        budgetChart = null;
    }

    if (!container) {
        showNotification('Error', message, 'error');
    }
}

function showChartAndGrid() {
    const chartContainer = document.querySelector('.h-80');
    const gridContainer = document.querySelector('.grid');

    if (chartContainer) chartContainer.classList.remove('hidden');
    if (gridContainer) gridContainer.classList.remove('hidden');
}

function exportToCSV() {
    const period = document.getElementById("analysisPeriod")?.value || 'all';
    const url = getAnalysisUrl(period);

    apiRequest(url, {
        headers: { "userId": user.userId.toString() }
    })
        .then(response => response.json())
        .then(data => {
            const budgets = data.result?.content || [];

            if (budgets.length > 0) {
                const headers = ['Category', 'Period', 'Planned Amount', 'Actual Spending', 'Variance', 'Status'];
                const rows = budgets.map(budget => {
                    const usagePercent = (budget.actualSpending / budget.plannedAmount * 100).toFixed(2) || 0;
                    const variance = budget.plannedAmount - (budget.actualSpending || 0);
                    const status = usagePercent >= 100 ? 'Over Budget' : usagePercent >= budget.notificationThreshold ? 'Near Limit' : 'On Track';

                    return [
                        `"${budget.categoryName || budget.userCategoryName}"`,
                        budget.periodType,
                        budget.plannedAmount.toFixed(2),
                        (budget.actualSpending || 0).toFixed(2),
                        variance.toFixed(2),
                        status
                    ];
                });

                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `budget_analysis_${period === 'all' ? 'all' : period}_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
                showNotification('Success', 'CSV exported successfully!', 'success');
            } else {
                showNotification('Error', 'No data to export.', 'error');
            }
        })
        .catch(error => {
            console.error('Error exporting CSV:', error);
            showNotification('Error', 'Error exporting data. Please try again.', 'error');
        });
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById("create-budget-form");
    const updateForm = document.getElementById("update-budget-form");

    if (createForm) {
        createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await submitBudgetForm("create-budget-form");
        });
    }

    if (updateForm) {
        updateForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const budgetId = document.getElementById('update-budget-id')?.value;
            await submitBudgetForm("update-budget-form", budgetId);
        });
    }
});

window.addEventListener('load', () => {
    if (checkAuth()) {
        initializeUI();

        const analysisPeriodSelect = document.getElementById('analysisPeriod');
        if (analysisPeriodSelect) {
            analysisPeriodSelect.addEventListener('change', loadAnalysis);
        }
    }
});