async function loadNotification() {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    notificationContainer.className = 'hidden absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10';
    document.body.appendChild(notificationContainer);

    const userId = 1; // Replace with actual user ID from your auth system
    const isVisible = !notificationContainer.classList.contains('hidden');

    if (isVisible) {
        notificationContainer.classList.add('hidden');
        return;
    }

    try {
        const response = await apiRequest(`${API_BASE_URL}/api/notifications/${userId}`);
        const data = await response.json();
        if (data.code === 1000) {
            const notifications = data.result;

            notificationContainer.innerHTML = `
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Notifications</h3>
                    <div class="max-h-96 overflow-y-auto">
                        ${notifications.length > 0 ? notifications.map(notification => `
                            <div class="py-2 border-b border-gray-100 last:border-b-0">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-sm font-medium text-gray-800">${notification.title}</p>
                                        <p class="text-sm text-gray-600">${notification.message}</p>
                                        <p class="text-xs text-gray-400">${notification.type}</p>
                                    </div>
                                    <button onclick="deleteNotification(${notification.notificationId})" 
                                            class="text-red-500 hover:text-red-700 text-sm">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        `).join('') : `
                            <p class="text-sm text-gray-500 text-center py-4">No notifications</p>
                        `}
                    </div>
                </div>
            `;

            notificationContainer.classList.remove('hidden');
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error fetching notifications:', error);
        notificationContainer.innerHTML = `
                <div class="p-4">
                    <p class="text-sm text-red-500 text-center">Error loading notifications</p>
                </div>
            `;
        notificationContainer.classList.remove('hidden');
    }
}

// Close notification when clicking outside
document.addEventListener('click', function (e) {
    const notificationContainer = document.getElementById('notificationContainer');
    const buttonNotification = document.getElementById('buttonNotification');
    if (notificationContainer && buttonNotification &&
        !notificationContainer.contains(e.target) &&
        !buttonNotification.contains(e.target)) {
        notificationContainer.classList.add('hidden');
    }
});

// Delete notification function
window.deleteNotification = async function (notificationId) {
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/notifications/${notificationId}`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            throw new Error('Failed to delete notification');
        }

        // Refresh notifications after deletion
        const buttonNotification = document.getElementById('buttonNotification');
        if (buttonNotification) {
            await loadNotification();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        // Show error message in notification container
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