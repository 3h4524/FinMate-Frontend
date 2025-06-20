function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.sidebar nav ul li a');

    links.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Handle logout
async function handleLogout() {
    console.log('[LOGOUT] Logout triggered');
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const response = await fetch('http://localhost:8080/api/v1/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('[LOGOUT] Logout failed on server');
            }
        }
    } catch (error) {
        console.error('[LOGOUT] Error during logout:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
}

async function loadSideBar(user) {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            const sidebarUserNameSpan = document.querySelector('.sidebar .user-info .user-name');
            if (sidebarUserNameSpan) {
                sidebarUserNameSpan.textContent = user.username;
            }
            const sidebarAvatar = document.querySelector('.sidebar .user-info img');
            if (sidebarAvatar) {
                sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=388e3c&color=fff`;
            }

            // Set active class for current page in sidebar
            setActiveSidebarLink();
        });
}