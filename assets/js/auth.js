// Import API service
import apiService from './services/api.js';
<<<<<<< HEAD
import { initGoogleSignIn } from './googleAuth.js';
=======
>>>>>>> origin/update_profile

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

    password.addEventListener('input', function() {
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
<<<<<<< HEAD
    
    // Initialize Google Sign-In with appropriate text based on page
    const isRegisterPage = window.location.pathname.includes('register.html');
    initGoogleSignIn(isRegisterPage ? 'signup_with' : 'signin_with');

    // Initialize forms based on current page
    if (window.location.pathname.includes('register.html')) {
        // initRegisterForm();
        // initPasswordValidation();
    } else if (window.location.pathname.includes('login.html')) {
        // initLoginForm();
    }
}); 
=======
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

// Backup logout mechanism - store logout intent in localStorage
function setLogoutIntent() {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('userData');
    
    if (token && userData) {
        localStorage.setItem('logoutIntent', JSON.stringify({
            token: token,
            userData: userData,
            timestamp: Date.now()
        }));
        console.log('Logout intent stored');
    }
}

// Check and process logout intent on page load
function checkLogoutIntent() {
    const logoutIntent = localStorage.getItem('logoutIntent');
    
    if (logoutIntent) {
        try {
            const intent = JSON.parse(logoutIntent);
            const token = intent.token;
            
            // Check if this was from browser close
            if (intent.browserClosed) {
                console.log('Processing logout intent from browser close');
            }
            
            // Send logout request
            fetch('http://localhost:8080/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).then(() => {
                console.log('Backup logout processed successfully');
            }).catch(error => {
                console.log('Backup logout failed:', error);
            }).finally(() => {
                localStorage.removeItem('logoutIntent');
            });
        } catch (error) {
            console.log('Error processing logout intent:', error);
            localStorage.removeItem('logoutIntent');
        }
    }
}

// Handle browser/tab close events
function handleBeforeUnload() {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('userData');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            
            // Use synchronous XMLHttpRequest for more reliable delivery during page unload
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://localhost:8080/api/v1/auth/logout', false); // Synchronous
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send();
            
            console.log('Logout request sent on page unload');
        } catch (error) {
            console.log('Error during logout on page unload:', error);
        }
    }
}

// Handle visibility change (when tab becomes hidden)
function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        const token = sessionStorage.getItem('token');
        const userData = sessionStorage.getItem('userData');
        
        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                // Set logout intent as backup
                setLogoutIntent();
                
                // Send logout request to backend to set verified = false
                fetch('http://localhost:8080/api/v1/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    console.log('Logout successful on visibility change');
                }).catch(error => {
                    console.log('Logout request failed on visibility change:', error);
                });
            } catch (error) {
                console.log('Error parsing user data on visibility change:', error);
            }
        }
    } else if (document.visibilityState === 'visible') {
        // When tab becomes visible again, check if we need to logout
        const logoutIntent = localStorage.getItem('logoutIntent');
        if (logoutIntent) {
            console.log('Tab became visible, processing logout intent');
            checkLogoutIntent();
        }
    }
}

// Handle page unload with multiple strategies
function handlePageUnload() {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('userData');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            
            // Set logout intent as backup
            setLogoutIntent();
            
            // Strategy 1: Use sendBeacon if available
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify({})], {type: 'application/json'});
                navigator.sendBeacon('http://localhost:8080/api/v1/auth/logout', blob);
                console.log('Logout sent via sendBeacon');
            } else {
                // Strategy 2: Use synchronous XMLHttpRequest
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'http://localhost:8080/api/v1/auth/logout', false);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send();
                console.log('Logout sent via XMLHttpRequest');
            }
        } catch (error) {
            console.log('Error during logout on page unload:', error);
        }
    }
}

// Clear session data when loading auth pages
function clearSessionOnAuthPages() {
    const currentPath = window.location.pathname;
    // CHỈ CLEAR SESSION TRÊN TRANG LOGIN VÀ KHI CÓ THAM SỐ LOGOUT
    if (currentPath.includes('/pages/login/') && window.location.search.includes('logout=true')) {
        console.log('Clearing session data on login page with logout=true:', currentPath);
        sessionStorage.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('loginTimestamp');
    }
}

// Call this function when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check for logout intent first
    checkLogoutIntent();
    clearSessionOnAuthPages();
    // Chỉ check session nếu KHÔNG phải trang login, register, forgot-password, reset-password, verify-email
    const path = window.location.pathname;
    const isAuthPage = /\/pages\/(login|register|forgot-password|reset-password|verify-email)(\/|\/index\.html)?/.test(path);
    if (!isAuthPage) {
        if (!checkSessionValidity()) {
            console.log('Invalid session, redirecting to login');
            window.location.href = '/pages/login/';
        }
    }
});

// Handle browser close completely
function handleBrowserClose() {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('userData');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            
            // Store logout intent for next session
            localStorage.setItem('logoutIntent', JSON.stringify({
                token: token,
                userData: userData,
                timestamp: Date.now(),
                browserClosed: true
            }));
            
            // Try to send logout request
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify({})], {type: 'application/json'});
                navigator.sendBeacon('http://localhost:8080/api/v1/auth/logout', blob);
            }
        } catch (error) {
            console.log('Error during browser close:', error);
        }
    }
}

// Add event listeners for browser/tab close
window.addEventListener('beforeunload', handlePageUnload);
window.addEventListener('unload', handleBrowserClose);
document.addEventListener('visibilitychange', handleVisibilityChange); 
>>>>>>> origin/update_profile
