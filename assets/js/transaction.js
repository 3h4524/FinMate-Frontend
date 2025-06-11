const API_BASE_URL = 'http://localhost:8080/api/transactions';
const CURRENT_USER_ID = 2;
let currentPage = 0;
let totalPages = 0;
let editingTransactionId = null;

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const contentAreas = document.querySelectorAll('.content-area');
const headerTitle = document.getElementById('headerTitle');
const transactionTableBody = document.getElementById('transactionTableBody');
const paginationDiv = document.getElementById('paginationDiv');
const pageNumbers = document.getElementById('pageNumbers');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loadingDiv = document.getElementById('loadingDiv');
const createBtn = document.getElementById('createBtn');
const searchBtn = document.getElementById('searchBtn');
const transactionModal = document.getElementById('transactionModal');
const searchModal = document.getElementById('searchModal');
const transactionForm = document.getElementById('transactionForm');
const searchForm = document.getElementById('searchForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
const cancelSearchBtn = document.getElementById('cancelSearchBtn');

// Form Fields
const formFields = {
    amount: document.getElementById('amount'),
    transactionDate: document.getElementById('transactionDate'),
    categorySelect: document.getElementById('category-edit'),
    paymentMethod: document.getElementById('paymentMethod'),
    location: document.getElementById('location'),
    note: document.getElementById('note'),
    imageUrl: document.getElementById('imageUrl'),
    recurringPattern: document.getElementById('recurringPattern'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate')
};

const searchFields = {
    minAmount: document.getElementById('minAmount'),
    maxAmount: document.getElementById('maxAmount'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    paymentMethod: document.getElementById('paymentMethodSearch'),
    location: document.getElementById('locationSearch'),
    note: document.getElementById('noteSearch'),
    isRecurring: document.getElementById('isRecurringSearch')
};

// Utility Functions
const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
};

const showLoading = () => {
    loadingDiv.classList.remove('hidden');
    transactionTableBody.innerHTML = '';
    paginationDiv.classList.add('hidden');
};

const hideLoading = () => {
    loadingDiv.classList.add('hidden');
};

const showModal = (modal) => {
    modal.classList.remove('hidden');
};

const hideModal = (modal) => {
    modal.classList.add('hidden');
};

const resetTransactionForm = () => {
    transactionForm.reset();
    formFields.transactionDate.value = new Date().toISOString().split('T')[0];
    formFields.categorySelect.value = '';
    modalTitle.textContent = 'Tạo giao dịch mới';
    submitBtn.textContent = 'Tạo giao dịch';
    editingTransactionId = null;
};

const resetSearchForm = () => {
    searchForm.reset();
    searchFields.isRecurring.value = '';
};

const validateTransactionForm = () => {
    if (!formFields.amount.value || parseFloat(formFields.amount.value) <= 0) {
        alert('Số tiền phải lớn hơn 0');
        return false;
    }
    if (!formFields.transactionDate.value) {
        alert('Ngày giao dịch là bắt buộc');
        return false;
    }
    if (!formFields.categorySelect.value) {
        alert('Category là bắt buộc');
        return false;
    }

    if (formFields.recurringPattern.value) {
        if (!formFields.startDate.value) {
            alert('Ngày bắt đầu là bắt buộc khi chọn mẫu lặp lại');
            return false;
        }
        if (!formFields.endDate.value) {
            alert('Ngày kết thúc là bắt buộc khi chọn mẫu lặp lại');
            return false;
        }
        // Ensure endDate is not before startDate
        if (new Date(formFields.endDate.value) < new Date(formFields.startDate.value)) {
            alert('Ngày kết thúc phải sau ngày bắt đầu');
            return false;
        }
    }

    return true;
};

// API Functions
const loadTransactions = async (searchParams = {}) => {
    showLoading();
    try {
        const params = new URLSearchParams({
            userId: CURRENT_USER_ID,
            page: currentPage,
            size: 10,
            sortBy: 'transactionDate',
            sortDirection: 'DESC',
            ...searchParams
        });
        const response = await fetch(`${API_BASE_URL}?${params}`);
        const data = await response.json();

        if (data.code === 1000) {
            renderTransactions(data.result.content || []);
            renderPagination(data.result.totalPages || 0);
        } else {
            alert(`Lỗi: ${data.message || 'Không thể tải giao dịch'}`);
            transactionTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có giao dịch nào</td></tr>';
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        alert('Lỗi khi tải danh sách giao dịch');
        transactionTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có giao dịch nào</td></tr>';
    } finally {
        hideLoading();
    }
};

const createTransaction = async (formData) => {
    try {
        let url = API_BASE_URL; // Default to /api/transactions
        let body;

        if (formData.recurringPattern) {
            // Recurring transaction
            url = 'http://localhost:8080/api/recurringTransactions';
            body = {
                userId: CURRENT_USER_ID,
                categoryId: formData.categoryId || null,
                userCategoryId: formData.userCategoryId || null,
                amount: parseFloat(formData.amount),
                note: formData.note || null,
                frequency: formData.recurringPattern, // Maps to DAILY, WEEKLY, MONTHLY
                startDate: formFields.startDate.value,
                endDate: formFields.endDate.value,
                isActive: true
            };
        } else {    
            // Non-recurring transaction
            body = {
                userId: CURRENT_USER_ID,
                categoryId: formData.categoryId || null,
                userCategoryId: formData.userCategoryId || null,
                amount: parseFloat(formData.amount),
                note: formData.note || null,
                transactionDate: formData.transactionDate,
                paymentMethod: formData.paymentMethod || null,
                location: formData.location || null,
                imageUrl: formData.imageUrl || null,
                isRecurring: false,
                recurringPattern: null
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (data.code === 1000) {
            alert('Tạo giao dịch thành công!');
            hideModal(transactionModal);
            resetTransactionForm();
            loadTransactions();
        } else {
            alert(`Lỗi: ${data.message || 'Không thể tạo giao dịch'}`);
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        alert('Lỗi khi tạo giao dịch');
    }
};

const updateTransaction = async (transactionId, formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${transactionId}?userId=${CURRENT_USER_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                categoryId: formData.categoryId || null,
                userCategoryId: formData.userCategoryId || null,
                amount: parseFloat(formData.amount),
                note: formData.note || null,
                transactionDate: formData.transactionDate,
                paymentMethod: formData.paymentMethod || null,
                location: formData.location || null,
                imageUrl: formData.imageUrl || null,
                isRecurring: formData.isRecurring,
                recurringPattern: formData.recurringPattern || null
            })
        });
        const data = await response.json();

        if (data.code === 1000) {
            alert('Cập nhật giao dịch thành công!');
            hideModal(transactionModal);
            resetTransactionForm();
            loadTransactions();
        } else {
            alert(`Lỗi: ${data.message || 'Không thể cập nhật giao dịch'}`);
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        alert('Lỗi khi cập nhật giao dịch');
    }
};

const deleteTransaction = async (transactionId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/${transactionId}?userId=${CURRENT_USER_ID}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Xóa giao dịch thành công!');
            loadTransactions();
        } else {
            const data = await response.json();
            alert(`Lỗi: ${data.message || 'Không thể xóa giao dịch'}`);
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Lỗi khi xóa giao dịch');
    }
};

const searchTransactions = async () => {
    const [type, id] = document.getElementById('category-search').value.split('-');
    const searchParams = {
        categoryId: (type === 'system') ? id : null,
        userCategoryId: (type === 'user') ? id : null,
        minAmount: searchFields.minAmount.value ? parseFloat(searchFields.minAmount.value) : null,
        maxAmount: searchFields.maxAmount.value ? parseFloat(searchFields.maxAmount.value) : null,
        startDate: searchFields.startDate.value || null,
        endDate: searchFields.endDate.value || null,
        paymentMethod: searchFields.paymentMethod.value || null,
        location: searchFields.location.value || null,
        note: searchFields.note.value || null,
        isRecurring: searchFields.isRecurring.value === '' ? null : searchFields.isRecurring.value === 'true'
    };

    if (type === 'system') {
        categoryId = id;
    } else if (type === 'user') {
        userCategoryId = id;
    }


    showLoading();
    try {
        const response = await fetch(`${"http://localhost:8080/api/transactions"}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: CURRENT_USER_ID,
                ...searchParams,
                page: currentPage,
                size: 10,
                sortBy: 'transactionDate',
                sortDirection: 'DESC'
            })
        });
        const data = await response.json();

        if (data.code === 1000) {
            renderTransactions(data.result.content || []);
            renderPagination(data.result.totalPages || 0);
            hideModal(searchModal);
            resetSearchForm();
        } else {
            alert(`Lỗi: ${data.message || 'Không thể tìm kiếm giao dịch'}`);
            transactionTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có giao dịch nào</td></tr>';
        }
    } catch (error) {
        console.error('Error searching transactions:', error);
        alert('Lỗi khi tìm kiếm giao dịch');
        transactionTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có giao dịch nào</td></tr>';
    } finally {
        hideLoading();
    }
};

const renderTransactions = (transactions) => {
    transactionTableBody.innerHTML = '';
    console.log('Rendering transactions:', transactions); // Debug log
    if (transactions.length === 0) {
        transactionTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có giao dịch nào</td></tr>';
        return;
    }
    transactions.forEach(transaction => {
        if (!transaction.transactionId) {
            console.error('Missing transactionId for transaction:', transaction);
            return;
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(transaction.transactionDate)}</td>
            <td>${transaction.categoryName == null ? transaction.userCategoryName : transaction.categoryName}</td>
            <td><span class="${transaction.amount < 0 ? 'amount-negative' : 'amount-positive'}">${formatAmount(transaction.amount)}</span></td>
            <td><div class="max-w-32 truncate" title="${transaction.note || ''}">${transaction.note || '-'}</div></td>
            <td>${transaction.paymentMethod || '-'}</td>
            <td>${transaction.location || '-'}</td>
            <td><span class="badge badge-${transaction.isRecurring ? 'recurring' : 'non-recurring'}">${transaction.isRecurring ? 'Có' : 'Không'}</span></td>
            <td class="action-buttons">
            <button class="action-btn edit-btn" data-id="${transaction.transactionId}">
            <svg width="16" height="16" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036
                        a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z">
                </path>
            </svg>
            </button>
            <button class="action-btn delete-btn" data-id="${transaction.transactionId}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M7 7h10">
                </path>
            </svg>
            </button>
            </td>
        `;
        transactionTableBody.appendChild(tr);
    });
};

const renderPagination = (total) => {
    totalPages = total;
    pageNumbers.innerHTML = '';
    if (total <= 1) {
        paginationDiv.classList.add('hidden');
        return;
    }
    paginationDiv.classList.remove('hidden');
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages - 1;

    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow);

    if (endPage - startPage < maxPagesToShow) {
        startPage = Math.max(0, endPage - maxPagesToShow);
    }

    for (let i = startPage; i < endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i + 1;
        btn.addEventListener('click', () => {
            currentPage = i;
            loadTransactions();
        });
        pageNumbers.appendChild(btn);
    }
};

// Event Listeners
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const tab = item.dataset.tab;
        contentAreas.forEach(area => area.classList.add('hidden'));
        document.getElementById(`${tab}-content`).classList.remove('hidden');
        headerTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
        if (tab === 'transactions') {
            currentPage = 0;
            loadTransactions();
        }
    });
});

createBtn.addEventListener('click', () => {
    resetTransactionForm();
    loadCategories();
    showModal(transactionModal);
});

searchBtn.addEventListener('click', () => {
    resetSearchForm();
    loadCategories();
    showModal(searchModal);
});

closeModalBtn.addEventListener('click', () => {
    hideModal(transactionModal);
    resetTransactionForm();
});

cancelBtn.addEventListener('click', () => {
    hideModal(transactionModal);
    resetTransactionForm();
});

closeSearchModalBtn.addEventListener('click', () => {
    hideModal(searchModal);
    resetSearchForm();
});

cancelSearchBtn.addEventListener('click', () => {
    hideModal(searchModal);
    resetSearchForm();
});

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateTransactionForm()) return;

    const [type, categoryId] = formFields.categorySelect.value.split('-');

    const formData = {
        amount: formFields.amount.value,
        transactionDate: formFields.transactionDate.value,
        paymentMethod: formFields.paymentMethod.value,
        location: formFields.location.value,
        note: formFields.note.value,
        imageUrl: formFields.imageUrl.value,
        recurringPattern: formFields.recurringPattern.value,
        isRecurring: !!formFields.recurringPattern.value,
        categoryId: null,
        userCategoryId: null
    };

    if (type === 'system') {
        formData.categoryId = categoryId;
    } else if (type === 'user') {
        formData.userCategoryId = categoryId;
    }

    if (editingTransactionId) {
        updateTransaction(editingTransactionId, formData);
    } else {
        createTransaction(formData);
    }
});

formFields.recurringPattern.addEventListener('change', () => {
    const recurringDatesDiv = document.querySelector('.recurring-datesdates');
    if (formFields.recurringPattern.value) {
        recurringDatesDiv.classList.remove('hidden');
        formFields.startDate.required = true;
        formFields.endDate.required = true;
    } else {
        recurringDatesDiv.classList.add('hidden');
        formFields.startDate.required = false;
        formFields.endDate.required = false;
    }
})

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 0;
    searchTransactions();
});

transactionTableBody.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button || !button.dataset.id) return;

    const id = button.dataset.id;
    if (button.classList.contains('edit-btn')) {
        // Edit logic
        fetch(`${"http://localhost:8080/api/transactions"}/${id}?userId=${CURRENT_USER_ID}`)
            .then(response => response.json())
            .then(data => {
                if (data.code === 1000) {
                    const transaction = data.result;
                    // Load categories first to ensure options are available
                    loadCategories().then(() => {
                        formFields.amount.value = transaction.amount;
                        formFields.transactionDate.value = transaction.transactionDate.split('T')[0];
                        if (transaction.categoryId) {
                            formFields.categorySelect.value = `system-${transaction.categoryId}`;
                        } else if (transaction.userCategoryId) {
                            formFields.categorySelect.value = `user-${transaction.userCategoryId}`;
                        } else {
                            formFields.categorySelect.value = '';
                        }
                        formFields.paymentMethod.value = transaction.paymentMethod || '';
                        formFields.location.value = transaction.location || '';
                        formFields.note.value = transaction.note || '';
                        formFields.imageUrl.value = transaction.imageUrl || '';
                        formFields.recurringPattern.value = transaction.recurringPattern || '';
                        modalTitle.textContent = 'Cập nhật giao dịch';
                        submitBtn.textContent = 'Cập nhật';
                        editingTransactionId = id;

                        showModal(transactionModal);
                    });
                } else {
                    alert(`Lỗi: ${data.message || 'Không thể tải giao dịch'}`);
                }
            })
            .catch(error => {
                console.error('Error loading transaction:', error);
                alert('Lỗi khi tải giao dịch');
            });
    } else if (button.classList.contains('delete-btn')) {
        // Delete logic
        deleteTransaction(id);
    }
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        loadTransactions();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        loadTransactions();
    }
});

const loadCategories = async () => {
    try {
        const systemRes = await fetch('http://localhost:8080/api/categories');
        const userRes = await fetch(`http://localhost:8080/api/userCategories/${CURRENT_USER_ID}`);

        const systemData = await systemRes.json();
        const userData = await userRes.json();

        const systemCategories = systemData.result || [];
        const userCategories = userData.result || [];

        const selectElements = document.querySelectorAll('.categorySelect');

        selectElements.forEach(select => {

            select.innerHTML = '<option value="">Chọn loại giao dịch</option>';

            // Hiển thị SYSTEM categories
            systemCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = `system-${category.categoryId}`;
                option.textContent = category.categoryName;
                select.appendChild(option);
            });

            // Hiển thị USER categories
            userCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = `user-${category.userCategoryId}`; // Fixed typo
                option.textContent = category.userCategoryName;
                select.appendChild(option);
            });
        });

    } catch (error) {
        console.error('Lỗi tải categories:', error);
        document.querySelectorAll('.categorySelect').forEach(select => {
            select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        });
    }
};