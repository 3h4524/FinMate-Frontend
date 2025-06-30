let currentPage = 0;
let totalPages = 0;

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update current date and time
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date-time').textContent = now.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'Asia/Ho_Chi_Minh'
    });
}

function saveFilters(startDate, endDate, entityType, adminId, keyword) {
    localStorage.setItem('logFilters', JSON.stringify({ startDate, endDate, entityType, adminId, keyword }));
}

function loadFilters() {
    const filters = JSON.parse(localStorage.getItem('logFilters') || '{}');
    document.getElementById('startDate').value = filters.startDate || '';
    document.getElementById('endDate').value = filters.endDate || '';
    document.getElementById('entityType').value = filters.entityType || '';
    document.getElementById('adminId').value = filters.adminId || '';
    document.getElementById('searchInput').value = filters.keyword || '';
    return filters;
}

async function loadStats(startDate = '', endDate = '') {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await apiRequest(`http://localhost:8080/api/admin/logs/stats?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load stats');
        const stats = await response.json();
        const data = stats.result;
        document.getElementById('totalLogs').textContent = data.totalLogs || 0;
        document.getElementById('actionStats').textContent = Object.values(data.actionStats || {}).reduce((sum, val) => sum + val, 0);
    } catch (error) {
        showNotification('Error', 'Failed to load stats. Please try again.', 'error');
        console.error('Error loading stats:', error);
    }
}

async function loadLogs(page = 0, size = 10, startDate = '', endDate = '', entityType = '', adminId = '', keyword = '') {
    try {
        const params = new URLSearchParams({ page, size });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (entityType) params.append('entityType', entityType);
        if (adminId) params.append('adminId', adminId);
        if (keyword) params.append('keyword', keyword);

        const response = await apiRequest(`http://localhost:8080/api/admin/logs?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        if (!data.result || !data.result.content) throw new Error('Data format incorrect');

        const logs = data.result.content;
        totalPages = data.result.totalPages;
        currentPage = page;

        const tbody = document.getElementById('logsBody');
        tbody.innerHTML = '';
        logs.forEach((log, index) => {
            const tr = document.createElement('tr');
            tr.className = 'table-row-hover';
            tr.innerHTML = `
                <td class="p-3">${index + 1 + page * size}</td>
                <td class="p-3">${log.adminId}</td>
                <td class="p-3">${log.action}</td>
                <td class="p-3">${log.entityType}</td>
                <td class="p-3">
                    <button class="action-icon view-icon mx-2" onclick="showLogDetails(${log.id})" title="View Details">
                        <i class="fas fa-eye text-teal-600 hover:text-teal-800"></i>
                    </button>
                    <button class="action-icon delete-icon mx-2" onclick="deleteLog(${log.id})" title="Delete">
                        <i class="fas fa-trash text-red-600 hover:text-red-800"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination();
        showNotification('Success', 'Logs loaded successfully!', 'success');
    } catch (error) {
        showNotification('Error', `Failed to load logs: ${error.message}`, 'error');
        console.error('Error loading logs:', error);
    }
}

async function refreshData() {
    const filters = loadFilters();
    await Promise.all([
        loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword),
        loadStats(filters.startDate, filters.endDate)
    ]);
}

async function showLogDetails(logId) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/logs/${logId}`);
        if (!response.ok) throw new Error('Failed to load log details');
        const log = await response.json();
        const logData = log.result;
        const timestamp = logData.createdAt ? 
            `${new Date(logData.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}<br>
            ${new Date(logData.createdAt).toLocaleDateString('vi-VN')}` : 'N/A';
        document.getElementById('logDetailsContent').innerHTML = `
            <div class="col-span-2 flex items-center gap-3 p-4 border rounded-lg bg-teal-50 shadow-sm">
                <i class="fas fa-id-badge text-teal-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Log ID</p>
                    <p class="font-semibold text-[var(--text-dark)]">${logData.id || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-lg bg-green-50 shadow-sm">
                <i class="fas fa-user text-green-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Admin ID</p>
                    <p class="font-semibold text-[var(--text-dark)]">${logData.adminId || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-lg bg-red-50 shadow-sm">
                <i class="fas fa-cog text-red-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Action</p>
                    <p class="font-semibold text-[var(--text-dark)]">${logData.action || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 shadow-sm">
                <i class="fas fa-folder text-yellow-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Entity Type</p>
                    <p class="font-semibold text-[var(--text-dark)]">${logData.entityType || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 shadow-sm">
                <i class="fas fa-tag text-blue-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Entity ID</p>
                    <p class="font-semibold text-[var(--text-dark)]">${logData.entityId || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 shadow-sm">
                <i class="fas fa-calendar-day text-gray-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Timestamp</p>
                    <p class="font-semibold text-[var(--text-dark)]">${timestamp}</p>
                </div>
            </div>
            <div class="col-span-2 flex items-start gap-3 p-4 border rounded-lg bg-purple-50 shadow-sm">
                <i class="fas fa-info-circle text-purple-600 text-lg"></i>
                <div>
                    <p class="text-sm text-[var(--text-light)]">Details</p>
                    <p class="font-semibold text-[var(--text-dark)]">${logData.details || 'N/A'}</p>
                </div>
            </div>
        `;
        const modal = document.getElementById('logDetailModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);
    } catch (error) {
        showNotification('Error', 'Failed to load log details. Please try again.', 'error');
        console.error('Error loading log details:', error);
    }
}

function closeLogDetails() {
    const modal = document.getElementById('logDetailModal');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
}

async function deleteLog(logId) {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/logs/${logId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        showNotification('Success', 'Log deleted successfully!', 'success');
        const filters = loadFilters();
        loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
    } catch (error) {
        showNotification('Error', 'Failed to delete log. Please try again.', 'error');
        console.error('Error deleting log:', error);
    }
}

function renderPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);
    startPage = Math.max(0, endPage - maxButtons);

    const createButton = (page, text, disabled = false) => {
        return `<button class="px-4 py-2 rounded-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white transition" ${disabled ? 'disabled' : `onclick="loadLogs(${page}, 10, loadFilters().startDate, loadFilters().endDate, loadFilters().entityType, loadFilters().adminId, loadFilters().keyword)"`}>${text}</button>`;
    };

    const buttons = [
        ...(startPage > 0 ? [createButton(0, '1'), ...(startPage > 1 ? ['<span class="px-4 py-2 text-gray-500">...</span>'] : [])] : []),
        ...Array.from({ length: endPage - startPage }, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === currentPage)),
        ...(endPage < totalPages ? [(endPage < totalPages - 1 ? '<span class="px-4 py-2 text-gray-500">...</span>' : ''), createButton(totalPages - 1, totalPages)] : []),
    ];

    pageNumbers.innerHTML = buttons.join('');
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages - 1;
}

document.addEventListener('DOMContentLoaded', async () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    if (!checkAuth()) return;

    const user = getCurrentUser();
    if (user) {
        const userInfo = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userInfo.name || userInfo.email?.split('@')[0] || 'Admin';
        loadSideBarSimple(userName);
        const filters = loadFilters();
        await loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
        await loadStats(filters.startDate, filters.endDate);
    }

    document.getElementById('searchInput').addEventListener('input', debounce(() => {
        const filters = loadFilters();
        loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
    }, 500));

    document.getElementById('filterBtn').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const entityType = document.getElementById('entityType').value;
        const adminId = document.getElementById('adminId').value;
        const keyword = document.getElementById('searchInput').value;
        saveFilters(startDate, endDate, entityType, adminId, keyword);
        loadLogs(0, 10, startDate, endDate, entityType, adminId, keyword);
        loadStats(startDate, endDate);
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            const filters = loadFilters();
            loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            const filters = loadFilters();
            loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
        }
    });

    document.getElementById('refreshBtn').addEventListener('click', refreshData);

    document.getElementById('exportBtn').addEventListener('click', async () => {
        try {
            const response = await apiRequest('http://localhost:8080/api/admin/logs/export', { responseType: 'blob' });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `admin_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Success', 'CSV exported successfully!', 'success');
        } catch (error) {
            showNotification('Error', 'Export failed. Please try again.', 'error');
            console.error('Error exporting file:', error);
        }
    });
});

function showNotification(title, message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const notificationCard = document.createElement('div');
    notificationCard.className = `mb-3 notification-slide-in ${type === 'error' ? 'bg-red-50 text-red-800' : type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`;
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
    }, 3000);
}

