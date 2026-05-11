import { RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Order, Stock, User } from "../types";

type SellListing = Order & {
  stock: Stock;
};

type OrderBookResponse = {
  buyOrders: Order[];
  sellOrders: Order[];
};

export function SellingStocksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<SellListing[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [buyQuantityByOrder, setBuyQuantityByOrder] = useState<
    Record<string, string>
  >({});

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const stocksResponse = await api.get<Stock[]>("/stocks/active");

    const allListings: SellListing[] = [];

    for (const stock of stocksResponse.data) {
      const orderBookResponse = await api.get<OrderBookResponse>(
        `/orders/orderbook/${stock.symbol}`,
      );

      for (const sellOrder of orderBookResponse.data.sellOrders) {
        allListings.push({
          ...sellOrder,
          stock,
        });
      }
    }

    setUser(meResponse.data);
    setListings(allListings);
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

  async function buyListing(listing: SellListing) {
    const quantity = Number(
      buyQuantityByOrder[listing.id] ?? listing.remainingQty,
    );

    if (quantity <= 0) {
      setError("Buy quantity must be greater than zero.");
      return;
    }

    if (quantity > Number(listing.remainingQty)) {
      setError("You cannot buy more than the available sell quantity.");
      return;
    }

    const confirmed = window.confirm(
      `Buy ${quantity} shares of ${listing.stock.symbol} at LKR ${listing.price}? This buy order will wait for admin approval.`,
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await api.post("/orders", {
        stockSymbol: listing.stock.symbol,
        side: "BUY",
        type: "LIMIT",
        price: Number(listing.price),
        quantity,
      });

      setMessage(
        `Buy order submitted for ${listing.stock.symbol}. Waiting for admin approval.`,
      );

      await load();
    } catch {
      setError("Could not create buy order. Check your available balance.");
    }
  }

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page
        title="Selling Stocks"
        subtitle="Approved sell orders from users. Click Buy to purchase listed stocks."
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
            <p className="font-black text-blue-900">Live selling stocks</p>
            <p className="text-sm text-blue-700">
              Shows approved sell orders only. Refreshes every 3 seconds.
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
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Stock Name</th>
                  <th className="p-4">Sell Price</th>
                  <th className="p-4">Available Quantity</th>
                  <th className="p-4">Buy Quantity</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-t">
                    <td className="p-4 font-black">{listing.stock.symbol}</td>
                    <td className="p-4">{listing.stock.name}</td>
                    <td className="p-4 font-bold">LKR {listing.price}</td>
                    <td className="p-4">{listing.remainingQty}</td>

                    <td className="p-4">
                      <input
                        className="w-28 rounded-xl border border-slate-300 px-3 py-2"
                        value={
                          buyQuantityByOrder[listing.id] ?? listing.remainingQty
                        }
                        onChange={(event) =>
                          setBuyQuantityByOrder((prev) => ({
                            ...prev,
                            [listing.id]: event.target.value,
                          }))
                        }
                      />
                    </td>

                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => buyListing(listing)}
                        className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
                      >
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}

                {listings.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-slate-500" colSpan={6}>
                      No approved sell orders right now. Users must sell from
                      Portfolio, then admin must approve the sell order.
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
