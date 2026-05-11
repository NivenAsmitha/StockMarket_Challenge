import { RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Trade, User } from "../types";

export function TradesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const tradesResponse = await api.get<Trade[]>("/trades/me");

    setUser(meResponse.data);
    setTrades(tradesResponse.data);
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
        title="My Trades"
        subtitle="Completed buy/sell executions appear here. Open orders are shown on the Orders page."
      >
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <p className="font-black text-blue-900">Live trades status</p>
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

        <Card>
          {trades.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-blue-50 px-6 py-4 text-4xl">
                📊
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                No completed trades yet
              </h2>

              <p className="mt-3 max-w-xl text-slate-500">
                Your orders are still not matched. A trade appears only when
                your BUY order matches a SELL order, or your SELL order matches
                a BUY order.
              </p>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-left text-sm text-blue-800">
                <p className="font-black">Example:</p>
                <p className="mt-1">
                  BUY SPC at LKR 100 must match SELL SPC at LKR 100 or lower.
                  Both orders must be approved by admin.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-t">
                      <td className="p-4 font-bold">
                        {trade.stock?.symbol ?? trade.stockId}
                      </td>
                      <td className="p-4">LKR {trade.price}</td>
                      <td className="p-4">{trade.quantity}</td>
                      <td className="p-4">LKR {trade.total}</td>
                      <td className="p-4">
                        {new Date(trade.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Page>
    </>
  );
}
