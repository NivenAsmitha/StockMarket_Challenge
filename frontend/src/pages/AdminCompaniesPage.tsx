import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Company, User } from "../types";

export function AdminCompaniesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [name, setName] = useState("Sea Pony Capital");
  const [symbol, setSymbol] = useState("SPC");
  const [description, setDescription] = useState("Demo listed company");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const companiesResponse = await api.get<Company[]>("/companies");

    setUser(meResponse.data);
    setCompanies(companiesResponse.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await api.post("/companies", {
      name,
      symbol,
      description,
    });

    await load();
  }

  async function approveCompany(id: string) {
    await api.patch(`/companies/${id}/approve`);
    await load();
  }

  async function rejectCompany(id: string) {
    await api.patch(`/companies/${id}/reject`);
    await load();
  }

  async function suspendCompany(id: string) {
    await api.patch(`/companies/${id}/suspend`);
    await load();
  }

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page title="Admin Companies">
        <form
          onSubmit={createCompany}
          className="mb-6 grid gap-4 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-4"
        >
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Company name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
          />

          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <button className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">
            Create
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t">
                  <td className="p-4 font-bold">{company.symbol}</td>
                  <td className="p-4">{company.name}</td>
                  <td className="p-4">{company.status}</td>
                  <td className="flex gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => approveCompany(company.id)}
                      className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => rejectCompany(company.id)}
                      className="rounded bg-orange-600 px-3 py-2 text-white hover:bg-orange-700"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => suspendCompany(company.id)}
                      className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}

              {companies.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Page>
    </>
  );
}
