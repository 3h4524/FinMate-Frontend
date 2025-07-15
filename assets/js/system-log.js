let currentPage = 0;
let totalPages = 0;

function saveFilters(startDate, endDate, entityType, adminId) {
    localStorage.setItem('logFilters', JSON.stringify({startDate, endDate, entityType, adminId}));
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
        const params = new URLSearchParams({page, size});
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (entityType) params.append('entityType', entityType);
        if (adminId) params.append('adminId', adminId);

        const response = await apiRequest(`http://localhost:8080/api/admin/logs?${params}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const {result: {content: logs, totalPages: pages}} = await response.json();

        if (!logs) throw new Error('Invalid data format');

        totalPages = pages;
        currentPage = page;

        document.getElementById('logsBody').innerHTML = logs.map(log => `
            <tr class="table-row-hover">
                <td class="px-4 py-3 whitespace-nowrap font-bold text-indigo-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-hashtag text-indigo-500"></i>
                        ${log.id}
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold text-green-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-user-shield text-green-500"></i>
                        ${log.adminId}
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold text-purple-700 uppercase">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-cog text-purple-500"></i>
                        ${log.action}
                    </div>
                </td>
                <td class="px-8 py-3 whitespace-nowrap text-blue-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-folder text-blue-500"></i>
                        ${log.entityType}
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded px-2 py-1 font-mono text-sm">
                        <i class="fas fa-calendar-alt text-indigo-500"></i>
                        ${formatTimestamp(log.createdAt)}
                    </span>
                </td>
                <td class="px-8 py-3 text-right whitespace-nowrap">
                    <button class="action-icon view-icon mx-2" onclick="showLogDetails(${log.id})" title="View Details">
                        <i class="fas fa-eye text-blue-600 hover:text-blue-800"></i>
                    </button>
                </td>
            </tr>
        `).join('');

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
    showNotification('Refresh Successful', 'Logs and statistics have been refreshed.', 'success');
}

async function showLogDetails(logId) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/admin/logs/${logId}`);
        if (!response.ok) throw new Error('Failed to load log details');
        const {result: logData} = await response.json();

        const fields = [
            {label: 'Log ID', icon: 'hashtag', color: 'indigo', value: logData.id},
            {label: 'Admin ID', icon: 'user-shield', color: 'green', value: logData.adminId},
            {label: 'Action', icon: 'cog', color: 'red', value: logData.action},
            {label: 'Entity Type', icon: 'folder', color: 'yellow', value: logData.entityType},
            {label: 'Entity ID', icon: 'tag', color: 'purple', value: logData.entityId},
            {label: 'Timestamp', icon: 'calendar-alt', color: 'blue', value: formatTimestamp(logData.createdAt)},
            {label: 'Details', icon: 'sticky-note', color: 'amber', value: logData.details}
        ];

        document.getElementById('logDetailsContent').innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${fields.map(({label, icon, color, value}) => `
                    <div class="p-3 bg-white rounded-lg shadow border-l-4 border-${color}-500">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fas fa-${icon} text-${color}-500 text-lg"></i>
                            <span class="text-xs text-gray-500 font-medium">${label}</span>
                        </div>
                        <div class="text-sm font-semibold text-${color}-700 break-all">${value || 'N/A'}</div>
                    </div>
                `).join('')}
            </div>
        `;

        const modal = document.getElementById('logDetailModal');
        modal.classList.replace('hidden', 'flex');
        setTimeout(() => modal.querySelector('.modal-content')?.classList.add('show'), 10);
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
        ...Array.from({length: endPage - startPage}, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === currentPage)),
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
            const response = await apiRequest('http://localhost:8080/api/admin/logs/export', {responseType: 'blob'});
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
    document.querySelectorAll('#startDate, #endDate, #entityType, #adminId').forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                document.getElementById('filterBtn').click();
            }
        });
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

function formatTimestamp(isoString, useBr = false) {
    if (!isoString) return 'N/A';
    if (isoString.includes('T')) {
        const [date, timeWithMs] = isoString.split('T');
        const time = timeWithMs.split('.')[0];
        return useBr ? `${time}<br>${date}` : `${date} ${time}`;
    }
    return isoString;
}