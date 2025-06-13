// Import API service
import apiService from './services/api.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const logoutBtn = document.getElementById('logoutBtn');

// Password toggle function
function togglePassword() {
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

// Notification functions
function showNotification(message, type = 'info') {
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

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

// Login function using API service
async function loginUser(email, password) {
    try {
        const response = await apiService.login({ email, password });
        
        if (response.requiresVerification) {
            sessionStorage.setItem('requiresVerification', 'true');
            sessionStorage.setItem('pendingVerificationEmail', response.email);
            window.location.href = '/verify-email.html?email=' + encodeURIComponent(response.email);
            return;
        }
        
        // Login successful
        showNotification('Login successful! Redirecting...', 'success');
        
        // Store authentication state and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('userData', JSON.stringify({
            userId: response.userId,
            email: response.email,
            name: response.name,
            role: response.role,
            premium: response.premium
        }));
        
        // Delay redirect to show notification
        setTimeout(() => {
            window.location.href = '/home.html';
        }, 1000);
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'An error occurred during login', 'error');
    }
}

// Google login function using API service
async function sendGoogleTokenToBackend(idToken) {
    try {
        const response = await apiService.processGoogleLogin(idToken);
        
        if (response.needSetPassword) {
            sessionStorage.setItem('userEmail', response.email);
            sessionStorage.setItem('needSetPassword', 'true');
            window.location.href = 'set-password.html';
            return;
        }
        
        showNotification('Google login successful! Redirecting...', 'success');
        
        // Store authentication state and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('userData', JSON.stringify({
            userId: response.userId,
            email: response.email,
            name: response.name,
            role: response.role,
            premium: response.premium
        }));
        
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1000);
    } catch (error) {
        console.error('Error sending Google token:', error);
        if (error.requiresVerification) {
            showNotification('Please verify your email address', 'info');
            sessionStorage.setItem('requiresVerification', 'true');
            sessionStorage.setItem('pendingVerificationEmail', error.email);
            setTimeout(() => {
                window.location.href = 'verify-email.html?email=' + encodeURIComponent(error.email);
            }, 1000);
        } else {
            showNotification(error.message || 'An error occurred during Google login', 'error');
        }
    }
}

// Logout function
async function logout() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await apiService.logout();
        }
        
        // Clear all stored data
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        sessionStorage.clear();
        
        // Show notification
        showNotification('Logged out successfully', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error during logout', 'error');
    }
}

// Initialize Google Sign-In
function initGoogleSignIn() {
    console.log('Initializing Google Sign-In...');
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleSignIn
    });
    google.accounts.id.renderButton(
        document.getElementById('googleLoginBtn'),
        { theme: 'outline', size: 'large' }
    );
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing event listeners...');
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                await loginUser(email, password);
            } catch (error) {
                console.error('Login error:', error);
                showNotification(error.message || 'Login failed', 'error');
            }
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted');
            
            const formData = new FormData(registerForm);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            };
            
            try {
                await apiService.register(userData);
                showNotification('Registration successful! Please verify your email.', 'success');
                setTimeout(() => {
                    window.location.href = '/verify-email.html?email=' + encodeURIComponent(userData.email);
                }, 1000);
            } catch (error) {
                console.error('Registration error:', error);
                showNotification(error.message || 'Registration failed', 'error');
            }
        });
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Show/hide forms
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }

    // Initialize Google Sign-In if on login page
    if (googleLoginBtn) {
        initGoogleSignIn();
    }
});

function showLoginForm() {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
}

function showRegisterForm() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
}

async function handleGoogleSignIn(response) {
    try {
        await sendGoogleTokenToBackend(response.credential);
    } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification(error.message || 'Google sign-in failed', 'error');
    }
} 