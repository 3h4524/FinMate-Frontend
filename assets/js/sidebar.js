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

// Check user role and show/hide admin features
function checkUserRoleAndShowAdminFeatures() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Role được lưu trong trường 'scope' của JWT token
            const userRole = payload.scope;
            console.log('User role from token:', userRole);
            if (userRole === 'ADMIN') {
                const userManagementLink = document.getElementById('userManagementLink');
                if (userManagementLink) {
                    userManagementLink.style.display = 'block';
                    console.log('Admin role detected - showing User Management link');
                }
            }
        }
    } catch (error) {
        console.error('Error checking user role:', error);
    }
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

// Load sidebar với username (for backward compatibility)
async function loadSideBar(user) {
    const userName = user.username || user.name;
    loadSideBarSimple(userName);
}

// Load sidebar đơn giản chỉ cần username
function loadSideBarSimple(userName) {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            const sidebarUserNameSpan = document.querySelector('.sidebar .user-info .user-name');
            if (sidebarUserNameSpan) {
                sidebarUserNameSpan.textContent = userName;
            }
            const sidebarAvatar = document.querySelector('.sidebar .user-info img');
            if (sidebarAvatar) {
                sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=388e3c&color=fff`;
            }

            // Set active class for current page in sidebar
            setActiveSidebarLink();
            
            // Show admin features for admin users
            setTimeout(() => {
                checkUserRoleAndShowAdminFeatures();
            }, 100);
        });
}