// Sidebar Management Functions

// Load sidebar HTML content
async function loadSidebarHTML() {
    try {
        const response = await fetch('../sidebar.html');
        if (!response.ok) {
            throw new Error('Failed to load sidebar.html');
        }
        let html = await response.text();
        
        // Apply saved state to HTML before rendering to prevent flash
        if (window.innerWidth > 1024) {
            const savedState = getSidebarState();
            if (savedState) {
                // If collapsed, modify the HTML to include collapsed classes immediately
                html = html.replace(
                    'id="sidebar" class="fixed h-screen bg-white shadow-xl transition-all duration-300 flex flex-col z-40 top-16" style="width: 256px;"',
                    'id="sidebar" class="fixed h-screen bg-white shadow-xl transition-all duration-300 flex flex-col z-40 top-16 sidebar-collapsed" style="width: 80px;"'
                );
            }
        }
        
        return html;
    } catch (error) {
        console.error('Error loading sidebar HTML:', error);
        return null;
    }
}

// Sidebar state management
function getSidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === null ? false : saved === 'true'; // Default to expanded (false) if no saved state
}

// Apply body class immediately for CSS pre-loading
function applyBodySidebarClass() {
    if (window.innerWidth > 1024) {
        const savedState = getSidebarState();
        if (savedState) {
            document.body.classList.add('sidebar-state-collapsed');
        } else {
            document.body.classList.remove('sidebar-state-collapsed');
        }
    }
}

function setSidebarState(isCollapsed) {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    // Update body class immediately
    applyBodySidebarClass();
}

function applySidebarState(isCollapsed) {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar) return;
    
    if (window.innerWidth <= 1024) {
        // Mobile: Always reset to default mobile state
        sidebar.classList.remove('sidebar-collapsed', 'sidebar-open');
        sidebar.style.width = '';
        if (mainContent) {
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.style.marginLeft = '0px';
            mainContent.style.width = '100%';
        }
        return;
    }
    
    // Desktop only: Apply collapsed/expanded state
    if (isCollapsed) {
        // Apply collapsed state
        sidebar.classList.add('sidebar-collapsed');
        sidebar.style.width = '80px';
        if (mainContent) {
            mainContent.classList.add('sidebar-collapsed');
            mainContent.style.marginLeft = '80px';
            mainContent.style.width = 'calc(100% - 80px)';
        }
    } else {
        // Apply expanded state
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.style.width = '256px';
        if (mainContent) {
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.style.marginLeft = '256px';
            mainContent.style.width = 'calc(100% - 256px)';
        }
    }
}

// Global toggle sidebar function for header integration
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainContent = document.querySelector('.main-content');

    if (!sidebar || !mainContent) {
        console.error('Sidebar or main content element not found!');
        return;
    }

    if (window.innerWidth <= 1024) {
        // Mobile: Toggle overlay sidebar
        sidebar.classList.toggle('sidebar-open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('overlay-visible');
        }
        
        // Reset main content styles for mobile
        mainContent.style.marginLeft = '0px';
        mainContent.style.width = '100%';
    } else {
        // Desktop: Toggle collapsed sidebar and save state
        const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
        const newState = !isCollapsed;
        
        // Save new state to localStorage
        setSidebarState(newState);
        
        // Apply new state
        applySidebarState(newState);
    }
};

// Global logout function for sidebar integration
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
};

// Set active sidebar link based on current page
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.sidebar-item');

    links.forEach(link => {
        if (link.getAttribute('data-page') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Check user role and show/hide admin features
function checkUserRoleAndShowAdminFeatures() {
    try {
        // Ưu tiên lấy userData từ sessionStorage (vì login và xác thực đều lưu ở đây)
        let userData = sessionStorage.getItem('userData');
        if (!userData) userData = localStorage.getItem('userData');
        let userRole = null;
        if (userData) {
            try {
                const user = JSON.parse(userData);
                userRole = user.role;
            } catch (e) { userRole = null; }
        }
        // Fallback: lấy từ token nếu không có userData
        if (!userRole) {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userRole = payload.scope || payload.role;
                } catch (e) { userRole = null; }
            }
        }
        if (userRole && userRole.toString().toUpperCase() === 'ADMIN') {
            // Show admin menu items only
            document.querySelectorAll('.admin-menu').forEach(menu => {
                menu.classList.remove('hidden');
                menu.style.display = 'block';
            });
            // Hide all user menu items for admin (including container)
            const userMenuSection = document.querySelector('.user-menu-section');
            if (userMenuSection) userMenuSection.style.display = 'none';
            document.querySelectorAll('.user-menu').forEach(item => {
                item.style.display = 'none';
            });
            console.log('Admin sidebar loaded - showing only admin features');
        } else {
            // Show user menu items only
            const userMenuSection = document.querySelector('.user-menu-section');
            if (userMenuSection) userMenuSection.style.display = 'block';
            document.querySelectorAll('.user-menu').forEach(item => {
                item.style.display = 'flex';
            });
            // Hide admin menu items for regular users
            document.querySelectorAll('.admin-menu').forEach(menu => {
                menu.classList.add('hidden');
                menu.style.display = 'none';
            });
            console.log('User sidebar loaded - showing only user features');
        }
    } catch (error) {
        console.error('Error checking user role:', error);
        // Fallback: hide admin menus if error
        document.querySelectorAll('.admin-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }
}

// Set active tab based on current page
function setActiveTab() {
    const currentPage = window.location.pathname;
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    // Remove active class from all items
    sidebarItems.forEach(item => {
        item.classList.remove('active');
        item.classList.add('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-800');
        item.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white', 'shadow-lg');
    });

    // Determine active item based on current page
    let activeItem;
    if (currentPage.includes('home')) {
        activeItem = document.querySelector('[data-page="dashboard"]');
    } else if (currentPage.includes('recurring-transaction')) {
        activeItem = document.querySelector('[data-page="recurring-transaction"]');
    } else if (currentPage.includes('transaction')) {
        activeItem = document.querySelector('[data-page="transactions"]');
    } else if (currentPage.includes('goal')) {
        activeItem = document.querySelector('[data-page="goals"]');
    } else if (currentPage.includes('budget')) {
        activeItem = document.querySelector('[data-page="budget"]');
    } else if (currentPage.includes('financial_report')) {
        activeItem = document.querySelector('[data-page="reports"]');
    } else if (currentPage.includes('user_premium')) {
        activeItem = document.querySelector('[data-page="premium"]');
    } else if (currentPage.includes('admin-dashboard')) {
        activeItem = document.querySelector('[data-page="admin-dashboard"]');
    } else if (currentPage.includes('user-management')) {
        activeItem = document.querySelector('[data-page="user-management"]');
    } else if (currentPage.includes('system-log')) {
        activeItem = document.querySelector('[data-page="system-log"]');
    } else if (currentPage.includes('subscription-manager')) {
        activeItem = document.querySelector('[data-page="subscription-manager"]');
    }

    // Add active class to current item
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.classList.remove('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-800');
        activeItem.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white', 'shadow-lg');
    }
}

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // Apply saved sidebar state IMMEDIATELY for desktop
    if (window.innerWidth > 1024) {
        const savedState = getSidebarState();
        applySidebarState(savedState);
    }
    
    // Handle responsive behavior
    handleResponsiveBehavior();
    
    // Set initial active state
    setActiveTab();
    
    // Check user role and adjust menu
    checkUserRoleAndShowAdminFeatures();
    
    // Load user info
    loadUserInfo();
    
    // Mark content as ready and enable transitions
    setTimeout(() => {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('content-ready');
        }
        document.body.classList.add('page-loaded');
    }, 50);
    
    console.log('Sidebar initialized successfully');
}

// Handle responsive behavior
function handleResponsiveBehavior() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 1024) {
            // Mobile: Reset sidebar state and close if open
            if (sidebar) {
                sidebar.classList.remove('sidebar-collapsed', 'sidebar-open');
                sidebar.style.width = '';
            }
            if (mainContent) {
                mainContent.classList.remove('sidebar-collapsed');
                mainContent.style.marginLeft = '0px';
                mainContent.style.width = '100%';
            }
            // Hide overlay if visible
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('overlay-visible');
            }
        } else {
            // Desktop: Apply saved state when resizing to desktop
            const savedState = getSidebarState();
            applySidebarState(savedState);
        }
    });
    
    // Handle overlay click on mobile
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
            }
            sidebarOverlay.classList.remove('overlay-visible');
        });
    }
}

// Load user information
function loadUserInfo() {
    const token = localStorage.getItem('token');
    if (token) {
        const usernameElement = document.querySelector('.user-name');
        if (usernameElement) {
            // Try to get user data from localStorage first
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    usernameElement.textContent = user.name || user.username || 'User';
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    usernameElement.textContent = 'User';
                }
            } else {
                usernameElement.textContent = 'Loading...';
            }
        }
    }
}

// Load sidebar for simple use case
async function loadSideBarSimple(userName) {
    try {
        // Apply main content state immediately before loading sidebar
        if (window.innerWidth > 1024) {
            const savedState = getSidebarState();
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                if (savedState) {
                    // Collapsed state
                    mainContent.classList.add('sidebar-collapsed');
                    mainContent.style.marginLeft = '80px';
                    mainContent.style.width = 'calc(100% - 80px)';
                } else {
                    // Expanded state
                    mainContent.classList.remove('sidebar-collapsed');
                    mainContent.style.marginLeft = '256px';
                    mainContent.style.width = 'calc(100% - 256px)';
                }
            }
        }
        
        const sidebarHtml = await loadSidebarHTML();
        if (sidebarHtml) {
            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = sidebarHtml;
                
                // Update username if provided
                if (userName) {
                    const usernameElement = document.querySelector('.user-name');
                    if (usernameElement) {
                        usernameElement.textContent = userName;
                    }
                }
                
                // Initialize sidebar - state will be applied immediately in initSidebar
                initSidebar();
            }
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
}

// Load sidebar with user data
async function loadSideBar(user) {
    try {
        // Apply main content state immediately before loading sidebar
        if (window.innerWidth > 1024) {
            const savedState = getSidebarState();
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                if (savedState) {
                    // Collapsed state
                    mainContent.classList.add('sidebar-collapsed');
                    mainContent.style.marginLeft = '80px';
                    mainContent.style.width = 'calc(100% - 80px)';
                } else {
                    // Expanded state
                    mainContent.classList.remove('sidebar-collapsed');
                    mainContent.style.marginLeft = '256px';
                    mainContent.style.width = 'calc(100% - 256px)';
                }
            }
        }
        
        const sidebarHtml = await loadSidebarHTML();
        if (sidebarHtml) {
            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = sidebarHtml;
                
                // Update user information
                if (user) {
                    const usernameElement = document.querySelector('.user-name');
                    if (usernameElement) {
                        usernameElement.textContent = user.name || user.username || 'User';
                    }
                }
                
                // Initialize sidebar - state will be applied immediately in initSidebar
                initSidebar();
            }
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
}

// Apply body class as early as possible to prevent flash
(function() {
    // Apply body class immediately when script loads
    if (window.innerWidth > 1024) {
        const saved = localStorage.getItem('sidebarCollapsed');
        const isCollapsed = saved === 'true';
        if (isCollapsed) {
            document.body.classList.add('sidebar-state-collapsed');
        }
    }
    
    // Disable transitions during initial load
    document.body.classList.add('no-transition-on-load');
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Apply body sidebar class immediately
    applyBodySidebarClass();
    
    // Apply main content state immediately if sidebar already exists
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth > 1024) {
        const savedState = getSidebarState();
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (savedState) {
                // Collapsed state
                sidebar.classList.add('sidebar-collapsed');
                sidebar.style.width = '80px';
                mainContent.classList.add('sidebar-collapsed');
                mainContent.style.marginLeft = '80px';
                mainContent.style.width = 'calc(100% - 80px)';
            } else {
                // Expanded state
                sidebar.classList.remove('sidebar-collapsed');
                sidebar.style.width = '256px';
                mainContent.classList.remove('sidebar-collapsed');
                mainContent.style.marginLeft = '256px';
                mainContent.style.width = 'calc(100% - 256px)';
            }
        }
    }
    
    // Only initialize if sidebar container exists but sidebar doesn't exist yet
    const sidebarContainer = document.getElementById('sidebar-container');

    if (sidebarContainer && !sidebar) {
        // Load sidebar HTML and initialize
        loadSideBarSimple('Loading...');
    } else if (sidebar) {
        // Sidebar already exists, just initialize
        initSidebar();
        loadUserInfo();
        checkUserRoleAndShowAdminFeatures();
    }
    
    // Remove no-transition class after a brief delay
    setTimeout(() => {
        document.body.classList.remove('no-transition-on-load');
    }, 100);
});