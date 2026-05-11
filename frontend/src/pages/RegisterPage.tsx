import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export function RegisterPage() {
  const [name, setName] = useState("Normal User");
  const [email, setEmail] = useState("user@test.com");
  const [password, setPassword] = useState("Password123");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Register failed");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-3xl font-bold">Register</h1>

        {message && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="mb-2 block text-sm font-medium">Name</label>
        <input
          className="mb-4 w-full rounded-lg border px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label className="mb-2 block text-sm font-medium">Email</label>
        <input
          className="mb-4 w-full rounded-lg border px-3 py-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="mb-2 block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mb-6 w-full rounded-lg border px-3 py-2"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700">
          Register
        </button>

        <p className="mt-4 text-center text-sm">
          Already have account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
