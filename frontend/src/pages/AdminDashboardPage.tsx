import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Company, Stock, User } from "../types";

export function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const companiesResponse = await api.get<Company[]>("/companies");
    const stocksResponse = await api.get<Stock[]>("/stocks");

    setUser(meResponse.data);
    setCompanies(companiesResponse.data);
    setStocks(stocksResponse.data);

    try {
      const usersResponse = await api.get<User[]>("/users");
      setUsers(usersResponse.data);
      setUsersError("");
    } catch {
      setUsers([]);
      setUsersError("Users endpoint not available yet.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const companyStatusData = useMemo(() => {
    const statuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

    return statuses.map((status) => ({
      status,
      count: companies.filter((company) => company.status === status).length,
    }));
  }, [companies]);

  const stockStatusData = useMemo(() => {
    const active = stocks.filter((stock) => stock.status === "ACTIVE").length;
    const suspended = stocks.filter(
      (stock) => stock.status === "SUSPENDED",
    ).length;

    return [
      { name: "Active", value: active },
      { name: "Suspended", value: suspended },
    ];
  }, [stocks]);

  const userStatusData = useMemo(() => {
    const active = users.filter((item) => item.isActive).length;
    const inactive = users.filter((item) => !item.isActive).length;

    return [
      { name: "Active Users", value: active },
      { name: "Inactive Users", value: inactive },
    ];
  }, [users]);

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page
        title="Admin Dashboard"
        subtitle="System overview, company status, stocks and users."
      >
        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard title="Companies" value={companies.length} />
          <MetricCard title="Stocks" value={stocks.length} />
          <MetricCard title="Users" value={users.length} />
          <MetricCard
            title="Active Stocks"
            value={stocks.filter((stock) => stock.status === "ACTIVE").length}
          />
        </div>

        {usersError && (
          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
            {usersError} To manage users, backend needs GET /users and PATCH
            /users/:id/status.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-xl font-black text-slate-900">
              Company Status
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-black text-slate-900">
              Stock Status
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {stockStatusData.map((entry) => (
                      <Cell key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-xl font-black text-slate-900">
              User Status
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userStatusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {userStatusData.map((entry) => (
                      <Cell key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-black text-slate-900">
              Listed Stocks
            </h2>

            <div className="space-y-3">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900">{stock.symbol}</p>
                    <p className="text-sm text-slate-500">{stock.name}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">LKR {stock.lastPrice}</p>
                    <p className="text-xs text-slate-500">{stock.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Page>
    </>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
    </Card>
  );
}
