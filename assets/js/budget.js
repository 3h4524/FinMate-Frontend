let budgetChart = null;
let chartType = 'bar';
let budgetHistory = [];
let userId;
let monitorPage = 0;
let analysisPage = 0;
const pageSize = 10;

async function initializeUI() {
    await fetchUserId();
    await updateDateTime();
    await fetchUserData();
    await monitorBudgets(0);
    await loadAnalysis(0);
    await setDefaultModalDates();
    await addBudgetCategory();
    await setupEventListeners();
}

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date-time').textContent = now.toLocaleString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'Asia/Ho_Chi_Minh'
    });
    setTimeout(updateDateTime, 60000);
}

function fetchUserData() {
    document.getElementById('userName').textContent = 'Khách';
    document.getElementById('userAvatar').src = 'https://via.placeholder.com/40';
}

function showProfile() {
    alert('Chức năng xem hồ sơ chưa được triển khai.');
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

function addBudgetCategory() {
    const categoryList = document.getElementById('category-list');
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 mb-2';
    row.innerHTML = `
            <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
                <option value="">Chọn danh mục</option>
                <option value="6">Ăn uống</option>
                <option value="7">Mua sắm</option>
                <option value="8">Di chuyển</option>
                <option value="9">Nhà cửa</option>
                <option value="10">Giải trí</option>
                <option value="11">Sức khỏe</option>
                <option value="12">Giáo dục</option>
                <option value="13">Hóa đơn</option>
                <option value="14">Khác</option>
            </select>
            <input type="number" name="amounts[]" step="0.01" min="0" placeholder="Số tiền ($)" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
            <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700" onclick="removeBudgetCategory(this)">×</button>
        `;
    categoryList.appendChild(row);
}

function removeBudgetCategory(button) {
    const categoryList = document.getElementById('category-list');
    if (categoryList.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('Phải có ít nhất một danh mục.');
    }
}

function addUpdateBudgetCategory() {
    const categoryList = document.getElementById('update-category-list');
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 mb-2';
    row.innerHTML = `
            <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
                <option value="">Chọn danh mục</option>
                <option value="6">Ăn uống</option>
                <option value="7">Mua sắm</option>
                <option value="8">Di chuyển</option>
                <option value="9">Nhà cửa</option>
                <option value="10">Giải trí</option>
                <option value="11">Sức khỏe</option>
                <option value="12">Giáo dục</option>
                <option value="13">Hóa đơn</option>
                <option value="14">Khác</option>
            </select>
            <input type="number" name="amounts[]" step="0.01" min="0" placeholder="Số tiền ($)" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
            <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700" onclick="removeUpdateBudgetCategory(this)">×</button>
        `;
    categoryList.appendChild(row);
}

function removeUpdateBudgetCategory(button) {
    const categoryList = document.getElementById('update-category-list');
    if (categoryList.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('Phải có ít nhất một danh mục.');
    }
}

document.getElementById("create-budget-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = {
        periodType: formData.get('periodType'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        threshold: parseInt(formData.get('threshold')),
        categories: formData.getAll('categories[]').map((category, index) => ({
            category, amount: parseFloat(formData.getAll('amounts[]')[index])
        }))
    };

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate <= startDate) { alert("Ngày kết thúc phải sau ngày bắt đầu."); return; }
    if (startDate < today) { alert("Ngày bắt đầu phải là hôm nay hoặc trong tương lai."); return; }
    if (!data.periodType) { alert("Vui lòng chọn kỳ ngân sách."); return; }
    if (data.categories.some(cat => !cat.category || cat.amount <= 0)) { alert("Vui lòng điền đầy đủ danh mục và số tiền hợp lệ."); return; }

    const categoryMap = {
        "Ăn uống": 6,
        "Mua sắm": 7,
        "Di chuyển": 8,
        "Nhà cửa": 9,
        "Giải trí": 10,
        "Sức khỏe": 11,
        "Giáo dục": 12,
        "Hóa đơn": 13,
        "Khác": 14
    };
    for (const cat of data.categories) {
        const categoryId = parseInt(cat.category);
        if (!categoryId || !categoryMap[Object.keys(categoryMap).find(key => categoryMap[key] === categoryId)]) {
            alert(`Danh mục không hợp lệ: ${cat.category}`);
            return;
        }

        const budgetData = {
            userId, categoryId, userCategoryId: null, amount: cat.amount,
            periodType: data.periodType, startDate: data.startDate, endDate: data.endDate,
            notificationThreshold: data.threshold
        };
        try {
            const response = await fetch('http://localhost:8080/budget', {
                method: "POST",
                headers: { "Content-Type": "application/json", "userId": userId.toString() },
                body: JSON.stringify(budgetData)
            });
            const responseData = await response.json();
            if (!response.ok || responseData.code !== 1000) {
                alert(`Lỗi khi tạo ngân sách cho ${Object.keys(categoryMap).find(key => categoryMap[key] === categoryId)}: ${responseData.message || "Lỗi không xác định"}`);
                return;
            }
            budgetHistory.push({ ...budgetData, categoryName: Object.keys(categoryMap).find(key => categoryMap[key] === categoryId) });
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi mạng. Vui lòng kiểm tra kết nối.");
            return;
        }
    }

    alert("Kế hoạch ngân sách được tạo thành công!");
    this.reset();
    closeModal('createBudgetModal');
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
        endDate: formData.get('endDate'),
        threshold: parseInt(formData.get('threshold')),
        categories: formData.getAll('categories[]').map((category, index) => ({
            category, amount: parseFloat(formData.getAll('amounts[]')[index])
        }))
    };

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate <= startDate) { alert("Ngày kết thúc phải sau ngày bắt đầu."); return; }
    if (startDate < today) { alert("Ngày bắt đầu phải là hôm nay hoặc trong tương lai."); return; }
    if (!data.periodType) { alert("Vui lòng chọn kỳ ngân sách."); return; }
    if (data.categories.some(cat => !cat.category || cat.amount <= 0)) { alert("Vui lòng điền đầy đủ danh mục và số tiền hợp lệ."); return; }

    const categoryMap = {
        "Ăn uống": 6,
        "Mua sắm": 7,
        "Di chuyển": 8,
        "Nhà cửa": 9,
        "Giải trí": 10,
        "Sức khỏe": 11,
        "Giáo dục": 12,
        "Hóa đơn": 13,
        "Khác": 14
    };
    const budgetData = {
        userId,
        categoryId: parseInt(data.categories[0].category),
        userCategoryId: null,
        amount: data.categories[0].amount,
        periodType: data.periodType,
        startDate: data.startDate,
        endDate: data.endDate,
        notificationThreshold: data.threshold
    };


    try {
        const response = await fetch(`http://localhost:8080/budget/${budgetId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "userId": userId.toString() },
            body: JSON.stringify(budgetData)
        });
        const responseData = await response.json();
        if (!response.ok || responseData.code !== 1000) {
            alert(`Lỗi khi cập nhật ngân sách: ${responseData.message || "Lỗi không xác định"}`);
            return;
        }
        alert("Kế hoạch ngân sách được cập nhật thành công!");
        closeModal('updateBudgetModal');
        monitorBudgets(0);
        loadAnalysis(0);
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Lỗi mạng. Vui lòng kiểm tra kết nối.");
    }
});

async function monitorBudgets(page) {
    monitorPage = page;
    const monitorTableBody = document.getElementById("monitor-table-body");
    const toastContainer = document.getElementById("toastContainer");
    const paginationContainer = document.getElementById("monitor-pagination");
    monitorTableBody.innerHTML = '<tr><td colspan="5" class="p-3"><i class="fas fa-spinner fa-spin"></i> Đang tải ngân sách...</td></tr>';
    toastContainer.innerHTML = '';
    paginationContainer.innerHTML = '';

    try {
        const response = await fetch(`http://localhost:8080/budget/list?page=${page}&size=${pageSize}`, { headers: { "userId": userId.toString() } });
        const data = await response.json();
        if (response.ok && data.result.content.length > 0) {
            monitorTableBody.innerHTML = '';
            data.result.content.forEach(budget => {
                const usagePercent = budget.percentageUsed.toFixed(2);
                const remaining = budget.amount - (budget.currentSpending || 0);
                let progressClass = 'bg-green-500';
                let statusText = 'Đúng tiến độ';

                if (usagePercent >= 100) {
                    progressClass = 'bg-red-500';
                    statusText = 'Vượt ngân sách';
                    showToast(`Vượt ngân sách: ${budget.categoryName}`, 'danger');
                } else if (usagePercent >= budget.notificationThreshold) {
                    progressClass = 'bg-yellow-500';
                    statusText = 'Gần giới hạn';
                    showToast(`Cảnh báo: ${budget.categoryName}`, 'warning');
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                        <td class="p-3">${budget.categoryName}</td>
                        <td class="p-3">${usagePercent}%</td>
                        <td class="p-3">
                            <div class="w-full max-w-[180px] h-2 bg-gray-200 rounded-full mx-auto">
                                <div class="${progressClass} h-full rounded-full" style="width: ${Math.min(usagePercent, 100)}%"></div>
                            </div>
                        </td>
                        <td class="p-3">${formatCurrency(remaining)}</td>
                        <td class="p-3">
                            <button onclick="viewBudgetDetails(${budget.id}, '${budget.categoryName}', ${budget.amount}, ${budget.currentSpending}, ${budget.notificationThreshold}, '${budget.startDate}', '${budget.endDate}', '${budget.periodType}')" class="text-teal-600 hover:text-teal-800 mr-2"><i class="fas fa-eye"></i></button>
                            <button onclick="openUpdateModal(${budget.id}, '${budget.periodType}', '${budget.startDate}', '${budget.endDate}', ${budget.notificationThreshold}, '${budget.categoryName}', ${budget.amount})" class="text-blue-600 hover:text-blue-800 mr-2"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteBudget(${budget.id})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                monitorTableBody.appendChild(row);
            });

            renderPagination(paginationContainer, data.result, monitorBudgets);
        } else {
            monitorTableBody.innerHTML = '<tr><td colspan="5" class="p-3">Không tìm thấy ngân sách nào.</td></tr>';
        }
    } catch (error) {
        console.error("Lỗi:", error);
        monitorTableBody.innerHTML = '<tr><td colspan="5" class="p-3 text-red-600">Lỗi khi tải ngân sách. Vui lòng thử lại.</td></tr>';
    }
}

async function fetchUserId() {
    console.log("Đang lấy user id");
    try {

        userId = 1;
        console.log("user id: ", userId);
    } catch (error) {
        console.log(error);
    }
}

function showToast(message, type) {
    const toastContainer = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `p-2 rounded text-sm bg-${type === 'warning' ? 'yellow' : 'red'}-100 text-${type === 'warning' ? 'yellow' : 'red'}-700 flex items-center gap-1 mb-1 animate-fade-in-out`;
    toast.innerHTML = `<i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function viewBudgetDetails(id, categoryName, amount, currentSpending, threshold, startDate, endDate, periodType) {
    const usagePercent = (currentSpending / amount * 100).toFixed(2) || 0;
    const remaining = amount - (currentSpending || 0);
    const detailsContent = `
            <div class="p-4 bg-teal-50 rounded-lg border border-teal-100">
                <p><strong class="text-teal-700">Danh mục:</strong> <span class="text-teal-800">${categoryName}</span></p>
            </div>
            <div class="p-4 bg-green-50 rounded-lg border border-green-100">
                <p><strong class="text-green-700">Số tiền Ngân sách:</strong> <span class="text-green-800">${formatCurrency(amount)}</span></p>
            </div>
            <div class="p-4 bg-red-50 rounded-lg border border-red-100">
                <p><strong class="text-red-700">Chi tiêu Hiện tại:</strong> <span class="text-red-800">${formatCurrency(currentSpending || 0)}</span></p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p><strong class="text-yellow-700">Phần trăm Sử dụng:</strong> <span class="text-yellow-800">${usagePercent}%</span></p>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p><strong class="text-blue-700">Ngưỡng Cảnh báo:</strong> <span class="text-blue-800">${threshold}%</span></p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p><strong class="text-gray-700">Ngày Bắt đầu:</strong> <span class="text-gray-800">${startDate}</span></p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p><strong class="text-gray-700">Ngày Kết thúc:</strong> <span class="text-gray-800">${endDate}</span></p>
            </div>
            <div class="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p><strong class="text-purple-700">Kỳ hạn:</strong> <span class="text-purple-800">${periodType === 'DAILY' ? 'Hàng ngày' : periodType === 'WEEKLY' ? 'Hàng tuần' : periodType === 'MONTHLY' ? 'Hàng tháng' : 'Hàng năm'}</span></p>
            </div>
            <div class="p-4 bg-green-50 rounded-lg border border-green-100">
                <p><strong class="text-green-700">Còn lại:</strong> <span class="text-green-800">${formatCurrency(remaining)}</span></p>
            </div>
        `;
    document.getElementById('budgetDetailsContent').innerHTML = detailsContent;
    openModal('budgetDetailsModal');
}

function openUpdateModal(budgetId, periodType, startDate, endDate, threshold, categoryName, amount) {
    document.getElementById('update-budget-id').value = budgetId;
    document.getElementById('update-periodType').value = periodType;
    document.getElementById('update-startDate').value = startDate;
    document.getElementById('update-endDate').value = endDate;
    document.getElementById('update-threshold').value = threshold;

    const categoryList = document.getElementById('update-category-list');
    categoryList.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 mb-2';
    row.innerHTML = `
            <select name="categories[]" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
                <option value="">Chọn danh mục</option>
                <option value="6" ${categoryName === 'Ăn uống' ? 'selected' : ''}>Ăn uống</option>
                <option value="7" ${categoryName === 'Mua sắm' ? 'selected' : ''}>Mua sắm</option>
                <option value="8" ${categoryName === 'Di chuyển' ? 'selected' : ''}>Di chuyển</option>
                <option value="9" ${categoryName === 'Nhà cửa' ? 'selected' : ''}>Nhà cửa</option>
                <option value="10" ${categoryName === 'Giải trí' ? 'selected' : ''}>Giải trí</option>
                <option value="11" ${categoryName === 'Sức khỏe' ? 'selected' : ''}>Sức khỏe</option>
                <option value="12" ${categoryName === 'Giáo dục' ? 'selected' : ''}>Giáo dục</option>
                <option value="13" ${categoryName === 'Hóa đơn' ? 'selected' : ''}>Hóa đơn</option>
                <option value="14" ${categoryName === 'Khác' ? 'selected' : ''}>Khác</option>
            </select>
            <input type="number" name="amounts[]" step="0.01" min="0" value="${amount}" class="flex-1 p-3 border border-gray-300 rounded-lg focus:border-green-600 focus:ring-2 focus:ring-green-300" required>
            <button type="button" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700" onclick="removeUpdateBudgetCategory(this)">×</button>
        `;
    categoryList.appendChild(row);
    openModal('updateBudgetModal');
}

async function deleteBudget(budgetId) {
    if (confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) {
        try {
            const response = await fetch(`http://localhost:8080/budget/${budgetId}`, {
                method: "DELETE",
                headers: { "userId": userId.toString() }
            });
            if (response.ok) {
                alert("Ngân sách đã được xóa thành công!");
                monitorBudgets(0);
                loadAnalysis(0);
            } else {
                const errorData = await response.json();
                alert(`Lỗi khi xóa ngân sách: ${errorData.message || "Lỗi không xác định"}`);
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi mạng. Vui lòng kiểm tra kết nối.");
        }
    }
}

async function loadAnalysis(page) {
    analysisPage = page;
    const table = document.getElementById("analysis-table");
    const period = document.getElementById("analysisPeriod").value;
    const paginationContainer = document.getElementById("analysis-pagination");
    table.innerHTML = '<tr><td colspan="5" class="p-3"><i class="fas fa-spinner fa-spin"></i> Đang tải phân tích...</td></tr>';
    paginationContainer.innerHTML = '';
    document.getElementById('totalBudgeted').textContent = '$0';
    document.getElementById('totalSpent').textContent = '$0';
    document.getElementById('varianceAmount').textContent = '$0';
    document.getElementById('spendingRate').textContent = '0%';

    try {
        const response = await fetch(`http://localhost:8080/budget/analysis?period=${period}&page=${page}&size=${pageSize}`, { headers: { "userId": userId.toString() } });
        const data = await response.json();
        if (response.ok && data.result.content.length > 0) {
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
                const statusText = usagePercent >= 100 ? 'Vượt ngân sách' : usagePercent >= budget.notificationThreshold ? 'Gần giới hạn' : 'Đúng tiến độ';
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
                        { label: 'Ngân sách', data: plannedData, backgroundColor: 'rgba(46, 125, 50, 0.6)', borderColor: 'rgba(46, 125, 50, 1)', borderWidth: 1 },
                        { label: 'Thực tế', data: actualData, backgroundColor: 'rgba(211, 47, 47, 0.6)', borderColor: 'rgba(211, 47, 47, 1)', borderWidth: 1 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Số tiền ($)' } },
                        x: { title: { display: true, text: period.includes('day') ? 'Giờ' : period.includes('week') ? 'Ngày' : period.includes('month') ? 'Tuần' : 'Tháng' } }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: `Ngân sách so với Thực tế - ${period === 'current_day' ? 'Ngày' : period === 'current_week' ? 'Tuần' : period === 'current_month' ? 'Tháng' : 'Năm'}` }
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
                    { label: 'Ngân sách vs Thực tế', data: [totalBudgeted, totalSpent], backgroundColor: ['rgba(46, 125, 50, 0.6)', 'rgba(211, 47, 47, 0.6)'], borderColor: ['rgba(46, 125, 50, 1)', 'rgba(211, 47, 47, 1)'], borderWidth: 1 }
                ];
                chartConfig.data.labels = ['Ngân sách', 'Thực tế'];
                chartConfig.options.scales = {};
            }

            budgetChart = new Chart(ctx, chartConfig);

            renderPagination(paginationContainer, data.result, loadAnalysis);
        } else {
            table.innerHTML = '<tr><td colspan="5" class="p-3">Không có dữ liệu ngân sách cho kỳ đã chọn.</td></tr>';
            if (budgetChart) { budgetChart.destroy(); budgetChart = null; }
        }
    } catch (error) {
        console.error("Lỗi:", error);
        table.innerHTML = '<tr><td colspan="5" class="p-3 text-red-600">Lỗi khi tải phân tích. Vui lòng thử lại.</td></tr>';
        if (budgetChart) { budgetChart.destroy(); budgetChart = null; }
    }
}

function renderPagination(container, pageData, fetchFunction) {
    container.innerHTML = '';
    const { number, totalPages } = pageData;
    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.className = `px-4 py-2 rounded-lg ${number === 0 ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'} text-white`;
    prevButton.disabled = number === 0;
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Trước';
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
    nextButton.innerHTML = 'Tiếp <i class="fas fa-chevron-right"></i>';
    nextButton.onclick = () => fetchFunction(number + 1);
    container.appendChild(nextButton);
}

function toggleChartType() {
    const chartIcon = document.getElementById('chartIcon');
    const chartTypeLabel = document.getElementById('chartTypeLabel');
    if (chartType === 'bar') {
        chartType = 'line';
        chartIcon.className = 'fas fa-chart-line';
        chartTypeLabel.textContent = 'Biểu đồ Đường';
    } else if (chartType === 'line') {
        chartType = 'pie';
        chartIcon.className = 'fas fa-chart-pie';
        chartTypeLabel.textContent = 'Biểu đồ Tròn';
    } else {
        chartType = 'bar';
        chartIcon.className = 'fas fa-chart-bar';
        chartTypeLabel.textContent = 'Biểu đồ Cột';
    }
    loadAnalysis(analysisPage);
}

function exportToCSV() {
    const period = document.getElementById("analysisPeriod").value;
    fetch(`http://localhost:8080/budget/analysis?period=${period}&page=${analysisPage}&size=${pageSize}`, { headers: { "userId": userId.toString() } })
        .then(response => response.json())
        .then(data => {
            if (data.result.content && data.result.content.length > 0) {
                const headers = ['Danh mục', 'Số tiền Kế hoạch', 'Chi tiêu Thực tế', 'Chênh lệch', 'Trạng thái'];
                const rows = data.result.content.map(budget => {
                    const usagePercent = (budget.actualSpending / budget.plannedAmount * 100).toFixed(2) || 0;
                    const variance = budget.plannedAmount - (budget.actualSpending || 0);
                    const status = usagePercent >= 100 ? 'Vượt ngân sách' : usagePercent >= budget.notificationThreshold ? 'Gần giới hạn' : 'Đúng tiến độ';
                    return [budget.categoryName || budget.userCategoryName, budget.plannedAmount.toFixed(2), (budget.actualSpending || 0).toFixed(2), variance.toFixed(2), status];
                });

                const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `phan_tich_ngan_sach_${period}_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
            } else {
                alert('Không có dữ liệu để xuất.');
            }
        })
        .catch(error => {
            console.error('Lỗi xuất CSV:', error);
            alert('Lỗi khi xuất dữ liệu. Vui lòng thử lại.');
        });
}

function viewBudgetHistory() {
    loadBudgetHistory();
    openModal('budgetHistoryModal');
}

function loadBudgetHistory() {
    const tableBody = document.getElementById('budget-history-table');
    tableBody.innerHTML = budgetHistory.length ? '' : '<tr><td colspan="4" class="p-3">Không có lịch sử ngân sách.</td></tr>';
    budgetHistory.forEach(budget => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td class="p-3">${budget.periodType === 'DAILY' ? 'Hàng ngày' : budget.periodType === 'WEEKLY' ? 'Hàng tuần' : budget.periodType === 'MONTHLY' ? 'Hàng tháng' : 'Hàng năm'}</td>
                <td class="p-3">${budget.categoryName}</td>
                <td class="p-3">${formatCurrency(budget.amount)}</td>
                <td class="p-3">${budget.startDate} đến ${budget.endDate}</td>
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
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
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
window.onload = initializeUI;