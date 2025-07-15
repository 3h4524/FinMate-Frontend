// profile.js - handles fetching and updating user profile information
import apiService from './services/api.js';

const API_BASE = 'http://localhost:8080';

// Helper to show notification messages
function showProfileNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-500 transform translate-x-full ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.style.zIndex = '9999';

    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
                if (t) {
                    t.classList.remove('tab-active');
                    t.classList.add('tab-inactive');
                }
            });
            if (tab) {
                tab.classList.remove('tab-inactive');
                tab.classList.add('tab-active');
            }

            // Show/hide content
            Object.values(tabContents).forEach(content => {
                if (content) content.classList.add('hidden');
            });
            if (tabContents[targetTab]) tabContents[targetTab].classList.remove('hidden');
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
        console.warn('API profile load failed, using sessionStorage', error);
    }

    // Fallback: sessionStorage
    const cached = sessionStorage.getItem('userData');
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
        } catch (e) {
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
        roleSpan.innerHTML = '';
        let badgeClass = '';
        let iconClass = '';
        let label = '';
        if (user.isAdmin) {
            badgeClass = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700';
            iconClass = 'fas fa-shield-alt mr-1 text-xs';
            label = 'Admin';
        } else if (user.isPremium || user.premium) {
            badgeClass = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
            iconClass = 'fas fa-crown mr-1 text-xs';
            label = 'Premium';
        } else {
            badgeClass = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800';
            iconClass = 'fas fa-user mr-1 text-xs';
            label = 'Basic';
        }
        const icon = document.createElement('i');
        icon.className = iconClass;
        roleSpan.className = badgeClass;
        roleSpan.appendChild(icon);
        roleSpan.appendChild(document.createTextNode(label));
    }

    // Form fields
    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';

    // Last login time
    const lastLoginSpan = document.getElementById('lastLoginTime');
    if (lastLoginSpan && user.lastLoginAt) {
        const lastLogin = new Date(user.lastLoginAt);
        const formatter = new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        lastLoginSpan.value = formatter.format(lastLogin);
    } else if (lastLoginSpan) {
        lastLoginSpan.value = '';
    }

    // Load sidebar with username
    if (typeof window.loadSideBarSimple === 'function') {
        window.loadSideBarSimple(user.name || 'User');
    }
}

// Toggle edit mode for profile form
function toggleEditMode(enabled) {
    const form = document.getElementById('profileForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, textarea');
    const editBtn = document.getElementById('editProfileBtn');
    const editActions = document.getElementById('editActions');

    inputs.forEach(input => {
        if (input.id === 'name' || input.id === 'email') {
            input.disabled = !enabled;
            if (enabled) {
                input.classList.remove('bg-gray-50', 'cursor-not-allowed');
            } else {
                input.classList.add('bg-gray-50', 'cursor-not-allowed');
            }
        }
    });

    if (enabled) {
        editBtn.classList.add('hidden');
        editActions.classList.remove('hidden');
    } else {
        editBtn.classList.remove('hidden');
        editActions.classList.add('hidden');
    }
}

// Initialize edit mode handlers
function initEditMode() {
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const form = document.getElementById('profileForm');

    if (!editBtn || !cancelBtn || !form) return;

    // Store original values for cancel operation
    let originalValues = {};

    editBtn.addEventListener('click', () => {
        // Store current values
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            originalValues[input.id] = input.value;
        });
        toggleEditMode(true);
    });

    cancelBtn.addEventListener('click', () => {
        // Restore original values
        Object.entries(originalValues).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) input.value = value;
        });
        toggleEditMode(false);
    });
}

// Handle profile form submission
function initProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim()
        };

        // Validate required fields
        if (!formData.name) {
            showProfileNotification('Please enter your name.', 'error');
            return;
        }

        if (!formData.email) {
            showProfileNotification('Please enter your email.', 'error');
            return;
        }

        if (!isValidEmail(formData.email)) {
            showProfileNotification('Invalid email format.', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/v1/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                },
                body: JSON.stringify(formData)
            });
            const response = await res.json();
            if (response.code === 2001 && formData.email) {
                showOtpEmailModal(formData.email);
                return;
            }
            if (res.ok && response.code === 1000) {
                // Update session storage
                const stored = JSON.parse(sessionStorage.getItem('userData') || '{}');
                const newStored = {...stored, ...formData};
                sessionStorage.setItem('userData', JSON.stringify(newStored));
                document.getElementById('profileName').textContent = formData.name;
                document.getElementById('profileEmail').textContent = formData.email;
                if (typeof window.updateHeaderDisplayNames === 'function') {
                    window.updateHeaderDisplayNames(formData.name);
                }
                showProfileNotification('Profile updated successfully!', 'success');
                toggleEditMode(false);
                hideInlineOtpBlock();
                saveProfileBtn.textContent = 'Save';
                window.location.reload();
                return;
            } else {
                showProfileNotification(response.message || 'Update failed.', 'error');
            }
        } catch (error) {
            showProfileNotification('Update failed.', 'error');
        }
    });
}

// Password validation
const passwordValidation = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
};

function updatePasswordStrength(password) {
    // Update validation states
    passwordValidation.length = password.length >= 8;
    passwordValidation.uppercase = /[A-Z]/.test(password);
    passwordValidation.lowercase = /[a-z]/.test(password);
    passwordValidation.number = /\d/.test(password);
    passwordValidation.special = /[@$!%*?&#]/.test(password);

    // Update UI for each requirement
    for (const [requirement, isValid] of Object.entries(passwordValidation)) {
        const element = document.getElementById(requirement);
        if (element) {
            const icon = element.querySelector('i');
            if (isValid) {
                icon.className = 'fas fa-check-circle mr-2 text-green-500';
                element.classList.remove('text-gray-500');
                element.classList.add('text-green-500');
            } else {
                icon.className = 'fas fa-times-circle mr-2 text-gray-500';
                element.classList.remove('text-green-500');
                element.classList.add('text-gray-500');
            }
        }
    }

    // Check if all requirements are met
    const allRequirementsMet = Object.values(passwordValidation).every(Boolean);
    return allRequirementsMet;
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchText = document.getElementById('passwordMatch');
    const mismatchText = document.getElementById('passwordMismatch');
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    if (newPassword && confirmPassword) {
        if (newPassword === confirmPassword) {
            matchText.classList.remove('hidden');
            mismatchText.classList.add('hidden');
            return true;
        } else {
            matchText.classList.add('hidden');
            mismatchText.classList.remove('hidden');
        }
    } else {
        matchText.classList.add('hidden');
        mismatchText.classList.add('hidden');
    }
    return false;
}

function validateForm() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    const isCurrentPasswordValid = currentPassword.length > 0;
    const isNewPasswordValid = updatePasswordStrength(newPassword);
    const isConfirmPasswordValid = validatePasswordMatch();

    changePasswordBtn.disabled = !(isCurrentPasswordValid && isNewPasswordValid && isConfirmPasswordValid);
}

function hideCurrentPasswordError() {
    const errorElement = document.getElementById('currentPasswordError');
    errorElement.classList.add('hidden');
}

function showCurrentPasswordError() {
    const errorElement = document.getElementById('currentPasswordError');
    errorElement.classList.remove('hidden');
}

// Event listeners for password form
document.addEventListener('DOMContentLoaded', function () {
    const passwordForm = document.getElementById('passwordForm');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordToggles = document.querySelectorAll('.password-toggle');

    // Hide current password error when user starts typing
    currentPassword.addEventListener('input', function () {
        hideCurrentPasswordError();
    });

    // Password visibility toggle
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });

    // Input validation events
    [currentPassword, newPassword, confirmPassword].forEach(input => {
        input.addEventListener('input', validateForm);
    });

    // Form submission
    passwordForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE}/api/v1/users/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: currentPassword.value,
                    newPassword: newPassword.value
                })
            });

            let data;
            try {
                // Thử parse JSON response
                const textResponse = await response.text();
                data = textResponse ? JSON.parse(textResponse) : {};
            } catch (jsonError) {
                console.error('JSON Parse Error:', jsonError);
                showProfileNotification('An error occurred while processing the response from the server!', 'error');
                return;
            }

            console.log('Response:', {status: response.status, data}); // Debug log

            if (response.ok) {
                // Hide any error messages
                hideCurrentPasswordError();

                // Show success notification
                showProfileNotification('Password changed successfully!', 'success');

                // Reset form
                passwordForm.reset();
                validateForm();
            } else {
                // Check specific error cases
                if (data.message) {
                    if (data.message.toLowerCase().includes('incorrect') ||
                        data.message.toLowerCase().includes('wrong') ||
                        data.message.toLowerCase().includes('invalid') ||
                        data.message.toLowerCase().includes('current password') ||
                        response.status === 400) {
                        // Hiển thị lỗi mật khẩu hiện tại không đúng
                        showCurrentPasswordError();
                        showProfileNotification('Current password is incorrect. Please check and try again!', 'error');
                    } else if (data.message.toLowerCase().includes('token') ||
                        data.message.toLowerCase().includes('unauthorized') ||
                        response.status === 401) {
                        showProfileNotification('Your session has expired. Please log in again!', 'error');
                        // Redirect to login page after 2 seconds
                        setTimeout(() => {
                            window.location.href = '/pages/login/';
                        }, 2000);
                    } else {
                        showProfileNotification(data.message, 'error');
                    }
                } else if (response.status === 401) {
                    showProfileNotification('Your session has expired. Please log in again!', 'error');
                    // Redirect to login page after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/pages/login/';
                    }, 2000);
                } else if (response.status === 400) {
                    // Hiển thị lỗi mật khẩu hiện tại không đúng
                    showCurrentPasswordError();
                    showProfileNotification('Current password is incorrect. Please check and try again!', 'error');
                } else if (response.status === 500) {
                    showProfileNotification('The server is experiencing issues. Please try again later!', 'error');
                } else {
                    showProfileNotification('An error occurred while changing the password. Please try again!', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (!navigator.onLine) {
                showProfileNotification('No internet connection. Please check your network connection!', 'error');
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showProfileNotification('Unable to connect to the server. Please check your network connection!', 'error');
            } else {
                showProfileNotification('An error occurred while changing the password. Please try again!', 'error');
            }
        }
    });
});

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
            showProfileNotification('Notification preferences updated successfully!', 'success');
        } catch (error) {
            showProfileNotification('Failed to update notification preferences.', 'error');
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
    initPasswordToggle();
    initNotificationPreferences();
    initEditMode();

    // Mark main content ready to reveal opacity
    const main = document.querySelector('.main-content');
    if (main) {
        main.classList.add('content-ready');
    }

    // Password form show/hide logic
    const btnShowPasswordForm = document.getElementById('btn-show-password-form');
    const passwordFormWrapper = document.getElementById('password-form-wrapper');
    const btnCancelPasswordForm = document.getElementById('btn-cancel-password-form');
    if (btnShowPasswordForm && passwordFormWrapper) {
        btnShowPasswordForm.addEventListener('click', () => {
            passwordFormWrapper.classList.remove('hidden');
            passwordFormWrapper.classList.add('animate__animated', 'animate__fadeInDown');
            btnShowPasswordForm.classList.add('hidden');
            setTimeout(initPasswordToggle, 0);
        });
    }
    if (btnCancelPasswordForm && passwordFormWrapper && btnShowPasswordForm) {
        btnCancelPasswordForm.addEventListener('click', () => {
            passwordFormWrapper.classList.add('hidden');
            btnShowPasswordForm.classList.remove('hidden');
        });
    }

    const btn2FA = document.getElementById('btn-2fa-toggle');
    const statusLabel = document.getElementById('2fa-status-label');
    const extraInfo = document.getElementById('2fa-extra-info');
    const modal2FA = document.getElementById('modal-2fa-confirm');
    const btnCancel2FA = document.getElementById('cancel-2fa-off');
    const btnConfirm2FA = document.getElementById('confirm-2fa-off');

    let is2FAEnabled = false;

    function update2FAUI(enabled) {
        is2FAEnabled = enabled;
        if (statusLabel) {
            statusLabel.textContent = enabled ? 'Enabled' : 'Disabled';
            statusLabel.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ' + (enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700');
        }
        if (btn2FA) {
            btn2FA.textContent = enabled ? 'Disable 2FA' : 'Enable 2FA';
            btn2FA.className = 'px-6 py-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none ' + (enabled ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-2 focus:ring-red-400' : 'bg-green-500 hover:bg-green-600 text-white focus:ring-2 focus:ring-green-400');
        }
        if (extraInfo) {
            extraInfo.classList.toggle('hidden', !enabled);
        }
    }

    // Lấy trạng thái 2FA từ backend khi load trang
    if (btn2FA) {
        fetch(`${API_BASE}/api/v1/users/profile`, {
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('token')
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('API error: ' + res.status);
                return res.json();
            })
            .then(data => {
                if (data.result && typeof data.result.is2FAEnabled !== 'undefined') {
                    update2FAUI(data.result.is2FAEnabled);
                }
            })
            .catch(err => console.error('2FA profile fetch error:', err));

        btn2FA.addEventListener('click', function () {
            if (!is2FAEnabled) {
                // Enable 2FA
                update2FAUI(true);
                fetch(`${API_BASE}/api/v1/users/profile/2fa`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                    },
                    body: JSON.stringify({is2FAEnabled: true})
                })
                    .then(res => {
                        if (!res.ok) throw new Error('API error: ' + res.status);
                        return res.json();
                    })
                    .then(data => {
                        showProfileNotification('Two-factor authentication enabled!', 'success');
                    })
                    .catch(err => {
                        showProfileNotification('Failed to enable 2FA: ' + err.message, 'error');
                        update2FAUI(false);
                    });
            } else {
                // Show disable modal
                if (modal2FA) modal2FA.classList.remove('hidden');
            }
        });
    }

    // Xử lý xác nhận tắt 2FA
    if (btnCancel2FA && btnConfirm2FA && modal2FA && btn2FA) {
        btnCancel2FA.onclick = function () {
            modal2FA.classList.add('hidden');
        };
        btnConfirm2FA.onclick = function () {
            modal2FA.classList.add('hidden');
            fetch(`${API_BASE}/api/v1/users/profile/2fa`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                },
                body: JSON.stringify({is2FAEnabled: false})
            })
                .then(res => {
                    if (!res.ok) throw new Error('API error: ' + res.status);
                    return res.json();
                })
                .then(data => {
                    update2FAUI(false);
                    showProfileNotification('Two-factor authentication disabled!', 'success');
                })
                .catch(err => {
                    showProfileNotification('Failed to disable 2FA: ' + err.message, 'error');
                    update2FAUI(true);
                });
        };
    }

    // OTP Email Modal logic
    const modalVerifyEmailOtp = document.getElementById('modal-verify-email-otp');
    const inputOtpEmail = document.getElementById('input-otp-email');
    const btnConfirmOtpEmail = document.getElementById('btn-confirm-otp-email');
    const btnCancelOtpEmail = document.getElementById('btn-cancel-otp-email');
    const btnResendOtpEmail = document.getElementById('btn-resend-otp-email');
    const otpEmailError = document.getElementById('otp-email-error');
    const otpEmailSuccess = document.getElementById('otp-email-success');
    let pendingNewEmail = null;

    function showOtpEmailModal(email) {
        pendingNewEmail = email;
        inputOtpEmail.value = '';
        otpEmailError.classList.add('hidden');
        otpEmailSuccess.classList.add('hidden');
        modalVerifyEmailOtp.classList.remove('hidden');
        inputOtpEmail.focus();
    }

    function hideOtpEmailModal() {
        modalVerifyEmailOtp.classList.add('hidden');
        pendingNewEmail = null;
    }

    if (btnCancelOtpEmail) {
        btnCancelOtpEmail.onclick = hideOtpEmailModal;
    }
    if (btnResendOtpEmail) {
        btnResendOtpEmail.onclick = async function () {
            if (!pendingNewEmail) return;
            otpEmailError.classList.add('hidden');
            otpEmailSuccess.classList.add('hidden');
            try {
                const res = await fetch(`${API_BASE}/api/v1/auth/send-verification`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email: pendingNewEmail})
                });
                if (res.ok) {
                    otpEmailSuccess.textContent = 'OTP resent successfully!';
                    otpEmailSuccess.classList.remove('hidden');
                } else {
                    otpEmailError.textContent = 'Failed to resend OTP.';
                    otpEmailError.classList.remove('hidden');
                }
            } catch (e) {
                otpEmailError.textContent = 'Network error.';
                otpEmailError.classList.remove('hidden');
            }
        };
    }
    if (btnConfirmOtpEmail) {
        btnConfirmOtpEmail.onclick = async function () {
            if (!pendingNewEmail) return;
            const otp = inputOtpEmail.value.trim();
            if (!otp || otp.length !== 6) {
                otpEmailError.textContent = 'Please enter a valid 6-digit code.';
                otpEmailError.classList.remove('hidden');
                return;
            }
            otpEmailError.classList.add('hidden');
            otpEmailSuccess.classList.add('hidden');
            try {
                const res = await fetch(`${API_BASE}/api/v1/users/profile/verify-email-change`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                    },
                    body: JSON.stringify({email: pendingNewEmail, otp})
                });
                const data = await res.json();
                if (res.ok && data.code === 1000) {
                    otpEmailSuccess.textContent = 'Email updated and verified successfully!';
                    otpEmailSuccess.classList.remove('hidden');
                    // Lưu tab đang active là security trước khi reload
                    localStorage.setItem('profileActiveTab', 'security');
                    setTimeout(() => {
                        hideOtpEmailModal();
                        window.location.reload();
                    }, 1200);
                } else {
                    otpEmailError.textContent = data.message || 'Invalid or expired code.';
                    otpEmailError.classList.remove('hidden');
                }
            } catch (e) {
                otpEmailError.textContent = 'Network error.';
                otpEmailError.classList.remove('hidden');
            }
        };
    }

    // Inline OTP block logic
    const emailInput = document.getElementById('email');
    const inlineOtpBlock = document.getElementById('inline-otp-block');
    const btnSendOtpInline = document.getElementById('btn-send-otp-inline');
    const btnConfirmOtpInline = document.getElementById('btn-confirm-otp-inline');
    const inputOtpInline = document.getElementById('input-otp-inline');
    const otpInlineError = document.getElementById('otp-inline-error');
    const otpInlineSuccess = document.getElementById('otp-inline-success');
    const otpInlineStatus = document.getElementById('otp-inline-status');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    let originalEmail = null;
    let otpVerified = false;
    let pendingNewEmailInline = null;

    // Lưu email gốc khi load profile
    if (emailInput) originalEmail = emailInput.value;
    if (saveProfileBtn) saveProfileBtn.disabled = false;

    if (emailInput) {
        emailInput.addEventListener('input', function () {
            const newEmail = emailInput.value.trim();
            if (newEmail && newEmail !== originalEmail) {
                inlineOtpBlock.classList.remove('hidden');
                saveProfileBtn.disabled = true;
                otpVerified = false;
                pendingNewEmailInline = newEmail;
                otpInlineError.classList.add('hidden');
                otpInlineSuccess.classList.add('hidden');
                otpInlineStatus.textContent = '';
                inputOtpInline.value = '';
            } else {
                inlineOtpBlock.classList.add('hidden');
                saveProfileBtn.disabled = false;
                otpVerified = false;
                pendingNewEmailInline = null;
                otpInlineError.classList.add('hidden');
                otpInlineSuccess.classList.add('hidden');
                otpInlineStatus.textContent = '';
                inputOtpInline.value = '';
            }
        });
    }
    if (btnSendOtpInline) {
        btnSendOtpInline.onclick = async function () {
            if (!pendingNewEmailInline) return;
            otpInlineError.classList.add('hidden');
            otpInlineSuccess.classList.add('hidden');
            otpInlineStatus.textContent = 'Sending...';
            try {
                const res = await fetch(`${API_BASE}/api/v1/users/profile/send-otp-change-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                    },
                    body: JSON.stringify({email: pendingNewEmailInline})
                });
                const data = await res.json();
                if (res.ok && data.code === 1000) {
                    otpInlineStatus.textContent = 'OTP sent!';
                    btnSendOtpInline.textContent = 'Resend OTP';
                } else {
                    otpInlineStatus.textContent = '';
                    otpInlineError.textContent = data.message || 'Failed to send OTP.';
                    otpInlineError.classList.remove('hidden');
                }
            } catch (e) {
                otpInlineStatus.textContent = '';
                otpInlineError.textContent = 'Network error.';
                otpInlineError.classList.remove('hidden');
            }
        };
    }
    if (inputOtpInline) {
        inputOtpInline.addEventListener('input', function () {
            const newEmail = emailInput.value.trim();
            const otp = inputOtpInline.value.trim();
            if (newEmail && newEmail !== originalEmail && otp.length === 6) {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Confirm';
            } else if (newEmail && newEmail !== originalEmail) {
                saveProfileBtn.disabled = true;
                saveProfileBtn.textContent = 'Save';
            }
        });
    }
});

function hideInlineOtpBlock() {
    inlineOtpBlock.classList.add('hidden');
    otpInlineError.classList.add('hidden');
    otpInlineSuccess.classList.add('hidden');
    otpInlineStatus.textContent = '';
    inputOtpInline.value = '';
    btnSendOtpInline.textContent = 'Send OTP';
    otpVerified = false;
    pendingNewEmailInline = null;
    if (saveProfileBtn) saveProfileBtn.disabled = false;
}

// Đổi email ở tab Security
const btnShowEmailForm = document.getElementById('btn-show-email-form');
const emailFormWrapper = document.getElementById('email-form-wrapper');
const btnCancelEmailForm = document.getElementById('btn-cancel-email-form');
const emailChangeForm = document.getElementById('emailChangeForm');
const newEmailInput = document.getElementById('newEmail');
const emailOtpBlock = document.getElementById('email-otp-block');
const btnSendOtpEmail = document.getElementById('btn-send-otp-email');
const inputOtpEmail = document.getElementById('input-otp-email');
const btnConfirmEmailForm = document.getElementById('btn-confirm-email-form');
const otpEmailError = document.getElementById('otp-email-error');
const otpEmailSuccess = document.getElementById('otp-email-success');
const otpEmailStatus = document.getElementById('otp-email-status');

if (btnShowEmailForm && emailFormWrapper) {
    btnShowEmailForm.onclick = () => {
        emailFormWrapper.classList.remove('hidden');
        btnShowEmailForm.classList.add('hidden');
        newEmailInput.value = '';
        emailOtpBlock.classList.add('hidden');
        otpEmailError.classList.add('hidden');
        otpEmailSuccess.classList.add('hidden');
        otpEmailStatus.textContent = '';
        inputOtpEmail.value = '';
        btnConfirmEmailForm.disabled = true;
        btnConfirmEmailForm.textContent = 'Confirm';
    };
}
if (btnCancelEmailForm && emailFormWrapper && btnShowEmailForm) {
    btnCancelEmailForm.onclick = () => {
        emailFormWrapper.classList.add('hidden');
        btnShowEmailForm.classList.remove('hidden');
    };
}
if (newEmailInput) {
    newEmailInput.addEventListener('input', function () {
        emailOtpBlock.classList.add('hidden');
        otpEmailError.classList.add('hidden');
        otpEmailSuccess.classList.add('hidden');
        otpEmailStatus.textContent = '';
        inputOtpEmail.value = '';
        btnConfirmEmailForm.disabled = true;
        btnConfirmEmailForm.textContent = 'Confirm';
        if (newEmailInput.value.trim()) {
            btnSendOtpEmail.disabled = false;
        } else {
            btnSendOtpEmail.disabled = true;
        }
    });
}
let otpEmailCountdown = null;

function startOtpEmailCountdown() {
    let seconds = 60;
    btnSendOtpEmail.disabled = true;
    btnSendOtpEmail.textContent = `Resend OTP (${seconds}s)`;
    otpEmailCountdown = setInterval(() => {
        seconds--;
        btnSendOtpEmail.textContent = `Resend OTP (${seconds}s)`;
        if (seconds <= 0) {
            clearInterval(otpEmailCountdown);
            btnSendOtpEmail.disabled = false;
            btnSendOtpEmail.textContent = 'Resend OTP';
        }
    }, 1000);
}

if (btnSendOtpEmail) {
    btnSendOtpEmail.onclick = async function () {
        const email = newEmailInput.value.trim();
        if (!email) return;
        emailOtpBlock.classList.add('hidden');
        otpEmailError.classList.add('hidden');
        otpEmailSuccess.classList.add('hidden');
        otpEmailStatus.textContent = 'Sending...';
        if (otpEmailCountdown) clearInterval(otpEmailCountdown);
        try {
            const res = await fetch(`${API_BASE}/api/v1/users/profile/send-otp-change-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                },
                body: JSON.stringify({email})
            });
            const data = await res.json();
            if (res.ok && data.code === 1000) {
                emailOtpBlock.classList.remove('hidden');
                otpEmailStatus.textContent = 'OTP sent!';
                startOtpEmailCountdown();
            } else if (data.code === 2003 || (data.message && data.message.toLowerCase().includes('already exists'))) {
                otpEmailStatus.textContent = '';
                otpEmailError.textContent = 'This email is already registered.';
                otpEmailError.classList.remove('hidden');
                emailOtpBlock.classList.add('hidden');
                showProfileNotification('This email is already registered.', 'error');
            } else {
                otpEmailStatus.textContent = '';
                otpEmailError.textContent = data.message || 'Failed to send OTP.';
                otpEmailError.classList.remove('hidden');
                emailOtpBlock.classList.add('hidden');
            }
        } catch (e) {
            otpEmailStatus.textContent = '';
            otpEmailError.textContent = 'Network error.';
            otpEmailError.classList.remove('hidden');
            emailOtpBlock.classList.add('hidden');
        }
    };
}
if (inputOtpEmail) {
    inputOtpEmail.addEventListener('input', function () {
        const otp = inputOtpEmail.value.trim();
        if (otp.length === 6) {
            btnConfirmEmailForm.disabled = false;
            btnConfirmEmailForm.textContent = 'Confirm';
        } else {
            btnConfirmEmailForm.disabled = true;
            btnConfirmEmailForm.textContent = 'Confirm';
        }
    });
}
if (emailChangeForm) {
    emailChangeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = newEmailInput.value.trim();
        const otp = inputOtpEmail.value.trim();
        if (!email || !otp || otp.length !== 6) {
            otpEmailError.textContent = 'Please enter the 6-digit OTP code.';
            otpEmailError.classList.remove('hidden');
            return;
        }
        otpEmailError.classList.add('hidden');
        otpEmailSuccess.classList.add('hidden');
        otpEmailStatus.textContent = 'Verifying...';
        try {
            const res = await fetch(`${API_BASE}/api/v1/users/profile/verify-email-change`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('token')
                },
                body: JSON.stringify({email, otp})
            });
            const data = await res.json();
            if (res.ok && data.code === 1000) {
                otpEmailStatus.textContent = '';
                otpEmailSuccess.textContent = 'Email updated and verified successfully!';
                otpEmailSuccess.classList.remove('hidden');
                // Lưu tab đang active là security trước khi reload
                localStorage.setItem('profileActiveTab', 'security');
                setTimeout(() => {
                    window.location.reload();
                }, 1200);
            } else {
                otpEmailStatus.textContent = '';
                otpEmailError.textContent = data.message || 'Invalid or expired code.';
                otpEmailError.classList.remove('hidden');
            }
        } catch (err) {
            otpEmailStatus.textContent = '';
            otpEmailError.textContent = 'Network error.';
            otpEmailError.classList.remove('hidden');
        }
    });
}

// Khi load lại trang, active lại tab nếu có trong localStorage
window.addEventListener('DOMContentLoaded', () => {
    const activeTab = localStorage.getItem('profileActiveTab');
    if (activeTab) {
        const tabBtn = document.querySelector(`[data-tab="${activeTab}"]`);
        if (tabBtn) tabBtn.click();
        localStorage.removeItem('profileActiveTab');
    }
}); 