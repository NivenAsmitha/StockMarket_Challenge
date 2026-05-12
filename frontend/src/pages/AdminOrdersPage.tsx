import { useCallback, useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Navbar } from "../components/Navbar";
import { Page } from "../components/Page";
import { api } from "../lib/api";
import type { Order, User } from "../types";

export function AdminOrdersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const meResponse = await api.get<User>("/auth/me");
    const ordersResponse = await api.get<Order[]>("/orders/admin/all");

    setCurrentUser(meResponse.data);
    setOrders(ordersResponse.data);
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

  async function approveOrder(order: Order) {
    const confirmed = window.confirm(
      `Approve ${order.side} order for ${order.stock?.symbol}?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await api.patch(`/orders/${order.id}/approve`);
      setMessage("Order approved. Matching engine checked automatically.");
      await load();
    } catch {
      setError("Could not approve order.");
    }
  }

  async function rejectOrder(order: Order) {
    const confirmed = window.confirm(
      `Reject ${order.side} order for ${order.stock?.symbol}?`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      await api.patch(`/orders/${order.id}/reject`);
      setMessage("Order rejected. Locked money/shares released.");
      await load();
    } catch {
      setError("Could not reject order.");
    }
  }

  return (
    <>
      <Navbar userRole={currentUser?.role} />

      <Page
        title="Admin Orders"
        subtitle="Company/market trades need admin approval. User-to-user selling stock trades are automatic."
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

        <Card className="mb-6">
          <h2 className="text-xl font-black text-slate-900">
            Order status guide
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <GuideBox
              title="PENDING"
              text="Company/market order is waiting for admin approval."
            />
            <GuideBox
              title="OPEN"
              text="Approved or automatic order waiting for opposite order."
            />
            <GuideBox
              title="PARTIAL"
              text="Some quantity filled. Remaining is active."
            />
            <GuideBox
              title="FILLED"
              text="Fully matched. Portfolio and trades updated."
            />
            <GuideBox
              title="CANCELLED"
              text="Cancelled by user. Locked funds/shares released."
            />
          </div>
        </Card>

        <Card>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Side</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">What next?</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t align-top">
                    <td className="p-4">
                      <p className="font-black">
                        {order.user?.name ?? "Unknown user"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.user?.email ?? "-"}
                      </p>
                    </td>

                    <td className="p-4 font-black">
                      {order.stock?.symbol ?? order.stockId}
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
                    <td className="p-4">{order.remainingQty}</td>

                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>

                    <td className="p-4">
                      <p className="max-w-xs text-xs leading-5 text-slate-500">
                        {getNextStep(order)}
                      </p>
                    </td>

                    <td className="p-4">
                      {order.status === "PENDING_APPROVAL" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => approveOrder(order)}
                            className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => rejectOrder(order)}
                            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={10}>
                      No orders found.
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

function GuideBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-black text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const className =
    status === "PENDING_APPROVAL"
      ? "bg-purple-100 text-purple-700"
      : status === "OPEN"
        ? "bg-yellow-100 text-yellow-700"
        : status === "FILLED"
          ? "bg-green-100 text-green-700"
          : status === "PARTIALLY_FILLED"
            ? "bg-blue-100 text-blue-700"
            : status === "REJECTED"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function getNextStep(order: Order) {
  if (order.status === "PENDING_APPROVAL") {
    return "Admin must approve or reject this company/market order.";
  }

  if (order.status === "OPEN") {
    if (order.side === "BUY") {
      return `Waiting for a SELL order for ${
        order.stock?.symbol ?? order.stockId
      } at ${order.price} or lower.`;
    }

    return `Listed for buyers. Waiting for a BUY order at ${order.price} or higher.`;
  }

  if (order.status === "PARTIALLY_FILLED") {
    return "Some quantity was filled. Remaining quantity is still active.";
  }

  if (order.status === "FILLED") {
    return "Trade completed. Portfolio and My Trades are updated.";
  }

  if (order.status === "CANCELLED") {
    return "Order was cancelled. No action needed.";
  }

  if (order.status === "REJECTED") {
    return "Order was rejected. No action needed.";
  }

  return "No action needed.";
}
