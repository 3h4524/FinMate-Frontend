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
        console.log('Login response:', response);
        
        if (response.requiresVerification) {
            sessionStorage.setItem('requiresVerification', 'true');
            sessionStorage.setItem('pendingVerificationEmail', response.email);
            window.location.href = '/verify-email.html?email=' + encodeURIComponent(response.email);
            return;
        }
        
        // Login successful
        showNotification('Login successful! Redirecting...', 'success');
        
        // Store authentication state and user data
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(response));
        sessionStorage.setItem('userId', response.userId);
        sessionStorage.setItem('userEmail', response.email);
        sessionStorage.setItem('userName', response.name);
        sessionStorage.setItem('userRole', response.role);
        sessionStorage.setItem('isPremium', response.premium);
        
        // Store token
        localStorage.setItem('token', response.token);
        
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
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(response));
        sessionStorage.setItem('userId', response.userId);
        sessionStorage.setItem('userEmail', response.email);
        sessionStorage.setItem('userName', response.name);
        sessionStorage.setItem('userRole', response.role);
        sessionStorage.setItem('isPremium', response.premium);
        
        // Store token
        localStorage.setItem('token', response.token);
        
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
                const response = await apiService.login({ email, password });
                console.log('Login response:', response);
                
                if (response.token) {
                    localStorage.setItem('token', response.token);
                    showNotification('Login successful!', 'success');
                    window.location.href = '/dashboard.html';
                }
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
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            try {
                const response = await apiService.register({ name, email, password });
                console.log('Register response:', response);
                showNotification('Registration successful! Please check your email for verification.', 'success');
                showLoginForm();
            } catch (error) {
                console.error('Register error:', error);
                showNotification(error.message || 'Registration failed', 'error');
            }
        });
    }

    // Google login button
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            console.log('Google login button clicked');
        });
    }

    // Forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Forgot password link clicked');
            
            const email = document.getElementById('loginEmail').value;
            if (!email) {
                showNotification('Please enter your email address', 'error');
                return;
            }
            
            try {
                await apiService.forgotPassword(email);
                showNotification('Password reset instructions sent to your email', 'success');
            } catch (error) {
                console.error('Forgot password error:', error);
                showNotification(error.message || 'Failed to process request', 'error');
            }
        });
    }

    // Toggle between login and register forms
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching to register form');
            showRegisterForm();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Switching to login form');
            showLoginForm();
        });
    }
});

// Form visibility functions
function showLoginForm() {
    console.log('Showing login form');
    if (loginSection) loginSection.style.display = 'block';
    if (registerSection) registerSection.style.display = 'none';
}

function showRegisterForm() {
    console.log('Showing register form');
    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'block';
}

// Google Sign-In handler
async function handleGoogleSignIn(response) {
    console.log('Google Sign-In response received');
    try {
        const result = await apiService.googleLogin(response.credential);
        console.log('Google login response:', result);
        
        if (result.token) {
            localStorage.setItem('token', result.token);
            showNotification('Login successful!', 'success');
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('Google login error:', error);
        showNotification(error.message || 'Google login failed', 'error');
    }
}

// Initialize Google Sign-In when the script loads
if (typeof google !== 'undefined') {
    initGoogleSignIn();
} else {
    console.log('Google Sign-In script not loaded yet');
} 