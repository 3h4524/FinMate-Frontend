let currentPage = 0;
let totalPages = 0;
let allPremiumPackages = [];

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



function saveFilters(code, isActive, startDate, endDate) {
    localStorage.setItem('couponFilters', JSON.stringify({ code, isActive, startDate, endDate }));
}

function loadFilters() {
    const filters = JSON.parse(localStorage.getItem('couponFilters') || '{}');
    document.getElementById('codeFilter').value = filters.code || '';
    document.getElementById('isActiveFilter').value = filters.isActive || '';
    document.getElementById('startDateFilter').value = filters.startDate || '';
    document.getElementById('endDateFilter').value = filters.endDate || '';
    return filters;
}

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

async function loadPremiumPackages() {
    try {
        const response = await apiRequest('http://localhost:8080/api/premium-package/fetchAll');
        if (!response.ok) throw new Error('Failed to load premium packages');
        const data = await response.json();
        allPremiumPackages = data.result || [];
        return allPremiumPackages;
    } catch (error) {
        showNotification('Error', 'Failed to load premium packages. Please try again.', 'error');
        console.error('Error loading premium packages:', error);
        return [];
    }
}

async function loadCoupons(page = 0, size = 6, showSuccessMessage = false) {
    try {
        const params = new URLSearchParams({ page, size, sortBy: 'usedCount', sortDirection: 'DESC' });
        await fetchAndRenderCoupons(`http://localhost:8080/api/coupon?${params.toString()}`, 'GET', null, showSuccessMessage);
    } catch (error) {
        showNotification('Error', `Failed to load coupons: ${error.message}`, 'error');
        console.error('Error loading coupons:', error);
    }
}

async function searchCoupons(page = 0, size = 6, code = '', isActive = '', startDate = '', endDate = '', showSuccessMessage = false) {
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

        await fetchAndRenderCoupons('http://localhost:8080/api/coupon/search', 'POST', searchDto, showSuccessMessage);
    } catch (error) {
        showNotification('Error', `Failed to search coupons: ${error.message}`, 'error');
        console.error('Error searching coupons:', error);
    }
}

async function fetchAndRenderCoupons(url, method, body = null, showSuccessMessage = false) {
    try {
        const options = { method };
        if (body) {
            options.body = JSON.stringify(body);
            options.headers = { 'Content-Type': 'application/json' };
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
                return;
            }
            const tr = document.createElement('tr');
            tr.className = 'table-row-hover';
            tr.innerHTML = `
                <td class="px-8 py-3 whitespace-nowrap font-bold text-indigo-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-hashtag text-indigo-500"></i>
                        ${index + 1 + currentPage * (body ? body.size : parseInt(new URLSearchParams(url.split('?')[1]).get('size')) || 6)}
                    </div>
                </td>
                <td class="px-3 py-3 whitespace-nowrap font-semibold text-green-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-ticket-alt text-green-500"></i>
                        ${coupon.code}
                    </div>
                </td>
                <td class="px-12 py-3 whitespace-nowrap font-semibold text-purple-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-percentage text-purple-500"></i>
                        ${coupon.discountPercentage}%
                    </div>
                </td>
                <td class="px-10 py-3 whitespace-nowrap font-semibold text-blue-700">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-toggle-on text-blue-500"></i>
                        ${coupon.isActive ? 'Active' : 'Inactive'}
                    </div>
                </td>
                <td class="px-9 py-3 whitespace-nowrap">
                    <span class="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded px-2 py-1 font-mono text-sm">
                        <i class="fas fa-chart-bar text-indigo-500"></i>
                        ${coupon.usedCount}/${coupon.maxUsage || '∞'}
                    </span>
                </td>
                <td class="px-6 py-3 text-right whitespace-nowrap">
                    <button class="action-icon view-icon mx-2" onclick="showCouponDetails(${coupon.id})" title="View Details">
                        <i class="fas fa-eye text-blue-600 hover:text-blue-800"></i>
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
        if (showSuccessMessage) {
            showNotification('Success', 'Coupons loaded successfully!', 'success');
        }
    } catch (error) {
        throw error;
    }
}

function renderPremiumPackages(containerId, selectedPackageIds = []) {
    const container = document.getElementById(containerId);
    if (!allPremiumPackages || allPremiumPackages.length === 0) {
        container.innerHTML = '<p class="text-gray-600">No premium packages available</p>';
        return;
    }
    console.log("id: ", selectedPackageIds);

    const packagesHTML = allPremiumPackages.map(pkg => `
        <div class="package-item flex items-center gap-2 p-2 rounded-md bg-gray-100 cursor-pointer text-sm text-gray-700 ${selectedPackageIds.includes(pkg.id) ? '' : 'opacity-75'}" 
             data-package-id="${pkg.id}" 
             onclick="togglePremiumPackage('${containerId}', ${pkg.id})">
            <i class="fas ${selectedPackageIds.includes(pkg.id) ? 'fa-check text-indigo-500' : 'fa-plus text-gray-600'} text-xs"></i>
            ${pkg.name}
        </div>
    `).join('');
    container.innerHTML = packagesHTML;
}

function togglePremiumPackage(containerId, packageId) {
    const container = document.getElementById(containerId);
    const packageItem = container.querySelector(`[data-package-id="${packageId}"]`);
    const input = document.getElementById('selectedPremiumPackages');
    let selectedPackageIds = input.value ? input.value.split(',').map(id => parseInt(id)) : [];

    if (selectedPackageIds.includes(packageId)) {
        selectedPackageIds = selectedPackageIds.filter(id => id !== packageId);
        packageItem.classList.add('opacity-75');
        packageItem.querySelector('i').classList.remove('fa-check', 'text-indigo-500');
        packageItem.querySelector('i').classList.add('fa-plus', 'text-gray-600');
    } else {
        selectedPackageIds.push(packageId);
        packageItem.classList.remove('opacity-75');
        packageItem.querySelector('i').classList.remove('fa-plus', 'text-gray-600');
        packageItem.querySelector('i').classList.add('fa-check', 'text-indigo-500');
    }

    input.value = selectedPackageIds.join(',');
}

async function refreshData() {
    const filters = loadFilters();
    await Promise.all([
        loadCoupons(0, 6, true),
        loadStats(),
        loadPremiumPackages()
    ]);
}

async function showCouponDetails(couponId) {
    try {
        const response = await apiRequest(`http://localhost:8080/api/coupon/${couponId}`);
        if (!response.ok) throw new Error('Failed to load coupon details');
        const coupon = await response.json();
        const couponData = coupon.result;
        const expiryDate = couponData.expiryDate ?
            new Date(couponData.expiryDate).toLocaleDateString('vi-VN') : 'N/A';
        const createdAt = couponData.createdAt ?
            formatTimestamp(couponData.createdAt, true) : 'N/A';
        const premiumPackages = couponData.premiumPackages || [];

        const fields = [
            { label: 'Coupon Code', icon: 'ticket-alt', color: 'indigo', value: couponData.code || 'N/A' },
            { label: 'Discount Percentage', icon: 'percentage', color: 'green', value: `${couponData.discountPercentage || 'N/A'}%` },
            { label: 'Description', icon: 'info-circle', color: 'red', value: couponData.description || 'N/A' },
            { label: 'Max Usage', icon: 'ticket-alt', color: 'yellow', value: couponData.maxUsage || 'Unlimited' },
            { label: 'Used Count', icon: 'chart-bar', color: 'blue', value: couponData.usedCount || 0 },
            { label: 'Expiry Date', icon: 'calendar-day', color: 'indigo', value: expiryDate },
            { label: 'Status', icon: 'toggle-on', color: 'purple', value: couponData.isActive ? 'Active' : 'Inactive' },
            { label: 'Applicable Premium Packages', icon: 'crown', color: 'indigo', value: premiumPackages.length > 0 ? premiumPackages.map(p => p.name).join(', ') : 'None' },
            { label: 'Created At', icon: 'calendar-day', color: 'indigo', value: createdAt }
        ];

        document.getElementById('couponDetailsContent').innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${fields.map(({ label, icon, color, value }) => `
                    <div class="p-4 bg-white rounded-lg shadow border-l-4 border-${color}-500 h-20 flex flex-col justify-between">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fas fa-${icon} text-${color}-500 text-lg"></i>
                            <span class="text-xs text-gray-500 font-medium">${label}</span>
                        </div>
                        <div class="text-sm font-semibold text-${color}-700 break-all">${value}</div>
                    </div>
                `).join('')}
            </div>
        `;

        const modal = document.getElementById('couponDetailModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        showNotification('Error', 'Failed to load coupon details. Please try again.', 'error');
        console.error('Error loading coupon details:', error);
    }
}

function closeCouponDetailModal() {
    const modal = document.getElementById('couponDetailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

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
        console.log("package: ", coupon.premiumPackages)
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

function closeCouponModal() {
    const modal = document.getElementById('couponModal');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('show');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
}

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

async function deleteCoupon(couponId) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
        const response = await apiRequest(`http://localhost:8080/api/coupon/${couponId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        showNotification('Success', 'Coupon deleted successfully!', 'success');
        const filters = loadFilters();
        loadCoupons(currentPage, 6, false);
    } catch (error) {
        showNotification('Error', 'Failed to delete coupon. Please try again.', 'error');
        console.error('Error deleting coupon:', error);
    }
}

function renderPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    const maxButtons = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons);
    startPage = Math.max(0, endPage - maxButtons);

    const createButton = (page, text, disabled = false) => {
        return `<button class="px-4 py-2 rounded-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition" ${disabled ? 'disabled' : `onclick="loadCoupons(${page}, 6, false)"`}>${text}</button>`;
    };

    const buttons = [
        ...(startPage > 0 ? [createButton(0, '1'), ...(startPage > 1 ? ['<span class="px-4 py-2 text-gray-500">...</span>'] : [])] : []),
        ...Array.from({ length: endPage - startPage }, (_, i) => createButton(startPage + i, startPage + i + 1, startPage + i === currentPage)),
        ...(endPage < totalPages ? [(endPage < totalPages - 1 ? '<span class="px-4 py-2 text-gray-500">...</span>' : ''), createButton(totalPages - 1, totalPages)] : []),
    ];

    pageNumbers.innerHTML = buttons.join('');
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages - 1;
}

function showNotification(title, message, type) {
    const toastContainer = document.getElementById('toastContainer');
    const notificationCard = document.createElement('div');
    const typeStyles = {
        error: {
            border: 'border-l-4 border-red-500',
            icon: '<i class="fas fa-times-circle text-red-500 text-lg"></i>'
        },
        warning: {
            border: 'border-l-4 border-yellow-400',
            icon: '<i class="fas fa-exclamation-triangle text-yellow-500 text-lg"></i>'
        },
        success: {
            border: 'border-l-4 border-green-500',
            icon: '<i class="fas fa-check-circle text-green-500 text-lg"></i>'
        },
        info: {
            border: 'border-l-4 border-blue-500',
            icon: '<i class="fas fa-info-circle text-blue-500 text-lg"></i>'
        }
    };
    const style = typeStyles[type] || typeStyles.info;
    notificationCard.className = `flex items-start gap-3 bg-white shadow-lg rounded-xl p-4 mb-3 fade-in ${style.border}`;
    notificationCard.innerHTML = `
        <div class="flex-shrink-0 mt-0.5">${style.icon}</div>
        <div class="flex-1">
            <div class="flex items-center justify-between">
                <h3 class="font-semibold text-gray-900">${title}</h3>
                <button class="ml-2 text-gray-400 hover:text-gray-600 text-lg font-bold leading-none focus:outline-none" aria-label="Close notification" tabindex="0">×</button>
            </div>
            <div class="mt-1 text-gray-700 text-sm">${message}</div>
        </div>
    `;
    notificationCard.querySelector('button').onclick = () => {
        notificationCard.classList.remove('fade-in');
        notificationCard.classList.add('fade-out');
        setTimeout(() => notificationCard.remove(), 300);
    };
    setTimeout(() => {
        notificationCard.classList.remove('fade-in');
        notificationCard.classList.add('fade-out');
        setTimeout(() => notificationCard.remove(), 300);
    }, 4000);
    toastContainer.appendChild(notificationCard);
}

function formatTimestamp(isoString, useBr = false) {
    if (!isoString) return 'N/A';
    if (isoString.includes('T')) {
        const [date, timeWithMs] = isoString.split('T');
        const time = timeWithMs.split('.')[0];
        return useBr ? `${time}<br>${date}` : `${date} ${time}`;
    }
    return isoString;
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('searchInput').addEventListener('input', debounce(() => {
        const code = document.getElementById('searchInput').value;
        saveFilters(code, document.getElementById('isActiveFilter').value, document.getElementById('startDateFilter').value, document.getElementById('endDateFilter').value);
        searchCoupons(0, 6, code, document.getElementById('isActiveFilter').value, document.getElementById('startDateFilter').value, document.getElementById('endDateFilter').value);
    }, 500));

    await Promise.all([
        loadCoupons(0, 6),
        loadStats(),
        loadPremiumPackages()
    ]);


    document.getElementById('filterBtn').addEventListener('click', () => {
        const code = document.getElementById('codeFilter').value;
        const isActive = document.getElementById('isActiveFilter').value;
        const startDate = document.getElementById('startDateFilter').value;
        const endDate = document.getElementById('endDateFilter').value;
        saveFilters(code, isActive, startDate, endDate);
        searchCoupons(0, 6, code, isActive, startDate, endDate);
        loadStats();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            const filters = loadFilters();
            loadCoupons(currentPage, 6, false);
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            const filters = loadFilters();
            loadCoupons(currentPage, 6, false);
        }
    });

    document.getElementById('refreshBtn').addEventListener('click', refreshData);

    document.getElementById('createBtn').addEventListener('click', () => openCouponModal());

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData)
            });
            if (!response.ok) throw new Error(couponId ? 'Failed to update coupon' : 'Failed to create coupon');
            showNotification('Success', couponId ? 'Coupon updated successfully!' : 'Coupon created successfully!', 'success');
            closeCouponModal();
            const filters = loadFilters();
            loadCoupons(currentPage, 6, false);
        } catch (error) {
            showNotification('Error', couponId ? 'Failed to update coupon. Please try again.' : 'Failed to create coupon. Please try again.', 'error');
            console.error('Error saving coupon:', error);
        }
    });

    // Enable pressing Enter in filter inputs to trigger Apply Filters
    document.querySelectorAll('#codeFilter, #isActiveFilter, #startDateFilter, #endDateFilter').forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                document.getElementById('filterBtn').click();
            }
        });
    });
});