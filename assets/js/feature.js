let currentPage = 0;
let totalPages = 0;

// Utility function for debouncing
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



// Save and load filters
function saveFilters(code, name, isActive) {
    localStorage.setItem('featureFilters', JSON.stringify({code, name, isActive}));
}

function loadFilters() {
    const filters = JSON.parse(localStorage.getItem('featureFilters') || '{}');
    document.getElementById('codeFilter').value = filters.code || '';
    document.getElementById('nameFilter').value = filters.name || '';
    document.getElementById('isActiveFilter').value = filters.isActive || '';
    return filters;
}

// Load feature statistics
async function loadStats() {
    try {
        const response = await apiRequest('http://localhost:8080/api/features/stats');
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        const features = data.result;
        console.log(features);
        const totalFeatures = features.totalFeatures;
        const activeFeatures = features.activeFeatures; // Assuming FeatureStatsResponse uses totalActives
        document.getElementById('totalFeatures').textContent = totalFeatures || 0;
        document.getElementById('activeFeatures').textContent = activeFeatures || 0;
    } catch (error) {
        showNotification('Error', 'Failed to load stats. Please try again.', 'error');
        console.error('Error loading stats:', error);
    }
}

// Load features with pagination and sorting (for filter button)
async function loadFeatures(page = 0, size = 10) {
    try {
        const url = `http://localhost:8080/api/features/filter?page=${page}&size=${size}&sortBy=code&sortDirection=DESC`;
        const response = await apiRequest(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (!data.result || !data.result.content) throw new Error('Data format incorrect');
        const features = data.result.content;
        totalPages = data.result.totalPages || 1;
        currentPage = page;
        console.log(features);
        const tbody = document.getElementById('featuresBody');
        tbody.innerHTML = '';
        features.forEach((feature, index) => {
            const featureId = feature.id; // Fallback to index-based ID
            const count = (index + 1 + page * size);
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 transition-colors duration-200';
            tr.innerHTML = `
                <td class="p-4">${count}</td>
                <td class="p-4 font-medium text-gray-900">${feature.featureCode || 'N/A'}</td>
                <td class="p-4 text-gray-700">${feature.featureName || 'N/A'}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${feature.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${feature.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="p-4">
                    <div class="flex items-center space-x-2">
                        <button class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200" onclick="showFeatureDetails(${featureId})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="p-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-200" onclick="editFeature(${featureId})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200" onclick="deleteFeature(${featureId})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination();
        showNotification('Success', 'Features loaded successfully!', 'success');
    } catch (error) {
        showNotification('Error', `Failed to load features: ${error.message}`, 'error');
        console.error('Error loading features:', error);
    }
}



// Refresh data
async function refreshData() {
    const filters = loadFilters();
    await Promise.all([
        loadFeatures(0, 10),
        loadStats()
    ]);
}

// Show feature details
async function showFeatureDetails(featureId) {
    if (!featureId) {
        showNotification('Error', 'Invalid feature ID.', 'error');
        console.error('Invalid featureId:', featureId);
        return;
    }
    try {
        const response = await apiRequest(`http://localhost:8080/api/features/${featureId}`);
        if (!response.ok) throw new Error('Failed to load feature details');
        const feature = (await response.json()).result;
        document.getElementById('featureDetailsContent').innerHTML = `
            <div class="flex items-center gap-3 p-4 border rounded-2xl bg-blue-50 border-blue-200">
                <i class="fas fa-code text-blue-600 text-lg"></i>
                <div>
                    <p class="text-sm text-gray-600">Feature Code</p>
                    <p class="font-semibold text-gray-900">${feature.featureCode || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-2xl bg-green-50 border-green-200">
                <i class="fas fa-tag text-green-600 text-lg"></i>
                <div>
                    <p class="text-sm text-gray-600">Feature Name</p>
                    <p class="font-semibold text-gray-900">${feature.featureName || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-start gap-3 p-4 border rounded-2xl bg-amber-50 border-amber-200">
                <i class="fas fa-info-circle text-amber-600 text-lg"></i>
                <div>
                    <p class="text-sm text-gray-600">Description</p>
                    <p class="font-semibold text-gray-900">${feature.featureDescription || 'N/A'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3 p-4 border rounded-2xl bg-purple-50 border-purple-200">
                <i class="fas fa-toggle-on text-purple-600 text-lg"></i>
                <div>
                    <p class="text-sm text-gray-600">Status</p>
                    <p class="font-semibold text-gray-900">${feature.active ? 'Active' : 'Inactive'}</p>
                </div>
            </div>
        `;
        const modal = document.getElementById('featureDetailModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        showNotification('Error', 'Failed to load feature details. Please try again.', 'error');
        console.error('Error loading feature details:', error);
    }
}

// Close feature detail modal
function closeFeatureDetailModal() {
    const modal = document.getElementById('featureDetailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Open create/edit feature modal
function openFeatureModal(feature = null) {
    const modal = document.getElementById('featureModal');
    const form = document.getElementById('featureForm');
    const title = document.getElementById('modalTitle');
    form.reset();
    if (feature) {
        title.textContent = 'Edit Feature';
        document.getElementById('code').value = feature.featureCode || '';
        document.getElementById('name').value = feature.featureName || '';
        document.getElementById('description').value = feature.featureDescription || '';
        document.getElementById('isActive').checked = feature.active || false;
        form.dataset.featureId = feature.id;
    } else {
        title.textContent = 'Create Feature';
        delete form.dataset.featureId;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Close feature modal
function closeFeatureModal() {
    const modal = document.getElementById('featureModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Edit feature
async function editFeature(featureId) {
    if (!featureId) {
        showNotification('Error', 'Invalid feature ID.', 'error');
        console.error('Invalid featureId:', featureId);
        return;
    }
    try {
        const response = await apiRequest(`http://localhost:8080/api/features/${featureId}`);
        if (!response.ok) throw new Error('Failed to load feature');
        const feature = (await response.json()).result;
        openFeatureModal(feature);
    } catch (error) {
        showNotification('Error', 'Failed to load feature. Please try again.', 'error');
        console.error('Error loading feature:', error);
    }
}

// Delete feature
async function deleteFeature(featureId) {
    if (!featureId) {
        showNotification('Error', 'Invalid feature ID.', 'error');
        console.error('Invalid featureId:', featureId);
        return;
    }
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
        const response = await apiRequest(`http://localhost:8080/api/features/${featureId}`, {method: 'DELETE'});
        if (!response.ok) throw new Error('Delete failed');
        showNotification('Success', 'Feature deleted successfully!', 'success');
        const filters = loadFilters();
        loadFeatures(currentPage, 10);
    } catch (error) {
        showNotification('Error', 'Failed to delete feature. Please try again.', 'error');
        console.error('Error deleting feature:', error);
    }
}

// Render pagination
function renderPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);
    startPage = Math.max(0, endPage - maxButtons);

    const createButton = (page, text, disabled = false) => {
        return `<button class="px-3 py-2 rounded-lg ${disabled ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition" ${disabled ? 'disabled' : `onclick="loadFeatures(${page}, 10)"`}>${text}</button>`;
    };

    const buttons = [
        ...(startPage > 0 ? [createButton(0, '1'), ...(startPage > 1 ? ['<span class="px-3 py-2 text-gray-500">...</span>'] : [])] : []),
        ...Array.from({length: endPage - startPage}, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === currentPage)),
        ...(endPage < totalPages ? [(endPage < totalPages - 1 ? '<span class="px-3 py-2 text-gray-500">...</span>' : ''), createButton(totalPages - 1, totalPages)] : []),
    ];

    pageNumbers.innerHTML = buttons.join('');
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages - 1;
}

// Show notification
function showNotification(title, message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const notificationCard = document.createElement('div');
    notificationCard.className = `mb-3 transform transition-all duration-300 ease-in-out ${type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-green-50 border border-green-200 text-green-800'}`;
    const iconPaths = {
        error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
        warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
    };
    notificationCard.innerHTML = `
        <div class="rounded-2xl p-4 shadow-lg">
            <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 mt-0.5 ${type === 'error' ? 'text-red-600' : type === 'warning' ? 'text-amber-600' : 'text-green-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${iconPaths[type]}
                </svg>
                <div class="flex-1">
                    <h3 class="font-semibold text-sm">${title}</h3>
                    <p class="mt-1 text-sm">${message}</p>
                </div>
            </div>
        </div>
    `;
    toastContainer.appendChild(notificationCard);
    setTimeout(() => {
        notificationCard.style.transform = 'translateX(100%)';
        notificationCard.style.opacity = '0';
        setTimeout(() => notificationCard.remove(), 300);
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    if (user) {
        const userInfo = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userInfo.name || userInfo.email?.split('@')[0] || 'Admin';
        loadSideBarSimple(userName);
        await loadFeatures(0, 10);
        await loadStats();
    }

    // Filter button handler
    document.getElementById('filterBtn').addEventListener('click', () => {
        const code = document.getElementById('codeFilter').value;
        const name = document.getElementById('nameFilter').value;
        const isActive = document.getElementById('isActiveFilter').value;
        saveFilters(code, name, isActive);
        searchFeatures(0, 10, code, name, isActive);
        loadStats();
    });

    // Pagination handlers
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadFeatures(currentPage, 10);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            loadFeatures(currentPage, 10);
        }
    });

    // Refresh button handler
    document.getElementById('refreshBtn').addEventListener('click', refreshData);

    // Create feature button handler
    document.getElementById('createBtn').addEventListener('click', () => openFeatureModal());

    // Form submission handler
    document.getElementById('featureForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const featureId = form.dataset.featureId;
        const featureData = {
            code: form.code.value,
            name: form.name.value,
            description: form.description.value,
            isActive: form.isActive.checked
        };
        try {
            const method = featureId ? 'PUT' : 'POST';
            const url = featureId ? `http://localhost:8080/api/features/${featureId}` : 'http://localhost:8080/api/features';
            const response = await apiRequest(url, {
                method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(featureData)
            });
            if (!response.ok) throw new Error(featureId ? 'Failed to update feature' : 'Failed to create feature');
            showNotification('Success', featureId ? 'Feature updated successfully!' : 'Feature created successfully!', 'success');
            closeFeatureModal();
            loadStats();
            loadFeatures(currentPage, 10);
        } catch (error) {
            showNotification('Error', featureId ? 'Failed to update feature. Please try again.' : 'Failed to create feature. Please try again.', 'error');
            console.error('Error saving feature:', error);
        }
    });
});
