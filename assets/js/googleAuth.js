import apiService from './services/api.js';

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

// Google authentication configuration
const googleAuthConfig = {
    clientId: '455189339360-ah566hols1au0npc7mou7halnl7ba4uk.apps.googleusercontent.com',
    buttonConfig: {
        type: 'standard',
        size: 'large',
        theme: 'outline',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '280'
    }
};

// Handle Google Sign-In response
async function handleGoogleSignIn(response) {
    try {
        const result = await apiService.processGoogleLogin(response.credential);
        
        // Google users don't need email verification since Google already verified their email
        showNotification('Google login successful! Redirecting...', 'success');
        
        // Validate token before storing
        if (!result.token) {
            throw new Error('Invalid token received from server');
        }

        // Store authentication state and user data in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('userData', JSON.stringify({
            email: result.email,
            name: result.name,
            role: result.role,
            userId: result.userId,
            premium: result.premium
        }));

        // Verify token is stored correctly
        const storedToken = localStorage.getItem('token');
        const storedUserData = localStorage.getItem('userData');
        if (!storedToken || !storedUserData) {
            throw new Error('Failed to store authentication data');
        }

        // Verify token is valid before redirecting
        try {
            const tokenData = JSON.parse(atob(storedToken.split('.')[1]));
            if (tokenData.exp * 1000 < Date.now()) {
                throw new Error('Token is expired');
            }
        } catch (error) {
            console.error('Token validation error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            throw new Error('Invalid token format');
        }
        
        setTimeout(() => {
            // Verify token one last time before redirect
            const finalToken = localStorage.getItem('token');
            const finalUserData = localStorage.getItem('userData');
            if (!finalToken || !finalUserData) {
                showNotification('Authentication failed. Please try again.', 'error');
                return;
            }   
            window.location.href = '/pages/home.html';
        }, 1000);
    } catch (error) {
        console.error('Google login error:', error);
        showNotification(error.message || 'An error occurred during Google login', 'error');
    }
}

// Initialize Google Sign-In with custom button text
function initGoogleSignIn(buttonText = 'signin_with') {
    console.log('Initializing Google Sign-In...');
    const currentOrigin = window.location.origin;
    console.log('Current origin:', currentOrigin);
    
    google.accounts.id.initialize({
        client_id: googleAuthConfig.clientId,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        origin: currentOrigin,
        locale: 'en' // Force English language
    });

    const buttonElement = document.getElementById('google-button');
    if (buttonElement) {
        google.accounts.id.renderButton(
            buttonElement,
            {   
                ...googleAuthConfig.buttonConfig,
                text: buttonText
            }
        );
    }
}

// Export functions for use in other files
export { initGoogleSignIn, handleGoogleSignIn }; 