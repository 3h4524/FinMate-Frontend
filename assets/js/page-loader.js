// Page Loader Utility - Prevent sidebar flash across all pages
// This script should be loaded first on every page

(function () {
    'use strict';

    // Apply critical CSS classes immediately to prevent flash
    function applyCriticalClasses() {
        // Add global layout CSS if not already added
        if (!document.querySelector('link[href*="global-layout.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            // Try to determine the correct path based on current page
            const currentPath = window.location.pathname;
            let cssPath = 'assets/css/global-layout.css';
            
            if (currentPath.includes('/pages/')) {
                cssPath = '../../assets/css/global-layout.css';
            } else if (currentPath.includes('/admin-dashboard/')) {
                cssPath = '../../assets/css/global-layout.css';
            }
            
            link.href = cssPath;
            document.head.insertBefore(link, document.head.firstChild);
        }

        // Apply sidebar state immediately based on localStorage
        if (window.innerWidth > 1024 && document.body) {
            const saved = localStorage.getItem('sidebarCollapsed');
            const isCollapsed = saved === 'true';

            if (isCollapsed) {
                document.body.classList.add('sidebar-state-collapsed');
            } else {
                document.body.classList.remove('sidebar-state-collapsed');
            }
        }

        // Disable transitions during initial load
        if (document.body) {
            document.body.classList.add('no-transition-on-load');
        }
    }

    // Auto-inject CSS for main content layout
    function injectMainContentCSS() {
        const mainContent = document.querySelector('.main-content, #mainContent, .flex-1');
        if (mainContent) {
            if (!mainContent.classList.contains('main-content')) {
                mainContent.classList.add('main-content');
            }
        }
    }

    // Initialize as early as possible
    if (document.readyState === 'loading') {
        applyCriticalClasses();
        document.addEventListener('DOMContentLoaded', function () {
            injectMainContentCSS();

            // Remove no-transition class after brief delay
            setTimeout(() => {
                if (document.body) {
                    document.body.classList.remove('no-transition-on-load');
                }
            }, 100);
        });
    } else {
        applyCriticalClasses();
        injectMainContentCSS();
        setTimeout(() => {
            if (document.body) {
                document.body.classList.remove('no-transition-on-load');
            }
        }, 100);
    }

    // Handle window resize to maintain proper layout
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 1024 && document.body) {
            document.body.classList.remove('sidebar-state-collapsed');
        } else if (document.body) {
            const saved = localStorage.getItem('sidebarCollapsed');
            const isCollapsed = saved === 'true';

            if (isCollapsed) {
                document.body.classList.add('sidebar-state-collapsed');
            } else {
                document.body.classList.remove('sidebar-state-collapsed');
            }
        }
    });

})(); 