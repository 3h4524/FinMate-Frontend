// Authentication logic for user pages
document.addEventListener('DOMContentLoaded', async function() {
<<<<<<< HEAD
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        console.log('[AUTH] No token or user data found, redirecting to login');
        window.location.href = 'login.html';
=======
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('userData');
    
    if (!token || !userData) {
        console.log('[AUTH] No token or user data found, redirecting to login');
        window.location.href = '../login/';
>>>>>>> origin/update_profile
        return;
    }

    // Load UI immediately with cached data for better UX
    const user = JSON.parse(userData);
    const userName = user.name || user.email.split('@')[0];
    
    // Show content and load sidebar immediately
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'flex';
    
    // Load sidebar immediately
    loadSideBarSimple(userName);

    // Update header name for home page
    const headerUserName = document.getElementById('userFullNameHeader');
    if (headerUserName) {
        headerUserName.textContent = userName;
    }

    // Hide loading spinner if exists
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) loadingSpinner.style.display = 'none';

    console.log('[AUTH] Verifying token with server in background...');
    
    try {
        const response = await fetch('http://localhost:8080/api/v1/auth/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('[AUTH] Response not OK, status:', response.status);
            if (response.status === 401 || response.status === 403) {
                console.log('[AUTH] Unauthorized, redirecting to login');
<<<<<<< HEAD
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
                window.location.href = 'login.html';
=======
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userData');
                window.location.href = '../login/';
>>>>>>> origin/update_profile
                return;
            }
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.log('[AUTH] Parse error, continuing with cached data:', e);
            return; // Don't redirect on parse error
        }

        if (data.code !== 1000) {
            console.log('[AUTH] Token verification failed:', data.message);
<<<<<<< HEAD
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
=======
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
            window.location.href = '../login/';
>>>>>>> origin/update_profile
            return;
        }

        console.log('[AUTH] Background verification successful');
        
    } catch (error) {
        console.error('[AUTH] Network error during background verification:', error);
        console.log('[AUTH] Continuing with cached credentials due to network error');
    }
});