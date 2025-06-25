// State management
let goalProgressResponse = null;
let chartType = 'line';
let error = '';
let progressChart;


let initialFormValues = {};


const NOTIFICATION_TYPES = {
    NOT_MET: {
        bgClass: 'bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400',
        iconClass: 'text-orange-500',
        titleClass: 'text-orange-800',
        messageClass: 'text-orange-700',
        badgeClass: 'text-orange-600 bg-orange-100',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-5.65-5.65l9.9 9.9m0-9.9l-9.9 9.9M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        showActions: true
    },
    ON_TRACK: {
        bgClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400',
        iconClass: 'text-blue-500',
        titleClass: 'text-blue-800',
        messageClass: 'text-blue-700',
        badgeClass: 'text-blue-600 bg-blue-100',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        showActions: false
    },
    AHEAD: {
        bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400',
        iconClass: 'text-green-500',
        titleClass: 'text-green-800',
        messageClass: 'text-green-700',
        badgeClass: 'text-green-600 bg-green-100',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        showActions: false
    },
    FAILED: {
        bgClass: 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-400',
        iconClass: 'text-red-500',
        titleClass: 'text-red-800',
        messageClass: 'text-red-700',
        badgeClass: 'text-red-600 bg-red-100',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8.5l3 3m0-3l-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        showActions: true
    },

    COMPLETED: {
        bgClass: 'bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400',
        iconClass: 'text-emerald-500',
        titleClass: 'text-emerald-800',
        messageClass: 'text-emerald-700',
        badgeClass: 'text-emerald-600 bg-emerald-100',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
        showActions: false
    },
    NOT_STARTED: {
        bgClass: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400',
        iconClass: 'text-yellow-500',
        titleClass: 'text-yellow-800',
        messageClass: 'text-yellow-700',
        badgeClass: 'text-yellow-600 bg-yellow-100',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        showActions: false
    }
};

// DOM elements
const pageTitle = document.getElementById('pageTitle');
const errorMessage = document.getElementById('errorMessage');
const errorText = errorMessage.querySelector('span');
const progressChartCanvas = document.getElementById('progressChart');
const lineChartButton = document.getElementById('lineChartButton');
const barChartButton = document.getElementById('barChartButton');

const addContributionBtn = document.getElementById('addContributionBtn');
const modifyGoalBtn = document.getElementById('modifyGoalBtn');

const addContributionButton = document.getElementById('addContributionButton');
const addContributionModal = document.getElementById('addContributionModal');
const closeModalButton = document.getElementById('closeModalButton');
const cancelModalButton = document.getElementById('cancelModalButton');
const contributionForm = document.getElementById('contributionForm');
const formError = document.getElementById('formError');


// DOM elements for edit modal
const editGoalModal = document.getElementById('editGoalModal');
const closeEditModalButton = document.getElementById('closeEditModalButton');
const cancelEditModalButton = document.getElementById('cancelEditModalButton');
const editGoalForm = document.getElementById('editGoalForm');
const editFormError = document.getElementById('editFormError');
const editErrorMessageModal = document.getElementById('editErrorMessageModal');


const cancelButton = document.getElementById('cancelButton');
const editButton = document.getElementById('editButton');

// API configuration
const API_BASE_URL = 'http://localhost:8080';

const urlParams = new URLSearchParams(window.location.search);
const goalId = urlParams.get('goalId');



function renderError() {
    errorMessage.classList.remove('hidden');
    errorText.textContent = error;
}

// API interactions
async function fetchGoalDetails() {
    console.log("fetchGoalDetails: " + goalId);
    try {
        const response = await apiRequest(`${API_BASE_URL}/goal_tracking/${goalId}`);
        if (!response.ok) throw new Error('Failed to fetch goal details');
        const data = await response.json();
        goalProgressResponse = data.result;
        renderGoalDetails();
        renderGoalMessage();
    } catch (err) {
        error = 'Failed to fetch goal details or contributions';
        renderError();
    }
}

async function fetchGoalProgressData() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/goal_tracking/list_progress/${goalId}`);
        if (!response.ok) throw new Error('Failed to fetch goal progress data');
        const data = await response.json();
        return data.result.content;
    } catch (error) {
        console.error('Error fetching goal progress data:', error);
        return null;
    }
}

async function fetchGoalContributionData(goalId) {
    try {
        const contributionsResponse = await apiRequest(`${API_BASE_URL}/contributions/${goalId}`);
        if (!contributionsResponse.ok) throw new Error('Failed to fetch goal contributions');
        const contributionsData = await contributionsResponse.json();
        return contributionsData.result.content;
    } catch (error) {
        console.error('Error fetching goal contribution data:', error);
        return null;
    }
}

// Render goal details
function renderGoalDetails() {
    pageTitle.textContent = `${goalProgressResponse.name} Progress`;
    document.getElementById('goalName').textContent = goalProgressResponse.name;


    if (goalProgressResponse.status === "IN_PROGRESS") {
        cancelButton.classList.remove('hidden');
        addContributionButton.classList.remove('hidden');
        editButton.classList.remove('hidden');
    } else {
        cancelButton.classList.add('hidden');
        addContributionButton.classList.add('hidden');
        editButton.classList.add('hidden');
    }

    document.getElementById('goalStatus').textContent = goalProgressResponse.status;
    document.getElementById('goalStatus').className = `px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(goalProgressResponse.status)}`;

    document.getElementById('currentAmount').textContent = formatCurrency(goalProgressResponse.amount);
    document.getElementById('targetAmount').textContent = formatCurrency(goalProgressResponse.targetAmount);
    document.getElementById('progressPercentage').textContent = `${goalProgressResponse.percentage}%`;
    document.getElementById('timeRemaining').textContent = goalProgressResponse.timeRemaining || 'N/A';
    document.getElementById('progressText').textContent = `${goalProgressResponse.percentage}%`;
    document.getElementById('progressBar').style.width = `${goalProgressResponse.percentage}%`;
    document.getElementById('progressBar').className = `h-4 rounded-full transition-all duration-300 ${getProgressColor(goalProgressResponse.percentage)}`;

    if (chartType === 'bar') {
        barChartButton.classList.add('bg-green-100', 'text-teal-600');
        lineChartButton.classList.remove('bg-green-100', 'text-teal-600');
    } else {
        lineChartButton.classList.add('bg-green-100', 'text-teal-600');
        barChartButton.classList.remove('bg-green-100', 'text-teal-600');
    }

    renderChart();
    renderContributions();
}

// Render chart
async function renderChart() {
    console.log("start render chart");
    if (!goalProgressResponse) return;

    const goalProgressList = await fetchGoalProgressData();
    if (!goalProgressList) return;

    const labels = goalProgressList.map(progress => formatDate_ddMMyyyy(progress.progressDate));
    const values = goalProgressList.map(progress => progress.amount);

    if (progressChart) progressChart.destroy();
    const ctx = progressChartCanvas.getContext('2d');
    progressChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount',
                data: values,
                backgroundColor: chartType === 'bar' ? '#0d9488' : 'transparent',
                borderColor: '#0d9488',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    console.log("end render chart");
}

// Render contributions
async function renderContributions() {
    console.log("start renderContributions");

    if (!goalProgressResponse) return;

    const goalContributions = await fetchGoalContributionData(goalProgressResponse.goalId) || [];
    if (!goalContributions) return;

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const contributionsList = document.getElementById('contributionsList');

    // Validate startDate <= endDate
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        contributionsList.innerHTML = `
            <div class="py-8 text-center text-red-600">
                <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="mt-2 font-medium">Error: Start date cannot be later than end date.</p>
            </div>
        `;
        return;
    }

    const filteredContributions = goalContributions
        .filter(contribution => {
            const contributionDate = new Date(contribution.contributionDate);
            const startDateValue = startDate ? new Date(startDate) : null;
            const endDateValue = endDate ? new Date(endDate) : null;

            // Ensure contribution date is within the range (inclusive)
            return (!startDateValue || contributionDate >= startDateValue) &&
                (!endDateValue || contributionDate <= endDateValue);
        })
        .sort((a, b) => new Date(b.contributionDate) - new Date(a.contributionDate)); // Sort by date descending

    contributionsList.innerHTML = filteredContributions.length > 0 ? filteredContributions.map(contribution => `
        <div class="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg px-4">
            <div>
                <p class="font-medium text-gray-900">${contribution.note || 'Contribution'}</p>
                <p class="text-sm text-gray-500">${formatDate_ddMMyyyy(contribution.contributionDate)}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-teal-600">
                    +${formatCurrency(contribution.amount)}
                </p>
            </div>
        </div>
    `).join('') : `
        <div class="py-8 text-center text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="mt-2">No contributions found for the selected date range.</p>
        </div>
    `;
    console.log("end renderContributions");
}

// Render Goal tracking message
async function renderGoalMessage() {

    console.log("Vao render message");

    try {
        const response = await apiRequest(`${API_BASE_URL}/goal/${goalId}`);

        if (!response.ok) throw new Error("Cannot track goal to alert.");

        const data = await response.json();
        const goal = data.result;

        console.log(goal.status);

        if (goal.status === "IN_PROGRESS") {
            // Validate target and current amounts
            if (goal.targetAmount == null || goal.currentAmount == null) {
                console.warn(`Goal ${goal.id} has null targetAmount or currentAmount`);
                return;
            }

            // Parse dates
            const startDate = new Date(goal.startDate);
            const deadlineDate = new Date(goal.deadline);
            const today = new Date(); // Assuming you want to compare with today

            // Calculate total days of goal duration
            const millisecondsPerDay = 1000 * 60 * 60 * 24;
            const daysEstimate = Math.floor((deadlineDate - startDate) / millisecondsPerDay) + 1;

            if (daysEstimate <= 0) {
                console.warn(`Goal ${goal.id} has invalid date range (startDate: ${startDate}, deadline: ${deadlineDate})`);
                return;
            }

            // Calculate average amount per day
            const averageAmountPerDay = goal.targetAmount / daysEstimate;

            // Calculate how many days have passed since start
            const daysPassed = Math.floor((today - startDate) / millisecondsPerDay) + 1;

            if (daysPassed < 0) {
                console.warn(`Goal ${goal.id} has startDate after today: ${startDate}`);

                showNotStartedNotification();

                return;
            }

            // Calculate expected amount by today
            const expectedAmountSoFar = averageAmountPerDay * daysPassed;

            // Compare and show notifications
            if (goal.currentAmount < expectedAmountSoFar) {
                showNotMetExpectationMessage(expectedAmountSoFar - goal.currentAmount, expectedAmountSoFar);
            } else if (goal.currentAmount === expectedAmountSoFar) {
                showOnTrackNotification();
            } else {
                showAheadNotification(goal.currentAmount - expectedAmountSoFar);
            }
        } else if (goal.status === "COMPLETED") {
            showCompletedNotification();
        } else if (goal.status === "FAILED") {
            showFailedNotification();

            addContributionBtn.disabled = true;

            modifyGoalBtn.classList.remove('text-orange-600', 'hover:text-orange-700');
            modifyGoalBtn.classList.add(
                'bg-orange-500',
                'text-white',
                'px-4',
                'py-2',
                'rounded-lg',
                'font-bold',
                'shadow-md',
                'hover:bg-orange-600',
                'transition-colors'
            );
        }


    } catch (err) {
        console.log(err);
    }
}


// function

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

async function cancelGoal(goalId) {
    console.log("trying to cancel Goal", goalId);
    try {
        const response = await apiRequest(`${API_BASE_URL}/goal/cancel/${goalId}`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error('Failed to cancel goal')
        }

        window.location.href = "goal.html";
    } catch (err) {
        showResult(err, "warning");
    }
}


function showNotMetExpectationMessage(neededAmount, expectedAmount) {
    updateProgressNotification(
        'NOT_MET',
        'Behind Schedule',
        `You need <span class="font-bold">${formatCurrency(neededAmount)}</span> to stay on track. Expected amount by today: <span class="font-semibold">${formatCurrency(expectedAmount)}</span>`,
    );
}


function showOnTrackNotification() {
    updateProgressNotification(
        'ON_TRACK',
        'On Track',
        'Great job! You\'re right on schedule. Keep up the momentum to reach your goal.',
    );
}

function showAheadNotification(aheadAmount) {
    updateProgressNotification(
        'AHEAD',
        'Ahead of Schedule! 🎉',
        `Fantastic! You're <span class="font-bold">${formatCurrency(aheadAmount)}</span> ahead of your target so far. Keep up the great work!`
    );
}

function showCompletedNotification() {
    updateProgressNotification(
        'COMPLETED',
        'The goal has achieved! 🎉',
        `Congratulations! You have accomplished this goal.`
    );
}

function showFailedNotification() {
    updateProgressNotification(
        'FAILED',
        'Goal Not Achieved ❌',
        'You didn’t meet your goal this time. Keep pushing!'
    );
}

function showNotStartedNotification() {
    updateProgressNotification(
        'NOT_STARTED',
        'Goal Not Started ⏳',
        'Your goal hasn’t started yet. Get ready for the kickoff!'
    );
}


function updateProgressNotification(type, title, message) {
    const card = document.getElementById('progressNotificationCard');
    const content = document.getElementById('notificationContent');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    const actions = document.getElementById('notificationActions');

    const config = NOTIFICATION_TYPES[type];
    if (!config) return;

    // Update styles and content
    content.className = 'rounded-xl p-5 shadow-sm transition-all duration-300 ' + config.bgClass;
    icon.className = 'w-6 h-6 ' + config.iconClass;
    icon.innerHTML = config.icon;

    titleEl.className = 'text-lg font-semibold ' + config.titleClass;
    titleEl.textContent = title;

    messageEl.className = 'mt-1 ' + config.messageClass;
    messageEl.innerHTML = message;

    // Show/hide action buttons
    if (config.showActions) {
        actions.classList.remove('hidden');
    } else {
        actions.classList.add('hidden');
    }

    // Show and animate
    card.classList.remove('notification-hidden');
    card.classList.remove('notification-slide-in');
    setTimeout(() => card.classList.add('notification-slide-in'), 10);
}

// Modal handling
function openModalAddContribution() {
    addContributionModal.classList.remove('hidden');
    document.getElementById('contributionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionNote').value = '';
    formError.classList.add('hidden');
}

function closeModalAddContribution() {
    addContributionModal.classList.add('hidden');
    formError.classList.add('hidden');
}


// Open edit modal and populate fields
async function openEditModal() {
    editGoalModal.classList.remove('hidden');
    try {
        const response = await apiRequest(`${API_BASE_URL}/goal/${goalId}`);
        const data = await response.json();

        if (data.code === 1000) {
            const goalResponse = data.result;

            document.getElementById('editGoalName').value = goalResponse.name;
            document.getElementById('editTargetAmount').value = goalResponse.targetAmount.toFixed(2);
            document.getElementById('editDeadline').value = goalResponse.deadline;
            document.getElementById('editNotificationEnabled').checked = goalResponse.notificationEnabled || false;
            editFormError.classList.add('hidden');

            // Store initial form values
            initialFormValues = {
                name: goalResponse.name,
                targetAmount: goalResponse.targetAmount.toFixed(2),
                deadline: goalResponse.deadline,
                notificationEnabled: goalResponse.notificationEnabled || false
            };

            updateSaveButtonState();

        } else {
            throw new Error("Fail to mark as completed");
        }
    } catch (err) {
        showResult(err, 'error');
    }
}

// Close edit modal
function closeEditModal() {
    editGoalModal.classList.add('hidden');
    editFormError.classList.add('hidden');
}

// Check if form values have changed
function hasFormChanged() {
    const currentValues = {
        name: document.getElementById('editGoalName').value.trim(),
        targetAmount: document.getElementById('editTargetAmount').value,
        deadline: document.getElementById('editDeadline').value,
        notificationEnabled: document.getElementById('editNotificationEnabled').checked
    };

    return (
        currentValues.name !== initialFormValues.name ||
        currentValues.targetAmount !== initialFormValues.targetAmount ||
        currentValues.deadline !== initialFormValues.deadline ||
        currentValues.notificationEnabled !== initialFormValues.notificationEnabled
    );
}

// Update Save button state
function updateSaveButtonState() {
    if (hasFormChanged()) {
        saveEditButton.disabled = false;
        saveEditButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        saveEditButton.classList.add('bg-gradient-to-r', 'from-teal-600', 'to-teal-700', 'hover:from-teal-700', 'hover:to-teal-800');
    } else {
        saveEditButton.disabled = true;
        saveEditButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        saveEditButton.classList.remove('bg-gradient-to-r', 'from-teal-600', 'to-teal-700', 'hover:from-teal-700', 'hover:to-teal-800');
    }
}

// Event listeners for modal and buttons
addContributionButton.addEventListener('click', openModalAddContribution);
closeModalButton.addEventListener('click', closeModalAddContribution);
cancelModalButton.addEventListener('click', closeModalAddContribution);

editButton.addEventListener('click', openEditModal);
closeEditModalButton.addEventListener('click', closeEditModal);
cancelEditModalButton.addEventListener('click', closeEditModal);

// Add input event listeners to update Save button state
document.getElementById('editGoalName').addEventListener('input', updateSaveButtonState);
document.getElementById('editTargetAmount').addEventListener('input', updateSaveButtonState);
document.getElementById('editDeadline').addEventListener('input', updateSaveButtonState);
document.getElementById('editNotificationEnabled').addEventListener('change', updateSaveButtonState);

lineChartButton.addEventListener('click', () => {
    chartType = 'line';
    lineChartButton.classList.add('bg-green-100', 'text-teal-600');
    barChartButton.classList.remove('bg-green-100', 'text-teal-600');
    renderChart();
});

barChartButton.addEventListener('click', () => {
    chartType = 'bar';
    barChartButton.classList.add('bg-green-100', 'text-teal-600');
    lineChartButton.classList.remove('bg-green-100', 'text-teal-600');
    renderChart();
});


addContributionBtn.addEventListener('click', openModalAddContribution);
modifyGoalBtn.addEventListener('click', openEditModal);


document.getElementById('startDate').addEventListener('change', renderContributions);
document.getElementById('endDate').addEventListener('change', renderContributions);
document.getElementById('refreshGoalContributionsButton').addEventListener('click', renderContributions);
document.getElementById('clearFiltersButton').addEventListener('click', () => {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    renderContributions();
});

cancelButton.addEventListener('click', () => {
    confirmCancelGoal(goalId)
});

// Form submission
contributionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const note = document.getElementById('contributionNote').value;
    const contributionDate = document.getElementById('contributionDate').value;

    // Validate inputs
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow contributions for today
    if (amount <= 0) {
        formError.classList.remove('hidden');
        formError.textContent = 'Amount must be greater than 0.';
        return;
    }
    if (new Date(contributionDate) > today) {
        formError.classList.remove('hidden');
        formError.textContent = 'Contribution date cannot be in the future.';
        return;
    }

    const contribution = {
        goalId: goalProgressResponse.goalId,
        amount,
        note: note || null,
        contributionDate
    };


    if (await addGoalContribution(contribution)) {
        closeModalAddContribution();
        await fetchGoalDetails();
    }
});

editGoalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!hasFormChanged()) {
        closeEditModal();
        return;
    }

    const name = document.getElementById('editGoalName').value.trim();
    const targetAmount = parseFloat(document.getElementById('editTargetAmount').value);
    const deadline = document.getElementById('editDeadline').value;
    const notificationEnabled = document.getElementById('editNotificationEnabled').checked;

    // Validate inputs
    if (!name) {
        editFormError.classList.remove('hidden');
        editErrorMessageModal.textContent = 'Goal name is required.';
        return;
    }
    if (targetAmount <= 0) {
        editFormError.classList.remove('hidden');
        editErrorMessageModal.textContent = 'Target amount must be greater than 0.';
        return;
    }
    if (!deadline) {
        editFormError.classList.remove('hidden');
        editErrorMessageModal.textContent = 'Deadline is required.';
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today) {
        editFormError.classList.remove('hidden');
        editErrorMessageModal.textContent = 'Deadline cannot be in the past.';
        return;
    }

    const updatedGoal = {
        name,
        targetAmount,
        deadline,
        notificationEnabled
    };

    try {
        const response = await apiRequest(`${API_BASE_URL}/goal/${goalId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedGoal)
        });
        if (!response.ok) throw new Error('Failed to update goal');
        showResult("Goal updated successfully!", "success");
        closeEditModal();
        await fetchGoalDetails();
    } catch (error) {
        editFormError.classList.remove('hidden');
        editErrorMessageModal.textContent = 'Failed to update goal. Please try again.';
        showResult('Error updating goal:', "error")
    }
});

async function initiateUI() {
    await fetchGoalDetails();
    await loadSideBar(getCurrentUser());
}

window.addEventListener('load', () => {
    if (checkAuth()) {
        initiateUI();
    }
});
