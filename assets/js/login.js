function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
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

// Xử lý đăng nhập
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    document.getElementById('emailError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (data.code === 1000 && data.result) {
            // Check if user is banned
            if (data.result.isDelete) {
                showNotification('Your account has been banned. Please contact support for assistance.', 'error');
                return;
            }

            if (!data.result.verified) {
                if (data.result.role === 'ADMIN') {
                    showNotification('You must verify before login. Redirecting to verfication page...', 'error');

                } else {
                    showNotification('Your account is not verified. Redirecting to verfication page...', 'error');

                }
                setTimeout(() => {
                    window.location.href = `/pages/verify-email/?email=${email}`;
                }, 1000);
                return;
            }

            // Store user data
            localStorage.setItem('token', data.result.token);

            // Store user data from response
            const userData = {
                email: data.result.email,
                name: data.result.name,
                role: data.result.role
            };

            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('Stored user data:', userData);

            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                // Check user role and redirect accordingly
                const userRole = data.result.role;
                if (userRole === 'ADMIN') {
                    window.location.href = '/pages/admin-dashboard';
                } else {
                    window.location.href = '/pages/home';
                }
            }, 1000);
        } else {
            showNotification(data.message || 'Login failed!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Có lỗi xảy ra khi đăng nhập', 'error');
    }
});
