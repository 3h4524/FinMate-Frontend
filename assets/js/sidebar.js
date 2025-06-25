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
                // Show admin menu items and divider
                const adminDivider = document.getElementById('adminDivider');
                const adminDashboardLink = document.getElementById('adminDashboardLink');
                const userManagementLink = document.getElementById('userManagementLink');
                const systemLogLink = document.getElementById('systemLogLink');
                const premiumAdminLink = document.getElementById('premiumAdminLink');

                if (adminDivider) {
                    adminDivider.style.display = 'block';
                    console.log('Admin role detected - showing Admin divider');
                }

                if (adminDashboardLink) {
                    adminDashboardLink.style.display = 'block';
                    console.log('Admin role detected - showing Admin Dashboard link');
                }

                if (userManagementLink) {
                    userManagementLink.style.display = 'block';
                    console.log('Admin role detected - showing User Management link');
                }

                if (systemLogLink) {
                    systemLogLink.style.display = 'block';
                    console.log('Admin role detected - showing System Log link');
                }

                if (premiumAdminLink) {
                    premiumAdminLink.style.display = 'block';
                    console.log('Admin role detected - showing Premium Manager link');
                }

                const userMenuItems = document.querySelectorAll('.user-menu');
                userMenuItems.forEach(item => {
                    item.style.display = 'none';
                });
            } else {
                // Hide admin menu items for regular users
                const adminMenuItems = document.querySelectorAll('.admin-menu');
                adminMenuItems.forEach(item => {
                    item.style.display = 'none';
                });
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
        window.location.href = '../login';
    }
}

// Load sidebar với username (for backward compatibility)
async function loadSideBar(user) {
    console.log("loadSideBar ne: ", user.username);
    console.log("loadSideBar ne: ", user);

    const userName = user.username || user.name;
    loadSideBarSimple(userName);
}

// Modern Sidebar HTML template
const sidebarTemplate = `
<!-- Modern Sidebar Component -->
<div class="sidebar">
    <div class="sidebar-header">
        <div class="logo">
            <div class="logo-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <span class="logo-text">FINMATE</span>
        </div>
    </div>
    
    <div class="sidebar-content">
        <nav>
            <ul class="nav-list">
                <!-- Regular User Menu -->
                <li class="nav-item user-menu">
                    <a href="../home" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-home"></i>
                        </div>
                        <span class="nav-text">Home</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                <li class="nav-item user-menu">
                    <a href="../transaction" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        <span class="nav-text">Transactions</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                <li class="nav-item user-menu">
                    <a href="../goal" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-bullseye"></i>
                        </div>
                        <span class="nav-text">Goals</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                <li class="nav-item user-menu">
                    <a href="../budget" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <span class="nav-text">Budget</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                <li class="nav-item user-menu">
                    <a href="../financial_report" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <span class="nav-text">Reports</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>

                <li class="nav-item user-menu">
                    <a href="../user_premium" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <span class="nav-text">Premium Plan</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                
                <!-- Admin Menu -->
                <li class="nav-divider admin-menu" id="adminDivider" style="display: none;">
                    <span>Admin</span>
                </li>
                <li class="nav-item admin-menu" id="adminDashboardLink" style="display: none;">
                    <a href="../admin-dashboard" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-tachometer-alt"></i>
                        </div>
                        <span class="nav-text">Dashboard</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                <li class="nav-item admin-menu" id="userManagementLink" style="display: none;">
                    <a href="../user-management" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-users-cog"></i>
                        </div>
                        <span class="nav-text">User Management</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>
                   <li class="nav-item admin-menu" id="systemLogLink" style="display: none;">
                    <a href="../system-log" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-users-cog"></i>
                        </div>
                        <span class="nav-text">System Log</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>

                </li>
                   <li class="nav-item admin-menu" id="premiumAdminLink" style="display: none;">
                    <a href="../subscription-manager" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-users-cog"></i>
                        </div>
                        <span class="nav-text">Premium Manager</span>
                        <div class="nav-indicator"></div>
                    </a>
                </li>

            </ul>
        </nav>
    </div>
    
    <div class="sidebar-footer">
        <button class="logout-btn" onclick="handleLogout()">
            <div class="logout-icon">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            <span>Logout</span>
        </button>
        
        <div class="user-profile" id="viewProfileBtn">
            <div class="user-avatar">
                <img id="sidebarAvatar" src="https://via.placeholder.com/40" alt="User Avatar">
                <div class="user-status"></div>
            </div>
            <div class="user-details">
                <span class="user-name">Loading...</span>
                <span class="user-role">View profile</span>
            </div>
            <div class="profile-menu">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    </div>
</div>

<style>
    .sidebar {
        width: 270px;
        background: #1a3d2e;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        color: #fff;
        display: flex;
        flex-direction: column;
        position: fixed;
        height: 100vh;
        z-index: 10;
        overflow: hidden;
        box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
        left: 0;
        top: 0;
    }

    /* Header Section */
    .sidebar-header {
        padding: 24px 20px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .logo-icon {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.25);
    }

    .logo-icon i {
        font-size: 18px;
        color: #fff;
    }

    .logo-text {
        font-size: 20px;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.3px;
    }

    /* Content Section */
    .sidebar-content {
        flex: 1;
        padding: 16px 0;
        overflow-y: auto;
    }

    .nav-list {
        list-style: none;
        padding: 0 16px;
        margin: 0;
    }

    .nav-divider {
        margin: 20px 0 8px;
        padding: 0 12px;
        font-size: 11px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .nav-item {
        margin-bottom: 2px;
    }

    .nav-link {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-radius: 10px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.7);
        transition: all 0.2s ease;
        position: relative;
    }

    .nav-link:hover {
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.9);
    }

    .nav-link.active {
        background: linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(56, 142, 60, 0.15) 100%);
        color: #fff;
        border: 1px solid rgba(76, 175, 80, 0.2);
    }

    .nav-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .nav-link:hover .nav-icon {
        background: rgba(255, 255, 255, 0.12);
    }

    .nav-link.active .nav-icon {
        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
        box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
    }

    .nav-icon i {
        font-size: 16px;
        color: inherit;
    }

    .nav-text {
        margin-left: 12px;
        font-size: 14px;
        font-weight: 500;
        color: inherit;
    }

    .nav-link.active .nav-text {
        font-weight: 600;
    }

    .nav-indicator {
        position: absolute;
        right: 8px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #4caf50;
        opacity: 0;
        transition: all 0.2s ease;
    }

    .nav-link.active .nav-indicator {
        opacity: 1;
    }

    /* Footer Section */
    .sidebar-footer {
        padding: 16px 20px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        margin-top: auto;
    }

    .logout-btn {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 10px 12px;
        background: rgba(220, 38, 38, 0.08);
        border: 1px solid rgba(220, 38, 38, 0.15);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 12px;
    }

    .logout-btn:hover {
        background: rgba(220, 38, 38, 0.12);
        border-color: rgba(220, 38, 38, 0.25);
        color: #fff;
    }

    .logout-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(220, 38, 38, 0.15);
        margin-right: 10px;
        flex-shrink: 0;
    }

    .logout-icon i {
        font-size: 14px;
        color: #ff6b6b;
    }

    .user-profile {
        display: flex;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .user-profile:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(76, 175, 80, 0.2);
    }

    .user-avatar {
        position: relative;
        margin-right: 10px;
        flex-shrink: 0;
    }

    .user-avatar img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 255, 255, 0.15);
    }

    .user-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 6px;
        height: 6px;
        background: #4caf50;
        border: 1px solid #1a3d2e;
        border-radius: 50%;
    }

    .user-details {
        flex: 1;
        min-width: 0;
    }

    .user-name {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        line-height: 1.2;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .user-role {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 400;
    }

    .profile-menu {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .profile-menu i {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
    }

    .user-profile:hover .profile-menu {
        background: rgba(76, 175, 80, 0.15);
    }

    .user-profile:hover .profile-menu i {
        color: #4caf50;
    }

    /* Scrollbar */
    .sidebar-content::-webkit-scrollbar {
        width: 3px;
    }

    .sidebar-content::-webkit-scrollbar-track {
        background: transparent;
    }

    .sidebar-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
    }

    .sidebar-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
    }

    /* Responsive */
    @media (max-width: 900px) {
        .sidebar {
            display: none;
        }
    }

    /* Ensure no overflow */
    #sidebar-container {
        width: 270px;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 0;
        z-index: 10;
        overflow: hidden;
    }

    body {
        margin: 0;
        padding: 0;
    }
</style>
`;

// Load sidebar đơn giản chỉ cần username - Không cần fetch nữa
function loadSideBarSimple(userName) {
    const sidebarContainer = document.getElementById('sidebar-container');

    // Load sidebar template instantly
    sidebarContainer.innerHTML = sidebarTemplate;

    // Update user info immediately
    const sidebarUserNameSpan = document.querySelector('.sidebar .user-details .user-name');
    if (sidebarUserNameSpan) {
        sidebarUserNameSpan.textContent = userName;
    }
    const sidebarAvatar = document.querySelector('.sidebar .user-avatar img');
    if (sidebarAvatar) {
        sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=388e3c&color=fff`;
    }

    // Set active class for current page in sidebar
    setActiveSidebarLink();

    // Show admin features for admin users
    checkUserRoleAndShowAdminFeatures();
}