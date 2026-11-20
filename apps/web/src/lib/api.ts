const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
      if (Array.isArray(detail)) {
        detail = detail.map((d: { msg?: string }) => d.msg || String(d)).join(", ");
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, String(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  available: boolean;
  disclaimer: string | null;
  sort_order: number;
};

export type InterviewSession = {
  id: string;
  category_slug: string;
  status: string;
  interviewer_gender: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  has_report: boolean;
};

export type Dashboard = {
  full_name: string;
  email: string;
  preferred_interviewer: string | null;
  categories: Category[];
  recent_sessions: InterviewSession[];
  performance_overview: {
    interviews_completed: number;
    average_score: number | null;
    message: string;
  };
};

export type Profile = {
  user_id: string;
  email: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  interview_goal: string | null;
  preferred_language: string;
  preferred_interviewer: string | null;
  location: string | null;
  target_role: string | null;
};

export type EvaluationReport = {
  id: string;
  session_id: string;
  summary: string | null;
  rubric: Record<string, unknown> | null;
  created_at: string;
  category_slug: string | null;
};

export const api = {
  signup: (body: { email: string; password: string; full_name: string }) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: (token: string) =>
    request<{ message: string }>(
      "/api/auth/logout",
      { method: "POST" },
      token,
    ),
  forgotPassword: (email: string) =>
    request<{ message: string; reset_token?: string; reset_url?: string }>(
      "/api/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
    ),
  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
  dashboard: (token: string) =>
    request<Dashboard>("/api/dashboard", {}, token),
  profile: (token: string) => request<Profile>("/api/profile/me", {}, token),
  updateProfile: (token: string, body: Partial<Profile>) =>
    request<Profile>(
      "/api/profile/me",
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),
  interviews: (token: string) =>
    request<InterviewSession[]>("/api/interviews", {}, token),
  reports: (token: string) =>
    request<EvaluationReport[]>("/api/reports", {}, token),
  report: (token: string, id: string) =>
    request<EvaluationReport>(`/api/reports/${id}`, {}, token),
};
