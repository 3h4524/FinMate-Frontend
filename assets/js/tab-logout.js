// Tab Logout Handler - Auto logout when tab is closed
(function () {
    'use strict';

    // Store logout data when tab is about to close
    function handleTabClose() {
        const token = sessionStorage.getItem('token');
        const userData = sessionStorage.getItem('userData');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);

                // Store logout intent in localStorage for backup
                localStorage.setItem('tabLogoutIntent', JSON.stringify({
                    token: token,
                    timestamp: Date.now()
                }));

                // Try to send logout request immediately
                // Method 1: sendBeacon (most reliable for page unload)
                if (navigator.sendBeacon) {
                    const formData = new FormData();
                    formData.append('token', token);
                    navigator.sendBeacon('http://localhost:8080/api/v1/auth/logout', formData);
                    console.log('Tab logout: sendBeacon sent');
                }

                // Method 2: Synchronous XMLHttpRequest as backup
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', 'http://localhost:8080/api/v1/auth/logout', false);
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.send();
                    console.log('Tab logout: XMLHttpRequest sent');
                } catch (e) {
                    console.log('Tab logout: XMLHttpRequest failed', e);
                }

            } catch (error) {
                console.log('Tab logout: Error processing logout', error);
            }
        }
    }

    // Process pending logout when page loads
    function processPendingLogout() {
        const logoutIntent = localStorage.getItem('tabLogoutIntent');

        if (logoutIntent) {
            try {
                const data = JSON.parse(logoutIntent);
                const token = data.token;

                console.log('Processing pending tab logout');

                // Send logout request
                fetch('http://localhost:8080/api/v1/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    console.log('Pending tab logout processed successfully');
                }).catch(error => {
                    console.log('Pending tab logout failed:', error);
                }).finally(() => {
                    localStorage.removeItem('tabLogoutIntent');
                });
            } catch (error) {
                console.log('Error processing pending tab logout:', error);
                localStorage.removeItem('tabLogoutIntent');
            }
        }
    }

    // Handle tab visibility change
    function handleTabVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            console.log('Tab hidden - triggering logout');
            handleTabClose();
        }
    }

    // Initialize when DOM is ready
    function init() {
        // Process any pending logout from previous session
        processPendingLogout();

        // Add event listeners
        window.addEventListener('beforeunload', handleTabClose);
        window.addEventListener('unload', handleTabClose);
        document.addEventListener('visibilitychange', handleTabVisibilityChange);

        console.log('Tab logout handler initialized');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); 