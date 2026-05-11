import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { User } from "../types";

type ApiUser = User & {
  createdAt?: string;
};

export function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    setCurrentUser(meResponse.data);

    try {
      const usersResponse = await api.get<ApiUser[]>("/users");
      setUsers(usersResponse.data);
      setError("");
    } catch {
      setError(
        "User management API is not available. Backend needs GET /users and PATCH /users/:id/status.",
      );
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(user: ApiUser) {
    const action = user.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.email}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(`/users/${user.id}/status`, {
        isActive: !user.isActive,
      });

      await load();
    } catch {
      setError(
        "Could not update user status. Backend endpoint PATCH /users/:id/status is required.",
      );
    }
  }

  return (
    <>
      <Navbar userRole={currentUser?.role} />

      <Page
        title="User Management"
        subtitle="View users and activate or deactivate accounts."
      >
        {error && (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
            {error}
          </div>
        )}

        <Card>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Email Verified</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-4 font-bold">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.role}</td>
                    <td className="p-4">
                      {user.isEmailVerified ? "Verified" : "Not verified"}
                    </td>
                    <td className="p-4">
                      <span
                        className={
                          user.isActive
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                            : "rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                        }
                      >
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => changeStatus(user)}
                        className={
                          user.isActive
                            ? "rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
                            : "rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
                        }
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={6}>
                      No users to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Page>
    </>
  );
}
