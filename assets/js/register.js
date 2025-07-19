// Add notification functions
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


// Password validation - synchronized with reset password page
function initPasswordValidation() {
    const password = document.getElementById('password');
    if (!password) return;

    const requirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    password.addEventListener('input', function () {
        const value = this.value;
        requirements.length.classList.toggle('valid', value.length >= 8);
        requirements.uppercase.classList.toggle('valid', /[A-Z]/.test(value));
        requirements.lowercase.classList.toggle('valid', /[a-z]/.test(value));
        requirements.number.classList.toggle('valid', /[0-9]/.test(value));
        requirements.special.classList.toggle('valid', /[!@#$%^&*]/.test(value));
    });
}

function initPasswordToggle() {
    // document.querySelectorAll('.password-toggle').forEach(btn => {
    //     const icon = btn;
    //     const targetInput = btn.dataset.target ? document.getElementById(btn.dataset.target) : btn.previousElementSibling;
    //     if (!targetInput) return;

    //     btn.addEventListener('click', () => {
    //         if (targetInput.type === 'password') {
    //             targetInput.type = 'text';
    //             icon.classList.remove('fa-eye-slash');
    //             icon.classList.add('fa-eye');
    //         } else {
    //             targetInput.type = 'password';
    //             icon.classList.add('fa-eye-slash');
    //             icon.classList.remove('fa-eye');
    //         }
    //     });
    // });
}

// Handle registration
document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Clear previous errors
    document.getElementById('nameError').style.display = 'none';
    document.getElementById('emailError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('confirmPasswordError').style.display = 'none';

    // Validate password - synchronized with reset password page
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
        showNotification('Password does not meet requirements.', 'error');
        document.getElementById('passwordError').textContent = 'Password does not meet requirements.';
        document.getElementById('passwordError').style.display = 'block';
        return;
    }

    // Check password match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        document.getElementById('confirmPasswordError').style.display = 'block';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name, email, password})
        });

        const data = await response.json();
        console.log('Register response:', data);

        if (data.code === 1000) {
            showNotification('Registration successful! Please check your email to verify your account.', 'success');
            // Redirect to email verification page
            setTimeout(() => {
                window.location.href = '../verify-email/index.html?email=' + encodeURIComponent(email);
            }, 2000);
        } else {
            // Show error message
            const errorMessage = data.message || 'Registration failed!';
            showNotification(errorMessage, 'error');

            // If it's an email already exists error, show it in the email field
            if (data.code === 1014) {
                document.getElementById('emailError').textContent = 'Email already registered';
                document.getElementById('emailError').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('An error occurred during registration! Please try again later.', 'error');
    }
});

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function () {
    initPasswordValidation();
    // initPasswordToggle();

    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
        rightPanel.addEventListener('click', (event) => {
            if (event.target.matches('[data-action="toggle-password"]')) {
                togglePassword();
            } else if (event.target.matches('[data-action="toggle-confirm-password"]')) {
                togglePassword(true);
            }
        });
    }

    // Initialize Google Sign-In
    import('./googleAuth.js').then(module => {
        module.initGoogleSignIn('signup_with');
    }).catch(error => {
        console.error('Failed to load Google Auth:', error);
    });
});