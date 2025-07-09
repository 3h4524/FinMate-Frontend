let budgetChart = null;
let chartType = 'bar';
let user;
const pageSize = 10;
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
let systemCategories = [];


async function initializeUI() {
    await fetchUser();
    if (!user || !user.userId) return;
    await loadSideBar(user);
    await loadSystemCategories();
    await loadUserCategories();
    await loadBudgetOverview();
    await monitorBudgets(0);
    await loadAnalysis(0);
    await setDefaultModalDates();
    await addBudgetCategory();
    await setupEventListeners();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar').classList.toggle('translate-x-0');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const content = modal.querySelector('.modal-content');
    if (content) {
        setTimeout(() => content.classList.add('show'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('.modal-content');

    if (content) {
        content.classList.remove('show');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);

    const modalConfig = {
        createBudgetModal: {formId: 'create-budget-form', listId: 'category-list', callback: addBudgetCategory},
        updateBudgetModal: {formId: 'update-budget-form', listId: 'update-category-list'}
    };

    if (modalConfig[modalId]) {
        const {formId, listId, callback} = modalConfig[modalId];
        const form = document.getElementById(formId);
        const list = document.getElementById(listId);
        if (form) form.reset();
        if (list) list.innerHTML = '';
        if (callback) callback();
    }
}

async function submitBudgetForm(formId, budgetId = null) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {
        periodType: formData.get('periodType'),
        startDate: formData.get('startDate'),
        threshold: parseInt(formData.get('threshold')),
        categories: formData.getAll('categories[]').map((category, index) => ({
            category, amount: parseFloat(formData.getAll('amounts[]')[index])
        }))
    };
    if (!validateBudgetData(data)) return;
    if (!user || !user.userId) {
        showNotification('Error', 'User not authenticated. Please log in.', 'error');
        return;
    }

    try {
        for (const cat of data.categories) {
            await saveBudgetCategory(cat, data, budgetId);
        }
        showNotification('Success', `Budget plan ${budgetId ? 'updated' : 'created'} successfully!`, 'success');
        form.reset();
        closeModal(budgetId ? 'updateBudgetModal' : 'createBudgetModal');
        document.getElementById('analysisPeriod').value = 'all';
        await loadBudgetOverview();
        monitorBudgets(0);
        loadAnalysis(0);
    } catch (error) {
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
    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    if (data.periodType === 'WEEKLY') {
        endDate.setDate(startDate.getDate() + 6);
    } else if (data.periodType === 'MONTHLY') {
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(startDate.getDate() - 1);
    }
    const budgetData = {
        userId: user.userId,
        categoryId,
        userCategoryId,
        amount: cat.amount,
        periodType: data.periodType,
        startDate: data.startDate,
        notificationThreshold: data.threshold
    };
    const url = budgetId ? `http://localhost:8080/budget/${budgetId}` : 'http://localhost:8080/budget';
    const method = budgetId ? 'PUT' : 'POST';
    const response = await apiRequest(url, {
        method,
        headers: {"Content-Type": "application/json", "userId": user.userId.toString()},
        body: JSON.stringify(budgetData)
    });
    const responseData = await response.json();
    console.log(responseData);
    if (!response.ok || responseData.code !== 1000) {
        showNotification('Error', responseData.message || 'Error saving budget', 'error');
        throw new Error(responseData.message || 'Error saving budget');
    }
}

document.getElementById("create-budget-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitBudgetForm("create-budget-form");
});

document.getElementById("update-budget-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const budgetId = document.getElementById('update-budget-id').value;
    await submitBudgetForm("update-budget-form", budgetId);
});

function addBudgetCategory(type = 'create', selectedCategory = null, amount = null) {
    const categoryList = document.getElementById(type === 'create' ? 'category-list' : 'update-category-list');
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3 mb-3';
    row.innerHTML = `
        <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition" required>
            <option value="">Select category</option>
            ${systemCategories.map(cat => `<option value="${cat.id}" ${selectedCategory == cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
            ${customCategories.map(cat => `<option value="custom_${cat.id}" ${selectedCategory === 'custom_' + cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}
        </select>
        <input type="number" name="amounts[]" step="0.01" min="0" ${amount ? `value="${amount}"` : 'placeholder="Amount (₫)"'} class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition" required>
        <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition" onclick="removeBudgetCategory(this, '${type}')">×</button>
    `;
    categoryList.appendChild(row);
}

async function loadSystemCategories() {
    try {
        const response = await apiRequest('http://localhost:8080/api/categories', {
            headers: {"userId": user.userId.toString()}
        });
        const data = await response.json();
        if (response.ok && data.result) {
            systemCategories = data.result.map(category => {
                if (category.type === 'EXPENSE') {
                    return {
                        id: category.categoryId,
                        name: category.categoryName
                    };
                }
            }).filter(cat => cat !== undefined);
        } else {
            showNotification('Error', 'Failed to load system categories.', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Network error while loading system categories.', 'error');
    }
}

async function loadUserCategories() {
    try {
        const response = await apiRequest(`http://localhost:8080/api/userCategories/${user.userId}`, {
            headers: {"userId": user.userId.toString()}
        });
        const data = await response.json();
        if (response.ok && data.result) {
            customCategories = data.result.map(category => {
                if (category.type === 'EXPENSE') {
                    return {
                        id: category.categoryId,
                        name: category.categoryName
                    };
                }
            }).filter(cat => cat !== undefined);
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
        } else {
            showNotification('Error', 'Failed to load user categories.', 'error');
        }
    } catch (error) {
        showNotification('Error', 'Network error while loading user categories.', 'error');
    }
}

async function loadBudgetOverview() {
    try {
        const response = await apiRequest(`http://localhost:8080/budget/list?page=0&size=1000`, {
            headers: {"userId": user.userId.toString()}
        });
        const data = await response.json();

        if (response.ok && data.result.content.length > 0) {
            const budgets = data.result.content;
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

            const remaining = totalBudget - totalSpent;
            const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

            // Update overview elements
            document.getElementById('activeBudgets').textContent = budgets.length;
            document.getElementById('totalBudgetAmount').textContent = formatCurrency(totalBudget);
            document.getElementById('totalSpentAmount').textContent = formatCurrency(totalSpent);
            document.getElementById('totalRemainingAmount').textContent = formatCurrency(remaining);
            document.getElementById('overallProgressPercent').textContent = `${overallProgress.toFixed(1)}%`;
            document.getElementById('overallProgressBar').style.width = `${Math.min(overallProgress, 100)}%`;
            document.getElementById('overBudgetCount').textContent = overBudgetCount;
            document.getElementById('nearLimitCount').textContent = nearLimitCount;

            // Update progress bar color based on overall progress
            const progressBar = document.getElementById('overallProgressBar');
            if (overallProgress >= 100) {
                progressBar.className = 'bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300';
            } else if (overallProgress >= 80) {
                progressBar.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300';
            } else {
                progressBar.className = 'bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300';
            }

        } else {
            document.getElementById('activeBudgets').textContent = '0';
            document.getElementById('totalBudgetAmount').textContent = '0';
            document.getElementById('totalSpentAmount').textContent = '0';
            document.getElementById('totalRemainingAmount').textContent = '0';
            document.getElementById('overallProgressPercent').textContent = '0%';
            document.getElementById('overallProgressBar').style.width = '0%';
            document.getElementById('overBudgetCount').textContent = '0';
            document.getElementById('nearLimitCount').textContent = '0';
            document.getElementById('overviewLastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    } catch (error) {
        console.error("Error loading budget overview:", error);
    }
}

async function refreshAllData() {
    try {
        await loadBudgetOverview();
        await monitorBudgets(0);
        await loadAnalysis(0);
        showNotification('Success', 'Data refreshed successfully!', 'success');
    } catch (error) {
        console.error("Error refreshing data:", error);
        showNotification('Error', 'Failed to refresh data.', 'error');
    }
}

function removeBudgetCategory(button, type = 'create') {
    const categoryList = document.getElementById(type === 'create' ? 'category-list' : 'update-category-list');
    if (categoryList.children.length > 1) {
        button.parentElement.remove();
    } else {
        showNotification('Error', 'At least one category is required.', 'error');
    }
}

function showNotification(title, message, type) {
    const toastContainer = document.getElementById("toastContainer");
    const notificationCard = document.createElement("div");
    notificationCard.className = `mb- notification-slide-in ${type === 'error' ? 'bg-red-50 text-red-800' : type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`;

    const iconPaths = {
        error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
        warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
    };
    notificationCard.innerHTML = `
    <div class="rounded-lg p-3 shadow-sm transition-all duration-300 text-sm">
        <div class="flex items-start space-x-2">
            <svg class="w-4 h-4 mt-0.5 ${type === 'error' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-green-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${iconPaths[type]}
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

async function monitorBudgets(page) {
    const monitorTableBody = document.getElementById("monitor-table-body");
    const paginationContainer = document.getElementById("monitor-pagination");
    monitorTableBody.innerHTML = '<tr><td colspan="6" class="p-3"><i class="fas fa-spinner fa-spin"></i> Loading budgets...</td></tr>';
    paginationContainer.innerHTML = '';

    try {
        const response = await apiRequest(`http://localhost:8080/budget/list?page=${page}&size=${pageSize}`, {
            headers: {"userId": user.userId.toString()}
        });
        const data = await response.json();
        if (response.ok && data.result.content.length > 0) {
            monitorTableBody.innerHTML = '';
            const overBudgets = [];
            const nearBudgets = [];
            data.result.content.forEach(budget => {
                const usagePercent = budget.percentageUsed.toFixed(2);
                const remaining = budget.amount - (budget.currentSpending || 0);
                let progressClass = 'bg-green-500';
                let statusText = 'On Track';
                if (usagePercent >= 100) {
                    progressClass = 'bg-red-500';
                    statusText = 'Over Budget';
                    overBudgets.push(budget.categoryName || budget.userCategoryName);
                } else if (usagePercent >= budget.notificationThreshold) {
                    progressClass = 'bg-yellow-500';
                    statusText = 'Near Limit';
                    nearBudgets.push(budget.categoryName || budget.userCategoryName);
                }

                const row = document.createElement('tr');
                row.className = budget.periodType === 'WEEKLY' ? 'weekly-row' : 'monthly-row';
                row.innerHTML = `
                    <td class="p-3">${budget.categoryName || budget.userCategoryName}</td>
                    <td class="p-3">${budget.periodType === 'WEEKLY' ? 'Weekly' : 'Monthly'}</td>
                    <td class="p-3">${usagePercent}%</td>
                    <td class="p-3">
                        <div class="w-full max-w-[180px] h-2 bg-gray-200 rounded-full mx-auto">
                            <div class="${progressClass} h-full rounded-full transition-all duration-300" style="width: ${Math.min(usagePercent, 100)}%"></div>
                        </div>
                    </td>
                    <td class="p-3">${formatCurrency(remaining)}</td>
                    <td class="p-3">
                        <button onclick="viewBudgetDetails(${budget.id}, '${budget.categoryName || budget.userCategoryName}', ${budget.amount}, ${budget.currentSpending}, ${budget.notificationThreshold}, '${budget.startDate}', '${budget.endDate}', '${budget.periodType}')" class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-eye"></i></button>
                        <button onclick="openUpdateModal(${budget.id}, '${budget.periodType}', '${budget.startDate}', ${budget.notificationThreshold}, '${budget.categoryName || budget.userCategoryName}', ${budget.amount}, ${budget.categoryId || 'custom_' + budget.userCategoryId})" class="text-blue-600 hover:text-blue-800 mr-3"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteBudget(${budget.id})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                monitorTableBody.appendChild(row);
            });

            if (overBudgets.length > 0) {
                showNotification('Warning', `Over budget: ${overBudgets.join(', ')}`, 'error');
            }
            if (nearBudgets.length > 0) {
                showNotification('Warning', `Near limit: ${nearBudgets.join(', ')}`, 'warning');
            }

            renderPagination(paginationContainer, data.result, monitorBudgets);
        } else {
            monitorTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-gray-500">No budgets found.</td></tr>';
        }
    } catch (error) {
        console.error("Error:", error);
        monitorTableBody.innerHTML = '<tr><td colspan="6" class="p-3 text-red-600">Error loading budgets. Please try again.</td></tr>';
        showNotification('Error', 'Error loading budgets. Please try again.', 'error');
    }
}

async function fetchUser() {
    try {
        user = await getCurrentUser();
        if (!user || !user.userId) {
            throw new Error('User not authenticated');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        showNotification('Error', 'Please log in to continue.', 'error');
        window.location.href = '/login';
    }
}

function viewBudgetDetails(id, categoryName, amount, currentSpending, threshold, startDate, endDate, periodType) {
    const usagePercent = (currentSpending / amount * 100).toFixed(2) || 0;
    const remaining = amount - (currentSpending || 0);

    const detailsContent = `
        <div class="col-span-2 flex items-center gap-3 p-4 border rounded-lg bg-blue-50 shadow-sm">
            <i class="fas fa-tag text-blue-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Category</p>
                <p class="font-semibold text-blue-800">${categoryName}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-green-50 shadow-sm">
            <i class="fas fa-wallet text-green-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Budget</p>
                <p class="font-semibold text-green-800">${formatCurrency(amount)}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-red-50 shadow-sm">
            <i class="fas fa-money-bill-wave text-red-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Current Spending</p>
                <p class="font-semibold text-red-800">${formatCurrency(currentSpending || 0)}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 shadow-sm">
            <i class="fas fa-percentage text-yellow-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Usage Percentage</p>
                <p class="font-semibold text-yellow-800">${usagePercent}%</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 shadow-sm">
            <i class="fas fa-bell text-blue-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Alert Threshold</p>
                <p class="font-semibold text-blue-800">${threshold}%</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 shadow-sm">
            <i class="fas fa-calendar-day text-gray-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Start Date</p>
                <p class="font-semibold text-gray-800">${startDate}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 shadow-sm">
            <i class="fas fa-calendar-check text-gray-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">End Date</p>
                <p class="font-semibold text-gray-800">${endDate}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-purple-50 shadow-sm">
            <i class="fas fa-sync-alt text-purple-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Period</p>
                <p class="font-semibold text-purple-800">${periodType === 'WEEKLY' ? 'Weekly' : 'Monthly'}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 p-4 border rounded-lg bg-emerald-50 shadow-sm">
            <i class="fas fa-piggy-bank text-emerald-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Remaining Balance</p>
                <p class="font-semibold text-emerald-800">${formatCurrency(remaining)}</p>
            </div>
        </div>
    `;
    document.getElementById('budgetDetailsContent').innerHTML = detailsContent;
    openModal('budgetDetailsModal');
}

async function openUpdateModal(budgetId, periodType, startDate, threshold, categoryName, amount, categoryId) {
    document.getElementById('update-budget-id').value = budgetId;
    document.getElementById('update-periodType').value = periodType;
    document.getElementById('update-startDate').value = startDate;
    document.getElementById('update-threshold').value = threshold;

    const categoryList = document.getElementById('update-category-list');
    categoryList.innerHTML = '';
    addBudgetCategory('update', categoryId, amount);
    openModal('updateBudgetModal');
}

async function deleteBudget(budgetId) {
    const modal = document.getElementById('deleteConfirmModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.querySelector('.modal-content').classList.add('show');
    }, 10);

    const deleteHandler = async () => {
        try {
            const response = await apiRequest(`http://localhost:8080/budget/${budgetId}`, {
                method: "DELETE",
                headers: {"userId": user.userId.toString()}
            });
            if (response.ok) {
                showNotification('Success', 'Budget deleted successfully!', 'success');
                await loadBudgetOverview();
                monitorBudgets(0);
                loadAnalysis(0);
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

async function loadAnalysis(page) {
    const table = document.getElementById("analysis-table");
    const period = document.getElementById("analysisPeriod").value;
    const paginationContainer = document.getElementById("analysis-pagination");
    table.innerHTML = '<tr><td colspan="6" class="p-3"><i class="fas fa-spinner fa-spin"></i> Loading analysis...</td></tr>';
    paginationContainer.innerHTML = '';
    document.getElementById('totalBudgeted').textContent = '0';
    document.getElementById('totalSpent').textContent = '0';
    document.getElementById('varianceAmount').textContent = '0';
    document.getElementById('spendingRate').textContent = '0%';

    try {
        const url = period === 'all' ?
            `http://localhost:8080/budget/analysis?page=${page}&size=${pageSize}` :
            `http://localhost:8080/budget/analysis?period=${period}&page=${page}&size=${pageSize}`;
        const response = await apiRequest(url, {
            headers: {"userId": user.userId.toString()}
        });
        const data = await response.json();
        if (response.ok && data.result.content.length > 0) {
            document.querySelector('.h-80').classList.remove('hidden');
            document.querySelector('.grid').classList.remove('hidden');
            table.innerHTML = '';
            const chartLabels = [];
            const plannedData = [];
            const actualData = [];
            let totalBudgeted = 0;
            let totalSpent = 0;

            data.result.content.forEach(budget => {
                const usagePercent = (budget.actualSpending / budget.plannedAmount * 100).toFixed(2) || 0;
                const variance = budget.plannedAmount - (budget.actualSpending || 0);
                totalBudgeted += budget.plannedAmount;
                totalSpent += budget.actualSpending || 0;
                const statusText = usagePercent >= 100 ? 'Over Budget' : usagePercent >= budget.notificationThreshold ? 'Near Limit' : 'On Track';
                const statusClass = usagePercent >= 100 ? 'bg-red-100 text-red-600' : usagePercent >= budget.notificationThreshold ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600';

                const row = document.createElement('tr');
                row.className = budget.periodType === 'WEEKLY' ? 'weekly-row' : 'monthly-row';
                row.innerHTML = `
                    <td class="p-3">${budget.categoryName || budget.userCategoryName}</td>
                    <td class="p-3">${formatCurrency(budget.plannedAmount)}</td>
                    <td class="p-3">${formatCurrency(budget.actualSpending || 0)}</td>
                    <td class="p-3 ${variance < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(variance)}</td>
                    <td class="p-3"><span class="px-3 py-1 rounded-full ${statusClass}">${statusText}</span></td>
                `;
                table.appendChild(row);

                chartLabels.push(budget.categoryName || budget.userCategoryName);
                plannedData.push(budget.plannedAmount);
                actualData.push(budget.actualSpending || 0);
            });

            const variance = totalBudgeted - totalSpent;
            const spendingRate = ((totalSpent / totalBudgeted) * 100).toFixed(1);
            document.getElementById('totalBudgeted').textContent = formatCurrency(totalBudgeted);
            document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
            document.getElementById('varianceAmount').textContent = formatCurrency(variance);
            document.getElementById('varianceAmount').className = `font-bold text-lg ${variance < 0 ? 'text-red-600' : 'text-green-600'}`;
            document.getElementById('spendingRate').textContent = `${spendingRate}%`;
            document.getElementById('spendingRate').className = `font-bold text-lg ${spendingRate >= 100 ? 'text-red-600' : spendingRate >= 80 ? 'text-yellow-600' : 'text-green-600'}`;

            if (budgetChart) budgetChart.destroy();
            const ctx = document.getElementById('budgetChart').getContext('2d');

            let chartConfig;

            if (chartType === 'pie') {
                chartConfig = {
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
                    options: {
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
                                text: `Budget Overview - ${period === 'all' ? 'All Periods' : period === 'WEEKLY' ? 'Weekly' : 'Monthly'}`,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                };
            } else {
                chartConfig = {
                    type: chartType === 'bar' ? 'bar' : 'line',
                    data: {
                        labels: chartLabels,
                        datasets: [
                            {
                                label: 'Planned Budget',
                                data: plannedData,
                                backgroundColor: 'rgba(46, 125, 50, 0.6)',
                                borderColor: 'rgba(46, 125, 50, 1)',
                                borderWidth: 2,
                                fill: chartType !== 'line'
                            },
                            {
                                label: 'Actual Spending',
                                data: actualData,
                                backgroundColor: 'rgba(211, 47, 47, 0.6)',
                                borderColor: 'rgba(211, 47, 47, 1)',
                                borderWidth: 2,
                                fill: chartType !== 'line'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {display: true, text: 'Amount ($)'},
                                ticks: {
                                    callback: function (value) {
                                        return formatCurrency(value);
                                    }
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Categories'
                                }
                            }
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
                                text: `Budget vs Actual by Category - ${period === 'all' ? 'All Periods' : period === 'WEEKLY' ? 'Weekly' : 'Monthly'}`,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const label = context.dataset.label || '';
                                        const value = context.parsed.y;
                                        return `${label}: ${formatCurrency(value)}`;
                                    }
                                }
                            }
                        }
                    }
                };

                // Thêm tension cho line chart
                if (chartType === 'line') {
                    chartConfig.data.datasets.forEach(dataset => {
                        dataset.tension = 0.1;
                    });
                }
            }

            budgetChart = new Chart(ctx, chartConfig);
            renderPagination(paginationContainer, data.result, loadAnalysis);
        } else {
            table.innerHTML = '<tr><td colspan="6" class="p-3 text-gray-500">No budget data for the selected period.</td></tr>';
            if (budgetChart) {
                budgetChart.destroy();
                budgetChart = null;
            }
            document.querySelector('.h-80').classList.add('hidden');
            document.querySelector('.grid').classList.add('hidden');
            showNotification('Info', 'No data available for the selected period.', 'warning');
        }
    } catch (error) {
        console.error("Error:", error);
        table.innerHTML = '<tr><td colspan="6" class="p-3 text-red-600">Error loading analysis. Please try again.</td></tr>';
        if (budgetChart) {
            budgetChart.destroy();
            budgetChart = null;
        }
        showNotification('Error', 'Error loading analysis. Please try again.', 'error');
    }
}

function renderPagination(container, pageData, fetchFunction) {
    const {number, totalPages} = pageData;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const maxButtons = 5;
    let startPage = Math.max(0, number - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);
    startPage = Math.max(0, endPage - maxButtons);

    const createButton = (page, text, disabled = false, icon = '') => {
        return `<button class="px-4 py-2 rounded-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white transition" ${disabled ? 'disabled' : `onclick="(${fetchFunction})(${page})"`}>${icon}${text}</button>`;
    };

    const buttons = [
        createButton(number - 1, '', number === 0, '<i class="fas fa-chevron-left"></i>'),
        ...(startPage > 0 ? [createButton(0, '1'), ...(startPage > 1 ? ['<span class="px-4 py-2 text-gray-500">...</span>'] : [])] : []),
        ...Array.from({length: endPage - startPage}, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === number)),
        ...(endPage < totalPages ? [(endPage < totalPages - 1 ? '<span class="px-4 py-2 text-gray-500">...</span>' : ''), createButton(totalPages - 1, totalPages)] : []),
        createButton(number + 1, '', number === totalPages - 1, '<i class="fas fa-chevron-right"></i>')
    ];

    container.innerHTML = buttons.join('');
}

function toggleChartType() {
    const chartIcon = document.getElementById('chartIcon');
    const chartTypeLabel = document.getElementById('chartTypeLabel');

    if (chartType === 'bar') {
        chartType = 'line';
        chartIcon.className = 'fas fa-chart-line';
        chartTypeLabel.textContent = 'Line Chart';
    } else if (chartType === 'line') {
        chartType = 'pie';
        chartIcon.className = 'fas fa-chart-pie';
        chartTypeLabel.textContent = 'Pie Chart';
    } else {
        chartType = 'bar';
        chartIcon.className = 'fas fa-chart-bar';
        chartTypeLabel.textContent = 'Bar Chart';
    }

    // Reload analysis với chart type mới
    loadAnalysis(0);
}

function exportToCSV() {
    const period = document.getElementById("analysisPeriod").value;
    const url = period === 'all' ?
        `http://localhost:8080/budget/analysis?page=0&size=1000` :
        `http://localhost:8080/budget/analysis?period=${period}&page=0&size=1000`;
    apiRequest(url, {
        headers: {"userId": user.userId.toString()}
    })
        .then(response => response.json())
        .then(data => {
            if (data.result.content && data.result.content.length > 0) {
                const headers = ['Category', 'Period', 'Planned Amount', 'Actual Spending', 'Variance', 'Status'];
                const rows = data.result.content.map(budget => {
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

                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.join(','))
                ].join('\n');
                const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
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

function searchBudgets() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('#monitor-table-body tr').forEach(row => {
        const category = row.cells[0]?.textContent.toLowerCase();
        row.style.display = category && category.includes(searchTerm) ? '' : 'none';
    });
    document.querySelectorAll('#analysis-table tr').forEach(row => {
        const category = row.cells[0]?.textContent.toLowerCase();
        row.style.display = category && category.includes(searchTerm) ? '' : 'none';
    });
}

function setDefaultModalDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('update-startDate').value = today;
}

function setupEventListeners() {
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('searchInput').addEventListener('input', searchBudgets);

    document.getElementById('analysisPeriod').addEventListener('change', () => {
        chartType = 'bar';
        const chartIcon = document.getElementById('chartIcon');
        const chartTypeLabel = document.getElementById('chartTypeLabel');
        chartIcon.className = 'fas fa-chart-bar';
        chartTypeLabel.textContent = 'Bar Chart';
        loadAnalysis(0);
    });

    document.querySelectorAll('.fixed').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
}

window.addEventListener('load', () => {
    if (checkAuth()) {
        initializeUI();
    }
});