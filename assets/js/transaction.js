const API_BASE_URL = 'http://localhost:8080/api/transactions';
let currentPage = 0;
let totalPages = 0;
let editingTransactionId = null;
let currentWallet = null;


// DOM Elements
const balanceAmount = document.getElementById('balanceAmount');
const balanceCurrency = document.getElementById('balanceCurrency');
const walletLoading = document.getElementById('walletLoading');
const walletBalance = document.getElementById('walletBalance');
const walletError = document.getElementById('walletError');
const walletModal = document.getElementById('walletModal');
const walletForm = document.getElementById('walletForm');
const newBalanceInput = document.getElementById('newBalance');
const currencySelect = document.getElementById('currency');
const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const editWalletBtn = document.getElementById('editWalletBtn');
const closeWalletModalBtn = document.getElementById('closeWalletModalBtn');
const cancelWalletBtn = document.getElementById('cancelWalletBtn');
const updateWalletBtn = document.getElementById('updateWalletBtn');
const createCategoryModal = document.getElementById('createCategoryModal');
const createCategoryForm = document.getElementById('createCategoryForm');
const closeCreateCategoryModalBtn = document.getElementById('closeCreateCategoryModalBtn');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const submitCategoryBtn = document.getElementById('submitCategoryBtn');

// JWT and User Management
const getToken = () => {
    return localStorage.getItem('token');
};

const getCurrentUser = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            userId: payload.userId || payload.sub,
            username: payload.username || payload.name,
            exp: payload.exp
        };
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
};

const isTokenExpired = () => {
    const user = getCurrentUser();
    if (!user) return true;
    return Date.now() >= user.exp * 1000;
};

const redirectToLogin = () => {
    localStorage.removeItem('token');
    window.location.href = '../pages/login.html';
};

const getAuthHeaders = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const checkAuth = () => {
    if (!getToken() || isTokenExpired()) {
        redirectToLogin();
        return false;
    }
    return true;
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

const showElement = (element) => {
    element.classList.remove('hidden');
};

const hideElement = (element) => {
    element.classList.add('hidden');
};

const showSuccess = (message) => {
    alert(message); // Thay bằng Toastify nếu cần
};

const showError = (message) => {
    alert(message); // Thay bằng Toastify nếu cần
};

const showLoading = () => {
    document.getElementById('loadingDiv').classList.remove('hidden');
    document.getElementById('transactionTableBody').innerHTML = '';
    document.getElementById('paginationDiv').classList.add('hidden');
};

const hideLoading = () => {
    document.getElementById('loadingDiv').classList.add('hidden');
};

const showModal = (modal) => {
    modal.classList.remove('hidden');
};

const hideModal = (modal) => {
    modal.classList.add('hidden');
};

const resetTransactionForm = () => {
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('category-edit').value = '';
    document.getElementById('modalTitle').textContent = 'Tạo giao dịch mới';
    document.getElementById('submitBtn').textContent = 'Tạo giao dịch';
    editingTransactionId = null;
};

const resetSearchForm = () => {
    document.getElementById('searchForm').reset();
    document.getElementById('isRecurringSearch').value = '';
};

const resetWalletForm = () => {
    walletForm.reset();
    if (currentWallet) {
        newBalanceInput.value = currentWallet.balance;
        currencySelect.value = currentWallet.currency;
        currentBalanceDisplay.textContent = formatAmount(currentWallet.balance) + ' ' + currentWallet.currency;
    }
};

const validateTransactionForm = () => {
    const formFields = {
        amount: document.getElementById('amount'),
        transactionDate: document.getElementById('transactionDate'),
        categorySelect: document.getElementById('category-edit'),
        recurringPattern: document.getElementById('recurringPattern'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate')
    };

    if (!formFields.amount.value || parseFloat(formFields.amount.value) <= 0) {
        showError('Số tiền phải lớn hơn 0');
        return false;
    }
    if (!formFields.transactionDate.value) {
        showError('Ngày giao dịch là bắt buộc');
        return false;
    }
    if (!formFields.categorySelect.value) {
        showError('Category là bắt buộc');
        return false;
    }

    if (formFields.recurringPattern.value) {
        if (!formFields.startDate.value) {
            showError('Ngày bắt đầu là bắt buộc khi chọn mẫu lặp lại');
            return false;
        }
        if (!formFields.endDate.value) {
            showError('Ngày kết thúc là bắt buộc khi chọn mẫu lặp lại');
            return false;
        }
        if (new Date(formFields.endDate.value) < new Date(formFields.startDate.value)) {
            showError('Ngày kết thúc phải sau ngày bắt đầu');
            return false;
        }
    }

    return true;
};

const validateWalletForm = () => {
    if (!newBalanceInput.value || isNaN(parseFloat(newBalanceInput.value)) || parseFloat(newBalanceInput.value) < 0) {
        showError('Vui lòng nhập số dư hợp lệ');
        return false;
    }
    if (!currencySelect.value) {
        showError('Vui lòng chọn loại tiền tệ');
        return false;
    }
    return true;
};

// API Functions
const apiRequest = async (url, options = {}) => {
    if (!checkAuth()) return null;
    
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            redirectToLogin();
            return null;
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

const loadWalletBalance = async () => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    
    try {
        showElement(walletLoading);
        hideElement(walletBalance);
        hideElement(walletError);

        const response = await apiRequest(`http://localhost:8080/api/wallet?userId=${user.userId}`);
        if (!response) return;

        const data = await response.json();

        if (data.code === 1000) {
            currentWallet = data.result;
            balanceAmount.textContent = formatAmount(currentWallet.balance);
            balanceCurrency.textContent = currentWallet.currency;
            currentBalanceDisplay.textContent = formatAmount(currentWallet.balance) + ' ' + currentWallet.currency;

            hideElement(walletLoading);
            showElement(walletBalance);
        } else {
            throw new Error(data.message || 'Failed to load wallet');
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
        hideElement(walletLoading);
        showElement(walletError);
    }
};

const updateWalletBalance = async (newBalance, currency) => {
    if (!checkAuth()) return false;
    
    const user = getCurrentUser();
    
    try {
        const response = await apiRequest('http://localhost:8080/api/wallet', {
            method: 'PUT',
            body: JSON.stringify({
                userId: user.userId,
                balance: parseFloat(newBalance),
                currency: currency
            })
        });

        if (!response) return false;

        const data = await response.json();

        if (data.code === 1000) {
            currentWallet = data.result;
            balanceAmount.textContent = formatAmount(data.result.balance);
            balanceCurrency.textContent = data.result.currency;
            currentBalanceDisplay.textContent = formatAmount(data.result.balance) + ' ' + data.result.currency;
            showSuccess('Cập nhật số dư ví thành công!');
            loadTransactions();
            return true;
        } else {
            throw new Error(data.message || 'Không thể cập nhật số dư ví');
        }
    } catch (error) {
        console.error('Error updating wallet:', error);
        showError(error.message || 'Lỗi khi cập nhật wallet');
        return false;
    }
};

const loadTransactions = async (searchParams = {}) => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    showLoading();
    
    try {
        const params = new URLSearchParams({
            userId: user.userId,
            page: currentPage,
            size: 10,
            sortBy: 'transactionDate',
            sortDirection: 'DESC',
            ...searchParams
        });
        
        const response = await apiRequest(`${API_BASE_URL}?${params}`);
        if (!response) return;
        
        const data = await response.json();

        if (data.code === 1000) {
            renderTransactions(data.result.content || []);
            renderPagination(data.result.totalPages || 0);
            await loadWalletBalance();
        } else {
            showError(`Lỗi: ${data.message || 'Không thể tải giao dịch'}`);
            document.getElementById('transactionTableBody').innerHTML = '<tr><td colspan="9" class="empty-state">Không có giao dịch nào</td></tr>';
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Lỗi khi tải danh sách giao dịch');
        document.getElementById('transactionTableBody').innerHTML = '<tr><td colspan="9" class="empty-state">Không có giao dịch nào</td></tr>';
    } finally {
        hideLoading();
    }
};

const createTransaction = async (formData) => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    
    try {
        let url = API_BASE_URL;
        let body;

        if (formData.recurringPattern) {
            url = 'http://localhost:8080/api/recurringTransactions';
            body = {
                userId: user.userId,
                categoryId: formData.categoryId || null,
                userCategoryId: formData.userCategoryId || null,
                amount: parseFloat(formData.amount),
                note: formData.note || null,
                frequency: formData.recurringPattern,
                startDate: formData.startDate,
                endDate: formData.endDate,
                isActive: true
            };
        } else {    
            body = {
                userId: user.userId,
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

        const response = await apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        
        if (!response) return;

        const data = await response.json();

        if (data.code === 1000) {
            showSuccess('Tạo giao dịch thành công!');
            hideModal(document.getElementById('transactionModal'));
            resetTransactionForm();
            loadTransactions();
        } else {
            showError(`Lỗi: ${data.message || 'Không thể tạo giao dịch'}`);
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        showError('Lỗi khi tạo giao dịch');
    }
};

const updateTransaction = async (transactionId, formData) => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    
    try {
        const response = await apiRequest(`${API_BASE_URL}/${transactionId}?userId=${user.userId}`, {
            method: 'PUT',
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
        
        if (!response) return;

        const data = await response.json();

        if (data.code === 1000) {
            showSuccess('Cập nhật giao dịch thành công!');
            hideModal(document.getElementById('transactionModal'));
            resetTransactionForm();
            loadTransactions();
            await loadWalletBalance();
        } else {
            showError(`Lỗi: ${data.message || 'Không thể cập nhật giao dịch'}`);
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        showError('Lỗi khi cập nhật giao dịch');
    }
};

const deleteTransaction = async (transactionId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    
    try {
        const response = await apiRequest(`${API_BASE_URL}/${transactionId}?userId=${user.userId}`, {
            method: 'DELETE'
        });
        
        if (!response) return;
        
        if (response.ok) {
            showSuccess('Xóa giao dịch thành công!');
            loadTransactions();
            await loadWalletBalance();
        } else {
            const data = await response.json();
            showError(`Lỗi: ${data.message || 'Không thể xóa giao dịch'}`);
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Lỗi khi xóa giao dịch');
    }
};

const searchTransactions = async () => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    const [type, id] = document.getElementById('category-search').value.split('-');
    
    const searchParams = {
        categoryId: (type === 'system') ? id : null,
        userCategoryId: (type === 'user') ? id : null,
        minAmount: document.getElementById('minAmount').value ? parseFloat(document.getElementById('minAmount').value) : null,
        maxAmount: document.getElementById('maxAmount').value ? parseFloat(document.getElementById('maxAmount').value) : null,
        startDate: document.getElementById('searchStartDate').value || null,
        endDate: document.getElementById('searchEndDate').value || null,
        paymentMethod: document.getElementById('paymentMethodSearch').value || null,
        location: document.getElementById('locationSearch').value || null,
        note: document.getElementById('noteSearch').value || null,
        isRecurring: document.getElementById('isRecurringSearch').value === '' ? null : document.getElementById('isRecurringSearch').value === 'true'
    };

    showLoading();
    try {
        const response = await apiRequest(`${API_BASE_URL}/search`, {
            method: 'POST',
            body: JSON.stringify({
                userId: user.userId,
                ...searchParams,
                page: currentPage,
                size: 10,
                sortBy: 'transactionDate',
                sortDirection: 'DESC'
            })
        });

        if (!response) return;

        const data = await response.json();

        if (data.code === 1000) {
            renderTransactions(data.result.content || []);
            renderPagination(data.result.totalPages || 0);
            hideModal(document.getElementById('searchModal'));
            resetSearchForm();
            await loadWalletBalance();
        } else {
            showError(`Lỗi: ${data.message || 'Không thể tìm kiếm giao dịch'}`);
            document.getElementById('transactionTableBody').innerHTML = '<tr><td colspan="9" class="empty-state">Không có giao dịch nào</td></tr>';
        }
    } catch (error) {
        console.error('Error searching transactions:', error);
        showError('Lỗi khi tìm kiếm giao dịch');
        document.getElementById('transactionTableBody').innerHTML = '<tr><td colspan="9" class="empty-state">Không có giao dịch nào</td></tr>';
    } finally {
        hideLoading();
    }
};

const renderTransactions = (transactions) => {
    const transactionTableBody = document.getElementById('transactionTableBody');
    transactionTableBody.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionTableBody.innerHTML = '<tr><td colspan="9" class="empty-state">Không có giao dịch nào</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        if (!transaction.transactionId) {
            console.error('Missing transactionId for transaction:', transaction);
            return;
        }
        
        const transactionType = transaction.categoryId ? 
            (transaction.categoryType || 'EXPENSE') : 
            (transaction.userCategoryType || 'EXPENSE');

        const categoryIcon = transaction.categoryIcon || transaction.userCategoryIcon || '';
        const categoryName = transaction.categoryName == null ? transaction.userCategoryName : transaction.categoryName;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(transaction.transactionDate)}</td>
            <td>${'<i class="fas fa-question"></i>'} ${categoryName}</td>
            <td>${transactionType}</td>
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
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    if (total <= 1) {
        document.getElementById('paginationDiv').classList.add('hidden');
        return;
    }
    
    document.getElementById('paginationDiv').classList.remove('hidden');
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = currentPage === totalPages - 1;

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

const loadCategories = async () => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    
    try {
        const systemRes = await apiRequest('http://localhost:8080/api/categories');
        const userRes = await apiRequest(`http://localhost:8080/api/userCategories/${user.userId}`);

        if (!systemRes || !userRes) return;

        const systemData = await systemRes.json();
        const userData = await userRes.json();

        const systemCategories = systemData.result || [];
        const userCategories = userData.result || [];
        console.info('System Categories:', systemCategories);
        console.info('User Categories:', userCategories);

        const selectElements = document.querySelectorAll('.categorySelect');

        selectElements.forEach(select => {
            select.innerHTML = '<option value="">Chọn loại giao dịch</option>';

            // Danh mục Thu nhập (INCOME)
            const incomeSystemCategories = systemCategories.filter(cat => cat.type === 'INCOME');
            const incomeUserCategories = userCategories.filter(cat => cat.type === 'INCOME');

            if (incomeSystemCategories.length > 0 || incomeUserCategories.length > 0) {
                const incomeOptgroup = document.createElement('optgroup');
                incomeOptgroup.label = 'Danh mục - Thu nhập';

                incomeSystemCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = `system-${category.categoryId}`;
                    option.innerHTML = `${'<i class="category.icon"></i>' || '<i class="fas fa-question"></i>'} ${category.categoryName}`;
                    incomeOptgroup.appendChild(option);
                });

                incomeUserCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = `user-${category.userCategoryId}`;
                    option.innerHTML = `${'<i class="category.icon"></i>' || '<i class="fas fa-question"></i>'} ${category.categoryName}`;
                    incomeOptgroup.appendChild(option);
                });

                select.appendChild(incomeOptgroup);
            }

            // Danh mục Chi tiêu (EXPENSE)
            const expenseSystemCategories = systemCategories.filter(cat => cat.type === 'EXPENSE');
            const expenseUserCategories = userCategories.filter(cat => cat.type === 'EXPENSE');

            if (expenseSystemCategories.length > 0 || expenseUserCategories.length > 0) {
                const expenseOptgroup = document.createElement('optgroup');
                expenseOptgroup.label = 'Danh mục - Chi tiêu';

                expenseSystemCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = `system-${category.categoryId}`;
                    option.innerHTML = `${'<i class="category.icon"></i>' || '<i class="fas fa-question"></i>'} ${category.categoryName}`;
                    expenseOptgroup.appendChild(option);
                });

                expenseUserCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = `user-${category.userCategoryId}`;
                    option.innerHTML = `${'<i class="category.icon"></i>' || '<i class="fas fa-question"></i>'} ${category.categoryName}`;
                    expenseOptgroup.appendChild(option);
                });

                select.appendChild(expenseOptgroup);
            }

            // Thêm tùy chọn "Tạo danh mục mới"
            const createOption = document.createElement('option');
            createOption.value = 'create-new';
            createOption.textContent = 'Tạo danh mục mới';
            select.appendChild(createOption);
        });

    } catch (error) {
        console.error('Lỗi tải categories:', error);
        document.querySelectorAll('.categorySelect').forEach(select => {
            select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        });
    }
};

const openCreateCategoryModal = () => {
    createCategoryForm.reset();
    showModal(createCategoryModal);
};

const closeCreateCategoryModal = () => {
    hideModal(createCategoryModal);
    createCategoryForm.reset();
};

const createUserCategory = async (formData) => {
    if (!checkAuth()) return;
    
    const user = getCurrentUser();
    
    try {
        const response = await apiRequest('http://localhost:8080/api/userCategories', {
            method: 'POST',
            body: JSON.stringify({
                userId: user.userId,
                userCategoryName: formData.categoryName,
                type: formData.categoryType,
                icon: formData.categoryIcon,
                color: formData.categoryColor
            })
        });

        if (!response) return;

        const data = await response.json();

        if (data.code === 1000) {
            showSuccess('Tạo danh mục thành công!');
            closeCreateCategoryModal();
            await loadCategories();
        } else {
            showError(`Lỗi: ${data.message || 'Không thể tạo danh mục'}`);
        }
    } catch (error) {
        console.error('Error creating user category:', error);
        showError('Lỗi khi tạo danh mục');
    }
};

// Modal Functions
const openWalletModal = () => {
    if (currentWallet) {
        newBalanceInput.value = currentWallet.balance;
        currencySelect.value = currentWallet.currency;
        currentBalanceDisplay.textContent = formatAmount(currentWallet.balance) + ' ' + currentWallet.currency;
    } else {
        currentBalanceDisplay.textContent = 'N/A';
    }
    showModal(walletModal);
};

const closeWalletModal = () => {
    hideModal(walletModal);
    resetWalletForm();
};

// Event Listeners
editWalletBtn.addEventListener('click', openWalletModal);
closeWalletModalBtn.addEventListener('click', closeWalletModal);
cancelWalletBtn.addEventListener('click', closeWalletModal);

walletModal.addEventListener('click', (e) => {
    if (e.target === walletModal) {
        closeWalletModal();
    }
});

walletForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateWalletForm()) return;

    const newBalance = newBalanceInput.value;
    const currency = currencySelect.value;

    updateWalletBtn.innerHTML = '⏳ Đang cập nhật...';
    updateWalletBtn.disabled = true;

    try {
        const success = await updateWalletBalance(newBalance, currency);
        if (success) {
            closeWalletModal();
        }
    } finally {
        updateWalletBtn.innerHTML = 'Cập nhật';
        updateWalletBtn.disabled = false;
    }
});

if (createCategoryModal) {
    closeCreateCategoryModalBtn.addEventListener('click', closeCreateCategoryModal);
    cancelCategoryBtn.addEventListener('click', closeCreateCategoryModal);

    createCategoryModal.addEventListener('click', (e) => {
        if (e.target === createCategoryModal) {
            closeCreateCategoryModal();
        }
    });

    createCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoryName = document.getElementById('categoryName').value.trim();
        const categoryType = document.getElementById('categoryType').value;
        const categoryIcon = document.getElementById('categoryIcon').value;
        const categoryColor = document.getElementById('categoryColor').value;

        if (!categoryName) {
            showError('Tên danh mục là bắt buộc');
            return;
        }
        if (!categoryType) {
            showError('Loại danh mục là bắt buộc');
            return;
        }
        if (!categoryIcon) {
            showError('Biểu tượng là bắt buộc');
            return;
        }

        submitCategoryBtn.innerHTML = '⏳ Đang lưu...';
        submitCategoryBtn.disabled = true;

        try {
            await createUserCategory({
                categoryName,
                categoryType,
                categoryIcon,
                categoryColor
            });
        } finally {
            submitCategoryBtn.innerHTML = 'Lưu Danh Mục';
            submitCategoryBtn.disabled = false;
        }
    });
}

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('categorySelect') && e.target.value === 'create-new') {
        openCreateCategoryModal();
        e.target.value = '';
    }
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        const tab = item.dataset.tab;
        document.querySelectorAll('.content-area').forEach(area => area.classList.add('hidden'));
        document.getElementById(`${tab}-content`).classList.remove('hidden');
        document.getElementById('headerTitle').textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
        if (tab === 'transactions') {
            currentPage = 0;
            loadTransactions();
        }
    });
});

document.getElementById('createBtn').addEventListener('click', () => {
    resetTransactionForm();
    loadCategories();
    showModal(document.getElementById('transactionModal'));
});

document.getElementById('searchBtn').addEventListener('click', () => {
    resetSearchForm();
    loadCategories();
    showModal(document.getElementById('searchModal'));
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    hideModal(document.getElementById('transactionModal'));
    resetTransactionForm();
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    hideModal(document.getElementById('transactionModal'));
    resetTransactionForm();
});

document.getElementById('closeSearchModalBtn').addEventListener('click', () => {
    hideModal(document.getElementById('searchModal'));
    resetSearchForm();
});

document.getElementById('cancelSearchBtn').addEventListener('click', () => {
    hideModal(document.getElementById('searchModal'));
    resetSearchForm();
});

document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateTransactionForm()) return;

    const [type, categoryId] = document.getElementById('category-edit').value.split('-');

    const formData = {
        amount: document.getElementById('amount').value,
        transactionDate: document.getElementById('transactionDate').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        location: document.getElementById('location').value,
        note: document.getElementById('note').value,
        imageUrl: document.getElementById('imageUrl').value,
        recurringPattern: document.getElementById('recurringPattern').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        isRecurring: !!document.getElementById('recurringPattern').value,
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

document.getElementById('recurringPattern').addEventListener('change', () => {
    const recurringDatesDiv = document.querySelector('.recurring-dates');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (document.getElementById('recurringPattern').value) {
        recurringDatesDiv.classList.remove('hidden');
        startDate.required = true;
        endDate.required = true;
    } else {
        recurringDatesDiv.classList.add('hidden');
        startDate.required = false;
        endDate.required = false;
    }
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 0;
    searchTransactions();
});

document.getElementById('transactionTableBody').addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button || !button.dataset.id) return;

    const id = button.dataset.id;
    const user = getCurrentUser();
    
    if (button.classList.contains('edit-btn')) {
        try {
            const response = await apiRequest(`${API_BASE_URL}/${id}?userId=${user.userId}`);
            if (!response) return;
            
            const data = await response.json();
            if (data.code === 1000) {
                const transaction = data.result;
                await loadCategories();
                
                document.getElementById('amount').value = transaction.amount;
                document.getElementById('transactionDate').value = transaction.transactionDate.split('T')[0];
                
                if (transaction.categoryId) {
                    document.getElementById('category-edit').value = `system-${transaction.categoryId}`;
                } else if (transaction.userCategoryId) {
                    document.getElementById('category-edit').value = `user-${transaction.userCategoryId}`;
                } else {
                    document.getElementById('category-edit').value = '';
                }
                
                document.getElementById('paymentMethod').value = transaction.paymentMethod || '';
                document.getElementById('location').value = transaction.location || '';
                document.getElementById('note').value = transaction.note || '';
                document.getElementById('imageUrl').value = transaction.imageUrl || '';
                document.getElementById('recurringPattern').value = transaction.recurringPattern || '';
                
                document.getElementById('modalTitle').textContent = 'Cập nhật giao dịch';
                document.getElementById('submitBtn').textContent = 'Cập nhật';
                editingTransactionId = id;

                showModal(document.getElementById('transactionModal'));
            } else {
                showError(`Lỗi: ${data.message || 'Không thể tải giao dịch'}`);
            }
        } catch (error) {
            console.error('Error loading transaction:', error);
            showError('Lỗi khi tải giao dịch');
        }
    } else if (button.classList.contains('delete-btn')) {
        deleteTransaction(id);
    }
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        loadTransactions();
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        loadTransactions();
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        redirectToLogin();
    });
}

// Initialize
window.addEventListener('load', () => {
    if (checkAuth()) {
        loadTransactions();
        loadWalletBalance();
    }
});

