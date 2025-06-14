// Import API service
import apiService from './services/api.js';
import { initGoogleSignIn } from './googleAuth.js';

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
export function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Check password match
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log('Register response:', data);

            if (data.code === 1000) {
                showNotification('Registration successful! Please check your email to verify your account.', 'success');
                // Redirect to email verification page
                setTimeout(() => {
                    window.location.href = 'verify-email.html?email=' + encodeURIComponent(email);
                }, 2000);
            } else {
                // Show error message
                const errorMessage = data.message || 'Registration failed!';
                showNotification(errorMessage, 'error');
                
                // If it's an email already exists error, show it in the email field
                if (data.code === 1014) {
                    const emailError = document.getElementById('email-error');
                    if (emailError) {
                        emailError.textContent = 'Email already registered';
                        emailError.style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            showNotification('An error occurred during registration! Please try again later.', 'error');
        }
    });
}



// Initialize Google Sign-In
document.addEventListener('DOMContentLoaded', () => {
    // Force English language
    document.documentElement.lang = 'en';
    
    // Initialize Google Sign-In with appropriate text based on page
    const isRegisterPage = window.location.pathname.includes('register.html');
    initGoogleSignIn(isRegisterPage ? 'signup_with' : 'signin_with');

    // Initialize forms based on current page
    if (window.location.pathname.includes('register.html')) {
        initRegisterForm();
        initPasswordValidation();
    } else if (window.location.pathname.includes('login.html')) {
        initLoginForm();
    }
}); 