async function renderPremiumModal() {
    const modalHtml = `
        <div id="premiumLimitModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-white rounded-3xl p-6 lg:p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300">
                <div class="text-center mb-6">
                    <div class="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-crown text-2xl lg:text-3xl text-amber-600"></i>
                    </div>
                    <h3 class="text-xl lg:text-2xl font-bold text-gray-800 mb-2">Premium Feature Required</h3>
                    <p class="text-gray-600 text-sm lg:text-base">You’ve reached the limit of your current package!</p>
                </div>
                <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 mb-6 border border-red-200">
                    <div class="flex items-center space-x-3 mb-3">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                        <span class="font-semibold text-red-800 text-sm lg:text-base">Limit Reached</span>
                    </div>
                    <p class="text-red-700 text-sm lg:text-base" id="messageLimit"></p>
                </div>
               <div class="space-y-3 mb-6">
                    <h4 class="font-semibold text-gray-800 text-base lg:text-lg">Premium Benefits:</h4>
                    <ul class="space-y-4">
                        ${features.slice(0, 3).map(feature => `
                            <li class="flex items-start space-x-3">
                                <div class="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                    <i class="fas fa-check-circle w-3 h-3 text-green-600"></i>
                                </div>
                                <span class="text-gray-700 text-sm lg:text-base leading-relaxed">${feature.featureName}</span>
                            </li>
                        `).join('')}
                        ${features.length > 3 ? `
                            <li class="flex items-start space-x-3">
                                <div class="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                                    <i class="fas fa-plus w-3 h-3 text-green-600"></i>
                                </div>
                                <span class="text-gray-700 text-sm lg:text-base leading-relaxed">+${features.length - 3} more features</span>
                            </li>
                        ` : ''}
                    </ul>
                </div>
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-6 border border-indigo-200">
                    <div class="text-center">
                        <p class="text-gray-600 text-sm mb-1">Premium Plan</p>
                        <div class="flex items-center justify-center space-x-2 mb-2">
                            <span class="text-2xl lg:text-3xl font-bold text-indigo-600">Rẻ lắm</span>
                            <span class="text-gray-500 text-sm">/month</span>
                        </div>
                        <p class="text-xs text-gray-500">Cancel anytime</p>
                    </div>
                </div>
                <div class="flex flex-col space-y-3">
                    <button id="upgradePremiumBtn" class="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-3 px-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <i class="fas fa-crown mr-2"></i>
                        Upgrade to Premium
                    </button>
                    <button id="closePremiumModalBtn" class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-colors">
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

let features;
const API_BASE_URL = 'http://localhost:8080';

async function loadFeature() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/api/features`);

        const data = await response.json();

        if (data.code === 1000) features = data.result;
        else throw new Error(response.message);

    } catch (err) {
        console.log(err.message);
    }
}

function showPremiumModal(messageLimit) {
    const modal = document.getElementById('premiumLimitModal');
    const modalContent = modal.querySelector('.bg-white');

    document.getElementById('messageLimit').textContent = messageLimit + '. Upgrade your current package to continue using this feature.';

    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';

    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);

    document.body.style.overflow = 'hidden';
}

function hidePremiumModal() {
    const modal = document.getElementById('premiumLimitModal');
    const modalContent = modal.querySelector('.bg-white');

    modal.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';

    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

async function initializePremiumModal() {

    await loadFeature();

    renderPremiumModal();

    const upgradeBtn = document.getElementById('upgradePremiumBtn');
    const closeBtn = document.getElementById('closePremiumModalBtn');
    const modal = document.getElementById('premiumLimitModal');

    upgradeBtn.addEventListener('click', () => {
        window.location.href = "/pages/user_premium/";
        hidePremiumModal();
    });

    closeBtn.addEventListener('click', hidePremiumModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePremiumModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hidePremiumModal();
        }
    });
}

// Automatically initialize the modal when the script is loaded
initializePremiumModal();

// Export functions for external use
window.PremiumModal = {
    show: showPremiumModal,
    hide: hidePremiumModal
};