import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import type { Order, OrderSide, OrderType, Stock, Trade, User } from "../types";

type OrderBook = {
  buyOrders: Order[];
  sellOrders: Order[];
};

type ApiErrorResponse = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function StockDetailPage() {
  const { symbol = "" } = useParams();

  const [user, setUser] = useState<User | null>(null);
  const [stock, setStock] = useState<Stock | null>(null);

  const [orderBook, setOrderBook] = useState<OrderBook>({
    buyOrders: [],
    sellOrders: [],
  });

  const [trades, setTrades] = useState<Trade[]>([]);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  const [side, setSide] = useState<OrderSide>("BUY");
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState("100");
  const [quantity, setQuantity] = useState("1");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const stockResponse = await api.get<Stock>(`/stocks/symbol/${symbol}`);
    const orderBookResponse = await api.get<OrderBook>(
      `/orders/orderbook/${symbol}`,
    );
    const tradesResponse = await api.get<Trade[]>(`/trades/recent/${symbol}`);

    setUser(meResponse.data);
    setStock(stockResponse.data);
    setOrderBook(orderBookResponse.data);
    setTrades(tradesResponse.data);
  }, [symbol]);

  useEffect(() => {
    void load();

    socket.connect();
    socket.emit("joinStockRoom", { symbol });

    socket.on("orderbook:update", (data: OrderBook) => {
      setOrderBook(data);
    });

    socket.on("trade:new", (trade: Trade) => {
      setTrades((prev) => [trade, ...prev]);
    });

    socket.on("stock:price:update", () => {
      void api.get<Stock>(`/stocks/symbol/${symbol}`).then((response) => {
        setStock(response.data);
      });
    });

    return () => {
      socket.emit("leaveStockRoom", { symbol });
      socket.off("orderbook:update");
      socket.off("trade:new");
      socket.off("stock:price:update");
      socket.disconnect();
    };
  }, [symbol, load]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      `Are you sure you want to ${side} ${quantity} shares of ${symbol}? This company/market trade needs admin approval.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setLatestOrder(null);

    try {
      const body: {
        stockSymbol: string;
        side: OrderSide;
        type: OrderType;
        quantity: number;
        price?: number;
        requiresApproval: boolean;
      } = {
        stockSymbol: symbol,
        side,
        type,
        quantity: Number(quantity),
        requiresApproval: true,
      };

      if (type === "LIMIT") {
        body.price = Number(price);
      }

      const response = await api.post<Order>("/orders", body);

      setLatestOrder(response.data);
      setMessage(getOrderSuccessMessage(response.data));

      await load();
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.response?.data?.message ?? "Order failed");
    }
  }

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page
        title={`${symbol} Trading`}
        subtitle="Company/market trades require admin approval before they enter the order book."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <p className="text-sm font-bold text-slate-500">Stock</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {stock?.name}
            </h2>
            <p className="text-lg font-bold text-blue-600">{stock?.symbol}</p>

            <p className="mt-6 text-sm font-bold text-slate-500">
              Last traded price
            </p>
            <p className="mt-1 text-4xl font-black text-slate-950">
              LKR {Number(stock?.lastPrice ?? 0).toLocaleString()}
            </p>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-2 text-2xl font-black text-slate-900">
              Place Company / Market Order
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              This trade request is submitted to admin first. After admin
              approval, it enters the order book and matches with opposite
              orders.
            </p>

            {message && (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={submitOrder} className="grid gap-4 md:grid-cols-5">
              <select
                className="rounded-xl border border-slate-300 px-3 py-3 font-bold outline-none focus:border-blue-500"
                value={side}
                onChange={(event) => setSide(event.target.value as OrderSide)}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>

              <select
                className="rounded-xl border border-slate-300 px-3 py-3 font-bold outline-none focus:border-blue-500"
                value={type}
                onChange={(event) => setType(event.target.value as OrderType)}
              >
                <option value="LIMIT">LIMIT</option>
                <option value="MARKET">MARKET</option>
              </select>

              <input
                className="rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                placeholder="Price"
                value={price}
                disabled={type === "MARKET"}
                onChange={(event) => setPrice(event.target.value)}
              />

              <input
                className="rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
                placeholder="Quantity"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />

              <button
                type="submit"
                className={
                  side === "BUY"
                    ? "rounded-xl bg-green-600 px-4 py-3 font-black text-white hover:bg-green-700"
                    : "rounded-xl bg-red-600 px-4 py-3 font-black text-white hover:bg-red-700"
                }
              >
                Submit {side}
              </button>
            </form>
          </Card>
        </div>

        {latestOrder && <OrderAcceptedCard order={latestOrder} />}

        <Card className="mt-6">
          <h2 className="mb-2 text-xl font-black text-slate-900">
            How this order works
          </h2>

          <div className="grid gap-4 md:grid-cols-4">
            <InfoBox
              title="1. Submitted"
              text="Your order is saved by the backend."
            />
            <InfoBox
              title="2. Admin Approval"
              text="Company/market trades wait for admin approval first."
            />
            <InfoBox
              title="3. Order Book"
              text="After approval, the order becomes OPEN and waits for a match."
            />
            <InfoBox
              title="4. Filled"
              text="When buy and sell prices match, the trade is completed."
            />
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Buy Orders</h2>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                Highest price first
              </span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Price</th>
                  <th className="py-2">Remaining</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {orderBook.buyOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 font-bold text-green-700">
                      {order.price}
                    </td>
                    <td className="py-3">{order.remainingQty}</td>
                    <td className="py-3">{getOrderStatusBadge(order)}</td>
                  </tr>
                ))}

                {orderBook.buyOrders.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={3}>
                      No approved buy orders in the order book.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Sell Orders</h2>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                Lowest price first
              </span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Price</th>
                  <th className="py-2">Remaining</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>

              <tbody>
                {orderBook.sellOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 font-bold text-red-700">
                      {order.price}
                    </td>
                    <td className="py-3">{order.remainingQty}</td>
                    <td className="py-3">{getOrderStatusBadge(order)}</td>
                  </tr>
                ))}

                {orderBook.sellOrders.length === 0 && (
                  <tr>
                    <td className="py-4 text-slate-500" colSpan={3}>
                      No approved sell orders in the order book.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="mb-4 text-xl font-black text-slate-900">
            Recent Trades
          </h2>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Price</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Total</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b">
                  <td className="py-3 font-bold">LKR {trade.price}</td>
                  <td className="py-3">{trade.quantity}</td>
                  <td className="py-3">LKR {trade.total}</td>
                  <td className="py-3">
                    {new Date(trade.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {trades.length === 0 && (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={4}>
                    No trades yet. A trade appears when approved buy and sell
                    orders match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </Page>
    </>
  );
}

function OrderAcceptedCard({ order }: { order: Order }) {
  const filledQuantity =
    Number(order.quantity) - Number(order.remainingQty ?? 0);

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Order submitted successfully
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            {order.side} {order.quantity} shares
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Order ID: <span className="font-mono">{order.id}</span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <SmallMetric title="Status" value={formatStatus(order.status)} />
          <SmallMetric title="Filled" value={filledQuantity.toString()} />
          <SmallMetric title="Remaining" value={order.remainingQty} />
          <SmallMetric title="Price" value={order.price ?? "Market"} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-700">
        <p className="font-black text-slate-900">What this means:</p>
        <p className="mt-1">{getOrderExplanation(order)}</p>
      </div>
    </Card>
  );
}

function SmallMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function getOrderSuccessMessage(order: Order) {
  if (order.status === "PENDING_APPROVAL") {
    return "Order submitted successfully. Waiting for admin approval.";
  }

  if (order.status === "FILLED") {
    return "Order accepted and fully filled. Trade completed successfully.";
  }

  if (order.status === "PARTIALLY_FILLED") {
    return "Order accepted and partially filled. Remaining quantity is still in the order book.";
  }

  if (order.status === "OPEN") {
    return "Order accepted into the order book. Waiting for a matching opposite order.";
  }

  return `Order submitted. Current status: ${formatStatus(order.status)}`;
}

function getOrderExplanation(order: Order) {
  if (order.status === "PENDING_APPROVAL") {
    return "This company/market order is waiting for admin approval. It will not appear in the order book until admin approves it.";
  }

  if (order.status === "FILLED") {
    return "Your order matched completely with an opposite order. You can now see the execution in My Trades.";
  }

  if (order.status === "PARTIALLY_FILLED") {
    return "Part of your order matched. The remaining quantity is still waiting in the order book.";
  }

  if (order.status === "OPEN") {
    if (order.side === "BUY") {
      return "Your buy order is approved and waiting because there is no sell order at your price or lower.";
    }

    return "Your sell order is approved and waiting because there is no buy order at your price or higher.";
  }

  if (order.status === "CANCELLED") {
    return "This order was cancelled. Any locked balance or locked shares should be released.";
  }

  if (order.status === "REJECTED") {
    return "This order was rejected by admin. Any locked balance or locked shares should be released.";
  }

  return "This order was not executed.";
}

function getOrderStatusBadge(order: Order) {
  const className =
    order.status === "PENDING_APPROVAL"
      ? "bg-purple-100 text-purple-800"
      : order.status === "OPEN"
        ? "bg-yellow-100 text-yellow-800"
        : order.status === "FILLED"
          ? "bg-green-100 text-green-800"
          : order.status === "PARTIALLY_FILLED"
            ? "bg-blue-100 text-blue-800"
            : order.status === "REJECTED"
              ? "bg-red-100 text-red-800"
              : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {formatStatus(order.status)}
    </span>
  );
}

function formatStatus(status: Order["status"]) {
  if (status === "PENDING_APPROVAL") {
    return "Pending Approval";
  }

  if (status === "PARTIALLY_FILLED") {
    return "Partially Filled";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}
