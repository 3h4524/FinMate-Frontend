document.addEventListener('DOMContentLoaded', function() {
    const resendLink = document.getElementById('resendLink');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const verificationStatus = document.getElementById('verificationStatus');
    const verificationIcon = document.getElementById('verificationIcon');

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    function updateVerificationStatus(status, message) {
        verificationStatus.textContent = message;
        verificationStatus.style.backgroundColor = status === 'success' ? '#e8f5e9' : '#ffebee';
        verificationStatus.style.color = status === 'success' ? '#2d5a3d' : '#dc3545';
        verificationIcon.innerHTML = status === 'success' ? 
            '<i class="fas fa-check-circle"></i>' : 
            '<i class="fas fa-exclamation-circle"></i>';
        verificationIcon.style.color = status === 'success' ? '#2d5a3d' : '#dc3545';
    }

    // Check verification status
    async function checkVerificationStatus() {
        if (!token) {
            updateVerificationStatus('error', 'Invalid or missing verification token');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/auth/verify-email?token=${token}`, {
                method: 'GET'
            });

            const data = await response.json();

            if (response.ok) {
                updateVerificationStatus('success', 'Email verified successfully!');
                showSuccess('Your email has been verified. You can now log in to your account.');
                // Redirect to login page after 5 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 5000);
            } else {
                updateVerificationStatus('error', 'Verification failed');
                showError(data.message || 'Failed to verify email. Please try again.');
            }
        } catch (error) {
            updateVerificationStatus('error', 'Verification failed');
            showError('Network error. Please check your connection and try again.');
        }
    }

    // Resend verification email
    async function resendVerificationEmail() {
        try {
            const response = await fetch('http://localhost:8080/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Verification email has been resent. Please check your inbox.');
            } else {
                showError(data.message || 'Failed to resend verification email. Please try again.');
            }
        } catch (error) {
            showError('Network error. Please check your connection and try again.');
        }
    }

    // Event listeners
    resendLink.addEventListener('click', function(e) {
        e.preventDefault();
        resendVerificationEmail();
    });

    // Check verification status on page load
    checkVerificationStatus();
}); 