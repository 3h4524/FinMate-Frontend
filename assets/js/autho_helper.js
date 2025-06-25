let cachedToken = null;
let cachedUser = null;

const getToken = () => {
    if (cachedToken === null) {
        cachedToken = localStorage.getItem('token');
    }
    return cachedToken;
};

const getCurrentUser = () => {
    if (cachedUser !== null) {
        return cachedUser;
    }

    const token = getToken();
    console.log("gettoken", token);
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        cachedUser = {
            userId: payload.userId || payload.sub,
            username: payload.username || payload.username,
            role: payload.scope,
            exp: payload.exp
        };
        return cachedUser;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
};

const clearCache = () => {
    cachedToken = null;
    cachedUser = null;
};

const redirectToLogin = () => {
    localStorage.removeItem('token');
    clearCache(); // Xóa cache khi đăng xuất
    window.location.href = '../login';
};

const isTokenExpired = () => {
    const user = getCurrentUser();
    if (!user) return true;
    return Date.now() >= user.exp * 1000;
};

const checkAuth = () => {
    if (!getToken() || isTokenExpired()) {
        redirectToLogin();
        return false;
    }
    return true;
};

const getAuthHeaders = () => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
