import { RefreshCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { PortfolioItem, User } from "../types";

export function PortfolioPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [sellQuantity, setSellQuantity] = useState("1");
  const [sellPrice, setSellPrice] = useState("100");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const portfolioResponse = await api.get<PortfolioItem[]>("/portfolios/me");

    setUser(meResponse.data);
    setItems(portfolioResponse.data);
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

  function openSellModal(item: PortfolioItem) {
    setSelectedItem(item);
    setSellQuantity("1");
    setSellPrice(item.stock.lastPrice || item.avgBuyPrice || "100");
    setMessage("");
    setError("");
  }

  async function submitSellOrder() {
    if (!selectedItem) return;

    const quantity = Number(sellQuantity);
    const price = Number(sellPrice);

    if (quantity <= 0 || price <= 0) {
      setError("Sell quantity and price must be greater than zero.");
      return;
    }

    if (quantity > Number(selectedItem.quantity)) {
      setError("You cannot sell more shares than your available quantity.");
      return;
    }

    const confirmed = window.confirm(
      `Sell ${quantity} shares of ${selectedItem.stock.symbol} at LKR ${price}?`,
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await api.post("/orders", {
        stockSymbol: selectedItem.stock.symbol,
        side: "SELL",
        type: "LIMIT",
        price,
        quantity,
      });

      setMessage(
        `${selectedItem.stock.symbol} sell order added to Selling Stocks page.`,
      );

      setSelectedItem(null);
      await load();
    } catch {
      setError("Could not create sell order. Check your available quantity.");
    }
  }

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page
        title="Portfolio"
        subtitle="Your owned stocks are shown here. Click Sell to list your stock for other users."
      >
        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <p className="font-black text-blue-900">Live portfolio status</p>
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

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4">Symbol</th>
                <th className="p-4">Name</th>
                <th className="p-4">Available</th>
                <th className="p-4">Locked</th>
                <th className="p-4">Average Buy</th>
                <th className="p-4">Last Price</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4 font-black">{item.stock.symbol}</td>
                  <td className="p-4">{item.stock.name}</td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4">{item.lockedQuantity}</td>
                  <td className="p-4">{item.avgBuyPrice}</td>
                  <td className="p-4">{item.stock.lastPrice}</td>

                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => openSellModal(item)}
                      className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-slate-500" colSpan={7}>
                    No shares yet. Buy stocks from Selling Stocks page first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Sell {selectedItem.stock.symbol}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Available quantity: {selectedItem.quantity}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-full bg-slate-100 p-2 hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <label className="mb-2 block text-sm font-bold">
                Sell Quantity
              </label>
              <input
                className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-3"
                value={sellQuantity}
                onChange={(event) => setSellQuantity(event.target.value)}
              />

              <label className="mb-2 block text-sm font-bold">Sell Price</label>
              <input
                className="mb-6 w-full rounded-xl border border-slate-300 px-4 py-3"
                value={sellPrice}
                onChange={(event) => setSellPrice(event.target.value)}
              />

              <button
                type="button"
                onClick={submitSellOrder}
                className="w-full rounded-xl bg-red-600 py-3 font-black text-white hover:bg-red-700"
              >
                Add to Selling Stocks
              </button>
            </div>
          </div>
        )}
      </Page>
    </>
  );
}
