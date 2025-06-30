let currentPage = 0;
let totalPages = 0;
const pageSize = 10;

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
    hideMainContent();
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const response = await apiRequest(`http://localhost:8080/api/admin/logs/stats?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load stats');
        
        const stats = await response.json();
        const data = stats.result;
        
        // Update statistics cards
        document.getElementById('totalLogs').textContent = data.totalLogs || 0;
        document.getElementById('actionStats').textContent = Object.values(data.actionStats || {}).reduce((sum, val) => sum + val, 0);
        
        // Calculate today's logs (if API doesn't provide this, we'll estimate)
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todayParams = new URLSearchParams(params);
        todayParams.set('startDate', todayString);
        todayParams.set('endDate', todayString);
        
        try {
            const todayResponse = await apiRequest(`http://localhost:8080/api/admin/logs/stats?${todayParams.toString()}`);
            const todayData = await todayResponse.json();
            document.getElementById('todayLogs').textContent = todayData.result?.totalLogs || 0;
        } catch {
            document.getElementById('todayLogs').textContent = '0';
        }
        
        // Calculate recent logs (last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentParams = new URLSearchParams();
        recentParams.set('startDate', oneHourAgo.toISOString());
        recentParams.set('endDate', today.toISOString());
        
        try {
            const recentResponse = await apiRequest(`http://localhost:8080/api/admin/logs/stats?${recentParams.toString()}`);
            const recentData = await recentResponse.json();
            document.getElementById('recentLogs').textContent = recentData.result?.totalLogs || 0;
        } catch {
            document.getElementById('recentLogs').textContent = '0';
        }
        
        showMainContent();
    } catch (error) {
        showMainContent();
        showNotification('Error', 'Failed to load stats. Please try again.', 'error');
        console.error('Error loading stats:', error);
        
        // Set default values on error
        document.getElementById('totalLogs').textContent = '0';
        document.getElementById('actionStats').textContent = '0';
        document.getElementById('todayLogs').textContent = '0';
        document.getElementById('recentLogs').textContent = '0';
    }
}

async function loadLogs(page = 0, size = 10, startDate = '', endDate = '', entityType = '', adminId = '', keyword = '') {
    hideMainContent();
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
        
        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center space-y-2">
                            <i class="fas fa-inbox text-4xl text-gray-300"></i>
                            <p class="text-lg font-medium">No logs found</p>
                            <p class="text-sm">Try adjusting your search filters</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            logs.forEach((log, index) => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 transition-colors';
                
                // Format timestamp
                const timestamp = log.createdAt ? new Date(log.createdAt) : null;
                const timeString = timestamp ? 
                    `${timestamp.toLocaleDateString('en-US')} ${timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 
                    'N/A';
                
                // Create admin name/badge
                const adminDisplay = log.adminId ? 
                    `<div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            A${log.adminId}
                        </div>
                        <span class="text-sm font-medium text-gray-900">Admin ${log.adminId}</span>
                    </div>` : 'N/A';
                
                // Create action badge
                const actionColor = getActionColor(log.action);
                const actionBadge = `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${actionColor}">
                    ${log.action || 'Unknown'}
                </span>`;
                
                // Create entity type badge
                const entityColor = getEntityColor(log.entityType);
                const entityBadge = `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${entityColor}">
                    ${log.entityType || 'Unknown'}
                </span>`;

                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">#${log.id || (index + 1 + page * size)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${adminDisplay}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${actionBadge}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${entityBadge}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${timeString}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button class="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 hover:scale-105" onclick="showLogDetails(${log.id})" title="View Details">
                            <i class="fas fa-eye mr-1"></i>
                            View
                        </button>
                        <button class="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-xl text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105" onclick="deleteLog(${log.id})" title="Delete">
                            <i class="fas fa-trash mr-1"></i>
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        updatePaginationInfo(logs.length, data.result.totalElements, page, size);
        renderPagination();
        showNotification('Success', 'Logs loaded successfully!', 'success');
        showMainContent();
    } catch (error) {
        showMainContent();
        showNotification('Error', `Failed to load logs: ${error.message}`, 'error');
        console.error('Error loading logs:', error);
    }
}

function getActionColor(action) {
    const colorMap = {
        'CREATE': 'bg-green-100 text-green-800',
        'UPDATE': 'bg-blue-100 text-blue-800',
        'DELETE': 'bg-red-100 text-red-800',
        'LOGIN': 'bg-indigo-100 text-indigo-800',
        'LOGOUT': 'bg-gray-100 text-gray-800'
    };
    return colorMap[action?.toUpperCase()] || 'bg-gray-100 text-gray-800';
}

function getEntityColor(entityType) {
    const colorMap = {
        'USER': 'bg-purple-100 text-purple-800',
        'TRANSACTION': 'bg-amber-100 text-amber-800',
        'BUDGET': 'bg-green-100 text-green-800',
        'GOAL': 'bg-blue-100 text-blue-800',
        'SYSTEM': 'bg-gray-100 text-gray-800'
    };
    return colorMap[entityType?.toUpperCase()] || 'bg-gray-100 text-gray-800';
}

function updatePaginationInfo(currentPageItems, totalItems, page, size) {
    const showingFrom = totalItems === 0 ? 0 : (page * size) + 1;
    const showingTo = Math.min((page + 1) * size, totalItems);
    
    document.getElementById('showingFrom').textContent = showingFrom;
    document.getElementById('showingTo').textContent = showingTo;
    document.getElementById('totalResults').textContent = totalItems;
}

async function refreshData() {
    hideMainContent();
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
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;

    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);
    startPage = Math.max(0, endPage - maxButtons);

    const createButton = (page, text, disabled = false, current = false) => {
        const baseClasses = 'relative inline-flex items-center px-4 py-2 border text-sm font-medium';
        let classes = baseClasses;
        
        if (current) {
            classes += ' z-10 bg-indigo-50 border-indigo-500 text-indigo-600';
        } else if (disabled) {
            classes += ' bg-gray-50 border-gray-300 text-gray-300 cursor-not-allowed';
        } else {
            classes += ' bg-white border-gray-300 text-gray-500 hover:bg-gray-50';
        }
        
        const onclick = disabled || current ? '' : `onclick="loadLogsForPage(${page})"`;
        return `<button class="${classes}" ${onclick} ${disabled ? 'disabled' : ''}>${text}</button>`;
    };

    // Previous button
    pagination.innerHTML += createButton(
        currentPage - 1, 
        '<i class="fas fa-chevron-left"></i>', 
        currentPage === 0
    );

    // First page
    if (startPage > 0) {
        pagination.innerHTML += createButton(0, '1');
        if (startPage > 1) {
            pagination.innerHTML += '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>';
        }
    }

    // Page numbers
    for (let i = startPage; i < endPage; i++) {
        pagination.innerHTML += createButton(i, i + 1, false, i === currentPage);
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pagination.innerHTML += '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>';
        }
        pagination.innerHTML += createButton(totalPages - 1, totalPages);
    }

    // Next button
    pagination.innerHTML += createButton(
        currentPage + 1, 
        '<i class="fas fa-chevron-right"></i>', 
        currentPage >= totalPages - 1
    );

    // Update mobile pagination buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 0;
        prevBtn.className = `relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage === 0 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
        }`;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages - 1;
        nextBtn.className = `ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage >= totalPages - 1 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
        }`;
    }
}

function loadLogsForPage(page) {
    const filters = loadFilters();
    loadLogs(page, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
}

// Remove the old DOMContentLoaded since it's now handled in the HTML file
// The new structure uses async loading with page loader

// Function to setup event listeners (called from HTML)
function setupSystemLogEventListeners() {
    document.getElementById('searchInput')?.addEventListener('input', debounce(() => {
        const filters = loadFilters();
        loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
    }, 500));

    document.getElementById('filterBtn')?.addEventListener('click', () => {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const entityType = document.getElementById('entityType').value;
        const adminId = document.getElementById('adminId').value;
        const keyword = document.getElementById('searchInput').value;
        saveFilters(startDate, endDate, entityType, adminId, keyword);
        loadLogs(0, 10, startDate, endDate, entityType, adminId, keyword);
        loadStats(startDate, endDate);
    });

    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            const filters = loadFilters();
            loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
        }
    });

    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            const filters = loadFilters();
            loadLogs(currentPage, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword);
        }
    });

    document.getElementById('refreshBtn')?.addEventListener('click', refreshData);

    document.getElementById('exportBtn')?.addEventListener('click', async () => {
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing system log page...');
    
    try {
        // Check authentication first
        const user = getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            console.log('[AUTH] Access denied: User does not have ADMIN role');
            alert('Access denied. This page is only available for administrators.');
            window.location.href = '../home';
            return;
        }

        // Load sidebar and header first to avoid flash
        if (typeof loadSideBarSimple === 'function') {
            await loadSideBarSimple();
        } else {
            console.error('loadSideBarSimple function not found');
        }
        
        if (typeof loadHeader === 'function') {
            await loadHeader();
        } else {
            console.error('loadHeader function not found');
        }
        
        // Show main content after loading sidebar/header
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'flex';
        }
        
        // Hide page loader if exists
        const pageLoader = document.getElementById('page-loader');
        if (pageLoader) {
            pageLoader.style.display = 'none';
        }

        // Setup event listeners
        setupSystemLogEventListeners();
        
        // Update current date/time
        updateSystemLogDateTime();
        setInterval(updateSystemLogDateTime, 60000); // Update every minute

        // Load initial data
        const filters = loadFilters ? loadFilters() : {};
        await Promise.all([
            loadLogs(0, 10, filters.startDate, filters.endDate, filters.entityType, filters.adminId, filters.keyword),
            loadStats(filters.startDate, filters.endDate)
        ]);

        console.log('System log page initialized successfully');
    } catch (error) {
        console.error('Error initializing system log page:', error);
    }
});

function updateSystemLogDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const dateTimeElement = document.getElementById('current-date-time');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

function closeLogDetails() {
    const modal = document.getElementById('logDetailModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Expose functions for global access
window.loadLogs = loadLogs;
window.loadStats = loadStats;
window.setupSystemLogEventListeners = setupSystemLogEventListeners;
window.closeLogDetails = closeLogDetails;
window.showLogDetails = showLogDetails;
window.deleteLog = deleteLog;
window.loadLogsForPage = loadLogsForPage;

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

// Thêm hàm show/hide mainContent
function showMainContent() {
    document.getElementById('mainContent').style.display = '';
}
function hideMainContent() {
    document.getElementById('mainContent').style.display = 'none';
}