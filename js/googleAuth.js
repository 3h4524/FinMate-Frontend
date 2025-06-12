import apiService from './services/api.js';

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
        
        if (!result.verified) {
            sessionStorage.setItem('requiresVerification', 'true');
            sessionStorage.setItem('pendingVerificationEmail', result.email);
            window.location.href = 'verify-email.html?email=' + encodeURIComponent(result.email);
            return;
        }
        
        showNotification('Google login successful! Redirecting...', 'success');
        
        // Validate token before storing
        if (!result.token) {
            throw new Error('Invalid token received from server');
        }

        // Store authentication state and user data in localStorage
        localStorage.setItem('token', result.token);


        // Verify token is stored correctly
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            throw new Error('Failed to store authentication token');
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
            throw new Error('Invalid token format');
        }
        
        setTimeout(() => {
            // Verify token one last time before redirect
            const finalToken = localStorage.getItem('token');
            if (!finalToken) {
                showNotification('Authentication failed. Please try again.', 'error');
                return;
            }   
            window.location.href = 'home.html';
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