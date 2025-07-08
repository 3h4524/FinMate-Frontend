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


function saveFilters(startDate, endDate, entityType, adminId) {
    localStorage.setItem('logFilters', JSON.stringify({ startDate, endDate, entityType, adminId }));
}

function loadFilters() {
    const filters = JSON.parse(localStorage.getItem('logFilters') || '{}');
    document.getElementById('startDate').value = filters.startDate || '';
    document.getElementById('endDate').value = filters.endDate || '';
    document.getElementById('entityType').value = filters.entityType || '';
    document.getElementById('adminId').value = filters.adminId || '';
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
        document.getElementById('actionStats').textContent = data.totalAdmins || 0;
    } catch (error) {
        showNotification('Error', 'Failed to load stats. Please try again.', 'error');
        console.error('Error loading stats:', error);
    }
}

async function loadLogs(page = 0, size = 10, startDate = '', endDate = '', entityType = '', adminId = '') {
    try {
        const params = new URLSearchParams({ page, size });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (entityType) params.append('entityType', entityType);
        if (adminId) params.append('adminId', adminId);

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
    <td class="px-6 py-4 whitespace-nowrap">${log.id}</td>
    <td class="px-6 py-4 whitespace-nowrap">${log.adminId}</td>
    <td class="px-6 py-4 whitespace-nowrap">${log.action}</td>
    <td class="px-6 py-4 whitespace-nowrap">${log.entityType}</td>
    <td class="px-6 py-4 whitespace-nowrap">${formatTimestamp(log.createdAt)}</td>
    <td class="px-6 py-4 text-right whitespace-nowrap">
        <button class="action-icon view-icon mx-2" onclick="showLogDetails(${log.id})" title="View Details">
            <i class="fas fa-eye text-blue-600 hover:text-blue-800"></i>
        </button>
    </td>
`;
            tbody.appendChild(tr);
        });

        renderPagination();
    } catch (error) {
        showNotification('Load Failed', `Failed to load logs: ${error.message}`, 'error');
        console.error('Error loading logs:', error);
    }
}

async function refreshData() {
    const filters = loadFilters();
    await Promise.all([
        loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId),
        loadStats(filters.startDate, filters.endDate)
    ]);
}

async function showLogDetails(logId) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/logs/${logId}`);
        if (!response.ok) throw new Error('Failed to load log details');
        const log = await response.json();
        const logData = log.result;
        document.getElementById('logDetailsContent').innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-indigo-500">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-hashtag text-indigo-500 text-xl"></i><span class="text-xs text-gray-500 font-medium">Log ID</span></div>
                        <div class="text-lg font-bold text-indigo-700 break-all">${logData.id || 'N/A'}</div>
                    </div>
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-green-500">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-user-shield text-green-500 text-xl"></i><span class="text-xs text-gray-500 font-medium">Admin ID</span></div>
                        <div class="text-lg font-bold text-green-700 break-all">${logData.adminId || 'N/A'}</div>
                    </div>
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-red-500">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-cog text-red-500 text-xl"></i><span class="text-xs text-gray-500 font-medium">Action</span></div>
                        <div class="text-lg font-bold text-red-700 break-all">${logData.action || 'N/A'}</div>
                    </div>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-yellow-400">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-folder text-yellow-400 text-xl"></i><span class="text-xs text-gray-500 font-medium">Entity Type</span></div>
                        <div class="text-lg font-bold text-yellow-700 break-all">${logData.entityType || 'N/A'}</div>
                    </div>
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-purple-500">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-tag text-purple-500 text-xl"></i><span class="text-xs text-gray-500 font-medium">Entity ID</span></div>
                        <div class="text-lg font-bold text-purple-700 break-all">${logData.entityId || 'N/A'}</div>
                    </div>
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-blue-500">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-calendar-alt text-blue-500 text-xl"></i><span class="text-xs text-gray-500 font-medium">Timestamp</span></div>
                        <div class="text-lg font-bold text-blue-700 break-all">${formatTimestamp(logData.createdAt)}</div>
                    </div>
                    <div class="flex flex-col items-start p-4 bg-white rounded-2xl shadow border-l-4 border-amber-500">
                        <div class="flex items-center gap-2 mb-2"><i class="fas fa-sticky-note text-amber-500 text-xl"></i><span class="text-xs text-gray-500 font-medium">Details</span></div>
                        <div class="text-lg font-bold text-amber-700 break-all">${logData.details || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
        const modal = document.getElementById('logDetailModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.querySelector('.modal-content')?.classList?.add('show'), 10);
    } catch (error) {
        showNotification('Load Failed', 'Failed to load log details. Please try again.', 'error');
        console.error('Error loading log details:', error);
    }
}

function closeLogDetails() {
    const modal = document.getElementById('logDetailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function renderPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    pageNumbers.innerHTML = '';
    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);
    startPage = Math.max(0, endPage - maxButtons);

    const createButton = (page, text, disabled = false) => {
        return `<button class="px-4 py-2 rounded-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white transition" ${disabled ? 'disabled' : `onclick="loadLogs(${page}, 10, loadFilters().startDate, loadFilters().endDate, loadFilters().entityType, loadFilters().adminId)"`}>${text}</button>`;
    };

    const buttons = [
        ...(startPage > 0 ? [createButton(0, '1'), ...(startPage > 1 ? ['<span class="px-4 py-2 text-gray-500">...</span>'] : [])] : []),
        ...Array.from({ length: endPage - startPage }, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === currentPage)),
        ...(endPage < totalPages ? [(endPage < totalPages - 1 ? '<span class="px-4 py-2 text-gray-500">...</span>' : ''), createButton(totalPages - 1, totalPages)] : []),
    ];

    pageNumbers.innerHTML = buttons.join('');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    if (user) {
        const userInfo = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userInfo.name || userInfo.email?.split('@')[0] || 'Admin';
        loadSideBarSimple(userName);
        const filters = loadFilters();
        await loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId);
        await loadStats(filters.startDate, filters.endDate);
    }

    document.getElementById('filterBtn').addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const entityType = document.getElementById('entityType').value;
        const adminId = document.getElementById('adminId').value;
        saveFilters(startDate, endDate, entityType, adminId);
        loadLogs(0, 10, startDate, endDate, entityType, adminId);
        loadStats(startDate, endDate);
        showNotification('Filter Applied', 'Log filters have been applied.', 'success');
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            const filters = loadFilters();
            loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            const filters = loadFilters();
            loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId);
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
            showNotification('Export Successful', 'CSV file has been downloaded.', 'success');
        } catch (error) {
            showNotification('Export Failed', 'Failed to export CSV. Please try again.', 'error');
            console.error('Error exporting file:', error);
        }
    });

    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('entityType').value = '';
        document.getElementById('adminId').value = '';
        saveFilters('', '', '', '');
        loadLogs(0, 10, '', '', '', '');
        loadStats('', '');
        showNotification('Filters Cleared', 'All log filters have been reset.', 'info');
    });

    // Ensure close buttons work even if rendered dynamically
    document.addEventListener('click', function (e) {
        if (
            (e.target.closest && e.target.closest('#logDetailModal .fa-times')) ||
            (e.target.closest && e.target.closest('#logDetailModal button') && e.target.textContent.includes('Close'))
        ) {
            closeLogDetails();
        }
    });

    // Inject notification animation CSS if not present
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.innerHTML = `
        .fade-in {
            opacity: 0;
            transform: translateY(-16px);
            animation: fadeInNotif 0.4s forwards;
        }
        .fade-out {
            opacity: 1;
            transform: translateY(0);
            animation: fadeOutNotif 0.3s forwards;
        }
        @keyframes fadeInNotif {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes fadeOutNotif {
            to {
                opacity: 0;
                transform: translateY(-16px);
            }
        }
        `;
        document.head.appendChild(style);
    }

    // Enable pressing Enter in filter inputs to trigger Apply Filters
    ['startDate', 'endDate', 'entityType', 'adminId'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    document.getElementById('filterBtn').click();
                }
            });
        }
    });
});

function showNotification(title, message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const notificationCard = document.createElement('div');
    // Color and icon by type
    const typeStyles = {
        error: {
            border: 'border-l-4 border-red-500',
            icon: '<i class="fas fa-times-circle text-red-500 text-lg"></i>'
        },
        warning: {
            border: 'border-l-4 border-yellow-400',
            icon: '<i class="fas fa-exclamation-triangle text-yellow-500 text-lg"></i>'
        },
        success: {
            border: 'border-l-4 border-green-500',
            icon: '<i class="fas fa-check-circle text-green-500 text-lg"></i>'
        },
        info: {
            border: 'border-l-4 border-blue-500',
            icon: '<i class="fas fa-info-circle text-blue-500 text-lg"></i>'
        }
    };
    const style = typeStyles[type] || typeStyles.info;
    notificationCard.className = `flex items-start gap-3 bg-white shadow-lg rounded-xl p-4 mb-3 fade-in ${style.border}`;
    notificationCard.innerHTML = `
        <div class="flex-shrink-0 mt-0.5">${style.icon}</div>
        <div class="flex-1">
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">${title}</h3>
                <button class="ml-2 text-gray-400 hover:text-gray-600 text-lg font-bold leading-none focus:outline-none" aria-label="Close notification" tabindex="0">&times;</button>
            </div>
            <div class="mt-1 text-gray-700 text-sm">${message}</div>
        </div>
    `;
    // Close on click X
    notificationCard.querySelector('button').onclick = () => {
        notificationCard.classList.remove('fade-in');
        notificationCard.classList.add('fade-out');
        setTimeout(() => notificationCard.remove(), 300);
    };
    // Auto-dismiss after 4s
    setTimeout(() => {
        notificationCard.classList.remove('fade-in');
        notificationCard.classList.add('fade-out');
        setTimeout(() => notificationCard.remove(), 300);
    }, 4000);
    toastContainer.appendChild(notificationCard);
}

function formatTimestamp(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const time = date.toLocaleTimeString('en-GB', { hour12: false });
    const day = date.toLocaleDateString('en-CA');
    return `${time}<br>${day}`;
}