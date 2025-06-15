async function addGoalContribution(contribution) {
    try {
        const response = await apiRequest(`${API_BASE_URL}/contributions/${contribution.goalId}`, {
            method: 'POST',
            body: JSON.stringify(contribution)
        });

        const data = await response.json();

        if (data.code === 1000) {
            showResult(data.message, "success");
            return true;
        } else throw new Error("Error adding contribution");
    } catch (error) {
        showResult(error, "error");
        return false;
    }
}