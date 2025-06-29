// profile.js - handles fetching and updating user profile information
import apiService from './services/api.js';

// Helper to show notification messages
function showProfileNotification(message, type = 'success') {
    const notification = document.getElementById('profileNotification');
    if (!notification) return;

    // Create notification content
    const icon = document.createElement('i');
    const textSpan = document.createElement('span');
    const closeButton = document.createElement('button');

    // Set icon based on type
    icon.className = 'mr-2 fas';
    switch (type) {
        case 'success':
            icon.classList.add('fa-check-circle', 'text-green-500');
            break;
        case 'error':
            icon.classList.add('fa-exclamation-circle', 'text-red-500');
            break;
        default:
            icon.classList.add('fa-info-circle', 'text-blue-500');
            break;
    }

    // Set text content
    textSpan.textContent = message;
    textSpan.className = 'flex-grow';

    // Set close button
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.className = 'ml-3 text-gray-400 hover:text-gray-600 focus:outline-none';
    closeButton.onclick = () => notification.classList.add('hidden');

    // Clear and set up notification
    notification.innerHTML = '';
    notification.className = 'fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center';
    notification.appendChild(icon);
    notification.appendChild(textSpan);
    notification.appendChild(closeButton);

    notification.classList.remove('hidden');

    // Auto hide after 4 seconds
    const timeout = setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);

    // Clear timeout if closed manually
    closeButton.onclick = () => {
        clearTimeout(timeout);
        notification.classList.add('hidden');
    };
}

// Tab navigation
function initTabNavigation() {
    const tabs = document.querySelectorAll('[data-tab]');
    const tabContents = {
        profile: document.getElementById('profileTab'),
        security: document.getElementById('securityTab'),
        notifications: document.getElementById('notificationsTab')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Update tab styles
            tabs.forEach(t => {
                t.classList.remove('tab-active');
                t.classList.add('tab-inactive');
            });
            tab.classList.remove('tab-inactive');
            tab.classList.add('tab-active');

            // Show/hide content
            Object.values(tabContents).forEach(content => {
                content.classList.add('hidden');
            });
            tabContents[targetTab]?.classList.remove('hidden');
        });
    });
}

// Populate profile information on load
async function loadProfile() {
    try {
        const user = await apiService.getUserProfile();
        if (user) {
            populateProfile(user);
            return;
        }
    } catch (error) {
        console.warn('API profile load failed, using localStorage', error);
    }

    // Fallback: localStorage
    const cached = localStorage.getItem('userData');
    if (cached) {
        try {
            const user = JSON.parse(cached);
            populateProfile({
                name: user.name,
                email: user.email,
                isPremium: user.isPremium ?? user.premium,
                phone: user.phone,
                location: user.location,
                bio: user.bio
            });
        } catch(e){
            console.error('Parse cached user error', e);
        }
    }
}

function populateProfile(user) {
    // Header information
    document.getElementById('profileName').textContent = user.name || 'User';
    document.getElementById('profileEmail').textContent = user.email;
    
    // Role badge
    const roleSpan = document.getElementById('profileRole');
    if (roleSpan) {
        const roleIcon = document.createElement('i');
        roleIcon.className = 'mr-1 fas';
        
        if (user.isAdmin) {
            roleSpan.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800';
            roleIcon.classList.add('fa-shield-alt');
            roleSpan.textContent = 'Admin';
        } else if (user.isPremium) {
            roleSpan.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800';
            roleIcon.classList.add('fa-crown');
            roleSpan.textContent = 'Premium';
        } else {
            roleSpan.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800';
            roleIcon.classList.add('fa-user');
            roleSpan.textContent = 'Basic';
        }
        
        roleSpan.insertBefore(roleIcon, roleSpan.firstChild);
    }

    // Form fields
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('location').value = user.location || '';
    document.getElementById('bio').value = user.bio || '';

    // Load notification preferences if available
    if (user.notifications) {
        document.getElementById('emailNotifications').checked = user.notifications.email;
        document.getElementById('pushNotifications').checked = user.notifications.push;
        document.getElementById('monthlyReport').checked = user.notifications.monthlyReport;
    }

    // Load sidebar with username
    if (typeof window.loadSideBarSimple === 'function') {
        window.loadSideBarSimple(user.name || 'User');
    }
}

// Handle profile form submission
function initProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            location: document.getElementById('location').value.trim(),
            bio: document.getElementById('bio').value.trim()
        };

        try {
            const updatedUser = await apiService.updateUserProfile(formData);
            if (updatedUser) {
                // Update local storage
                const stored = JSON.parse(localStorage.getItem('userData') || '{}');
                const newStored = { ...stored, ...formData };
                localStorage.setItem('userData', JSON.stringify(newStored));

                // Reflect changes in header without reload
                if (typeof window.updateHeaderDisplayNames === 'function') {
                    window.updateHeaderDisplayNames(updatedUser.name);
                }

                showProfileNotification('Thông tin đã được cập nhật thành công!', 'success');
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            showProfileNotification(error.message || 'Cập nhật thất bại.', 'error');
        }
    });
}

// Handle password change
function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value.trim();
        const newPassword = document.getElementById('newPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();

        if (newPassword !== confirmPassword) {
            showProfileNotification('Mật khẩu xác nhận không khớp.', 'error');
            return;
        }

        try {
            await apiService.changePassword({ currentPassword, newPassword });
            showProfileNotification('Đổi mật khẩu thành công!', 'success');
            form.reset();
        } catch (error) {
            showProfileNotification(error.message || 'Đổi mật khẩu thất bại.', 'error');
        }
    });
}

// Handle notification preferences
function initNotificationPreferences() {
    const form = document.querySelector('#notificationsTab .space-y-6');
    if (!form) return;

    const savePreferences = async () => {
        const preferences = {
            email: document.getElementById('emailNotifications').checked,
            push: document.getElementById('pushNotifications').checked,
            monthlyReport: document.getElementById('monthlyReport').checked
        };

        try {
            await apiService.updateNotificationPreferences(preferences);
            showProfileNotification('Tùy chọn thông báo đã được cập nhật!', 'success');
        } catch (error) {
            showProfileNotification('Không thể cập nhật tùy chọn thông báo.', 'error');
        }
    };

    // Save button click
    const saveButton = form.querySelector('button[type="button"]:last-child');
    if (saveButton) {
        saveButton.addEventListener('click', savePreferences);
    }

    // Reset button click
    const resetButton = form.querySelector('button[type="button"]:first-child');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.getElementById('emailNotifications').checked = true;
            document.getElementById('pushNotifications').checked = false;
            document.getElementById('monthlyReport').checked = true;
            savePreferences();
        });
    }
}

// Password toggle icons
function initPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                input.type = 'password';
                icon.classList.add('fa-eye-slash');
                icon.classList.remove('fa-eye');
            }
        });
    });
}

// Initialize on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    initTabNavigation();
    initProfileForm();
    initPasswordForm();
    initPasswordToggle();
    initNotificationPreferences();
    
    // Mark main content ready to reveal opacity
    const main = document.querySelector('.main-content');
    if (main) {
        main.classList.add('content-ready');
    }
}); 