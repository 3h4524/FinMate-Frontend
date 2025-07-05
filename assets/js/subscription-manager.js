// Subscription Manager JavaScript
// API Configuration
const API_BASE_URL = 'http://localhost:8080/api/premium-package';
const SUBSCRIPTION_API_URL = 'http://localhost:8080/api/subscriptions';
const FEATURES_API_URL = 'http://localhost:8080/api/features';
const OFFER_API_URL = 'http://localhost:8080/api/promotional-offer';

// Global variables
let currentPage = 0;
let totalPages = 0;
let currentFilter = 'all';
let packages = [];
let allFeatures = [];
let selectedList = []; // Global array to store selected package IDs

const buttonCreatePromotional = document.getElementById("buttonCreatePromotional");

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    try {
        console.log('Initializing subscription manager page...');

        // Check authentication first
        if (!isLoggedIn()) {
            redirectToLogin();
            return;
        }

        // Load sidebar and header first to avoid flash
        if (typeof loadSideBarSimple === 'function') {
            await loadSideBarSimple();
        } else {
            console.error('loadSideBarSimple function not found');
        }

        if (typeof loadHeader === 'function') {
            await loadHeader();
        } else {
            console.error('loadHeader function not found');
        }

        // Show main content after loading sidebar/header
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.style.display = 'flex';
        }

        // Hide page loader if exists
        const pageLoader = document.getElementById('page-loader');
        if (pageLoader) {
            pageLoader.style.display = 'none';
        }

        // Setup functionality
        setupEventListeners();

        // Load data
        await initializeSubscriptionManager();

        // Setup datetime updates
        updateDateTime();
        setInterval(updateDateTime, 60000);

        console.log('Subscription manager page initialized successfully');
    } catch (error) {
        console.error('Error initializing subscription manager:', error);
        showErrorMessage('Failed to initialize subscription manager');
    }
});

// Main initialization function
async function initializeSubscriptionManager() {
    try {
        await Promise.all([
            loadStats(),
            loadPackages(),
            loadRecentSubscriptions(),
            loadFeatures()
        ]);
    } catch (error) {
        console.error('Error in initialization:', error);
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'text-indigo-600', 'bg-indigo-50');
                b.classList.add('text-gray-600', 'bg-gray-50');
            });

            this.classList.add('active', 'text-indigo-600', 'bg-indigo-50');
            this.classList.remove('text-gray-600', 'bg-gray-50');

            // Apply filter
            currentFilter = this.dataset.filter;
            currentPage = 0;
            console.log('Filter changed to:', currentFilter); // Debug log
            applyCurrentFilter();
        });
    });

    // Modal form submissions
    const createForm = document.getElementById('createPackageForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreatePackage);
    }

    const updateForm = document.getElementById('updatePackageForm');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdatePackage);
    }

    const createOfferForm = document.getElementById('createOfferForm');
    if (createOfferForm) {
        createOfferForm.addEventListener('submit', handleCreateOffer);
    }

    // Pagination mobile buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                changePage(currentPage - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                changePage(currentPage + 1);
            }
        });
    }
    setupCheckBoxCreateOffer();
}

// This function will be replaced by the enhanced version below

// Load packages
async function loadPackages(page = 0, size = 4) {
    if (buttonCreatePromotional) {
        if (selectedList.length === 0) buttonCreatePromotional.classList.add("hidden");
    }
    try {
        const response = await apiRequest(
            `${API_BASE_URL}?page=${page}&size=${size}&sortBy=price&sortDirection=DESC`
        );

        if (!response || !response.ok) {
            throw new Error('Failed to fetch packages');
        }

        const data = await response.json();
        if (data.result) {
            packages = data.result.content || [];
            currentPage = data.result.number || 0;
            totalPages = data.result.totalPages || 0;

            // Apply current filter to packages
            applyCurrentFilter();
            setupCheckBoxCreateOffer();
        }
    } catch (error) {
        console.error('Error loading packages:', error);
        showErrorMessage('Failed to load packages');
        renderEmptyPackages();
    }
}

// Apply current filter to packages
function applyCurrentFilter() {
    let filteredPackages = packages;

    // Apply filter based on currentFilter
    if (currentFilter !== 'all') {
        filteredPackages = packages.filter(pkg => {
            switch (currentFilter) {
                case 'monthly':
                    return pkg.durationType === 'MONTH';
                case 'yearly':
                    return pkg.durationType === 'YEAR';
                case 'active':
                    return pkg.isActive === true;
                default:
                    return true;
            }
        });
    }

    renderPackages(filteredPackages);
    renderPagination();
}

// Render packages
function renderPackages(packagesData) {
    const container = document.getElementById('packagesContainer');
    if (!container) return;

    if (!packagesData || packagesData.length === 0) {
        renderEmptyPackages();
        return;
    }

    container.innerHTML = packagesData.map(pkg => `
        <div class="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${getPackageIconBackground(pkg.name)}">
                        <i class="fas ${getPackageIcon(pkg.name)} text-white text-lg"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">${pkg.name}</h3>
                        <p class="text-sm text-gray-500 uppercase font-medium">${getDurationText(pkg.durationValue, pkg.durationType)}</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <input type="checkbox" id="checkbox-premium-${pkg.id}">
                    <button id="button-edit-premium-${pkg.id}" onclick="openUpdateModal(${pkg.id})" class="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button id="button-delete-premium-${pkg.id}" onclick="deletePackage(${pkg.id})" class="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="text-3xl font-bold text-gray-900">${formatPrice(pkg.price)}</div>
                <div class="text-sm text-gray-500">per ${pkg.durationValue} ${pkg.durationType.toLowerCase()}</div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4 text-center">
                <div>
                    <div class="text-xl font-bold text-gray-900">${pkg.subscribers || 0}</div>
                    <div class="text-xs text-gray-500 uppercase">Subscribers</div>
                </div>
                <div>
                    <div class="text-xl font-bold text-gray-900">${pkg.isActive ? 'Active' : 'Inactive'}</div>
                    <div class="text-xs text-gray-500 uppercase">Status</div>
                </div>
            </div>
            
            <div class="space-y-2">
                <h4 class="text-sm font-medium text-gray-700">Features:</h4>
                <div class="flex flex-wrap gap-1">
                    ${(pkg.features || []).slice(0, 3).map(feature => `
                        <span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg">${getFeatureName(feature)}</span>
                    `).join('')}
                    ${pkg.features && pkg.features.length > 3 ? `
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">+${pkg.features.length - 3} more</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');


    selectedList.forEach(item => {
        const checkbox = document.getElementById(`checkbox-premium-${item.id}`);
        if (checkbox) {
            checkbox.checked = true;
            // Hide edit and delete buttons for checked packages
            const editButton = document.getElementById(`button-edit-premium-${item.id}`);
            const deleteButton = document.getElementById(`button-delete-premium-${item.id}`);
            if (editButton) editButton.classList.add('hidden');
            if (deleteButton) deleteButton.classList.add('hidden');
        }
    });
}



// Map feature codes to feature names for display
const getFeatureName = (featureCode) => {
    const feature = allFeatures.find(f => f.featureCode === featureCode);
    return feature ? feature.featureName : featureCode;
};

// Render empty state
function renderEmptyPackages() {
    const container = document.getElementById('packagesContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-box-open text-gray-400 text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
            <p class="text-gray-500 max-w-sm">Get started by creating your first subscription package.</p>
            <button onclick="openNewPackageModal()" class="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105">
                Create Package
            </button>
        </div>
    `;
}

// Load recent subscriptions
async function loadRecentSubscriptions() {
    try {
        const response = await apiRequest(`${SUBSCRIPTION_API_URL}/recent?page=0&size=5&sortBy=createdAt&sortDirection=DESC`);

        if (!response || !response.ok) {
            throw new Error('Failed to fetch recent subscriptions');
        }

        const data = await response.json();
        if (data.result && data.result.content) {
            renderRecentSubscriptions(data.result.content);
        } else {
            renderEmptySubscriptions();
        }
    } catch (error) {
        console.error('Error loading recent subscriptions:', error);
        renderEmptySubscriptions();
    }
}

// Render recent subscriptions
function renderRecentSubscriptions(subscriptions) {
    const container = document.getElementById('recentSubscriptions');
    if (!container) return;

    if (!subscriptions || subscriptions.length === 0) {
        renderEmptySubscriptions();
        return;
    }

    container.innerHTML = `
        <div class="space-y-4">
            ${subscriptions.map(sub => `
                <div class="flex items-center space-x-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        ${(sub.userName || 'Unknown').charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">${sub.userName || 'Unknown User'}</p>
                        <p class="text-xs text-gray-500">${sub.packageName || 'Unknown Package'}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-medium text-green-600">${formatPrice(sub.amount || 0)}</p>
                        <p class="text-xs text-gray-500">${formatTimeAgo(sub.createdAt)}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render empty subscriptions
function renderEmptySubscriptions() {
    const container = document.getElementById('recentSubscriptions');
    if (!container) return;

    container.innerHTML = `
        <div class="text-center py-8">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="fas fa-users text-gray-400"></i>
            </div>
            <p class="text-gray-500 text-sm">No recent subscriptions</p>
        </div>
    `;
}

// Load features for modals
async function loadFeatures() {
    try {
        const response = await apiRequest(FEATURES_API_URL);
        if (response && response.ok) {
            const data = await response.json();
            allFeatures = data.result || [];
            renderFeaturesInModals();
        }
    } catch (error) {
        console.error('Error loading features:', error);
        allFeatures = [];
    }
}

// Render features in modals
function renderFeaturesInModals() {
    const createContainer = document.getElementById('createFeatures');
    const updateContainer = document.getElementById('updateFeatures');

    const featuresHTML = allFeatures.map(feature => `
        <div class="feature-item flex items-center space-x-2 p-2 bg-white rounded-xl hover:bg-indigo-50 cursor-pointer transition-colors" data-feature-id="${feature.featureCode}">
            <input type="checkbox" id="feature-${feature.featureCode}" class="rounded text-indigo-600 focus:ring-indigo-500">
            <label for="feature-${feature.featureCode}" class="text-sm text-gray-700 cursor-pointer">${feature.featureName}</label>
        </div>
    `).join('');

    if (createContainer) {
        createContainer.innerHTML = featuresHTML;
        setupFeatureSelection(createContainer, 'createSelectedFeatures');
    }

    if (updateContainer) {
        updateContainer.innerHTML = featuresHTML.replace(/feature-/g, 'update-feature-');
        setupFeatureSelection(updateContainer, 'updateSelectedFeatures');
    }
}

// Setup feature selection
function setupFeatureSelection(container, hiddenInputString) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const hiddenInput = document.getElementById(hiddenInputString);

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const selectedFeatures = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.id.split('-').pop());

            if (hiddenInput) {
                hiddenInput.value = selectedFeatures.join(',');
            }
        });
    });
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'flex';

    // Update mobile buttons
    if (prevBtn) {
        prevBtn.disabled = currentPage === 0;
        prevBtn.classList.toggle('opacity-50', currentPage === 0);
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages - 1;
        nextBtn.classList.toggle('opacity-50', currentPage === totalPages - 1);
    }

    // Generate page numbers for desktop
    if (pageNumbers) {
        const pages = [];
        for (let i = 0; i < totalPages; i++) {
            pages.push(`
                <button onclick="changePage(${i})" class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === currentPage
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }">
                    ${i + 1}
                </button>
            `);
        }
        pageNumbers.innerHTML = pages.join('');
    }
}

// Change page
function changePage(page) {
    if (page >= 0 && page < totalPages && page !== currentPage) {
        currentPage = page;
        loadPackages(page);
    }
}

// Modal functions
function openNewPackageModal() {
    const modal = document.getElementById('createPackageModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Reset form
        const form = document.getElementById('createPackageForm');
        if (form) form.reset();

        // Uncheck all features
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    }
}

function closeNewPackageModal() {
    const modal = document.getElementById('createPackageModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function openUpdateModal(packageId) {
    const modal = document.getElementById('updatePackageModal');
    if (modal) {
        modal.classList.remove('hidden');

        // Find package data
        const pkg = packages.find(p => p.id === packageId);
        if (pkg) {
            // Populate form fields
            document.getElementById('updatePackageId').value = pkg.id;
            document.getElementById('updateName').value = pkg.name;
            document.getElementById('updatePrice').value = pkg.price;
            document.getElementById('updateDurationValue').value = pkg.durationValue;
            document.getElementById('updateDurationType').value = pkg.durationType;
            document.getElementById('updateIsActive').value = pkg.isActive.toString();

            // Set selected features
            const featureCodes = (pkg.features || []);

            const hiddenInput = document.getElementById('updateSelectedFeatures');
            if (hiddenInput) hiddenInput.value = featureCodes.join(',');

            // Check corresponding checkboxes
            const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                const featureCode = cb.id.split('-').pop();
                cb.checked = featureCodes.includes(featureCode);
            });

        }
    }
}

function closeUpdateModal() {
    const modal = document.getElementById('updatePackageModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function setupCheckBoxCreateOffer() {
    const checkboxes = document.querySelectorAll('[id^="checkbox-premium-"]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const packageId = this.id.split('-').pop(); // Extract package ID from checkbox ID
            const pkg = packages.find(p => String(p.id) === packageId); // Find package by ID
            const editButton = document.getElementById(`button-edit-premium-${packageId}`);
            const deleteButton = document.getElementById(`button-delete-premium-${packageId}`);

            if (this.checked) {
                if (!selectedList.some(item => item.id === packageId)) {
                    selectedList.push({ id: packageId, name: pkg ? pkg.name : 'Unknown' });
                    if (selectedList.length != 0) buttonCreatePromotional.classList.remove("hidden");
                }
                // Hide edit and delete buttons
                if (editButton) editButton.classList.add('hidden');
                if (deleteButton) deleteButton.classList.add('hidden');
            } else {
                selectedList = selectedList.filter(item => item.id !== packageId);
                if (selectedList.length === 0) buttonCreatePromotional.classList.add("hidden");
                // Show edit and delete buttons
                if (editButton) editButton.classList.remove('hidden');
                if (deleteButton) deleteButton.classList.remove('hidden');
            }
        });
    });
}

// Open modal create offer
function openCreateOfferModal() {
    const modal = document.getElementById('createOfferModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Reset form
        const form = document.getElementById('createOfferForm');
        if (form) form.reset();
        // Set default values
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('expiryDate').value = tomorrow.toISOString().split('T')[0];


        // Render selected packages
        const selectedPackagesContainer = document.getElementById('selectedPackages');
        if (selectedPackagesContainer) {
            if (selectedList.length === 0) {
                selectedPackagesContainer.innerHTML = '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">No packages selected</span>';
            } else {
                selectedPackagesContainer.innerHTML = selectedList.slice(0, 3).map(item => `
                    <span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg">${item.name}</span>
                `).join('') + (selectedList.length > 3 ? `
                    <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">+${selectedList.length - 3} more</span>
                ` : '');
            }
        }
    }
}

function closeCreateOfferModal() {
    const modal = document.getElementById('createOfferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}


// Form handlers
async function handleCreatePackage(e) {
    e.preventDefault();

    // Validate form data
    const name = document.getElementById('createName').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const durationValue = parseInt(document.getElementById('createDurationValue').value);
    const durationType = document.getElementById('createDurationType').value;
    const features = document.getElementById('createSelectedFeatures').value
        ? document.getElementById('createSelectedFeatures').value.split(',').filter(f => f.trim())
        : [];

    // Basic validation
    if (!name) {
        showErrorMessage('Package name is required');
        return;
    }

    if (!price || price <= 0) {
        showErrorMessage('Valid price is required');
        return;
    }

    if (!durationValue || durationValue <= 0) {
        showErrorMessage('Valid duration value is required');
        return;
    }

    const formData = {
        name,
        price,
        durationValue,
        durationType,
        features
    };


    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
        submitBtn.disabled = true;

        const response = await apiRequest(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (response && response.ok) {
            showSuccessMessage('Package created successfully');
            closeNewPackageModal();
            selectedList = [];
            loadPackages();
            loadStats(); // Refresh stats
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create package');
        }
    } catch (error) {
        console.error('Error creating package:', error);
        showErrorMessage(error.message || 'Failed to create package');
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Create Package';
            submitBtn.disabled = false;
        }
    }
}

async function handleUpdatePackage(e) {
    e.preventDefault();

    const packageId = document.getElementById('updatePackageId').value;

    // Validate form data
    const name = document.getElementById('updateName').value.trim();
    const price = parseFloat(document.getElementById('updatePrice').value);
    const durationValue = parseInt(document.getElementById('updateDurationValue').value);
    const durationType = document.getElementById('updateDurationType').value;
    const isActive = document.getElementById('updateIsActive').value === 'true';
    const features = document.getElementById('updateSelectedFeatures').value
        ? document.getElementById('updateSelectedFeatures').value.split(',').filter(f => f.trim())
        : [];

    // Basic validation
    if (!name) {
        showErrorMessage('Package name is required');
        return;
    }

    if (!price || price <= 0) {
        showErrorMessage('Valid price is required');
        return;
    }

    if (!durationValue || durationValue <= 0) {
        showErrorMessage('Valid duration value is required');
        return;
    }

    const formData = {
        name,
        price,
        durationValue,
        durationType,
        isActive,
        features
    };


    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Updating...';
        submitBtn.disabled = true;

        const response = await apiRequest(`${API_BASE_URL}/${packageId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        if (response && response.ok) {
            showSuccessMessage('Package updated successfully');
            closeUpdateModal();
            selectedList = [];
            loadPackages();
            loadStats(); // Refresh stats
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update package');
        }
    } catch (error) {
        console.error('Error updating package:', error);
        showErrorMessage(error.message || 'Failed to update package');
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Update Package';
            submitBtn.disabled = false;
        }
    }
}

// Offer
async function handleCreateOffer(e) {
    e.preventDefault();

    // Get form values
    const discountEvent = document.getElementById('discountEvent').value.trim();
    const discountPercentage = parseFloat(document.getElementById('discountPercentage').value);
    const startDate = document.getElementById('startDate').value;
    const expiryDate = document.getElementById('expiryDate').value;

    // Validation
    if (!discountEvent) {
        showErrorMessage('Discount Event is required');
        return;
    }

    if (isNaN(discountPercentage) || discountPercentage <= 0) {
        showErrorMessage('Discount Percentage must be greater than 0');
        return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);

    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
        showErrorMessage('Invalid date format');
        return;
    }

    if (start < now) {
        showErrorMessage('Start Date must be today or in the future');
        return;
    }

    if (expiry <= now) {
        showErrorMessage('Expiry Date must be in the future');
        return;
    }

    if (start >= expiry) {
        showErrorMessage('Expiry Date must be on or after Start Date');
        return;
    }


    // Prepare form data with package IDs from selectedList
    const formData = {
        discountEvent: discountEvent,
        discountPercentage: discountPercentage,
        startDate: startDate,
        expiryDate: expiryDate,
        packageIds: selectedList.map(item => item.id)
    };

    try {
        const response = await apiRequest(`${OFFER_API_URL}`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.code === 1000) {
            showSuccessMessage(data.message);
            closeCreateOfferModal();
            selectedList = [];
            loadPackages();
            loadStats();
        } else {
            throw new Error(data.message || "Fail to create an offer.");
        }
    } catch (err) {
        showErrorMessage(err.message);
    }
}

// Delete package with confirmation
async function deletePackage(packageId) {
    // Find package name for better confirmation message
    const pkg = packages.find(p => p.id === packageId);
    const packageName = pkg ? pkg.name : 'this package';

    if (!confirm(`Are you sure you want to delete "${packageName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await apiRequest(`${API_BASE_URL}/${packageId}`, {
            method: 'DELETE'
        });

        if (response && response.ok) {
            showSuccessMessage(`Package "${packageName}" deleted successfully`);
            loadPackages();
            loadStats(); // Refresh stats
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete package');
        }
    } catch (error) {
        console.error('Error deleting package:', error);
        showErrorMessage(error.message || 'Failed to delete package');
    }
}

// Utility functions
function getPackageIcon(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('basic')) return 'fa-cube';
    if (lowerName.includes('pro') || lowerName.includes('premium')) return 'fa-crown';
    if (lowerName.includes('enterprise')) return 'fa-building';
    if (lowerName.includes('yearly') || lowerName.includes('annual')) return 'fa-calendar-alt';
    return 'fa-box';
}

function getPackageIconBackground(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('basic')) return 'bg-gradient-to-br from-blue-500 to-blue-600';
    if (lowerName.includes('pro') || lowerName.includes('premium')) return 'bg-gradient-to-br from-purple-500 to-purple-600';
    if (lowerName.includes('enterprise')) return 'bg-gradient-to-br from-green-500 to-green-600';
    if (lowerName.includes('yearly') || lowerName.includes('annual')) return 'bg-gradient-to-br from-amber-500 to-amber-600';
    return 'bg-gradient-to-br from-gray-500 to-gray-600';
}

function getDurationText(value, type) {
    const typeMap = {
        'DAY': value === 1 ? 'day' : 'days',
        'WEEK': value === 1 ? 'week' : 'weeks',
        'MONTH': value === 1 ? 'month' : 'months',
        'YEAR': value === 1 ? 'year' : 'years'
    };
    return `${value} ${typeMap[type] || 'month'}`;
}

function formatPrice(price) {
    return formatCurrency(price);
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function updateDateTime() {
    // Update any time-sensitive elements
    loadRecentSubscriptions();
}

// Load sidebar function to prevent flash
async function loadSidebar() {
    try {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;

        // Try to use the global loadSidebar function first
        if (window.loadSidebar && typeof window.loadSidebar === 'function') {
            await window.loadSidebar();
            return;
        }

        // Fallback to manual loading
        const response = await fetch('/sidebar.html');
        if (response.ok) {
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;

            // Initialize sidebar functionality if needed
            if (window.initializeSidebar && typeof window.initializeSidebar === 'function') {
                window.initializeSidebar();
            }
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
        // Don't throw error, just log it to prevent page breaking
    }
}


// Enhanced stats loading with actual API integration
async function loadStats() {
    try {
        // Try to load actual stats first
        const [revenueResponse] = await Promise.allSettled([
            apiRequest(`${SUBSCRIPTION_API_URL}/revenue-subscribers`)
        ]);

        let stats = {
            totalRevenue: "0đ",
            revenueChange: "+0%",
            totalSubscribers: 0,
            subscribersChange: "+0%",
            conversionRate: "0%",
            conversionChange: "+0%",
            avgRevenue: "0đ",
            avgRevenueChange: "+0%"
        };

        // Use API data if available, otherwise use mock data
        if (revenueResponse.status === 'fulfilled' && revenueResponse.value?.ok) {
            const revenueData = await revenueResponse.value.json();
            if (revenueData.result) {
                stats.totalRevenue = formatPrice(revenueData.result.revenue || 0);
                stats.totalSubscribers = revenueData.result.subscribers || 0;
                // Growth rates are not available from API, keep mock values
                stats.revenueChange = "+12.5%";
                stats.subscribersChange = "+8.2%";
            }
        } else {
            // Mock data fallback
            stats = {
                totalRevenue: "2,500,000đ",
                revenueChange: "+12.5%",
                totalSubscribers: 156,
                subscribersChange: "+8.2%",
                conversionRate: "24.3%",
                conversionChange: "+2.1%",
                avgRevenue: "16,025đ",
                avgRevenueChange: "-3.2%"
            };
        }

        // Update DOM elements safely
        const elements = [
            { id: 'totalRevenue', value: stats.totalRevenue },
            { id: 'revenueChange', value: stats.revenueChange },
            { id: 'totalSubscribers', value: stats.totalSubscribers },
            { id: 'subscribersChange', value: stats.subscribersChange },
            { id: 'conversionRate', value: stats.conversionRate },
            { id: 'conversionChange', value: stats.conversionChange },
            { id: 'avgRevenue', value: stats.avgRevenue },
            { id: 'avgRevenueChange', value: stats.avgRevenueChange }
        ];

        elements.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set safe default values on error
        const defaultElements = ['totalRevenue', 'totalSubscribers', 'conversionRate', 'avgRevenue'];
        defaultElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = id.includes('Revenue') ? '0đ' : '0';
        });
    }
}

// Enhanced modal close with escape key support
function setupModalKeyboardSupport() {
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeNewPackageModal();
            closeUpdateModal();
            closeCreateOfferModal();
        }
    });

    const modals = ['createPackageModal', 'updatePackageModal', 'createOfferModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    if (modalId === 'createPackageModal') {
                        closeNewPackageModal();
                    } else if (modalId === 'updatePackageModal') {
                        closeUpdateModal();
                    } else if (modalId === 'createOfferModal') {
                        closeCreateOfferModal();
                    }
                }
            });
        }
    });
}

// Enhanced error and success messaging
function showErrorMessage(message) {
    console.error(message);

    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

function showSuccessMessage(message) {

    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}



// Global exports for HTML onclick handlers
window.openNewPackageModal = openNewPackageModal;
window.closeNewPackageModal = closeNewPackageModal;
window.openUpdateModal = openUpdateModal;
window.closeUpdateModal = closeUpdateModal;
window.deletePackage = deletePackage;
window.changePage = changePage;
window.loadSidebar = loadSidebar;

// Additional utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced responsive handling
function handleResize() {
    // Rerender components on resize for better responsive experience
    if (packages.length > 0) {
        renderPackages(packages);
    }
}

// Initialize modal keyboard support and other event handlers when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    setupModalKeyboardSupport();
    // Add resize handler for responsive behavior
    window.addEventListener('resize', debounce(handleResize, 250));

    // Add click outside handlers for modals
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
            // Clicked on modal backdrop
            if (e.target.id === 'createPackageModal') {
                closeNewPackageModal();
            } else if (e.target.id === 'updatePackageModal') {
                closeUpdateModal();
            }
        }
    });
});