import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [message, setMessage] = useState("Verifying...");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");

    async function verify() {
      if (!token) {
        setError("Token missing");
        setMessage("");
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setMessage(response.data.message);
        setError("");
      } catch (err: any) {
        setError(err.response?.data?.message ?? "Verification failed");
        setMessage("");
      }
    }

    void verify();
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="mb-4 text-3xl font-bold">Email Verification</h1>

        {message && <p className="text-green-700">{message}</p>}
        {error && <p className="text-red-700">{error}</p>}

        <Link
          to="/login"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
