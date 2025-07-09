let currentPage = 0;
let totalPages = 0;
let allPremiumPackages = [];

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

// Update current date and time
function updateDateTime() {
    const now = new Date();
    document.getElementById('current-date-time').textContent = now.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'Asia/Ho_Chi_Minh'
    });
}

// Save and load filters
function saveFilters(code, isActive, startDate, endDate) {
    localStorage.setItem('couponFilters', JSON.stringify({code, isActive, startDate, endDate}));
}

function loadFilters() {
    const filters = JSON.parse(localStorage.getItem('couponFilters') || '{}');
    document.getElementById('codeFilter').value = filters.code || '';
    document.getElementById('isActiveFilter').value = filters.isActive || '';
    document.getElementById('startDateFilter').value = filters.startDate || '';
    document.getElementById('endDateFilter').value = filters.endDate || '';
    return filters;
}

// Load coupon statistics
async function loadStats() {
    try {
        const response = await apiRequest('http://localhost:8080/api/coupon');
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        const coupons = data.result.content;
        const totalCoupons = data.result.totalElements;
        const activeCoupons = coupons.filter(c => c.isActive).length;
        const totalUsage = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
        document.getElementById('totalCoupons').textContent = totalCoupons || 0;
        document.getElementById('activeCoupons').textContent = activeCoupons || 0;
        document.getElementById('totalUsage').textContent = totalUsage || 0;
    } catch (error) {
        showNotification('Error', 'Failed to load stats. Please try again.', 'error');
        console.error('Error loading stats:', error);
    }
}

// Load premium packages
async function loadPremiumPackages() {
    try {
        const response = await apiRequest('http://localhost:8080/api/premium-package/fetchAll');
        if (!response.ok) throw new Error('Failed to load premium packages');
        const data = await response.json();
        allPremiumPackages = data.result || [];
        console.log(allPremiumPackages);
        return allPremiumPackages;
    } catch (error) {
        showNotification('Error', 'Failed to load premium packages. Please try again.', 'error');
        console.error('Error loading premium packages:', error);
        return [];
    }
}

// Load coupons
async function loadCoupons(page = 0, size = 6) {
    try {
        const params = new URLSearchParams({page, size, sortBy: 'usedCount', sortDirection: 'DESC'});
        await fetchAndRenderCoupons(`http://localhost:8080/api/coupon?${params.toString()}`, 'GET');
    } catch (error) {
        showNotification('Error', `Failed to load coupons: ${error.message}`, 'error');
        console.error('Error loading coupons:', error);
    }
}

async function searchCoupons(page = 0, size = 6, code = '', isActive = '', startDate = '', endDate = '') {
    try {
        const searchDto = {
            code: code || null,
            isActive: isActive !== '' ? isActive === 'true' : null,
            startDate: startDate || null,
            endDate: endDate || null,
            page,
            size,
            sortBy: 'usedCount',
            sortDirection: 'DESC'
        };

        await fetchAndRenderCoupons('http://localhost:8080/api/coupon/search', 'POST', searchDto);
    } catch (error) {
        showNotification('Error', `Failed to search coupons: ${error.message}`, 'error');
        console.error('Error searching coupons:', error);
    }
}

async function fetchAndRenderCoupons(url, method, body = null) {
    try {
        const options = {method};
        if (body) {
            options.body = JSON.stringify(body);
            options.headers = {'Content-Type': 'application/json'};
        }

        const response = await apiRequest(url, options);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (!data.result || !data.result.content) throw new Error('Data format incorrect');

        const coupons = data.result.content;
        totalPages = data.result.totalPages;
        currentPage = body ? body.page : parseInt(new URLSearchParams(url.split('?')[1]).get('page')) || 0;

        const tbody = document.getElementById('couponsBody');
        tbody.innerHTML = '';
        coupons.forEach((coupon, index) => {
            if (!coupon.id) {
                console.warn(`Coupon at index ${index} has no ID`, coupon);
                return; // Skip rendering this coupon
            }
            const tr = document.createElement('tr');
            tr.className = 'table-row-hover';
            tr.innerHTML = `
                        <td class="p-3">${index + 1 + currentPage * (body ? body.size : parseInt(new URLSearchParams(url.split('?')[1]).get('size')) || 6)}</td>
                        <td class="p-3">${coupon.code}</td>
                        <td class="p-3">${coupon.discountPercentage}%</td>
                        <td class="p-3">${coupon.isActive ? 'Active' : 'Inactive'}</td>
                        <td class="p-3">${coupon.usedCount}/${coupon.maxUsage || '∞'}</td>
                        <td class="p-3">
                            <button class="action-icon view-icon mx-2" onclick="showCouponDetails(${coupon.id})" title="View Details">
                                <i class="fas fa-eye text-teal-600 hover:text-teal-800"></i>
                            </button>
                            <button class="action-icon edit-icon mx-2" onclick="editCoupon(${coupon.id})" title="Edit">
                                <i class="fas fa-edit text-yellow-600 hover:text-yellow-800"></i>
                            </button>
                            <button class="action-icon delete-icon mx-2" onclick="deleteCoupon(${coupon.id})" title="Delete">
                                <i class="fas fa-trash text-red-600 hover:text-red-800"></i>
                            </button>
                        </td>
                    `;
            tbody.appendChild(tr);
        });

        renderPagination();
        showNotification('Success', 'Coupons loaded successfully!', 'success');
    } catch (error) {
        throw error; // Re-throw để hàm gọi xử lý lỗi
    }
}

// Render premium packages for selection
function renderPremiumPackages(containerId, selectedPackageIds = []) {
    const container = document.getElementById(containerId);
    if (!allPremiumPackages || allPremiumPackages.length === 0) {
        container.innerHTML = '<p class="text-gray-600">No premium packages available</p>';
        return;
    }

    const packagesHTML = allPremiumPackages.map(pkg => `
                <div class="package-item flex items-center gap-2 p-2 rounded-md bg-gray-100 cursor-pointer text-sm text-[var(--text-dark)] ${selectedPackageIds.includes(pkg.id) ? '' : 'opacity-75'}" 
                     data-package-id="${pkg.id}" 
                     onclick="togglePremiumPackage('${containerId}', ${pkg.id})">
                    <i class="fas ${selectedPackageIds.includes(pkg.id) ? 'fa-check text-[var(--primary)]' : 'fa-plus text-gray-600'} text-xs"></i>
                    ${pkg.name}
                </div>
            `).join('');
    container.innerHTML = packagesHTML;
}

// Toggle premium package selection
function togglePremiumPackage(containerId, packageId) {
    const container = document.getElementById(containerId);
    const packageItem = container.querySelector(`[data-package-id="${packageId}"]`);
    const input = document.getElementById('selectedPremiumPackages');
    let selectedPackageIds = input.value ? input.value.split(',').map(id => parseInt(id)) : [];

    if (selectedPackageIds.includes(packageId)) {
        selectedPackageIds = selectedPackageIds.filter(id => id !== packageId);
        packageItem.classList.add('opacity-75');
        packageItem.querySelector('i').classList.remove('fa-check', 'text-[var(--primary)]');
        packageItem.querySelector('i').classList.add('fa-plus', 'text-gray-600');
    } else {
        selectedPackageIds.push(packageId);
        packageItem.classList.remove('opacity-75');
        packageItem.querySelector('i').classList.remove('fa-plus', 'text-gray-600');
        packageItem.querySelector('i').classList.add('fa-check', 'text-[var(--primary)]');
    }

    input.value = selectedPackageIds.join(',');
}

// Refresh data
async function refreshData() {
    const filters = loadFilters();
    await Promise.all([
        loadCoupons(0, 6),
        loadStats(),
        loadPremiumPackages()
    ]);
}

// Show coupon details
async function showCouponDetails(couponId) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/coupon/${couponId}`);
        if (!response.ok) throw new Error('Failed to load coupon details');
        const coupon = await response.json();
        const couponData = coupon.result;
        const expiryDate = couponData.expiryDate ?
            new Date(couponData.expiryDate).toLocaleDateString('vi-VN') : 'N/A';
        const createdAt = couponData.createdAt ?
            `${new Date(couponData.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}<br>
                    ${new Date(couponData.createdAt).toLocaleDateString('vi-VN')}` : 'N/A';
        const premiumPackages = couponData.premiumPackages || [];
        document.getElementById('couponDetailsContent').innerHTML = `
                    <div class="col-span-2 flex items-center gap-3 p-4 border rounded-lg bg-teal-50 shadow-sm">
                        <i class="fas fa-ticket-alt text-teal-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Coupon Code</p>
                            <p class="font-semibold text-[var(--text-dark)]">${couponData.code || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 border rounded-lg bg-green-50 shadow-sm">
                        <i class="fas fa-percentage text-green-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Discount Percentage</p>
                            <p class="font-semibold text-[var(--text-dark)]">${couponData.discountPercentage || 'N/A'}%</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 border rounded-lg bg-red-50 shadow-sm">
                        <i class="fas fa-info-circle text-red-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Description</p>
                            <p class="font-semibold text-[var(--text-dark)]">${couponData.description || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 shadow-sm">
                        <i class="fas fa-ticket-alt text-yellow-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Max Usage</p>
                            <p class="font-semibold text-[var(--text-dark)]">${couponData.maxUsage || 'Unlimited'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 shadow-sm">
                        <i class="fas fa-ticket-alt text-blue-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Used Count</p>
                            <p class="font-semibold text-[var(--text-dark)]">${couponData.usedCount || 0}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 border rounded-lg bg-gray-50 shadow-sm">
                        <i class="fas fa-calendar-day text-gray-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Expiry Date</p>
                            <p class="font-semibold text-[var(--text-dark)]">${expiryDate}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 border rounded-lg bg-purple-50 shadow-sm">
                        <i class="fas fa-toggle-on text-purple-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Status</p>
                            <p class="font-semibold text-[var(--text-dark)]">${couponData.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                    </div>
                    <div class="col-span-2 flex items-center gap-3 p-4 border rounded-lg bg-teal-50 shadow-sm">
                        <i class="fas fa-crown text-teal-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Applicable Premium Packages</p>
                            <p class="font-semibold text-[var(--text-dark)]">${premiumPackages.length > 0 ? premiumPackages.map(p => p.name).join(', ') : 'None'}</p>
                        </div>
                    </div>
                    <div class="col-span-2 flex items-center gap-3 p-4 border rounded-lg bg-teal-50 shadow-sm">
                        <i class="fas fa-calendar-day text-teal-600 text-lg"></i>
                        <div>
                            <p class="text-sm text-[var(--text-light)]">Created At</p>
                            <p class="font-semibold text-[var(--text-dark)]">${createdAt}</p>
                        </div>
                    </div>
                `;
        const modal = document.getElementById('couponDetailModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);
    } catch (error) {
        showNotification('Error', 'Failed to load coupon details. Please try again.', 'error');
        console.error('Error loading coupon details:', error);
    }
}

// Close coupon detail modal
function closeCouponDetailModal() {
    const modal = document.getElementById('couponDetailModal');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
}

// Open create/edit coupon modal
async function openCouponModal(coupon = null) {
    const modal = document.getElementById('couponModal');
    const form = document.getElementById('couponForm');
    const title = document.getElementById('modalTitle');
    form.reset();
    document.getElementById('selectedPremiumPackages').value = '';
    await loadPremiumPackages();
    if (coupon) {
        title.textContent = 'Edit Coupon';
        document.getElementById('code').value = coupon.code || '';
        document.getElementById('description').value = coupon.description || '';
        document.getElementById('discountPercentage').value = coupon.discountPercentage || '';
        document.getElementById('maxUsage').value = coupon.maxUsage || '';
        document.getElementById('expiryDate').value = coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '';
        document.getElementById('isActive').checked = coupon.isActive || false;
        const packageIds = coupon.premiumPackages ? coupon.premiumPackages.map(p => p.id) : [];
        document.getElementById('selectedPremiumPackages').value = packageIds.join(',');
        renderPremiumPackages('premiumPackages', packageIds);
        form.dataset.couponId = coupon.id;
    } else {
        title.textContent = 'Create Coupon';
        renderPremiumPackages('premiumPackages', []);
        delete form.dataset.couponId;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.querySelector('.modal-content').classList.add('show'), 10);
}

// Close coupon modal
function closeCouponModal() {
    const modal = document.getElementById('couponModal');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
}

// Edit coupon
async function editCoupon(couponId) {
    if (!couponId) {
        showNotification('Error', 'Invalid coupon ID.', 'error');
        console.error('Invalid couponId:', couponId);
        return;
    }
    try {
        const response = await apiRequest(`http://localhost:8080/api/coupon/${couponId}`);
        if (!response.ok) throw new Error('Failed to load coupon');
        const coupon = (await response.json()).result;
        openCouponModal(coupon);
    } catch (error) {
        showNotification('Error', 'Failed to load coupon. Please try again.', 'error');
        console.error('Error loading coupon:', error);
    }
}

// Delete coupon
async function deleteCoupon(couponId) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
        const response = await apiRequest(`http://localhost:8080/api/coupon/${couponId}`, {method: 'DELETE'});
        if (!response.ok) throw new Error('Delete failed');
        showNotification('Success', 'Coupon deleted successfully!', 'success');
        const filters = loadFilters();
        loadCoupons(currentPage, 6);
    } catch (error) {
        showNotification('Error', 'Failed to delete coupon. Please try again.', 'error');
        console.error('Error deleting coupon:', error);
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
        return `<button class="px-4 py-2 rounded-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white transition" ${disabled ? 'disabled' : `onclick="loadCoupons(${page}, 6)"`}>${text}</button>`;
    };

    const buttons = [
        ...(startPage > 0 ? [createButton(0, '1'), ...(startPage > 1 ? ['<span class="px-4 py-2 text-gray-500">...</span>'] : [])] : []),
        ...Array.from({length: endPage - startPage}, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === currentPage)),
        ...(endPage < totalPages ? [(endPage < totalPages - 1 ? '<span class="px-4 py-2 text-gray-500">...</span>' : ''), createButton(totalPages - 1, totalPages)] : []),
    ];

    pageNumbers.innerHTML = buttons.join('');
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages - 1;
}

// Show notification
function showNotification(title, message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const notificationCard = document.createElement('div');
    notificationCard.className = `mb-3 notification-slide-in ${type === 'error' ? 'bg-red-50 text-red-800' : type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`;
    const iconPaths = {
        error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
        warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
    };
    notificationCard.innerHTML = `
                <div class="rounded-lg p-3 shadow-sm transition-all duration-300 text-sm">
                    <div class="flex items-start space-x-2">
                        <svg class="w-4 h-4 mt-0.5 ${type === 'error' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-green-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${iconPaths[type]}
                        </svg>
                        <div class="flex-1">
                            <h3 class="font-semibold leading-snug">${title}</h3>
                            <p class="mt-0.5 leading-snug">${message}</p>
                        </div>
                    </div>
                </div>
            `;
    toastContainer.appendChild(notificationCard);
    setTimeout(() => {
        notificationCard.classList.remove('notification-slide-in');
        notificationCard.classList.add('notification-slide-out');
        setTimeout(() => notificationCard.remove(), 300);
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    if (!checkAuth()) return;

    const user = getCurrentUser();
    if (user) {
        const userInfo = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userInfo.name || userInfo.email?.split('@')[0] || 'Admin';
        loadSideBarSimple(userName);
        const filters = loadFilters();
        await Promise.all([
            loadCoupons(0, 6),
            loadStats(),
            loadPremiumPackages()
        ]);
    }

    // Search input handler
    document.getElementById('searchInput').addEventListener('input', debounce(() => {
        const code = document.getElementById('searchInput').value;
        saveFilters(code, document.getElementById('isActiveFilter').value, document.getElementById('startDateFilter').value, document.getElementById('endDateFilter').value);
        searchCoupons(0, 6, code, document.getElementById('isActiveFilter').value, document.getElementById('startDateFilter').value, document.getElementById('endDateFilter').value);
    }, 500));

    // Filter button handler
    document.getElementById('filterBtn').addEventListener('click', () => {
        const code = document.getElementById('codeFilter').value;
        const isActive = document.getElementById('isActiveFilter').value;
        const startDate = document.getElementById('startDateFilter').value;
        const endDate = document.getElementById('endDateFilter').value;
        saveFilters(code, isActive, startDate, endDate);
        searchCoupons(0, 6, code, isActive, startDate, endDate);
        loadStats();
    });

    // Pagination handlers
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            const filters = loadFilters();
            loadCoupons(currentPage, 6);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            const filters = loadFilters();
            loadCoupons(currentPage, 6);
        }
    });

    // Refresh button handler
    document.getElementById('refreshBtn').addEventListener('click', refreshData);

    // Create coupon button handler
    document.getElementById('createBtn').addEventListener('click', () => openCouponModal());

    // Form submission handler
    document.getElementById('couponForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const couponId = form.dataset.couponId;
        const couponData = {
            code: form.code.value,
            description: form.description.value,
            discountPercentage: parseFloat(form.discountPercentage.value),
            maxUsage: form.maxUsage.value ? parseInt(form.maxUsage.value) : null,
            expiryDate: form.expiryDate.value,
            isActive: form.isActive.checked,
            premiumId: form.premiumPackageIds.value ? form.premiumPackageIds.value.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : []
        };
        try {
            const method = couponId ? 'PUT' : 'POST';
            const url = couponId ? `http://localhost:8080/api/coupon/${couponId}` : 'http://localhost:8080/api/coupon';
            const response = await apiRequest(url, {
                method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(couponData)
            });
            if (!response.ok) throw new Error(couponId ? 'Failed to update coupon' : 'Failed to create coupon');
            showNotification('Success', couponId ? 'Coupon updated successfully!' : 'Coupon created successfully!', 'success');
            closeCouponModal();
            const filters = loadFilters();
            loadCoupons(currentPage, 6);
        } catch (error) {
            showNotification('Error', couponId ? 'Failed to update coupon. Please try again.' : 'Failed to create coupon. Please try again.', 'error');
            console.error('Error saving coupon:', error);
        }
    });
});