const API_URL = "http://127.0.0.1:8000"

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token")

  if (!refreshToken) {
    return null
  }

  try {
    const response = await fetch(`${API_URL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.access) {
      return null
    }

    localStorage.setItem("access_token", data.access)

    return data.access
  } catch {
    return null
  }
}

function redirectToLogin() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")

  window.location.href = "/login"
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let accessToken = localStorage.getItem("access_token")

  const buildHeaders = (token: string | null) => {
    const headers = new Headers(options.headers)

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return headers
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(accessToken),
  })

  if (response.status === 401) {
    accessToken = await refreshAccessToken()

    if (!accessToken) {
      redirectToLogin()
      return response
    }

    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: buildHeaders(accessToken),
    })
  }

  return response
}