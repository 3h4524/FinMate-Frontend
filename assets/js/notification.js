let notifications = [];

async function loadNotification() {
    let notificationContainer = document.getElementById('notificationContainer');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-all duration-300';
        document.body.appendChild(notificationContainer);
    }

    notificationContainer.classList.remove('hidden');

    notificationContainer.innerHTML = `
        <div class="p-4 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-lg">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    🔔 Notifications
                </h3>
            </div>
            <div class="max-h-96 overflow-y-auto space-y-3 pr-2">
                ${notifications.length > 0 ? notifications.map(notification => `
                    <div class="p-3 rounded-xl shadow-sm border hover:shadow-md transition flex justify-between items-start 
                        ${notification.type === 'Goal' ? 'bg-blue-50 border-blue-200' : ''} 
                        ${notification.type === 'Spending' ? 'bg-red-50 border-red-200' : ''}">
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">${notification.title}</p>
                            <p class="text-sm text-gray-600">${notification.message}</p>
                            <p class="text-xs text-gray-400 mt-1">Type: ${notification.type}</p>
                        </div>
                        <button onclick="deleteNotification(${notification.notificationId})" 
                            class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-lg font-semibold text-sm ml-3 transition hover:from-indigo-600 hover:to-purple-700">
                            Mark as Read
                        </button>
                    </div>
                `).join('') : `
                    <p class="text-sm text-gray-500 text-center py-6">No notifications available</p>
                `}
            </div>
        </div>
    `;
}

document.addEventListener('click', function (e) {
    const notificationContainer = document.getElementById('notificationContainer');
    const buttonNotification = document.getElementById('buttonNotification');
    if (notificationContainer && buttonNotification &&
        !notificationContainer.contains(e.target) &&
        !buttonNotification.contains(e.target)) {
        notificationContainer.classList.add('hidden');
    }
});

window.deleteNotification = async function (notificationId) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/notifications/${notificationId}`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            throw new Error(response.message);
        }
        await fetchNotifications();
        loadNotification();
        loadNumberOfNotification();
    } catch (error) {
        console.error('Error deleting notification:', error);
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            notificationContainer.innerHTML = `
                <div class="p-4">
                    <p class="text-sm text-red-500 text-center">Failed to delete notification</p>
                </div>
            `;
            notificationContainer.classList.remove('hidden');
        }
    }
};

// Initialize
window.addEventListener('load', () => {
    console.log('Notification script loaded');
    initNotification();
});

async function initNotification() {
    await fetchNotifications();
    loadNumberOfNotification();
}

async function fetchNotifications() {
    try {
        const response = await apiRequest(`http://localhost:8080/api/notifications`);
        const data = await response.json();

        if (data.code === 1000) {
            notifications = data.result;
            loadNumberOfNotification();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error fetching notifications:', error.message);
    }
}

function loadNumberOfNotification() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (notifications.length > 0) {
            badge.textContent = notifications.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}