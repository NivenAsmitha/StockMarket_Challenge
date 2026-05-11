import { RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Order, User } from "../types";

export function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const ordersResponse = await api.get<Order[]>("/orders/me");

    setUser(meResponse.data);
    setOrders(ordersResponse.data);
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

  async function cancelOrder(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) {
      return;
    }

    await api.delete(`/orders/${id}/cancel`);
    await load();
  }

  return (
    <>
      <Navbar userRole={user?.role} />

      <Page
        title="My Orders"
        subtitle="Orders need admin approval first. After approval, they wait for a matching opposite order."
      >
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <p className="font-black text-blue-900">Live order status</p>
            <p className="text-sm text-blue-700">
              This page refreshes automatically every 3 seconds.
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

        <Card className="mb-6">
          <h2 className="text-xl font-black text-slate-900">
            Order status guide
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <GuideBox
              title="PENDING"
              text="Order submitted. Waiting for admin approval."
            />
            <GuideBox
              title="OPEN"
              text="Admin approved. Waiting for matching opposite order."
            />
            <GuideBox
              title="PARTIAL"
              text="Some quantity filled. Remaining quantity is still waiting."
            />
            <GuideBox
              title="FILLED"
              text="Fully matched and executed. It appears in My Trades."
            />
            <GuideBox
              title="CANCELLED"
              text="Order was cancelled. Locked funds or shares are released."
            />
          </div>
        </Card>

        <Card>
          {orders.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-slate-100 px-6 py-4 text-4xl">
                📦
              </div>

              <h2 className="text-2xl font-black text-slate-900">
                No orders yet
              </h2>

              <p className="mt-3 text-slate-500">
                Go to Market, select a stock, and create a buy or sell order.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Side</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Quantity</th>
                    <th className="p-4">Filled</th>
                    <th className="p-4">Remaining</th>
                    <th className="p-4">Status Details</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const filledQuantity =
                      Number(order.quantity) - Number(order.remainingQty);

                    return (
                      <tr key={order.id} className="border-t align-top">
                        <td className="p-4 font-black">
                          {order.stock?.symbol}
                        </td>

                        <td className="p-4">
                          <span
                            className={
                              order.side === "BUY"
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700"
                                : "rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700"
                            }
                          >
                            {order.side}
                          </span>
                        </td>

                        <td className="p-4">{order.type}</td>
                        <td className="p-4">{order.price ?? "Market"}</td>
                        <td className="p-4">{order.quantity}</td>
                        <td className="p-4">{filledQuantity}</td>
                        <td className="p-4">{order.remainingQty}</td>

                        <td className="p-4">
                          <OrderStatusDetails order={order} />
                        </td>

                        <td className="p-4">
                          {(order.status === "PENDING_APPROVAL" ||
                            order.status === "OPEN" ||
                            order.status === "PARTIALLY_FILLED") && (
                            <button
                              type="button"
                              onClick={() => cancelOrder(order.id)}
                              className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Page>
    </>
  );
}

function OrderStatusDetails({ order }: { order: Order }) {
  return (
    <div>
      <span className={getStatusClass(order.status)}>
        {getStatusLabel(order.status)}
      </span>

      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
        {getOrderExplanation(order)}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        ID: <span className="font-mono">{order.id.slice(0, 8)}</span>
      </p>
    </div>
  );
}

function GuideBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function getStatusLabel(status: Order["status"]) {
  if (status === "PENDING_APPROVAL") {
    return "Waiting Admin Approval";
  }

  if (status === "OPEN") {
    return "Admin Approved / Waiting Match";
  }

  if (status === "PARTIALLY_FILLED") {
    return "Partially Filled";
  }

  if (status === "FILLED") {
    return "Filled / Completed";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  if (status === "REJECTED") {
    return "Rejected";
  }

  return status;
}

function getStatusClass(status: Order["status"]) {
  const base = "rounded-full px-3 py-1 text-xs font-black";

  if (status === "PENDING_APPROVAL") {
    return `${base} bg-purple-100 text-purple-800`;
  }

  if (status === "OPEN") {
    return `${base} bg-yellow-100 text-yellow-800`;
  }

  if (status === "PARTIALLY_FILLED") {
    return `${base} bg-blue-100 text-blue-800`;
  }

  if (status === "FILLED") {
    return `${base} bg-green-100 text-green-800`;
  }

  if (status === "CANCELLED") {
    return `${base} bg-slate-100 text-slate-700`;
  }

  if (status === "REJECTED") {
    return `${base} bg-red-100 text-red-700`;
  }

  return `${base} bg-red-100 text-red-700`;
}

function getOrderExplanation(order: Order) {
  if (order.status === "PENDING_APPROVAL") {
    return "Your order was submitted successfully. It is waiting for admin approval before entering the order book.";
  }

  if (order.status === "OPEN") {
    if (order.side === "BUY") {
      return "Admin approved this buy order. It is now waiting for a seller at this price or lower.";
    }

    return "Admin approved this sell order. It is now waiting for a buyer at this price or higher.";
  }

  if (order.status === "PARTIALLY_FILLED") {
    return "Some quantity was matched. The remaining quantity is still waiting in the order book.";
  }

  if (order.status === "FILLED") {
    return "This order was fully matched with an opposite order. Check My Trades for execution details.";
  }

  if (order.status === "CANCELLED") {
    return "This order was cancelled and removed from the active order book.";
  }

  if (order.status === "REJECTED") {
    return "This order was rejected by admin. Locked funds or shares were released.";
  }

  return "This order was rejected by the system.";
}
