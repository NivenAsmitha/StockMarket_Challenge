import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, saveTokens } from "../lib/api";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    role: "ADMIN" | "USER";
  };
};

type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("Password123");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      saveTokens(response.data.accessToken, response.data.refreshToken);

      if (response.data.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.response?.data?.message ?? "Login failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-950">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Login to your trading dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <label className="mb-2 block text-sm font-bold text-slate-700">
          Email
        </label>
        <input
          className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="mb-2 block text-sm font-bold text-slate-700">
          Password
        </label>
        <input
          type="password"
          className="mb-6 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="w-full rounded-xl bg-blue-600 py-3 font-black text-white transition hover:bg-blue-700">
          Login
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          No account?{" "}
          <Link to="/register" className="font-bold text-blue-600">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
