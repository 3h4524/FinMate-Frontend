
let currentPage = 0;
let totalPages = 0;

// Update current date and time
function updateDateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); // e.g., "09:16"
    document.getElementById('current-date-time').innerHTML = `
        <div>${time}</div>
        <div>${day}, ${date} ${month}, ${year}</div>
    `;
}

document.addEventListener('DOMContentLoaded', async () => {
    updateDateTime();
    if (!checkAuth()) return;

    const user = getCurrentUser();
    if (user) {
        const userInfo = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userInfo.name || userInfo.email?.split('@')[0] || 'Admin';
        loadSideBarSimple(userName);
        await loadLogs();
    }
});

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

        const tbody = document.getElementById('logsBody');
        tbody.innerHTML = '';
        logs.forEach((log, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-4">${index + 1}</td>
                <td class="p-4">${log.id}</td>
                <td class="p-4">${log.action}</td>
                <td class="p-4">${log.entityType}</td>
                <td class="p-4">${log.entityId || 'N/A'}</td>
                <td class="p-4">${log.createdAt ? `
                    <div>${new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>${new Date(log.createdAt).toLocaleDateString('vi-VN')}</div>
                ` : 'N/A'}</td>
                <td class="p-4">${log.details || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination();
        showNotification('Logs loaded successfully', 'success');
    } catch (error) {
        showNotification(`Failed to load logs: ${error.message}`, 'error');
        console.error('Error loading logs:', error);
    }
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i + 1;
        button.className = `px-3 py-1 ${i === currentPage ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg hover:bg-green-600 hover:text-white transition`;
        button.onclick = () => {
            currentPage = i;
            loadLogs(currentPage, 10);
        };
        pagination.appendChild(button);
    }
}

document.getElementById('filterBtn')?.addEventListener('click', () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const entityType = document.getElementById('entityType').value;
    const adminId = document.getElementById('adminId').value;
    loadLogs(0, 10, startDate, endDate, entityType, adminId);
});

document.getElementById('exportBtn')?.addEventListener('click', async () => {
    try {
        const response = await apiRequest('http://localhost:8080/api/admin/logs/export', { responseType: 'blob' });
        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'admin_logs.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Export successful', 'success');
    } catch (error) {
        showNotification('Export failed. Please try again.', 'error');
        console.error('Error exporting file:', error);
    }
});

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    notificationMessage.textContent = message;
    notification.className = `fixed top-5 right-5 p-4 rounded-lg shadow-md text-sm z-50 ${type === 'success' ? 'bg-green-100 text-green-800 notification-slide-in' : 'bg-red-100 text-red-700 notification-slide-in'}`;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('notification-slide-out');
        setTimeout(() => notification.classList.add('hidden'), 300);
    }, 3000);
}
