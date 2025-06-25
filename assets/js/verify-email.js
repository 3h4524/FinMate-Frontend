function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');

    notification.classList.remove('success', 'error', 'info');
    notification.classList.add(type);

    messageElement.textContent = message;
    notification.classList.add('show');

    setTimeout(() => hideNotification(), 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
}

const requiresVerification = sessionStorage.getItem('requiresVerification');
const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');

const urlParams = new URLSearchParams(window.location.search);
const emailFromUrl = urlParams.get('email');

if (!emailFromUrl && requiresVerification !== 'true' && !pendingEmail) {
    // if (isAuthenticated === 'true') {
    // window.location.href = '../home';
    // } else {
    // window.location.href = 'login.html';
    // }
}

const email = emailFromUrl || pendingEmail;
if (email) {
    document.getElementById('email').value = decodeURIComponent(email);
}

let timeLeft = 0;
const timerElement = document.getElementById('timer');
let timerInterval = null;
const sendCodeButton = document.getElementById('sendCodeButton');

async function sendVerificationCode() {
    const email = document.getElementById('email').value;

    // Immediate UI updates
    sendCodeButton.disabled = true;
    sendCodeButton.innerHTML = '<i class="fas fa-clock"></i> Resend Code';
    showNotification('Sending verification code...', 'info');

    // Start timer immediately
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timeLeft = 60; // Set to 1 minute
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);

    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) timerContainer.style.display = 'block';

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/resend-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email })
        });

        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { message: 'Invalid response from server.' };
        }

        if (response.ok) {
            showNotification(data.message || 'Verification code sent!', 'success');
        } else {
            showNotification(data.message || 'Failed to send verification code.', 'error');
        }
    } catch (error) {
        console.error('sendVerificationCode error:', error);
        showNotification('Error sending verification code.', 'error');
    }
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        sendCodeButton.disabled = false;
        sendCodeButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Code';
        timerElement.textContent = "00:00";
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

document.getElementById('verificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = document.getElementById('verificationCode').value;
    const userEmail = document.getElementById('email').value;

    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email: userEmail, otp })
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse response:', jsonError);
            showNotification('Invalid response from server.', 'error');
            return;
        }

        const serverMessage = data.message ? data.message.trim().toLowerCase() : '';
        const isVerifiedCodefully = (data.code === 1000 && serverMessage === 'Email verified successfully');

        if (response.ok || isVerifiedCodefully) {
            showNotification('Verification successful! Please log in.', 'success');
            if (timerInterval) clearInterval(timerInterval);

            // Remove localStorage items as user will explicitly log in
            // localStorage.removeItem('token');
            // localStorage.removeItem('userData');

            setTimeout(() => {
                try {
                    window.location.assign('../login');
                } catch (error) {
                    console.error('Redirection failed:', error);
                    showNotification('Could not redirect. Please go to the login page manually.', 'error');
                }
            }, 1500);
        } else {
            console.error('Verification failed:', data.message, 'Status:', response.status);
            showNotification(data.message || 'Invalid verification code.', 'error');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('Verification error. Please try again.', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateTimerDisplay();
    const timerContainer = document.querySelector('.timer-container');
    if (timerContainer) timerContainer.style.display = 'block';
});
