// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    // Load header and sidebar
    loadHeaderAndSidebar();
});

const API_BASE_URL = 'http://localhost:8080';
let packages = [];
let filteredPackages = [];
let billingCycle = 'monthly';
let purchasedList;

// Load header and sidebar
async function loadHeaderAndSidebar() {
    try {
        await Promise.all([
            loadHeader(),
            loadSideBarSimple()
        ]);
    } catch (error) {
        console.error('Error loading header/sidebar:', error);
    }
}

// Fallback functions if not loaded from other files
if (typeof loadHeader !== 'function') {
    window.loadHeader = function() {
        console.log('Header loading function not available');
        return Promise.resolve();
    };
}

if (typeof loadSideBarSimple !== 'function') {
    window.loadSideBarSimple = function() {
        console.log('Sidebar loading function not available');
        return Promise.resolve();
    };
}

if (typeof checkAuth !== 'function') {
    window.checkAuth = function() {
        console.log('Auth checking function not available');
        return true;
    };
}

if (typeof getCurrentUser !== 'function') {
    window.getCurrentUser = function() {
        console.log('Get current user function not available');
        return { name: 'User' };
    };
}

if (typeof apiRequest !== 'function') {
    window.apiRequest = function(url, options = {}) {
        console.log('API request function not available, using fetch');
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                ...options.headers
            }
        });
    };
}

if (typeof formatCurrency !== 'function') {
    window.formatCurrency = function(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
}

if (typeof initiatePayment !== 'function') {
    window.initiatePayment = function(packageId) {
        console.log('Payment initiation function not available for package:', packageId);
        alert('Payment functionality is under development');
    };
}

const getPackageIcon = () => 'enterprise';

const getDurationText = (value, type) => {
    const typeMap = {
        'DAY': value === 1 ? 'day' : 'days',
        'WEEK': value === 1 ? 'week' : 'weeks',
        'MONTH': value === 1 ? 'month' : 'months',
        'YEAR': value === 1 ? 'year' : 'years'
    };
    return `per ${value} ${typeMap[type] || 'month'}`;
};

const renderPackages = (packagesData) => {
    const container = document.getElementById('packagesContainer');
    if (!packagesData || packagesData.length === 0) {
        container.innerHTML = `
            <div class="relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 plan-card border border-indigo-100">
                <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                    <div class="flex items-center justify-center mb-4">
                        <i data-lucide="package" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-center mb-2">No Plans Available</h3>
                    <p class="text-center text-indigo-100 text-sm">Please check back later for new premium plans!</p>
                </div>
            </div>
        `;
        return;
    }

    const packagesHTML = packagesData.map(pkg => {
        const isPopular = pkg.name.toLowerCase().includes('pro') || pkg.name.toLowerCase().includes('premium');
        const yearlyPrice = pkg.price * 12 * 0.83;
        const priceToShow = billingCycle === 'monthly' ? pkg.price : yearlyPrice;
        const durationText = billingCycle === 'monthly' ? getDurationText(pkg.durationValue, pkg.durationType) : 'per year';

        return `
            <div class="relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 plan-card border border-indigo-100 hover:shadow-indigo-200">
                ${isPopular ? `<div class="popular-badge absolute top-0 left-0 text-white text-xs font-semibold px-4 py-1 z-10">Most Popular</div>` : ''}
                <div class="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white">
                    <div class="flex items-center justify-center mb-4">
                        <i data-lucide="crown" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-center mb-3">${pkg.name}</h3>
                    <div class="text-center">
                        <div class="package-price text-3xl font-bold mb-2">
                            ${formatCurrency(priceToShow)}
                            <div class="package-period text-indigo-100 text-sm font-normal mt-1">${durationText}</div>
                        </div>
                        <div class="yearly-info ${billingCycle === 'monthly' ? 'hidden' : ''}">
                            <span class="text-indigo-200 line-through text-sm">${formatCurrency(pkg.price * 12)}</span>
                            <span class="text-green-300 font-semibold ml-2 text-sm bg-green-500 bg-opacity-20 px-2 py-1 rounded-full">Save 17%</span>
                        </div>
                    </div>
                </div>
                <div class="p-8 plan-card-content">
                    <ul class="space-y-4 mb-8">
                        ${(pkg.features || ['Basic Features', 'Customer Support']).slice(0, 3).map(feature => `
                            <li class="flex items-start space-x-3">
                                <div class="flex-shrink-0 w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                                    <i data-lucide="check" class="w-3 h-3 text-indigo-600"></i>
                                </div>
                                <span class="text-gray-700 leading-relaxed">${feature}</span>
                            </li>
                        `).join('')}
                        ${pkg.features && pkg.features.length > 3 ? `
                            <li class="flex items-start space-x-3">
                                <div class="flex-shrink-0 w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                                    <i data-lucide="plus" class="w-3 h-3 text-indigo-600"></i>
                                </div>
                                <span class="text-gray-700 leading-relaxed">+${pkg.features.length - 3} more features</span>
                            </li>
                        ` : ''}
                    </ul>
                    <div class="plan-card-footer">
                        <button 
                            ${isPurchased(pkg.id) ? `disabled` : ''} 
                            class="buy-now-btn w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg" 
                            data-package-id="${pkg.id}"
                            onclick="initiatePayment(${pkg.id})"
                        >
                            <i data-lucide="credit-card" class="w-5 h-5 inline mr-2"></i>
                            ${isPurchased(pkg.id) ? 'Purchased' : 'Buy Now'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = packagesHTML;
    lucide.createIcons();
};

function isPurchased(pkgId) {
    for (let i = 0; i < purchasedList.length; i++) {
        if (purchasedList[i].id === pkgId) return true;
    }
    return false;
}

const toggleBilling = (cycle) => {
    billingCycle = cycle;
    const monthlyBtn = document.getElementById('monthly-btn');
    const yearlyBtn = document.getElementById('yearly-btn');

    if (cycle === 'monthly') {
        monthlyBtn.className = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105';
        yearlyBtn.className = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 relative';
        filteredPackages = packages.filter(pkg => pkg.durationType === 'MONTH');
    } else {
        yearlyBtn.className = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 relative';
        monthlyBtn.className = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50';
        filteredPackages = packages.filter(pkg => pkg.durationType === 'YEAR');
    }

    renderPackages(filteredPackages);
};

const loadPackages = async () => {
    const packagesData = await fetchPackages(0, 6);
    if (packagesData) {
        packages = packagesData.content;
        // packages = Array(4).fill(packagesData.content).flat();
        filteredPackages = packages.filter(pkg => pkg.durationType === 'MONTH');
    }
};

const init = async () => {
    try {
        if (!checkAuth()) return;
        
        // Load purchased plans and packages
        await fetchPurchasedPremiumPlans();
        await loadPackages();
        toggleBilling('monthly');
        
        console.log('Premium page initialized successfully');
    } catch (error) {
        console.error('Error initializing premium page:', error);
    }
};
const fetchPackages = async (page = 0, size = 6, sortBy = 'price', sortDirection = 'DESC') => {
    try {
        const response = await apiRequest(
            `${API_BASE_URL}/api/premium-package?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
        );
        if (!response) return null;
        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching packages:', error);
        return null;
    }
};

async function fetchPurchasedPremiumPlans() {
    try {
        const response = await apiRequest(
            `${API_BASE_URL}/api/premium-package/purchasedList`
        );


        if (!response) return null;
        const data = await response.json();

        purchasedList = data.result;
    } catch (error) {
        console.error('Error fetching packages:', error);
    }
};

// Updated DOMContentLoaded to integrate properly
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the page after header and sidebar are loaded
    await init();
});

// Thêm function để disable/enable tất cả nút Buy Now
function setAllBuyButtonsState(disabled) {
    const buyButtons = document.querySelectorAll('button[onclick^="initiatePayment"]');
    buyButtons.forEach(button => {
        button.disabled = disabled;

        if (disabled) {
            // Thêm loading state
            button.innerHTML = `
                <i data-lucide="loader-2" class="w-4 h-4 inline mr-1 animate-spin"></i>
                Processing...
            `;
            button.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            // Reset về trạng thái ban đầu
            button.innerHTML = `
                <i data-lucide="credit-card" class="w-4 h-4 inline mr-1"></i>
                Buy Now
            `;
            button.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    // Recreate icons sau khi thay đổi HTML
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Updated initiatePayment function
async function initiatePayment(packageId) {
    // Disable tất cả nút ngay khi bắt đầu
    setAllBuyButtonsState(true);

    try {
        const response = await apiRequest(`${API_BASE_URL}/api/checkout/create?packageId=${packageId}`, {
            method: 'POST',
        });

        if (!response.ok) throw new Error("Fail to fetch");

        const data = await response.json();
        if (data.code === 1000) {
            // Redirect thành công - không cần enable lại vì sẽ chuyển trang
            window.location.href = data.result;
        } else {
            console.error('Checkout failed:', data.message);
            // Enable lại nút nếu có lỗi
            setAllBuyButtonsState(false);

            // Có thể thêm thông báo lỗi cho user
            alert('Checkout failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error initiating checkout:', error);
        // Enable lại nút nếu có lỗi
        setAllBuyButtonsState(false);

        // Thông báo lỗi cho user
        alert('An error occurred while processing your payment. Please try again.');
    }
}