import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import { Company, Stock, User } from "../types";

export function AdminStocksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [symbol, setSymbol] = useState("SPC");
  const [name, setName] = useState("Sea Pony Capital");
  const [totalShares, setTotalShares] = useState("1000000");
  const [initialPrice, setInitialPrice] = useState("100");

  const load = useCallback(async () => {
    const me = await api.get("/auth/me");
    const companiesResponse = await api.get("/companies?status=APPROVED");
    const stocksResponse = await api.get("/stocks");

    setUser(me.data);
    setCompanies(companiesResponse.data);
    setStocks(stocksResponse.data);

    if (!companyId && companiesResponse.data.length > 0) {
      setCompanyId(companiesResponse.data[0].id);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createStock(event: FormEvent) {
    event.preventDefault();

    await api.post("/stocks", {
      companyId,
      symbol,
      name,
      totalShares: Number(totalShares),
      initialPrice: Number(initialPrice),
    });

    await load();
  }

  return (
    <>
      <Navbar userRole={user?.role} />
      <Page title="Admin Stocks">
        <form
          onSubmit={createStock}
          className="mb-6 grid gap-4 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-3"
        >
          <select
            className="rounded-lg border px-3 py-2"
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.symbol} - {company.name}
              </option>
            ))}
          </select>

          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
          />

          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Total shares"
            value={totalShares}
            onChange={(event) => setTotalShares(event.target.value)}
          />

          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Initial price"
            value={initialPrice}
            onChange={(event) => setInitialPrice(event.target.value)}
          />

          <button className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white">
            Create Stock
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Last Price</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.id} className="border-t">
                  <td className="p-4 font-bold">{stock.symbol}</td>
                  <td className="p-4">{stock.name}</td>
                  <td className="p-4">{stock.company?.name}</td>
                  <td className="p-4">{stock.lastPrice}</td>
                  <td className="p-4">{stock.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </>
  );
}
