function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate_ddMMyyyy(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return day + '/' + month + '/' + year;
}

function formatPercentage(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
}

function getStatusColor(status) {
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-200 text-green-800';
        case 'FAILED':
            return 'bg-red-200 text-red-800';
        case 'CANCELLED':
            return 'bg-gray-200 text-gray-600';
        default:
            return 'bg-yellow-200 text-yellow-800';
    }
}

function getProgressColor(progress) {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
}


function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.floor((360 / count) * i);
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

function showResult(title, status) {
    console.log(`${title}: ${status}`);
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: status,
        title: title,
        showConfirmButton: true,
        timer: 2000,
        timerProgressBar: true
    });
}

async function showConfirmDialog(title, text) {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f56565',
        cancelButtonColor: '#a0aec0',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
    });
    return result.isConfirmed;
}

function showErrorMessage(message) {

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

function renderPagination (total) {
    totalPages = total;
    const pageNumbers = DOM.pageNumbers;
    const paginationDiv = DOM.paginationDiv;
    const firstBtn = DOM.firstBtn;
    const lastBtn = DOM.lastBtn;
    pageNumbers.innerHTML = '';
    if (total <= 1) {
        hideElement(paginationDiv);
        return;
    }
    showElement(paginationDiv);
    firstBtn.disabled = currentPage === 0;
    lastBtn.disabled = currentPage === totalPages - 1;
    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow);
    if (endPage - startPage < maxPagesToShow) {
        startPage = Math.max(0, endPage - maxPagesToShow);
    }
    for (let i = startPage; i < endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `px-4 py-3 rounded-lg font-semibold ${i === currentPage ? 'bg-green-600 text-white shadow-md' : 'bg-white border-2 border-gray-200 hover:bg-green-50 hover:border-green-600'}`;
        btn.textContent = i + 1;
        btn.addEventListener('click', () => {
            currentPage = i;
            loadTransactions();
        });
        pageNumbers.appendChild(btn);
    }
};
