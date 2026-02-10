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
        throw new Error(error.detail || error.message || "Request failed")
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

export async function registerUser(username, password, display_name = undefined) {
    return apiClient("/register", () => null, {
        method: "POST",
        body: JSON.stringify({
            username, password, display_name
        })
    })
}

export async function createRoom(title) {
    return apiClient(`/create-room?title=${encodeURIComponent(title)}`, () => (sessionStorage.getItem("token")), {
        method: "POST",
    })
}

export async function joinRoom(room_code) {
    return apiClient("/join-room", () => (sessionStorage.getItem("token")), {
        method: "POST",
        body: JSON.stringify({
            room_code
        })
    })
}

export async function getAllRooms() {
    return apiClient("/rooms/user", () => sessionStorage.getItem("token"), {
        method: "GET",
    })
}

export async function getAllRequestRooms() {
    return apiClient("/rooms/pending", () => sessionStorage.getItem("token"), {
        method: "GET",
    })
}

// For the room owner
export async function getAllPendingRequests() {
    return apiClient("/pending-requests", () => sessionStorage.getItem("token"), {
        method: "GET",
    })
}