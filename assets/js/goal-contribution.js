async function addGoalContribution(contribution) {
    try {
<<<<<<< HEAD
        const response = await apiRequest(`${API_BASE_URL}/contributions`, {
=======
        const response = await apiRequest(`${API_BASE_URL}/contributions/${contribution.goalId}`, {
>>>>>>> origin/update_profile
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