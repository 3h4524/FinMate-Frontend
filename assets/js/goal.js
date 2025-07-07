// State management
let goals = [];
let error = '';

// DOM elements
const newGoalButton = document.getElementById('newGoalButton');
const errorMessage = document.getElementById('errorMessage');
const errorText = errorMessage.querySelector('span');
const noGoalsView = document.getElementById('noGoalsView');
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

let user;

function renderError() {
    errorMessage.classList.remove('hidden');
    errorText.textContent = error;
}

// API interactions
async function fetchGoalProgress() {
    console.log('fetching Goals Progress...');
    try {

        const response = await apiRequest(`${API_BASE_URL}/goal_tracking/list`, {
            headers: { 'userId': user.userId.toString() }
        });
        const data = await response.json();

        console.log("Da vao load goal progress");

        if (data.code === 1000) {
            goals = data.result.content;
            console.log("fetch goals", goals);
            renderGoals();
        } else {
            throw Error("Failed to fetch goals progress");
        }
    } catch (err) {
        error = 'Failed to fetch goals';
        renderError();
    }
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
                    <svg class="w-4 h-4 mr-1 md:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    <span class="md:inline hidden">Cancel</span>
                </button>` : `
                <button disabled class="flex items-center text-red-600 opacity-50 font-medium cursor-not-allowed">
                    <svg class="w-4 h-4 mr-1 md:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span class="md:inline hidden">Cancel</span>
                </button>`}
        </div>

        <div class="flex flex-wrap items-center justify-between mb-4 w-full">
            <div>
                ${goal.status === 'IN_PROGRESS' ? `
                    <button onclick="markAsComplete('${goal.goalId}')" class="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-semibold px-3 py-1.5 rounded-md hover:bg-green-50 transition-all duration-200">
                        <svg class="w-4 h-4 mr-1.5 md:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="md:inline hidden">Mark as Complete</span>
                    </button>` : `
                    <button disabled class="inline-flex items-center text-sm text-green-600 opacity-50 font-semibold px-3 py-1.5 rounded-md cursor-not-allowed">
                        <svg class="w-4 h-4 mr-1.5 md:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span class="md:inline hidden">Mark as Complete</span>
                    </button>`}
            </div>
            
            <div class="flex items-center space-x-4">
                <div class="px-3 py-1 rounded-full text-xs font-medium truncate ${getStatusColor(goal.status)}">${goal.status}</div>
                <button onclick="window.location.href = '../goal/goal_detail/?goalId=${goal.goalId}';" class="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    <svg class="w-4 h-4 mr-1 md:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    <span class="md:inline hidden">View Details</span>
                </button>
            </div>
        </div>
        <div class="mb-4">
            <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span class="truncate">${formatCurrency(goal.amount)} of ${formatCurrency(goal.targetAmount)}</span>
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
            <div class="flex items-center truncate">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span class="md:inline hidden">Progress Date: ${formatDate_ddMMyyyy(goal.progressDate)}</span>
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
    console.log("trying to cancel Goal: ", goalId);
    try {

        const response = await apiRequest(`${API_BASE_URL}/goal/cancel/${goalId}`, {
            method: 'PATCH'
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


async function markAsComplete(goalId) {
    console.log("Trying to mark as completed goal: ", goalId);

    try {
        const response = await apiRequest(`${API_BASE_URL}/goal/${goalId}`);
        const data = await response.json();

        if (data.code === 1000) {
            const goalResponse = data.result;
            const contribution = {
                goalId: goalId,
                amount: remainingAmount = goalResponse.targetAmount - goalResponse.currentAmount,
                note: 'Mark As Completed',
                contributionDate: new Date()
            };
            if (await addGoalContribution(contribution)) {
                showResult("Mark as completed successfully", 'success');
                await fetchGoalProgress();
            } else {
                throw new Error("Fail to mark as completed");
            }
        } else {
            throw new Error("Fail to mark as completed");
        }
    } catch (err) {
        showResult(err, 'error');
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
        userId: user.userId,
        userId: user.userId,
        description: formData.get('descriptionModal'),
        targetAmount: parseFloat(formData.get('targetAmountModal')),
        currentAmount: parseFloat(formData.get('currentAmountModal')),
        startDate: formData.get('startDateModal'),
        deadline: formData.get('deadlineModal'),
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
        const response = await apiRequest(`${API_BASE_URL}/goal`, {
            method: 'POST',
            body: JSON.stringify(goalData)
        });

        console.log("Xong fetch, ", response);
        const data = await response.json();
        console.log("Xong chuyen data thanh json: ", data);

        if (data.code === 1000) {
            showResult(data.message, "success");
            closeModal();
            newGoalModal.classList.add('hidden');
            newGoalForm.reset();
            hideError();
            await fetchGoalProgress();
        } else {
            throw Error(data.message);
        }

    } catch (err) {
        showResult(err.message, 'error');
        closeModal();
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

async function initializeUI() {
    try {
        console.log('Initializing goals page...');

        // Load sidebar and header first
        if (typeof loadSideBarSimple === 'function') {
            loadSideBarSimple();
        } else {
            console.error('loadSideBarSimple function not found');
        }

        if (typeof loadHeaderSimple === 'function') {
            loadHeaderSimple();
        } else {
            console.error('loadHeaderSimple function not found');
        }

        // Show main content after loading UI components
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.style.display = 'block';
        }

        // Load data
        await fetchGoalProgress();

        console.log('Goals page initialized successfully');
    } catch (err) {
        error = 'Failed to initialize app: ' + err.message;
        console.error(error);
        renderError();
    }
}

// Initialize
window.addEventListener('load', () => {
    if (checkAuth()) {
        console.log("hjaha");
        user = getCurrentUser()
        console.log("xem: ", user);
        initializeUI();
    }
});


