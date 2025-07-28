// Import API service
import apiService from './services/api.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Password toggle functions
export function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    }
}

export function toggleConfirmPassword() {
    const confirmPasswordInput = document.getElementById('confirm-password');
    const toggleIcon = document.querySelectorAll('.password-toggle')[1];

    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    } else {
        confirmPasswordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    }
}

// Notification functions
export function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');

    // Remove existing classes
    notification.classList.remove('success', 'error', 'info');
    // Add new type class
    notification.classList.add(type);

    messageElement.textContent = message;
    notification.classList.add('show');

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

export function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

// Password validation
export function initPasswordValidation() {
    const password = document.getElementById('password');
    if (!password) return;

    const requirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    // Initially mark all requirements as invalid
    Object.values(requirements).forEach(li => li.classList.add('invalid'));

    password.addEventListener('input', function () {
        const value = this.value;

        // Check length
        if (value.length >= 8) {
            requirements.length.classList.add('valid');
            requirements.length.classList.remove('invalid');
        } else {
            requirements.length.classList.remove('valid');
            requirements.length.classList.add('invalid');
        }

        // Check uppercase
        if (/[A-Z]/.test(value)) {
            requirements.uppercase.classList.add('valid');
            requirements.uppercase.classList.remove('invalid');
        } else {
            requirements.uppercase.classList.remove('valid');
            requirements.uppercase.classList.add('invalid');
        }

        // Check lowercase
        if (/[a-z]/.test(value)) {
            requirements.lowercase.classList.add('valid');
            requirements.lowercase.classList.remove('invalid');
        } else {
            requirements.lowercase.classList.remove('valid');
            requirements.lowercase.classList.add('invalid');
        }

        // Check number
        if (/[0-9]/.test(value)) {
            requirements.number.classList.add('valid');
            requirements.number.classList.remove('invalid');
        } else {
            requirements.number.classList.remove('valid');
            requirements.number.classList.add('invalid');
        }

        // Check special character
        if (/[!@#$%^&*]/.test(value)) {
            requirements.special.classList.add('valid');
            requirements.special.classList.remove('invalid');
        } else {
            requirements.special.classList.remove('valid');
            requirements.special.classList.add('invalid');
        }
    });
}

// Form submission handlers
// export function initRegisterForm() {
//     const registerForm = document.getElementById('register-form');
//     if (!registerForm) return;

//     registerForm.addEventListener('submit', async function(e) {
//         e.preventDefault();
//         const name = document.getElementById('name').value;
//         const email = document.getElementById('email').value;
//         const password = document.getElementById('password').value;
//         const confirmPassword = document.getElementById('confirm-password').value;

//         // Check password match
//         if (password !== confirmPassword) {
//             showNotification('Passwords do not match!', 'error');
//             return;
//         }

//         try {
//             const response = await fetch('http://localhost:8080/api/v1/auth/register', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 },
//                 credentials: 'include',
//                 body: JSON.stringify({ name, email, password })
//             });

//             const data = await response.json();
//             console.log('Register response:', data);

//             if (data.code === 1000) {
//                 showNotification('Registration successful! Please check your email to verify your account.', 'success');
//                 // Redirect to email verification page
//                 setTimeout(() => {
//                     window.location.href = 'verify-email.html?email=' + encodeURIComponent(email);
//                 }, 2000);
//             } else {
//                 // Show error message
//                 const errorMessage = data.message || 'Registration failed!';
//                 showNotification(errorMessage, 'error');

//                 // If it's an email already exists error, show it in the email field
//                 if (data.code === 1014) {
//                     const emailError = document.getElementById('email-error');
//                     if (emailError) {
//                         emailError.textContent = 'Email already registered';
//                         emailError.style.display = 'block';
//                     }
//                 }
//             }
//         } catch (error) {
//             console.error('Register error:', error);
//             showNotification('An error occurred during registration! Please try again later.', 'error');
//         }
//     });
// }

// export function initLoginForm() {
//     const loginForm = document.getElementById('loginForm');
//     if (!loginForm) return;

//     loginForm.addEventListener('submit', async function(e) {
//         e.preventDefault();
//         const email = document.getElementById('loginEmail').value;
//         const password = document.getElementById('loginPassword').value;

//         try {
//             const response = await fetch('http://localhost:8080/api/v1/auth/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Accept': 'application/json'
//                 },
//                 credentials: 'include',
//                 body: JSON.stringify({ email, password })
//             });

//             const data = await response.json();
//             console.log('Login response:', data);

//             if (data.success && data.result) {
//                 // Store user data
//                 localStorage.setItem('token', data.result.token);
//                 localStorage.setItem('userData', JSON.stringify({
//                     userId: data.result.userId,
//                     email: data.result.email,
//                     name: data.result.name,
//                     role: data.result.role,
//                     premium: data.result.premium
//                 }));

//                 showNotification('Login successful! Redirecting...', 'success');
//                 setTimeout(() => {
//                     window.location.href = 'home.html';
//                 }, 1000);
//             } else {
//                 showNotification(data.message || 'Login failed!', 'error');
//             }
//         } catch (error) {
//             console.error('Login error:', error);
//             showNotification('An error occurred during login! Please try again later.', 'error');
//         }
//     });
// }

// Initialize Google Sign-In
document.addEventListener('DOMContentLoaded', () => {
    // Force English language
    document.documentElement.lang = 'en';
});

// Session management functions
function checkSessionValidity() {
    const loginTimestamp = sessionStorage.getItem('loginTimestamp');
    const token = sessionStorage.getItem('token');

    if (!loginTimestamp || !token) {
        return false;
    }

    const loginTime = parseInt(loginTimestamp);
    const currentTime = Date.now();
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Check if session has expired (24 hours)
    if (currentTime - loginTime > sessionTimeout) {
        console.log('Session expired, clearing data');
        clearSessionData();
        return false;
    }

    return true;
}

function clearSessionData() {
    sessionStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('loginTimestamp');
}

// Logout functions now handled by logout-manager.js

// Handle visibility change (when tab becomes hidden)
function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        // Logout intent handling removed - now handled by logout-manager.js
        console.log('Tab hidden - logout intent handled by logout-manager.js');
    } else if (document.visibilityState === 'visible') {
        // When tab becomes visible again, check if we need to logout
        const logoutIntent = localStorage.getItem('logoutIntent');
        if (logoutIntent) {
            console.log('Tab became visible, processing logout intent');
            // This is now handled by logout-manager.js
        }
    }
}

// Page unload handling removed - now handled by logout-manager.js

// Clear session data when loading auth pages
function clearSessionOnAuthPages() {
    const currentPath = window.location.pathname;
    // CHỈ CLEAR SESSION TRÊN TRANG LOGIN VÀ KHI CÓ THAM SỐ LOGOUT
    if (currentPath === '/' && window.location.search.includes('logout=true')) {
        console.log('Clearing session data on login page with logout=true:', currentPath);
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('loginTimestamp');
    }
}

// Call this function when page loads
document.addEventListener('DOMContentLoaded', function () {
    clearSessionOnAuthPages();
    // Chỉ check session nếu KHÔNG phải trang login, register, forgot-password, reset-password, verify-email
    const path = window.location.pathname;
    const isAuthPage = (
        path === '/' ||
        /\/pages\/(register|forgot-password|reset-password|verify-email)(\/|\/index\.html)?$/.test(path)
    );
    if (!isAuthPage) {
        if (!checkSessionValidity()) {
            console.log('Invalid session, redirecting to login');
            window.location.href = '/';
        }
    }
});

// Browser close handling removed - now handled by logout-manager.js

// Event listeners removed - now handled by logout-manager.js 