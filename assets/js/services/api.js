// API service for handling all API calls
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Helper function to validate token
function validateToken(token) {
    if (!token) return false;
    try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const isValid = tokenData.exp * 1000 > Date.now();
        if (!isValid) {
            console.log('Token expired');
<<<<<<< HEAD
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
=======
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
>>>>>>> origin/update_profile
        }
        return isValid;
    } catch (error) {
        console.error('Token validation error:', error);
<<<<<<< HEAD
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
=======
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userData');
>>>>>>> origin/update_profile
        return false;
    }
}

// Helper function to get valid token
function getValidToken() {
<<<<<<< HEAD
    const token = localStorage.getItem('token');
=======
    const token = sessionStorage.getItem('token');
>>>>>>> origin/update_profile
    if (!token) {
        console.log('No token found');
        return null;
    }
    if (!validateToken(token)) {
        console.log('Token invalid or expired');
        return null;
    }
    return token;
}

// Helper function to handle API responses
async function handleResponse(response) {
    const data = await response.json();
    
    if (response.status === 401) {
        console.log('Unauthorized response');
<<<<<<< HEAD
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/pages/login/index.html';
=======
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userData');
        // Chỉ redirect về login nếu KHÔNG phải trang register, login, forgot-password, reset-password, verify-email
        const path = window.location.pathname;
        const isAuthPage = /\/pages\/(login|register|forgot-password|reset-password|verify-email)(\/|\/index\.html)?$/.test(path);
        if (!isAuthPage) {
            window.location.href = '/pages/login/';
        }
>>>>>>> origin/update_profile
        return null;
    }
    
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    
    return data.result;
}

const apiService = {
    // Authentication endpoints
    async login(credentials) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            
            // Kiểm tra email chưa xác thực trước
            if (data.code === 1003 || data.message === 'Email not verified') {
                return {
                    requiresVerification: true,
                    email: credentials.email
                };
            }

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.result || !data.result.token) {
                throw new Error('Invalid token received from server');
            }

            // Store token and user data
<<<<<<< HEAD
            localStorage.setItem('token', data.result.token);
            localStorage.setItem('userData', JSON.stringify(data.result));
=======
            sessionStorage.setItem('token', data.result.token);
            sessionStorage.setItem('loginTimestamp', Date.now().toString());

            // Store user data from response
            const userData = {
                email: data.result.email,
                name: data.result.name,
                role: data.result.role
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));
            console.log('Stored user data:', userData);
>>>>>>> origin/update_profile

            return data.result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async verifyToken() {
        const token = getValidToken();
        if (!token) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                console.log('Token verification failed:', data.message);
<<<<<<< HEAD
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
=======
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('userData');
>>>>>>> origin/update_profile
                return false;
            }
            return true;
        } catch (error) {
            console.error('Token verification error:', error);
<<<<<<< HEAD
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
=======
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
>>>>>>> origin/update_profile
            return false;
        }
    },

    async logout() {
        try {
            const token = getValidToken();
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
<<<<<<< HEAD
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = '/pages/login/index.html';
=======
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
            window.location.href = '/pages/login/';
>>>>>>> origin/update_profile
        }
    },

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    async processGoogleLogin(idToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: idToken }),
                credentials: 'include'
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Google login failed');
            }

            if (data.code !== 1000 || !data.result) {
                throw new Error(data.message || 'Google login failed');
            }

            return data;
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    },

    async verifyEmail(email, code) {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code }),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    async forgotPassword(email) {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    async resetPassword(token, newPassword) {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword }),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    // User profile endpoints
    async getUserProfile() {
        const token = getValidToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Get user profile error:', error);
            throw error;
        }
    },

    async updateUserProfile(userData) {
<<<<<<< HEAD
        const token = localStorage.getItem('token');
=======
        const token = sessionStorage.getItem('token');
>>>>>>> origin/update_profile
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    async changePassword(passwordData) {
        const token = getValidToken();
        if (!token) throw new Error('Unauthorized');

        const response = await fetch(`${API_BASE_URL}/users/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordData)
        });
        await handleResponse(response);
        return true;
    },

    // Transaction endpoints
    async getTransactions() {
        const token = getValidToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return handleResponse(response);
        } catch (error) {
            console.error('Get transactions error:', error);
            throw error;
        }
<<<<<<< HEAD
    },

    async createTransaction(transactionData) {
        const token = getValidToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    async updateTransaction(id, transactionData) {
        const token = getValidToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData),
            credentials: 'include'
        });
        return handleResponse(response);
    },

    async deleteTransaction(id) {
        const token = getValidToken();
        if (!token) return null;

        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        return handleResponse(response);
    }
};

export default apiService; 
=======
    }
};

export default apiService;
>>>>>>> origin/update_profile
