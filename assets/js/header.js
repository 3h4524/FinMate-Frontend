// Header Management Functions

// Load header HTML content
async function loadHeaderHTML() {
    try {
        const response = await fetch('../header.html');
        if (!response.ok) {
            throw new Error('Failed to load header.html');
        }
        const html = await response.text();
        return html;
    } catch (error) {
        console.error('Error loading header HTML:', error);
        return null;
    }
}

// Update time of day greeting
function updateTimeOfDay() {
    const timeOfDayElement = document.getElementById('time-of-day');
    if (timeOfDayElement) {
        const hour = new Date().getHours();
        let timeOfDay;
        
        if (hour >= 5 && hour < 12) {
            timeOfDay = 'morning';
        } else if (hour >= 12 && hour < 17) {
            timeOfDay = 'afternoon';
        } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'evening';
        } else {
            timeOfDay = 'night';
        }
        
        timeOfDayElement.textContent = timeOfDay;
        console.log('Time of day updated:', timeOfDay);
    } else {
        console.log('Time of day element not found');
    }
}

// Update current date
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const mobileDateElement = document.getElementById('current-date-mobile');
    
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const mobileOptions = { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    };
    
    const fullDate = now.toLocaleDateString('en-US', options);
    const mobileDate = now.toLocaleDateString('en-US', mobileOptions);
    
    if (dateElement) {
        dateElement.textContent = fullDate;
        console.log('Date updated (desktop):', fullDate);
    } else {
        console.log('Date element (desktop) not found');
    }
    
    if (mobileDateElement) {
        mobileDateElement.textContent = mobileDate;
        console.log('Date updated (mobile):', mobileDate);
    } else {
        console.log('Date element (mobile) not found');
    }
}

// Initialize header functionality
function initHeader() {
    console.log('Initializing header...');
    
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    // Hamburger menu toggle - triggers sidebar
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', function() {
            // Call global toggleSidebar function defined in sidebar.js
            if (typeof window.toggleSidebar === 'function') {
                window.toggleSidebar();
            }
        });
        console.log('Menu toggle button initialized');
    } else {
        console.log('Menu toggle button not found');
    }

    // User dropdown toggle
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
                userDropdown.classList.remove('show');
            }
        });
        console.log('User dropdown initialized');
    } else {
        console.log('User dropdown elements not found');
    }

    // Load user info and update time/date
    loadHeaderUserInfo();
    updateTimeOfDay();
    updateCurrentDate();
    
    // Update time of day every minute
    setInterval(updateTimeOfDay, 60000);
    
    // Update date every hour
    setInterval(updateCurrentDate, 3600000);
    
    console.log('Header initialization complete');
}



// Load user information into header
async function loadHeaderUserInfo() {
<<<<<<< HEAD
    // First, load from localStorage for immediate display
    const userData = localStorage.getItem('userData');
=======
    // First, load from sessionStorage for immediate display
    const userData = sessionStorage.getItem('userData');
>>>>>>> origin/update_profile
    let fallbackName = 'User';
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            fallbackName = user.name || user.email?.split('@')[0] || 'User';
            
            // Determine premium flag from either field
            const premiumFlag = user.isPremium !== undefined ? user.isPremium : user.premium;
            
            updateHeaderDisplay(fallbackName, user.email, user.role, premiumFlag);
        } catch (error) {
            console.error('Error parsing cached user data:', error);
        }
    }
    
    // Then fetch fresh data from API
    try {
<<<<<<< HEAD
        const token = localStorage.getItem('token');
=======
        const token = sessionStorage.getItem('token');
>>>>>>> origin/update_profile
        if (!token) {
            updateHeaderDisplay(fallbackName, null, null, null);
            return;
        }

        const response = await fetch('http://localhost:8080/api/v1/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch user profile:', response.status);
            return;
        }

        const data = await response.json();
        
        if (data.code === 1000 && data.result) {
            const userName = data.result.name || data.result.email?.split('@')[0] || 'User';
            
<<<<<<< HEAD
            // Update localStorage with fresh data
            localStorage.setItem('userData', JSON.stringify(data.result));
=======
            // Update sessionStorage with fresh data
            sessionStorage.setItem('userData', JSON.stringify(data.result));
>>>>>>> origin/update_profile
            
            const premiumFlag2 = data.result.isPremium !== undefined ? data.result.isPremium : data.result.premium;
            updateHeaderDisplay(userName, data.result.email, data.result.role, premiumFlag2);
            
            console.log('Header user info updated:', userName);
        } else {
            console.error('API response error:', data.message);
        }
        
    } catch (error) {
        console.error('Error loading user info from API:', error);
    }
}

// Helper function to update all user name displays
function updateHeaderDisplay(userName, email, role, isPremium) {
    // Name
    document.querySelectorAll('.user-display-name').forEach(el => el.textContent = userName);
    // Greeting
    document.querySelectorAll('.user-greeting-name').forEach(el => el.textContent = userName);
    // Email
    if (email) {
        document.querySelectorAll('.user-display-email').forEach(el => el.textContent = email);
    }
    // Determine label
    let label = 'Basic';
    if (role && role.toString().trim().toUpperCase().includes('ADMIN')) {
        label = 'Admin';
    } else if (isPremium) {
        label = 'Premium';
    }
    document.querySelectorAll('.user-display-role').forEach(el => {
        // reset classes
        el.classList.remove('badge-basic','badge-premium','badge-admin');

        // Construct inner HTML with optional icon
        if (label === 'Premium') {
            el.classList.add('badge-premium');
            el.innerHTML = '<i class="fas fa-crown"></i> <span class="role-text">Premium</span>';
        } else if (label === 'Admin') {
            el.classList.add('badge-admin');
            el.textContent = 'Admin';
        } else {
            el.classList.add('badge-basic');
            el.textContent = 'Basic';
        }
    });
    console.log('Header role:', role, 'isPremium:', isPremium, 'computed label:', label);
}

// Backward compatibility for existing calls
function updateHeaderDisplayNames(name) {
    updateHeaderDisplay(name);
}

// Load header for pages
async function loadHeader() {
    const headerContainer = document.getElementById('header-container');
    
    if (headerContainer) {
        const headerHTML = await loadHeaderHTML();
        if (headerHTML) {
            headerContainer.innerHTML = headerHTML;
            initHeader();
        }
    } else {
        // If no container, check if header already exists
        const existingHeader = document.getElementById('main-header');
        if (existingHeader) {
            initHeader();
        }
    }
}

// Responsive header adjustments (header-specific only)
function handleHeaderResize() {
    // Update date format based on screen size
    updateCurrentDate();
}

// Initialize header on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if header container exists or header already exists
    const headerContainer = document.getElementById('header-container');
    const existingHeader = document.getElementById('main-header');
    
    if (headerContainer && !existingHeader) {
        loadHeader();
    } else if (existingHeader) {
        initHeader();
    }
    
    // Handle window resize
    window.addEventListener('resize', handleHeaderResize);
});

// Export functions for use in other files
window.loadHeader = loadHeader;
window.updateHeaderDisplay = updateHeaderDisplay;
window.updateHeaderDisplayNames = updateHeaderDisplayNames; 