import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import { Stock, User } from "../types";

export function MarketPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function load() {
      const me = await api.get("/auth/me");
      const stocksResponse = await api.get("/stocks/active");

      setUser(me.data);
      setStocks(stocksResponse.data);
    }

    load();
  }, []);

  return (
    <>
      <Navbar userRole={user?.role} />
      <Page title="Market">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Last Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.id} className="border-t">
                  <td className="p-4 font-bold">{stock.symbol}</td>
                  <td className="p-4">{stock.name}</td>
                  <td className="p-4">{stock.company?.name}</td>
                  <td className="p-4">
                    LKR {Number(stock.lastPrice).toLocaleString()}
                  </td>
                  <td className="p-4">{stock.status}</td>
                  <td className="p-4">
                    <Link
                      to={`/stocks/${stock.symbol}`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-white"
                    >
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </>
  );
}
