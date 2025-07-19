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

// Handle login
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('password').value;

    document.getElementById('emailError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email, password})
        });

        const data = await response.json();
        console.log('Login response:', data);
        console.log('isVerified:', data.result?.isVerified);
        console.log('is2FAEnabled:', data.result?.is2FAEnabled);
        console.log('role:', data.result?.role);

        if (data.code === 1000 && data.result) {
            // Check if user is banned
            if (data.result.isDelete) {
                showNotification('Your account has been banned. Please contact support for assistance.', 'error');
                return;
            }

            // Check email verification
            if (!data.result.isVerified) {
                // Only require verification for admin and 2FA users
                if (data.result.role === 'ADMIN' || data.result.is2FAEnabled) {
                    if (data.result.role === 'ADMIN') {
                        showNotification('Admin account requires email verification. Redirecting to verification page...', 'error');
                    } else {
                        showNotification('Your account requires email verification. Redirecting to verification page...', 'error');
                    }
                    setTimeout(() => {
                        window.location.href = `../verify-email/index.html?email=${email}`;
                    }, 1000);
                    return;
                } else {
                    // Regular users without 2FA can proceed
                    console.log('Regular user without 2FA, proceeding to login despite not verified');
                }
            }

            // If verified or regular user without 2FA, proceed with login
            console.log('User can proceed to login');

            // Store user data in sessionStorage instead of localStorage
            sessionStorage.setItem('token', data.result.token);
            sessionStorage.setItem('loginTimestamp', Date.now().toString());

            // Store user data from response
            const userData = {
                email: data.result.email,
                name: data.result.name,
                role: data.result.role,
                is2FAEnabled: data.result.is2FAEnabled || false
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));
            console.log('Stored user data:', userData);

            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                // Check user role and redirect accordingly
                const userRole = data.result.role;
                if (userRole === 'ADMIN') {
                    window.location.href = 'pages/admin-dashboard/';
                } else {
                    window.location.href = 'pages/home/';
                }
            }, 1000);
        } else if (data.code === 1003) {
            showNotification('Please verify your email before logging in.', 'error');
            setTimeout(() => {
                window.location.href = `../verify-email/index.html?email=${email}`;
            }, 1000);
        } else {
            showNotification(data.message || 'Login failed!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login. Please try again.', 'error');
    }
});

// Event delegation
document.addEventListener('DOMContentLoaded', () => {
    const rightPanel = document.querySelector('.right-panel');
    rightPanel.addEventListener('click', (event) => {
        if (event.target.matches('[data-action="toggle-password"]')) {
            togglePassword();
        }
    });
});