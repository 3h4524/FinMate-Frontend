lucide.createIcons();

const API_BASE_URL = 'http://localhost:8080';
let packages = [];
let filteredPackages = [];
let billingCycle = 'monthly';
let purchasedList;

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
            <div class="relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 plan-card">
                <div class="bg-gradient-to-r from-gray-500 to-gray-600 p-5 text-white">
                    <div class="flex items-center justify-center mb-3">
                        <i data-lucide="box" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold text-center mb-1">No Plans Available</h3>
                    <p class="text-center text-gray-200 text-sm">Check back later for new premium plans!</p>
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
            <div class="relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 plan-card">
                ${isPopular ? `<div class="popular-badge absolute top-0 left-0 text-white text-xs font-semibold px-3 py-0.5">Most Popular</div>` : ''}
                <div class="bg-gradient-to-r from-green-700 to-green-800 p-5 text-white">
                    <div class="flex items-center justify-center mb-3">
                        <i data-lucide="crown" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold text-center mb-1">${pkg.name}</h3>
                    <div class="text-center">
                        <div class="package-price">
                            ${formatCurrency(priceToShow)}
                            <span class="package-period text-gray-100 text-sm">${durationText}</span>
                        </div>
                        <div class="yearly-info ${billingCycle === 'monthly' ? 'hidden' : ''}">
                            <span class="text-gray-100 line-through text-xs">${formatCurrency(pkg.price * 12)}₫</span>
                            <span class="text-green-300 font-semibold ml-1 text-xs">Save 17%</span>
                        </div>
                    </div>
                </div>
                <div class="p-5 plan-card-content">
                    <ul class="space-y-2 mb-5">
                        ${(pkg.features || ['Basic Features', 'Support']).slice(0, 3).map(feature => `
                            <li class="flex items-start space-x-2">
                                <div class="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                    <i data-lucide="check" class="w-2.5 h-2.5 text-green-600"></i>
                                </div>
                                <span class="text-gray-700 text-sm leading-relaxed">${feature}</span>
                            </li>
                        `).join('')}
                        ${pkg.features && pkg.features.length > 3 ? `
                            <li class="flex items-start space-x-2">
                                <div class="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                    <i data-lucide="plus" class="w-2.5 h-2.5 text-green-600"></i>
                                </div>
                                <span class="text-gray-700 text-sm leading-relaxed">+${pkg.features.length - 3} more</span>
                            </li>
                        ` : ''}
                    </ul>
                    <div class="plan-card-footer">
                        <button ${isPurchased(pkg.id) ? `disabled` : ''} class="w-full py-2.5 px-4 rounded-lg font-semibold text-sm bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-500 shadow-md focus:outline-none focus:ring-2 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:scale-100 disabled:shadow-none" onclick="initiatePayment(${pkg.id})">
                            <i data-lucide="credit-card" class="w-4 h-4 inline mr-1"></i>
                            Buy Now
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
        monthlyBtn.classList.add('bg-teal-500', 'text-white', 'shadow-sm');
        monthlyBtn.classList.remove('text-gray-600', 'hover:text-teal-500');
        yearlyBtn.classList.remove('bg-teal-500', 'text-white', 'shadow-sm');
        yearlyBtn.classList.add('text-gray-600', 'hover:text-teal-500');
        filteredPackages = packages.filter(pkg => pkg.durationType === 'MONTH');
    } else {
        yearlyBtn.classList.add('bg-teal-500', 'text-white', 'shadow-sm');
        yearlyBtn.classList.remove('text-gray-600', 'hover:text-teal-500');
        monthlyBtn.classList.remove('bg-teal-500', 'text-white', 'shadow-sm');
        monthlyBtn.classList.add('text-gray-600', 'hover:text-teal-500');
        filteredPackages = packages.filter(pkg => pkg.durationType === 'YEAR');
    }

    renderPackages(filteredPackages);
};

const loadPackages = async () => {
    const packagesData = await fetchPackages(0, 6);
    if (packagesData) {
        // packages = packagesData.content;
        packages = Array(4).fill(packagesData.content).flat();
        filteredPackages = packages.filter(pkg => pkg.durationType === 'MONTH');
    }
};

const init = async () => {
    if (!checkAuth()) return;
    loadSideBar(getCurrentUser());
    await fetchPurchasedPremiumPlans();
    await loadPackages();
    toggleBilling('monthly');
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

document.addEventListener('DOMContentLoaded', init);

async function initiatePayment(packageId) {

    try {
        const response = await apiRequest(`${API_BASE_URL}/api/checkout/create?packageId=${packageId}`, {
            method: 'POST',
        });

        if (!response.ok) throw new Error("Fail to fetch");

        const data = await response.json();
        if (data.code === 1000) {
            window.location.href = data.result; // Redirect to PayOS checkout URL
        } else {
            console.error('Checkout failed:', data.message);
        }
    } catch (error) {
        console.error('Error initiating checkout:', error);
    }
}