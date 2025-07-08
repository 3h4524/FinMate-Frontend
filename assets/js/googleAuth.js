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
        const apiResponse = await apiService.processGoogleLogin(response.credential);
        
        const data = apiResponse.result;
        
         if (data.isDelete) {
                    showNotification('Your account has been banned. Please contact support for assistance.', 'error');
                    return;
             }
        
        // Google users don't need email verification since Google already verified their email
        showNotification('Google login successful! Redirecting...', 'success');
        
        // Validate token before storing
        if (!data.token) {
            throw new Error('Invalid token received from server');
        }

<<<<<<< HEAD
        // Store authentication state and user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify({
=======
        // Store token
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('loginTimestamp', Date.now().toString());

        // Store authentication state and user data in sessionStorage
        sessionStorage.setItem('userData', JSON.stringify({
>>>>>>> origin/update_profile
            email: data.email,
            name: data.name,
            role: data.role,
            userId: data.userId,
            premium: data.premium
        }));

        // Verify token is stored correctly
<<<<<<< HEAD
        const storedToken = localStorage.getItem('token');
        const storedUserData = localStorage.getItem('userData');
=======
        const storedToken = sessionStorage.getItem('token');
        const storedUserData = sessionStorage.getItem('userData');
>>>>>>> origin/update_profile
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
<<<<<<< HEAD
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
=======
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
>>>>>>> origin/update_profile
            throw new Error('Invalid token format');
        }
        
        setTimeout(() => {
            // Verify token one last time before redirect
<<<<<<< HEAD
            const finalToken = localStorage.getItem('token');
            const finalUserData = localStorage.getItem('userData');
=======
            const finalToken = sessionStorage.getItem('token');
            const finalUserData = sessionStorage.getItem('userData');
>>>>>>> origin/update_profile
            if (!finalToken || !finalUserData) {
                showNotification('Authentication failed. Please try again.', 'error');
                return;
            }   
<<<<<<< HEAD
            window.location.href = '../home';
=======
            
            // Redirect based on user role, not current page
            const userData = JSON.parse(finalUserData);
            if (userData.role === 'ADMIN') {
                window.location.href = '../admin-dashboard';
            } else {
                window.location.href = '../home';
            }
>>>>>>> origin/update_profile
        }, 1000);
    } catch (error) {
        console.error('Google login error:', error);
        showNotification(error.message || 'An error occurred during Google login', 'error');
    }
}

// Initialize Google Sign-In with custom button text
function initGoogleSignIn(buttonText = 'signin_with') {
    console.log('Initializing Google Sign-In...');
<<<<<<< HEAD
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
=======
    
    // Make sure Google Sign-In script is loaded
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        console.log('Google Sign-In script not loaded yet, waiting...');
        setTimeout(() => initGoogleSignIn(buttonText), 100);
        return;
    }
    
    const currentOrigin = window.location.origin;
    console.log('Current origin:', currentOrigin);
    
    // Detect context based on current page
    const isRegisterPage = window.location.pathname.includes('register');
    const context = isRegisterPage ? 'signup' : 'signin';
    
    try {
        const buttonElement = document.getElementById('google-button');
        if (buttonElement) {
            buttonElement.setAttribute('data-locale', 'en'); // Force English for Google button
        }
        google.accounts.id.initialize({
            client_id: googleAuthConfig.clientId,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: context,
            ux_mode: 'popup',
            origin: currentOrigin,
            locale: 'en' // Force English language
        });
        if (buttonElement) {
            google.accounts.id.renderButton(
                buttonElement,
                {   
                    ...googleAuthConfig.buttonConfig,
                    text: buttonText
                }
            );
            console.log('Google Sign-In button rendered successfully');
        } else {
            console.error('Google button element not found');
        }
    } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
>>>>>>> origin/update_profile
    }
}

// Export functions for use in other files
<<<<<<< HEAD
export { initGoogleSignIn, handleGoogleSignIn }; 
=======
export { initGoogleSignIn, handleGoogleSignIn };

document.addEventListener('DOMContentLoaded', function() {
    let text = 'signin_with';
    if (window.location.pathname.includes('register')) text = 'signup_with';
    initGoogleSignIn(text);
}); 
>>>>>>> origin/update_profile
