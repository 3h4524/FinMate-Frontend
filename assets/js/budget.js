let budgetChart = null;
let chartType = 'bar';
let budgetHistory = [];
let user;
let monitorPage = 0;
let analysisPage = 0;
const pageSize = 10;

async function initializeUI() {
    await fetchUser();
    await updateDateTime();
    await monitorBudgets(0);
    await loadAnalysis(0);
    await setDefaultModalDates();
    await addBudgetCategory();
    await setupEventListeners();
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date-time').textContent = now.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'Asia/Ho_Chi_Minh'
    });
    setTimeout(updateDateTime, 60000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar').classList.toggle('translate-x-0');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.getElementById(modalId).classList.add('flex');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (modalId === 'createBudgetModal') {
        document.getElementById('create-budget-form').reset();
        document.getElementById('category-list').innerHTML = '';
        addBudgetCategory();
        setDefaultModalDates();
    } else if (modalId === 'updateBudgetModal') {
        document.getElementById('update-budget-form').reset();
        document.getElementById('update-category-list').innerHTML = '';
    }
}

function addBudgetCategory(type = 'create') {
    const categoryList = document.getElementById(type === 'create' ? 'category-list' : 'update-category-list');
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 mb-2';
    row.innerHTML = `
        <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
            <option value="">Select Category</option>
            <option value="6">Food & Dining</option>
            <option value="7">Shopping</option>
            <option value="8">Transportation</option>
            <option value="9">Housing</option>
            <option value="10">Entertainment</option>
            <option value="11">Health</option>
            <option value="12">Education</option>
            <option value="13">Bills</option>
            <option value="14">Others</option>  
        </select>
        <input type="number" name="amounts[]" step="0.01" min="0" placeholder="Amount ($)" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
        <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700" onclick="removeBudgetCategory(this, '${type}')">×</button>
    `;
    categoryList.appendChild(row);
}

function removeBudgetCategory(button, type = 'create') {
    const categoryList = document.getElementById(type === 'create' ? 'category-list' : 'update-category-list');
    if (categoryList.children.length > 1) {
        button.parentElement.remove();
    } else {
        showAlert('At least one category is required.', 'error');
    }
}

function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    const alertBar = document.createElement('div');
    alertBar.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg max-w-md w-full transition-all duration-300 alert-slide-in ${type === 'error' ? 'bg-red-600 text-white' :
            type === 'warning' ? 'bg-yellow-600 text-white' :
                'bg-green-600 text-white'
        }`;

    alertBar.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' :
            type === 'warning' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />' :
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'}
                </svg>
                <span class="font-medium">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `;

    alertContainer.appendChild(alertBar);
    setTimeout(() => {
        alertBar.classList.remove('alert-slide-in');
        alertBar.classList.add('alert-slide-out');
        setTimeout(() => alertBar.remove(), 300);
    }, 3000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.className = 'fixed top-0 left-0 w-full z-50 pointer-events-none';
    document.body.appendChild(container);
    return container;
}

document.getElementById("create-budget-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {
        periodType: formData.get('periodType'),
        startDate: formData.get('startDate'),
        threshold: parseInt(formData.get('threshold')),
        categories: formData.getAll('categories[]').map((category, index) => ({
            category, amount: parseFloat(formData.getAll('amounts[]')[index])
        }))
    };

    const startDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
        showAlert("Start date must be today or in the future.", 'error');
        return;
    }
    if (!data.periodType) {
        showAlert("Please select a budget period.", 'error');
        return;
    }
    if (data.categories.some(cat => !cat.category || cat.amount <= 0)) {
        showAlert("Please fill in all categories and valid amounts.", 'error');
        return;
    }

    const categoryMap = {
        "Food & Dining": 6,
        "Shopping": 7,
        "Transportation": 8,
        "Housing": 9,
        "Entertainment": 10,
        "Health": 11,
        "Education": 12,
        "Bills": 13,
        "Others": 14
    };
    for (const cat of data.categories) {
        const categoryId = parseInt(cat.category);
        const budgetData = {
            userId: user.userId, categoryId, userCategoryId: null, amount: cat.amount,
            periodType: data.periodType, startDate: data.startDate,
            notificationThreshold: data.threshold
        };
        try {
            const response = await apiRequest('http://localhost:8080/budget', {
                method: "POST",
                headers: { "Content-Type": "application/json", "userId": user.userId.toString() },
                body: JSON.stringify(budgetData)
            });
            const responseData = await response.json();
            if (!response.ok || responseData.code !== 1000) {
                showNotification(`Error creating budget for ${Object.keys(categoryMap).find(key => categoryMap[key] === categoryId)}`, responseData.message || "Unknown error", 'error');
                return;
            }
            budgetHistory.push({ ...budgetData, categoryName: Object.keys(categoryMap).find(key => categoryMap[key] === categoryId) });
        } catch (error) {
            console.error("Error:", error);
            showNotification('Network Error', 'Please check your connection.', 'error');
            return;
        }
    }

    showNotification('Success', 'Budget plan created successfully!', 'success');
    this.reset();
    closeModal('createBudgetModal');
    document.getElementById('analysisPeriod').value = data.periodType.toLowerCase();
    monitorBudgets(0);
    loadAnalysis(0);
});

document.getElementById("update-budget-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const budgetId = document.getElementById('update-budget-id').value;
    const formData = new FormData(this);
    const data = {
        periodType: formData.get('periodType'),
        startDate: formData.get('startDate'),
        threshold: parseInt(formData.get('threshold')),
        categories: formData.getAll('categories[]').map((category, index) => ({
            category, amount: parseFloat(formData.getAll('amounts[]')[index])
        }))
    };

    const startDate = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
        showAlert("Start date must be today or in the future.", 'error');
        return;
    }
    if (!data.periodType) {
        showAlert("Please select a budget period.", 'error');
        return;
    }
    if (data.categories.some(cat => !cat.category || cat.amount <= 0)) {
        showAlert("Please fill in all categories and valid amounts.", 'error');
        return;
    }

    const categoryMap = {
        "Food & Dining": 6,
        "Shopping": 7,
        "Transportation": 8,
        "Housing": 9,
        "Entertainment": 10,
        "Health": 11,
        "Education": 12,
        "Bills": 13,
        "Others": 14
    };

    try {
        for (const cat of data.categories) {
            const categoryId = parseInt(cat.category);
            const budgetData = {
                userId: user.userId,
                categoryId,
                userCategoryId: null,
                amount: cat.amount,
                periodType: data.periodType,
                startDate: data.startDate,
                notificationThreshold: data.threshold
            };

            const response = await apiRequest(`http://localhost:8080/budget/${budgetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "userId": user.userId.toString() },
                body: JSON.stringify(budgetData)
            });
            const responseData = await response.json();
            if (!response.ok || responseData.code !== 1000) {
                showNotification('Error', `Error updating budget: ${responseData.message || "Unknown error"}`, 'error');
                return;
            }
        }
        showNotification('Success', 'Budget plan updated successfully!', 'success');
        closeModal('updateBudgetModal');
        monitorBudgets(0);
        loadAnalysis(0);
    } catch (error) {
        console.error("Error:", error);
        showNotification('Network Error', 'Please check your connection.', 'error');
    }
});

async function monitorBudgets(page) {
    monitorPage = page;
    const monitorTableBody = document.getElementById("monitor-table-body");
    const paginationContainer = document.getElementById("monitor-pagination");
    monitorTableBody.innerHTML = '<tr><td colspan="5" class="p-3"><i class="fas fa-spinner fa-spin"></i> Loading budgets...</td></tr>';
    paginationContainer.innerHTML = '';

    try {
        const response = await apiRequest(`http://localhost:8080/budget/list?page=${page}&size=${pageSize}`);
        const data = await response.json();
        console.log("View: ", data);
        console.log("View details: ", data.result.content);
        if (response.ok && data.result.content.length > 0) {
            monitorTableBody.innerHTML = '';
            data.result.content.forEach(budget => {
                console.log("bud: ", budget);
                const usagePercent = budget.percentageUsed.toFixed(2);
                const remaining = budget.amount - (budget.currentSpending || 0);
                let progressClass = 'bg-green-500';
                let statusText = 'On Track';

                if (usagePercent >= 100) {
                    progressClass = 'bg-red-500';
                    statusText = 'Over Budget';
                    showNotification('Warning', `Over budget: ${budget.categoryName || budget.userCategoryName}`, 'error');
                } else if (usagePercent >= budget.notificationThreshold) {
                    progressClass = 'bg-yellow-500';
                    statusText = 'Near Limit';
                    showNotification('Warning', `Near limit: ${budget.categoryName || budget.userCategoryName}`, 'warning');
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-3">${budget.categoryName || budget.userCategoryName}</td>
                    <td class="p-3">${usagePercent}%</td>
                    <td class="p-3">
                        <div class="w-full max-w-[180px] h-2 bg-gray-200 rounded-full mx-auto">
                            <div class="${progressClass} h-full rounded-full" style="width: ${Math.min(usagePercent, 100)}%"></div>
                        </div>
                    </td>
                    <td class="p-3">${formatCurrency(remaining)}</td>
                    <td class="p-3">
                        <button onclick="viewBudgetDetails(${budget.id}, '${budget.categoryName || budget.userCategoryName}', ${budget.amount}, ${budget.currentSpending}, ${budget.notificationThreshold}, '${budget.startDate}', '${budget.endDate}', '${budget.periodType}')" class="text-teal-600 hover:text-teal-800 mr-2"><i class="fas fa-eye"></i></button>
                        <button onclick="openUpdateModal(${budget.id}, '${budget.periodType}', '${budget.startDate}', ${budget.notificationThreshold}, '${budget.categoryName || budget.userCategoryName}', ${budget.amount})" class="text-blue-600 hover:text-blue-800 mr-2"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteBudget(${budget.id})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                monitorTableBody.appendChild(row);
            });

            renderPagination(paginationContainer, data.result, monitorBudgets);
        } else {
            monitorTableBody.innerHTML = '<tr><td colspan="5" class="p-3">No budgets found.</td></tr>';
        }
    } catch (error) {
        console.error("Error:", error);
        monitorTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-red-600">Error loading budgets. Please try again.</td></tr>';
        showNotification('Error', 'Error loading budgets. Please try again.', 'error');
    }
}

async function fetchUser() {
    console.log("Fetching user ");
    try {
        user = getCurrentUser();
        console.log("user id: ", user.userId);
    } catch (error) {
        console.log(error);
    }
}

function showNotification(title, message, type) {
    const toastContainer = document.getElementById("toastContainer");
    const notificationCard = document.createElement("div");
    notificationCard.id = "progressNotificationCard";
    notificationCard.className = `mb-6 notification-slide-in ${type === 'error' ? 'bg-red-50 text-red-800' : type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`;

    const iconPath = type === 'error' ?
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' :
        type === 'warning' ?
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />' :
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';

    notificationCard.innerHTML = `
        <div id="notificationContent" class="rounded-xl p-5 shadow-sm transition-all duration-300">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <svg id="notificationIcon" class="w-6 h-6 ${type === 'error' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-green-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${iconPath}
                    </svg>
                </div>
                <div class="ml-4 flex-1">
                    <div class="flex items-center justify-between">
                        <h3 id="notificationTitle" class="text-lg font-semibold">${title}</h3>
                    </div>
                    <p id="notificationMessage" class="mt-1">${message}</p>
                    <div id="notificationActions" class="mt-3 flex items-center space-x-3 hidden">
                        <button id="addContributionBtn" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:text-gray-700 disabled:cursor-not-allowed disabled:opacity-75">
                            Add Contribution
                        </button>
                        <button id="modifyGoalBtn" class="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Modify Goal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    toastContainer.appendChild(notificationCard);
    setTimeout(() => {
        notificationCard.classList.remove('notification-slide-in');
        notificationCard.classList.add('notification-slide-out');
        setTimeout(() => notificationCard.remove(), 300);
    }, 1000);
}

function viewBudgetDetails(id, categoryName, amount, currentSpending, threshold, startDate, endDate, periodType) {
    const usagePercent = (currentSpending / amount * 100).toFixed(2) || 0;
    const remaining = amount - (currentSpending || 0);

    const detailsContent = `
        <div class="col-span-2 flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <i class="fas fa-tag text-teal-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Category</p>
                <p class="font-semibold text-teal-800">${categoryName}</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-green-50">
            <i class="fas fa-wallet text-green-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Budget</p>
                <p class="font-semibold text-green-800">${formatCurrency(amount)}</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-red-50">
            <i class="fas fa-money-bill-wave text-red-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Current Spending</p>
                <p class="font-semibold text-red-800">${formatCurrency(currentSpending || 0)}</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50">
            <i class="fas fa-percentage text-yellow-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Usage Percentage</p>
                <p class="font-semibold text-yellow-800">${usagePercent}%</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-blue-50">
            <i class="fas fa-bell text-blue-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Alert Threshold</p>
                <p class="font-semibold text-blue-800">${threshold}%</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <i class="fas fa-calendar-day text-gray-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Start Date</p>
                <p class="font-semibold text-gray-800">${startDate}</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            <i class="fas fa-calendar-check text-gray-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">End Date</p>
                <p class="font-semibold text-gray-800">${endDate}</p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-purple-50">
            <i class="fas fa-sync-alt text-purple-600 text-lg"></i>
            <div>
                <p class="text-sm text-gray-500">Period</p>
                <p class="font-semibold text-purple-800">
                    ${periodType === 'WEEKLY' ? 'Weekly' :
            periodType === 'MONTHLY' ? 'Monthly' :
                'Yearly'}
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3 p-3 border rounded-lg bg-emerald-50">
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

async function openUpdateModal(budgetId, periodType, startDate, threshold) {
    document.getElementById('update-budget-id').value = budgetId;
    document.getElementById('update-periodType').value = periodType;
    document.getElementById('update-startDate').value = startDate;
    document.getElementById('update-threshold').value = threshold;

    const categoryList = document.getElementById('update-category-list');
    categoryList.innerHTML = '';

    try {
        const response = await apiRequest(`http://localhost:8080/budget/${budgetId}`, {});
        const budgetData = await response.json();
        console.log("budgetdata: ", budgetData);
        if (response.ok && budgetData.result) {
            const budget = budgetData.result;
            console.log("res: ", budget);

            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 mb-2';
            row.innerHTML = `
                <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
                    <option value="">Select Category</option>
                    <option value="6" ${budget.categoryId === 6 ? 'selected' : ''}>Food & Dining</option>
                    <option value="7" ${budget.categoryId === 7 ? 'selected' : ''}>Shopping</option>
                    <option value="8" ${budget.categoryId === 8 ? 'selected' : ''}>Transportation</option>
                    <option value="9" ${budget.categoryId === 9 ? 'selected' : ''}>Housing</option>
                    <option value="10" ${budget.categoryId === 10 ? 'selected' : ''}>Entertainment</option>
                    <option value="11" ${budget.categoryId === 11 ? 'selected' : ''}>Health</option>
                    <option value="12" ${budget.categoryId === 12 ? 'selected' : ''}>Education</option>
                    <option value="13" ${budget.categoryId === 13 ? 'selected' : ''}>Bills</option>
                    <option value="14" ${budget.categoryId === 14 ? 'selected' : ''}>Others</option>
                </select>
                <input type="number" name="amounts[]" step="0.01" min="0" value="${budget.amount}" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
                <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700" onclick="removeBudgetCategory(this, 'update')">×</button>
            `;
            categoryList.appendChild(row);
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification('Error', 'Unable to load budget information.', 'error');
    }

    openModal('updateBudgetModal');
}

async function deleteBudget(budgetId) {
    if (confirm('Are you sure you want to delete this budget?')) {
        try {
            const response = await apiRequest(`http://localhost:8080/budget/${budgetId}`, {
                method: "DELETE",
                headers: { "userId": user.userId.toString() }
            });
            if (response.ok) {
                showNotification('Success', 'Budget deleted successfully!', 'success');
                monitorBudgets(0);
                loadAnalysis(0);
            } else {
                const errorData = await response.json();
                showNotification('Error', `Error deleting budget: ${errorData.message || "Unknown error"}`, 'error');
            }
        } catch (error) {
            console.error("Error:", error);
            showNotification('Network Error', 'Please check your connection.', 'error');
        }
    }
}

async function loadAnalysis(page) {
    analysisPage = page;
    const table = document.getElementById("analysis-table");
    const period = document.getElementById("analysisPeriod").value;
    const paginationContainer = document.getElementById("analysis-pagination");
    table.innerHTML = '<tr><td colspan="5" class="p-3"><i class="fas fa-spinner fa-spin"></i> Loading analysis...</td></tr>';
    paginationContainer.innerHTML = '';
    document.getElementById('totalBudgeted').textContent = '$0';
    document.getElementById('totalSpent').textContent = '$0';
    document.getElementById('varianceAmount').textContent = '$0';
    document.getElementById('spendingRate').textContent = '0%';

    try {
        const response = await apiRequest(`http://localhost:8080/budget/analysis?period=${period}&page=${page}&size=${pageSize}`, {
            headers: { "userId": user.userId.toString() }
        });
        const data = await response.json();
        if (response.ok && data.result.content.length > 0) {
            document.querySelector('.h-64').classList.remove('hidden');
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
            const chartConfig = {
                data: {
                    labels: chartLabels,
                    datasets: [
                        { label: 'Budget', data: plannedData, backgroundColor: 'rgba(46, 125, 50, 0.6)', borderColor: 'rgba(46, 125, 50, 1)', borderWidth: 1 },
                        { label: 'Actual', data: actualData, backgroundColor: 'rgba(211, 47, 47, 0.6)', borderColor: 'rgba(211, 47, 47, 1)', borderWidth: 1 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } },
                        x: { title: { display: true, text: period.includes('day') ? 'Hour' : period.includes('week') ? 'Day' : period.includes('month') ? 'Week' : 'Month' } }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: `Budget vs Actual - ${period === 'current_day' ? 'Day' : period === 'current_week' ? 'Week' : period === 'current_month' ? 'Month' : 'Year'}` }
                    }
                }
            };

            if (chartType === 'bar') {
                chartConfig.type = 'bar';
            } else if (chartType === 'line') {
                chartConfig.type = 'line';
                chartConfig.data.datasets.forEach(dataset => {
                    dataset.fill = false;
                    dataset.tension = 0.1;
                });
            } else if (chartType === 'pie') {
                chartConfig.type = 'pie';
                chartConfig.data.datasets = [
                    { label: 'Budget vs Actual', data: [totalBudgeted, totalSpent], backgroundColor: ['rgba(46, 125, 50, 0.6)', 'rgba(211, 47, 47, 0.6)'], borderColor: ['rgba(46, 125, 50, 1)', 'rgba(211, 47, 47, 1)'], borderWidth: 1 }
                ];
                chartConfig.data.labels = ['Budget', 'Actual'];
                chartConfig.options.scales = {};
            }

            budgetChart = new Chart(ctx, chartConfig);

            renderPagination(paginationContainer, data.result, loadAnalysis);
        } else {
            table.innerHTML = '<tr><td colspan="5" class="p-3 italic text-gray-500">No budget data for the selected period.</td></tr>';
            if (budgetChart) { budgetChart.destroy(); budgetChart = null; }

            document.querySelector('.h-64').classList.add('hidden');
            document.querySelector('.grid').classList.add('hidden');
        }

    } catch (error) {
        console.error("Error:", error);
        table.innerHTML = '<tr><td colspan="5" class="p-3 text-red-600">Error loading analysis. Please try again.</td></tr>';
        if (budgetChart) { budgetChart.destroy(); budgetChart = null; }
        showNotification('Error', 'Error loading analysis. Please try again.', 'error');
    }
}

function renderPagination(container, pageData, fetchFunction) {
    container.innerHTML = '';
    const { number, totalPages } = pageData;
    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.className = `px-4 py-2 rounded-lg ${number === 0 ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'} text-white`;
    prevButton.disabled = number === 0;
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevButton.onclick = () => fetchFunction(number - 1);
    container.appendChild(prevButton);

    for (let i = 0; i < totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `px-4 py-2 rounded-lg ${i === number ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white`;
        pageButton.textContent = i + 1;
        pageButton.onclick = () => fetchFunction(i);
        container.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.className = `px-4 py-2 rounded-lg ${number === totalPages - 1 ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'} text-white`;
    nextButton.disabled = number === totalPages - 1;
    nextButton.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextButton.onclick = () => fetchFunction(number + 1);
    container.appendChild(nextButton);
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
    loadAnalysis(analysisPage);
}

function exportToCSV() {
    const period = document.getElementById("analysisPeriod").value;
    fetch(`http://localhost:8080/budget/analysis?period=${period}&page=${analysisPage}&size=${pageSize}`, {
        headers: { "userId": user.userId.toString() }
    })
        .then(response => response.json())
        .then(data => {
            if (data.result.content && data.result.content.length > 0) {
                const headers = ['Category', 'Planned Amount', 'Actual Spending', 'Variance', 'Status'];
                const rows = data.result.content.map(budget => {
                    const usagePercent = (budget.actualSpending / budget.plannedAmount * 100).toFixed(2) || 0;
                    const variance = budget.plannedAmount - (budget.actualSpending || 0);
                    const status = usagePercent >= 100 ? 'Over Budget' : usagePercent >= budget.notificationThreshold ? 'Near Limit' : 'On Track';
                    return [budget.categoryName || budget.userCategoryName, budget.plannedAmount.toFixed(2), (budget.actualSpending || 0).toFixed(2), variance.toFixed(2), status];
                });

                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `budget_analysis_${period}_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
            } else {
                showNotification('Error', 'No data to export.', 'error');
            }
        })
        .catch(error => {
            console.error('Error exporting CSV:', error);
            showNotification('Error', 'Error exporting data. Please try again.', 'error');
        });
}

function viewBudgetHistory() {
    loadBudgetHistory();
    openModal('budgetHistoryModal');
}

function loadBudgetHistory() {
    const tableBody = document.getElementById('budget-history-table');
    tableBody.innerHTML = budgetHistory.length ? '' : '<tr><td colspan="4" class="p-3">No budget history.</td></tr>';
    budgetHistory.forEach(budget => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-3">${budget.periodType === 'WEEKLY' ? 'Weekly' : budget.periodType === 'MONTHLY' ? 'Monthly' : 'Yearly'}</td>
            <td class="p-3">${budget.categoryName}</td>
            <td class="p-3">${formatCurrency(budget.amount)}</td>
            <td class="p-3">${budget.startDate} to ${budget.endDate}</td>
        `;
        tableBody.appendChild(row);
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

function searchBudgetHistory() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    document.querySelectorAll('#budget-history-table tr').forEach(row => {
        const category = row.cells[1]?.textContent.toLowerCase();
        row.style.display = category && category.includes(searchTerm) ? '' : 'none';
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function setDefaultModalDates() {
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
}

function setupEventListeners() {
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('searchInput').addEventListener('input', searchBudgets);
    document.getElementById('historySearch').addEventListener('input', searchBudgetHistory);
    document.getElementById('analysisPeriod').addEventListener('change', () => loadAnalysis(0));
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