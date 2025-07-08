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

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendResetLink(email) {
    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    try {
        // Disable button and show loading state
        submitButton.disabled = true;
<<<<<<< HEAD
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        showNotification('Đang gửi yêu cầu...', 'info');
=======
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        showNotification('Sending request...', 'info');
>>>>>>> origin/update_profile

        const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.code === 1000) {
<<<<<<< HEAD
            showNotification('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.', 'success');
            setTimeout(() => {
                window.location.href = '../../pages/login/';
            }, 2000);
        } else {
            const errorMessage = data.message || 'Không thể gửi liên kết đặt lại mật khẩu.';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Lỗi khi gửi liên kết đặt lại mật khẩu:', error);
        showNotification('Có lỗi xảy ra khi gửi liên kết đặt lại mật khẩu!', 'error');
=======
            showNotification('Password reset link has been sent to your email.', 'success');
            setTimeout(() => {
                window.location.href = '../login/';
            }, 2000);
        } else {
            const errorMessage = data.message || 'Could not send password reset link.';
            showNotification(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Error sending password reset link:', error);
        showNotification('An error occurred while sending the reset link!', 'error');
>>>>>>> origin/update_profile
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

document.getElementById('forgotForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value;

    // Reset error message
    document.getElementById('emailError').style.display = 'none';

    // Validate email
    if (!email) {
<<<<<<< HEAD
        showNotification('Vui lòng nhập email của bạn.', 'error');
=======
        showNotification('Please enter your email address.', 'error');
>>>>>>> origin/update_profile
        return;
    }

    if (!validateEmail(email)) {
<<<<<<< HEAD
        showNotification('Vui lòng nhập email hợp lệ.', 'error');
=======
        showNotification('Please enter a valid email address.', 'error');
>>>>>>> origin/update_profile
        return;
    }

    sendResetLink(email);
});