function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(amount);
}


function formatDate_ddMMyyyy(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return day + '/' + month + '/' + year;
}

const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
};

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
