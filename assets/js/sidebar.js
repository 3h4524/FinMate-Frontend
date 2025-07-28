// Sidebar Management Functions

// Load sidebar HTML content
async function loadSidebarHTML() {
    try {
        // Try to determine the correct path based on current page
        const currentPath = window.location.pathname;
        let sidebarPath = 'pages/sidebar.html';
        
        if (currentPath.includes('/pages/')) {
            sidebarPath = '../sidebar.html';
        } else if (currentPath.includes('/admin-dashboard/')) {
            sidebarPath = '../sidebar.html';
        }
        
        const response = await fetch(sidebarPath);
        if (!response.ok) {
            throw new Error('Failed to load sidebar.html');
        }
        let html = await response.text();
        
        console.log('Sidebar HTML loaded successfully');
        
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

// Retry initialization if sidebar is not found
function retrySidebarInit(maxRetries = 5, delay = 100) {
    let retries = 0;
    
    function attemptInit() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            console.log('Sidebar found, initializing...');
            initSidebar();
        } else if (retries < maxRetries) {
            retries++;
            console.log(`Sidebar not found, retrying... (${retries}/${maxRetries})`);
            setTimeout(attemptInit, delay);
        } else {
            console.error('Failed to initialize sidebar after maximum retries');
        }
    }
    
    attemptInit();
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
        // Mobile: No collapse functionality - always full width
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.style.width = '256px';
        
        // Main content always full width on mobile
        if (mainContent) {
            mainContent.classList.remove('sidebar-collapsed');
            mainContent.style.marginLeft = '0px';
            mainContent.style.width = '100%';
        }
        
        return;
    }
    
    // Desktop: Apply collapsed/expanded state
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
    console.log('=== toggleSidebar called ===');
    console.log('Window width:', window.innerWidth);
    
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainContent = document.querySelector('.main-content');

    console.log('Sidebar element:', sidebar);
    console.log('Sidebar overlay:', sidebarOverlay);
    console.log('Main content:', mainContent);

    if (!sidebar) {
        console.error('Sidebar element not found!');
        return;
    }

    if (window.innerWidth <= 1024) {
        // Mobile: Simple slide in/out - no collapse functionality
        const sidebarContainer = document.getElementById('sidebar-container');
        const isOpen = sidebar.classList.contains('sidebar-open');
        
        console.log('Mobile mode - isOpen:', isOpen);
        console.log('Sidebar container:', sidebarContainer);
        
        if (sidebarContainer) {
            if (isOpen) {
                sidebarContainer.classList.remove('sidebar-open');
                console.log('Removed sidebar-open from container');
            } else {
                sidebarContainer.classList.add('sidebar-open');
                console.log('Added sidebar-open to container');
            }
        }
        
        if (isOpen) {
            sidebar.classList.remove('sidebar-open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('overlay-visible');
            }
            console.log('Closed sidebar');
        } else {
            sidebar.classList.add('sidebar-open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('overlay-visible');
            }
            console.log('Opened sidebar');
        }
        
        // Reset main content styles for mobile
        if (mainContent) {
            mainContent.style.marginLeft = '0px';
            mainContent.style.width = '100%';
        }
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

// Function to toggle sidebar width on mobile (disabled - mobile only slides in/out)
window.toggleSidebarWidth = function() {
    console.log('=== toggleSidebarWidth called ===');
    
    if (window.innerWidth <= 1024) {
        // Mobile: Use simple toggle instead of width toggle
        console.log('Mobile detected - using simple toggle instead of width toggle');
        window.toggleSidebar();
    } else {
        // Desktop: Toggle between collapsed and expanded width
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.error('Sidebar element not found');
            return;
        }
        
        const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
        const newState = !isCollapsed;
        
        // Save new state to localStorage
        setSidebarState(newState);
        
        // Apply new state
        applySidebarState(newState);
    }
};

// Add event listener for overlay to close sidebar on mobile
function setupOverlayListener() {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
        // Remove any existing listeners to prevent duplicates
        overlay.removeEventListener('click', closeSidebarOnOverlayClick);
        overlay.addEventListener('click', closeSidebarOnOverlayClick);
    }
}

// Function to close sidebar when overlay is clicked
function closeSidebarOnOverlayClick() {
    const sidebar = document.getElementById('sidebar');
    const sidebarContainer = document.getElementById('sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('sidebar-open');
    }
    if (sidebarContainer) {
        sidebarContainer.classList.remove('sidebar-open');
    }
    if (overlay) {
        overlay.classList.remove('overlay-visible');
    }
}

// Function to update mobile toggle button state
function updateMobileToggleButton(isCollapsed) {
    console.log('updateMobileToggleButton called with isCollapsed:', isCollapsed);
    
    const toggleIcon = document.getElementById('mobile-toggle-icon');
    const toggleText = document.getElementById('mobile-toggle-text');
    
    console.log('Toggle icon found:', !!toggleIcon);
    console.log('Toggle text found:', !!toggleText);
    
    if (toggleIcon && toggleText) {
        if (isCollapsed) {
            toggleIcon.className = 'fas fa-expand-alt';
            toggleText.textContent = 'Mở rộng';
            console.log('Updated button to show "Mở rộng"');
        } else {
            toggleIcon.className = 'fas fa-compress-alt';
            toggleText.textContent = 'Thu gọn';
            console.log('Updated button to show "Thu gọn"');
        }
    }
    
    // Update button visibility based on screen size
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    if (toggleBtn) {
        if (window.innerWidth <= 1024) {
            toggleBtn.style.display = 'flex';
            console.log('Mobile toggle button displayed');
        } else {
            toggleBtn.style.display = 'none';
            console.log('Mobile toggle button hidden');
        }
    }
}

// Global logout function for sidebar integration
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        window.location.href = '../login/index.html';
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
    } else if (currentPage.includes('coupon')) {
        activeItem = document.querySelector('[data-page="coupon"]');
    } else if (currentPage.includes('feature')) {
        activeItem = document.querySelector('[data-page="feature"]');
    }

    // Add active class to current item
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    console.log('Initializing sidebar, window width:', window.innerWidth);
    console.log('Sidebar element:', sidebar);
    
    // Ensure sidebar exists before proceeding
    if (!sidebar) {
        console.error('Sidebar element not found during initialization');
        return;
    }
    
    // Apply saved sidebar state IMMEDIATELY for both desktop and mobile
    const savedState = getSidebarState();
    console.log('Saved sidebar state:', savedState);
    applySidebarState(savedState);
    
    // Update mobile toggle button state
    updateMobileToggleButton(savedState);
    
    // Handle responsive behavior
    handleResponsiveBehavior();
    
    // Set initial active state
    setActiveTab();
    
    // Check user role and adjust menu
    checkUserRoleAndShowAdminFeatures();
    
    // Load user info
    loadUserInfo();
    
    // Setup overlay listener for mobile
    setupOverlayListener();
    
    // Mark content as ready and enable transitions
    setTimeout(() => {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('content-ready');
        }
        if (document.body) {
            document.body.classList.add('page-loaded');
        }
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
            // Mobile: Apply saved collapsed state but keep sidebar closed
            if (sidebar) {
                sidebar.classList.remove('sidebar-open');
                // Apply saved collapsed state for width
                const savedState = getSidebarState();
                applySidebarState(savedState);
                updateMobileToggleButton(savedState);
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
            updateMobileToggleButton(savedState);
        }
    });
    
    // Handle overlay click on mobile - use the centralized function
    setupOverlayListener();
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
                
                // Initialize sidebar with retry mechanism
                retrySidebarInit();
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
                
                // Initialize sidebar with retry mechanism
                retrySidebarInit();
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
        if (isCollapsed && document.body) {
            document.body.classList.add('sidebar-state-collapsed');
        }
    }
    
    // Disable transitions during initial load
    if (document.body) {
        document.body.classList.add('no-transition-on-load');
    }
    
    // Debug: Check if toggleSidebarWidth is defined
    console.log('Sidebar.js loaded - toggleSidebarWidth defined:', typeof window.toggleSidebarWidth);
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
        // Sidebar already exists, just initialize with retry mechanism
        retrySidebarInit();
        loadUserInfo();
        checkUserRoleAndShowAdminFeatures();
    }
    
    // Remove no-transition class after a brief delay
    setTimeout(() => {
        if (document.body) {
            document.body.classList.remove('no-transition-on-load');
        }
    }, 100);
});