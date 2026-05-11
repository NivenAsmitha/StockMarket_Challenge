import { RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Balance, User } from "../types";

export function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User & { balance?: Balance }>("/auth/me");

    setUser(meResponse.data);
    setBalance(meResponse.data.balance ?? null);
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [load]);

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page
        title="Dashboard"
        subtitle="Your cash balance updates automatically after completed trades."
      >
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <p className="font-black text-blue-900">Live account status</p>
            <p className="text-sm text-blue-700">
              Refreshes every 3 seconds.
              {lastUpdated && ` Last updated: ${lastUpdated}`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">User</p>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm">{user?.email}</p>
            <p className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
              {user?.role}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-slate-500">Available LKR</p>
            <h2 className="text-3xl font-bold">
              {Number(balance?.availableLkr ?? 0).toLocaleString()}
            </h2>
          </Card>

          <Card>
            <p className="text-sm text-slate-500">Locked LKR</p>
            <h2 className="text-3xl font-bold">
              {Number(balance?.lockedLkr ?? 0).toLocaleString()}
            </h2>
          </Card>
        </div>
      </Page>
    </>
  );
}
