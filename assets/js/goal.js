
// State management
let goals = [];
let error = '';

// DOM elements
const newGoalButton = document.getElementById('newGoalButton');
const errorMessage = document.getElementById('errorMessage');
const errorText = errorMessage.querySelector('span');
const noGoalsView = document.getElementById('noGoalsView');
const goalListView = document.getElementById('goalListView');
const goalsList = document.getElementById('goalsList');
const createFirstGoalButton = document.getElementById('createFirstGoalButton');
const newGoalModal = document.getElementById('newGoalModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelButton = document.getElementById('cancelButton');
const newGoalForm = document.getElementById('newGoalForm');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessageModal = document.getElementById('errorMessageModal');
const targetAmountInput = document.getElementById('targetAmountModal');
const currentAmountInput = document.getElementById('currentAmountModal');

const statusFilter = document.getElementById('statusFilter');

// API configuration
const API_BASE_URL = 'http://localhost:8080';

let userId;

function renderError() {
    errorMessage.classList.remove('hidden');
    errorText.textContent = error;
}

// API interactions
async function fetchGoalProgress() {
    console.log('fetching Goals Progress...');
    try {
        const response = await fetch(`${API_BASE_URL}/goal_tracking/list`, {
            headers: { 'userId': userId.toString() }
        });
        if (!response.ok) throw new Error('Failed to fetch goals');
        const data = await response.json();
        goals = data.result.content;
        console.log("fetch goals", goals);
        renderGoals();
    } catch (err) {
        error = 'Failed to fetch goals';
        renderError();
    }
}

async function fetchUserId() {
    console.log("Fetching user id");
    userId = 13;
}

// Event listener for status filter
statusFilter.addEventListener('change', () => {
    renderGoals();
});

// Render goals list
function renderGoals() {
    const selectedStatus = statusFilter.value;


    // Filter goals based on selected status
    let filteredGoals = goals;
    if (selectedStatus !== 'ALL') {
        filteredGoals = goals.filter(goal => goal.status === selectedStatus);
    }

    let inprogressGoals = goals.filter(goal => goal.status === "IN_PROGRESS");

    if (filteredGoals.length === 0) {
        noGoalsView.classList.remove('hidden');
        goalsList.classList.add('hidden');
    } else {
        noGoalsView.classList.add('hidden');
        goalsList.classList.remove('hidden');
        document.getElementById('inProgressGoals').textContent = inprogressGoals.length.toString();
        const totalSaved = filteredGoals.reduce((sum, goal) => sum + goal.amount, 0);
        document.getElementById('totalSaved').textContent = formatCurrency(totalSaved);
        const averageProgress = Math.round(inprogressGoals.reduce((sum, goal) => sum + goal.percentage, 0) / inprogressGoals.length) || 0;
        document.getElementById('averageProgress').textContent = `${averageProgress}%`;
        goalsList.innerHTML = filteredGoals.map(goal => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:bg-gray-50 hover:shadow-md transition-all">
                <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 truncate max-w-[70%]">${goal.name}</h3>
                            ${goal.status === 'IN_PROGRESS' ? `
                            <button onclick="confirmCancelGoal('${goal.goalId}');" class="flex items-center text-red-600 hover:text-red-700 font-medium">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Cancel
                            </button>` : ''}
                </div>

                <div class="flex items-center justify-between mb-4">
                    <p class="text-sm text-gray-600 rounded-full inline-block px-2 py-1 ${goal.isLongTerm ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${goal.isLongTerm ? 'Long Term' : 'Short Term'}
                    </p>
                    <div class="flex items-center space-x-4">
                        <div class="px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}">${goal.status}</div>
                        <button onclick="window.location.href = 'goal_detail.html?goalId=${goal.goalId}';" class="flex items-center text-teal-600 hover:text-teal-700 font-medium">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View Details
                        </button>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-600 mb-2">
                        <span>${formatCurrency(goal.amount)} of ${formatCurrency(goal.targetAmount)}</span>
                        <span>${goal.percentage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="h-3 rounded-full ${getProgressColor(goal.percentage)}" style="width: ${goal.percentage}%"></div>
                    </div>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        ${goal.timeRemaining || 'N/A'}
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Progress Date: ${formatDate_ddMMyyyy(goal.progressDate)}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Hàm xác nhận hủy mục tiêu
async function confirmCancelGoal(goalId) {
    const confirmed = await showConfirmDialog(
        'Do you want to cancel this goal?',
        'You won’t be able to undo this action.!'
    );
    if (confirmed) {
        await cancelGoal(goalId);
    }
}

// function
async function cancelGoal(goalId) {
    console.log("trying to cancel Goal", goalId);
    try {
        const response = await fetch(`${API_BASE_URL}/goal/cancel/${goalId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });


        if (!response.ok) {
            throw new Error('Failed to cancel goal')
        }

        showResult("Cancelled Goal Successfully", "warning");
        await fetchGoalProgress();

    } catch (err) {
        showResult(err, "warning");
    }
}


// Modal functionality
function closeModal() {
    newGoalModal.classList.add('hidden');
    newGoalForm.reset();
    hideError();
}

function showError(message) {
    errorMessageModal.textContent = message;
    errorDisplay.classList.remove('hidden');
}

function hideError() {
    errorDisplay.classList.add('hidden');
}

function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('startDateModal').valueAsDate = today;
    document.getElementById('deadlineModal').valueAsDate = tomorrow;
}

// Event listeners for modal
newGoalButton.addEventListener('click', () => {
    newGoalModal.classList.remove('hidden');
});

createFirstGoalButton.addEventListener('click', () => {
    newGoalModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', closeModal);
cancelButton.addEventListener('click', closeModal);

newGoalModal.addEventListener('click', (e) => {
    if (e.target === newGoalModal) {
        closeModal();
    }
});

newGoalButton.addEventListener('click', setDefaultDates);
createFirstGoalButton.addEventListener('click', setDefaultDates);

// Form submission
newGoalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const formData = new FormData(newGoalForm);
    const goalData = {
        name: formData.get('nameModal'),
        userId: userId,
        description: formData.get('descriptionModal'),
        targetAmount: parseFloat(formData.get('targetAmountModal')),
        currentAmount: parseFloat(formData.get('currentAmountModal')),
        startDate: formData.get('startDateModal'),
        deadline: formData.get('deadlineModal'),
        isLongTerm: formData.get('isLongTermModal') === 'on'
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = new Date(goalData.startDate);
    const deadline = new Date(goalData.deadline);

    // Validation
    if (goalData.targetAmount <= 0 || goalData.currentAmount < 0 || goalData.currentAmount > goalData.targetAmount) {
        showError('Invalid amounts: Target must be positive and greater than current amount');
        return;
    }
    if (startDate > deadline) {
        showError('Target date must be after start date');
        return;
    }
    if (startDate < now) {
        showError('Start date must be in the future');
        return;
    }
    if (deadline < now) {
        showError('Target date must be in the future');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/goal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(goalData)
        });
        if (!response.ok) throw new Error('Failed to create goal');
        showResult("Congratulations you have successfully created a new goal!", "success");
        closeModal();
        newGoalModal.classList.add('hidden');
        newGoalForm.reset();
        hideError();
        await fetchGoalProgress();
    } catch (err) {
        showError(err.message || 'Failed to create goal');
    }
});

// Real-time validation for amounts
function validateAmounts() {
    const target = parseFloat(targetAmountInput.value) || 0;
    const current = parseFloat(currentAmountInput.value) || 0;

    if (current > target && target > 0) {
        currentAmountInput.setCustomValidity('Current amount cannot exceed target amount');
    } else {
        currentAmountInput.setCustomValidity('');
    }
}

targetAmountInput.addEventListener('input', validateAmounts);
currentAmountInput.addEventListener('input', validateAmounts);

async function initializeApp() {
    try {
        await fetchUserId(); // Wait for userId to be fetched
        await fetchGoalProgress(); // Then fetch goals
        // await Promise.all([fetchGoalProgress(), fetchTransaction()]); // nếu muốn fetch 2 cái khác song song
    } catch (err) {
        error = 'Failed to initialize app: ' + err.message;
        console.error(error);
        renderError();
    }
}

initializeApp();
