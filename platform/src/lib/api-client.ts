/**
 * LMS Platform API Client
 * Unified HTTP client for Super Admin and Library Admin communication.
 */

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  meta?: Record<string, any>
  message?: string
  error?: string
  field_errors?: Record<string, string[]>
}

export class ApiError extends Error {
  code: string
  status: number
  fieldErrors?: Record<string, string[]>

  constructor(message: string, status: number = 500, code: string = "INTERNAL_ERROR", fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return (
    localStorage.getItem("platform_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    null
  )
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("platform_token", token)
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("platform_token")
    localStorage.removeItem("access_token")
    localStorage.removeItem("token")
  }
}

export async function refreshPlatformToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const refreshToken =
    localStorage.getItem("platform_refresh_token") ||
    localStorage.getItem("refresh_token")

  if (refreshToken) {
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL.replace(/\/$/, "")}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (res.ok) {
        const raw = await res.json()
        const payload = raw?.data || raw
        const access = payload?.access || payload?.access_token
        const newRefresh = payload?.refresh || payload?.refresh_token
        if (access) {
          setToken(access)
          if (newRefresh) {
            localStorage.setItem("platform_refresh_token", newRefresh)
          }
          return access
        }
      }
    } catch (e) {
      console.warn("Refresh token attempt failed:", e)
    }
  }
  return null
}

async function ensurePlatformToken(force = false): Promise<string | null> {
  if (!force) {
    const existing = getToken()
    if (existing) return existing
  }
  if (typeof window === "undefined") return null

  // Try refreshing with refresh_token first
  const refreshed = await refreshPlatformToken()
  if (refreshed) return refreshed

  // If refresh failed or unavailable, re-authenticate with superadmin credentials
  try {
    const res = await fetch(`${DEFAULT_API_BASE_URL.replace(/\/$/, "")}/auth/sign-in/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "superadmin@gmail.com",
        password: "AdminPass123!",
      }),
    })
    if (res.ok) {
      const raw = await res.json()
      const data = raw?.data || raw
      const access = data?.access || data?.tokens?.access_token || data?.access_token
      const refresh = data?.refresh || data?.tokens?.refresh_token || data?.refresh_token
      if (access) {
        setToken(access)
        if (refresh) localStorage.setItem("platform_refresh_token", refresh)
        return access
      }
    }
  } catch (err) {
    console.warn("Could not auto-acquire platform session token:", err)
  }
  return null
}

interface RequestOptions extends RequestInit {
  params?: Record<string, any>
  branchId?: string
  idempotencyKey?: string
  lang?: string
  _retry?: boolean
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, branchId, idempotencyKey, lang = "en", ...customConfig } = options

  const cleanEndpoint = endpoint.replace(/^\//, "")
  const base = DEFAULT_API_BASE_URL.replace(/\/$/, "")

  let url: string
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    url = endpoint
  } else if (cleanEndpoint.startsWith("api/v1/")) {
    const root = base.replace(/\/api\/v1$/, "").replace(/\/v1$/, "")
    url = `${root}/${cleanEndpoint}`
  } else if (cleanEndpoint.startsWith("v1/")) {
    const root = base.replace(/\/api\/v1$/, "").replace(/\/v1$/, "")
    url = `${root}/${cleanEndpoint}`
  } else {
    // If cleanEndpoint starts with "platform/", prefer "/v1/platform/"
    if (cleanEndpoint.startsWith("platform/")) {
      const root = base.replace(/\/api\/v1$/, "").replace(/\/v1$/, "")
      url = `${root}/v1/${cleanEndpoint}`
    } else {
      url = `${base}/${cleanEndpoint}`
    }
  }

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString
    }
  }

  let token = getToken()
  if (!token && !endpoint.includes("/auth/")) {
    token = await ensurePlatformToken()
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Accept-Language": lang,
    ...(customConfig.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (branchId) {
    headers["X-Branch-Id"] = branchId
  }

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  }

  let response: Response
  try {
    response = await fetch(url, config)
  } catch (err: any) {
    throw new ApiError(
      err?.message || "Network connection to backend server failed. Please ensure the backend is running.",
      0,
      "NETWORK_ERROR"
    )
  }

  if (response.status === 204) {
    return {} as T
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    // Transparent token refresh on 401 Unauthorized
    if (response.status === 401 && !options._retry && !endpoint.includes("/auth/")) {
      clearToken()
      const newToken = await ensurePlatformToken(true)
      if (newToken) {
        return request<T>(endpoint, {
          ...options,
          _retry: true,
        })
      }
    }

    const errorMsg =
      data?.error?.message ||
      data?.message ||
      data?.detail ||
      data?.error ||
      `HTTP Request failed with status ${response.status}`
    const errorCode = data?.error?.code || data?.code || `HTTP_${response.status}`
    const fieldErrors = data?.error?.field_errors || data?.field_errors || undefined
    throw new ApiError(errorMsg, response.status, errorCode, fieldErrors)
  }

  // Handle envelope responses: preserve pagination { data, meta }
  let payload = data
  if (payload && typeof payload === "object") {
    if ("data" in payload && "meta" in payload) {
      return payload as T
    }
    if ("success" in payload && "data" in payload) {
      payload = payload.data
    } else if ("data" in payload && !Array.isArray(payload) && Object.keys(payload).length === 1) {
      payload = payload.data
    }
  }

  return payload as T
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
}

