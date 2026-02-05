const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// Send requests to the backend with JWT Athentication
export async function apiClient(endpoint, getToken, options = {}) {
    const token = await getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    )

    if (!response.ok) {
        const error = await response.json().catch(() => {});
        throw new Error(error.detail || "Request failed")
    }

    // Check if there's no content
    if (response.status == 204) {
        return null;
    }

    return response.json()
}

export async function loginUser(username, password) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    return apiClient("/auth/login", () => null, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
    });
}