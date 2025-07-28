// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    lucide.createIcons();

    // Load header and sidebar
    loadFeatures();
    loadHeaderAndSidebar();
});

const API_BASE_URL = 'http://localhost:8080';
let packages = [];
let filteredPackages = [];
let billingCycle = 'monthly';
let purchasedList;
let selectedPackageId = null;
let amoutPayment = null;
let allFeatures = [];
let promotionalOffers = [];


async function handlePaymentResult(urlParams, orderCode) {
    const couponId = urlParams.get('couponId') || null;
    const statusPayment = urlParams.get('status') || null;
    // const paymentId = urlParams.get('id') || null;
    try {
        const paymentResponse = {
            couponId: couponId,
            orderCode: orderCode,
            status: statusPayment
        };
        console.log("Sending payment status update:", paymentResponse);

        // Assuming apiRequest is defined in autho_helper.js and handles token/auth
        const response = await apiRequest(`${API_BASE_URL}/api/payment/return`, {
            method: 'POST',
            body: JSON.stringify(paymentResponse)
        });
        const data = await response.json();

        console.log("API response data:", data);

        if (data.code === 1000) {
            if (statusPayment === 'PAID') {
                showSuccessMessage('Thank you for your purchase, the corresponding advanced features have been activated.');
            } else if (statusPayment === 'CANCELLED') {
                showErrorMessage('Your payment transaction was cancelled. No charges were made.');
            } else if (statusPayment === 'PENDING') {
                showErrorMessage('Your payment is still pending. Please complete the payment to finalize your order.');
            }
        } else {
            throw new Error(response.nessage);
        }
    } catch (error) {
        showErrorMessage(error.message);
    } finally {
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

const COUPON_CODE_MAX_LENGTH = 50;

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

// Load features for modals
async function loadFeatures() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/features`);
        if (response && response.ok) {
            const data = await response.json();
            allFeatures = data.result || [];
        }
    } catch (error) {
        showErrorMessage('Error loading features:', error);
        allFeatures = [];
    }
}


// Map feature codes to feature names for display
const getFeatureName = (featureCode) => {
    const feature = allFeatures.find(f => f.featureCode === featureCode);
    return feature ? feature.featureName : featureCode;
};

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
        const isPopular = false;
        // const isPopular = pkg.name.toLowerCase().includes('pro') || pkg.name.toLowerCase().includes('premium');

        const durationText = getDurationText(pkg.durationValue, pkg.durationType);

        // Check for promotional offer
        const offer = promotionalOffers.find(offer => offer.packageIds.includes(pkg.id));
        let priceToShow = pkg.price;
        let originalPrice = pkg.price;
        let daysRemainingText = '';
        if (offer) {
            // Calculate discounted price
            priceToShow = pkg.price * (1 - offer.discountPercentage / 100);
            // Calculate days remaining
            const today = new Date();
            const expiry = new Date(offer.expiryDate);
            const diffTime = expiry - today;
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysRemainingText = daysRemaining > 0 ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` : 'Expires today';
        }

        return `
        <div class="relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 plan-card border border-purple-100 hover:shadow-purple-200">
            ${isPopular ? `<div class="popular-badge absolute top-0 left-0 text-white text-xs font-semibold px-4 py-1 z-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-br-2xl">Most Popular</div>` : ''}
            ${offer ? `<div class="event-badge absolute top-0 right-0 text-white text-xs font-semibold px-3 py-2 z-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-bl-2xl whitespace-nowrap">
                <div class="flex items-center space-x-2">
                    <i data-lucide="clock" class="w-3 h-3"></i>
                    <span>${offer.discountEvent}</span>
                    <span class="text-yellow-100 font-bold">• ${daysRemainingText}</span>
                </div>
            </div>` : ''}
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-8 text-white">
                <div class="flex items-center justify-center mb-4">
                    <i data-lucide="crown" class="w-8 h-8"></i>
                </div>
                <div class="flex items-center justify-center mb-3">
                    <h3 class="text-xl font-bold text-center">${pkg.name}</h3>
                    ${offer ? `
                        <div class="inline-flex bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-1 rounded-full items-center shadow-md ml-3">
                            <i data-lucide="gift" class="w-3 h-3 inline mr-1"></i>
                             ${offer.discountPercentage}%
                        </div>
                    ` : ''}
                </div>
                <div class="text-center">
                    <div class="package-price text-3xl font-bold mb-2">
                        <div>
                            ${formatCurrency(priceToShow)}
                            ${offer ? `<span class="line-through text-purple-200 text-lg ml-2">${formatCurrency(originalPrice)}</span>` : ''}
                        </div>
                        <div class="package-period text-purple-100 text-sm font-normal mt-1">${durationText}</div>
                    </div>
                </div>
            </div>
            <div class="p-8 plan-card-content">
                <ul class="space-y-4 mb-8">
                    ${(pkg.features).slice(0, 3).map(feature => `
                        <li class="flex items-start space-x-3">
                            <div class="flex-shrink-0 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                                <i data-lucide="check" class="w-3 h-3 text-purple-600"></i>
                            </div>
                            <span class="text-gray-700 leading-relaxed">${getFeatureName(feature)}</span>
                        </li>
                    `).join('')}
                    ${pkg.features && pkg.features.length > 3 ? `
                        <li class="flex items-start space-x-3">
                            <div class="flex-shrink-0 w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                                <i data-lucide="plus" class="w-3 h-3 text-purple-600"></i>
                            </div>
                            <span class="text-gray-700 leading-relaxed">+${pkg.features.length - 3} more features</span>
                        </li>
                    ` : ''}
                </ul>
                <div class="plan-card-footer">
                    <button 
                        ${isPurchased(pkg.id) ? `disabled` : ''} 
                        class="buy-now-btn w-full py-4 px-6 rounded-xl font-semibold 
                        bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg 
                        focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 transform 
                        hover:scale-105 hover:shadow-xl 
                        disabled:bg-none disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:scale-100 disabled:shadow-none" 
                        data-package-id="${pkg.id}"
                        onclick="showCouponModal(${pkg.id}, ${priceToShow})">
                        <i data-lucide="credit-card" class="w-5 h-3 inline mr-2"></i>
                        ${isPurchased(pkg.id) ? getDateRemainingForSubscription(pkg.id) : 'Buy Now'}
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
        if (purchasedList[i].packageId === pkgId) return true;
    }
    return false;
}

function getDateRemainingForSubscription(pkgId) {
    let datesRemainingText = null;
    for (let i = 0; i < purchasedList.length; i++) {
        if (purchasedList[i].packageId === pkgId) {

            const today = new Date();
            const endDate = new Date(purchasedList[i].endDate);
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            datesRemainingText = daysRemaining > 0 ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` : 'Expires today';
        }
    }
    return datesRemainingText;
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
    const packagesData = await fetchPackages(0, 10);
    if (packagesData) {
        packages = packagesData.content;
        filteredPackages = packages.filter(pkg => pkg.durationType === 'MONTH');
    }
};

const init = async () => {
    try {
        if (!checkAuth()) return;

        const urlParams = new URLSearchParams(window.location.search);
        const orderCode = urlParams.get('orderCode') || null;

        if (orderCode != null) {
            console.log("Entering fetchPaymentStatus...");
            await handlePaymentResult(urlParams, orderCode);
        }

        // Load purchased plans and packages
        await fetchPurchasedSubscriptionPlans();
        await fetchPromotionalOffers();
        await loadPackages();
        toggleBilling('monthly');
        setupCouponModal();

        console.log('Premium page initialized successfully');
    } catch (error) {
        showErrorMessage('Error initializing premium page:', error);
    }
};
const fetchPackages = async (page = 0, size = 3, sortBy = 'price', sortDirection = 'DESC') => {
    try {
        const response = await apiRequest(
            `${API_BASE_URL}/api/premium-package?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`
        );
        if (!response) return null;
        const data = await response.json();
        return data.result;
    } catch (error) {
        showErrorMessage('Error fetching packages:', error);
        return null;
    }
};

async function fetchPromotionalOffers() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/promotional-offer`);

        const data = await response.json();

        if (data.code === 1000) {
            promotionalOffers = data.result;
            console.log("of: ", promotionalOffers);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        showErrorMessage(error.message);
    }
}


async function fetchPurchasedSubscriptionPlans() {
    try {
        const response = await apiRequest(
            `${API_BASE_URL}/api/subscriptions/purchasedList`
        );


        if (!response) return null;
        const data = await response.json();

        purchasedList = data.result;
        console.log("List: ", purchasedList);
    } catch (error) {
        showErrorMessage('Error fetching packages:', error);
    }
}

// Thêm function để disable/enable tất cả nút Buy Now
function setAllBuyButtonsState(disabled) {
    const buyButtons = document.querySelectorAll('button[onclick^="showCouponModal"]');
    buyButtons.forEach(button => {
        button.disabled = disabled;
        if (disabled) {


            button.innerHTML = `
                <i data-lucide="loader-2" class="w-4 h-4 inline mr-1 animate-spin"></i>
                Processing...
            `;
            button.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
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

// Show coupon modal and store package ID
function showCouponModal(packageId, amount) {
    selectedPackageId = packageId;
    amoutPayment = amount;
    const couponModal = document.getElementById('couponModal');
    const couponInput = document.getElementById('couponCode');
    const couponError = document.getElementById('couponError');

    couponInput.value = '';
    couponError.classList.add('hidden');
    couponModal.classList.remove('hidden');
}

// Setup coupon modal event listeners
function setupCouponModal() {
    const couponModal = document.getElementById('couponModal');
    const closeCouponModal = document.getElementById('closeCouponModal');
    const cancelCouponBtn = document.getElementById('cancelCouponBtn');
    const proceedPaymentBtn = document.getElementById('proceedPaymentBtn');
    const couponInput = document.getElementById('couponCode');
    const couponError = document.getElementById('couponError');

    // Close modal
    const closeModal = () => {
        couponModal.classList.add('hidden');
        selectedPackageId = null;
        amoutPayment = null;
        couponInput.value = '';
        couponError.classList.add('hidden');
    };

    closeCouponModal.addEventListener('click', closeModal);
    cancelCouponBtn.addEventListener('click', closeModal);

    // Validate coupon
    async function validateCoupon(couponCode) {
        if (!couponCode) {
            couponModal.classList.add('hidden');
            return true;
        }

        if (couponCode.length > COUPON_CODE_MAX_LENGTH) {
            couponError.textContent = `Coupon code cannot exceed ${COUPON_CODE_MAX_LENGTH} characters`;
            couponError.classList.remove('hidden');
            return false;
        }

        try {
            const response = await apiRequest(`${API_BASE_URL}/api/coupon/validate/${couponCode}`);

            const data = await response.json();

            if (data.code === 1000) {
                couponError.classList.add('hidden');
                couponModal.classList.add('hidden');
                return true;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            couponError.textContent = error.message;
            couponError.classList.remove('hidden');
            return false;
        }
    };

    // Proceed to payment
    proceedPaymentBtn.addEventListener('click', async () => {
        if (!selectedPackageId) return;

        const couponCode = couponInput.value.trim();

        let isValid = await validateCoupon(couponCode);


        if (isValid === true) {
            setAllBuyButtonsState(true);

            try {

                const paymentRequest = {
                    packageId: selectedPackageId,
                    code: couponCode,
                    amount: amoutPayment
                };

                const response = await apiRequest(`${API_BASE_URL}/api/payment/create`, {
                    method: 'POST',
                    body: JSON.stringify(paymentRequest)
                });

                if (!response.ok) throw new Error('Failed to initiate payment');

                const data = await response.json();
                if (data.code === 1000) {
                    window.location.href = data.result;
                } else {
                    throw new Error(data.message || 'payment failed');
                }
            } catch (error) {
                showErrorMessage('Error initiating payment:', error);
                setAllBuyButtonsState(false);
                alert('An error occurred while processing your payment. Please try again.');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', init);