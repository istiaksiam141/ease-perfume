"use client";

import { useEffect, useState } from "react";

type SavedOrder = { orderNumber: string; receiptToken: string };
type Order = {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  total: number;
  items: { productName: string; size: string; quantity: number }[];
};

const storageKey = "ease-saved-orders";
const deliveryStages = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const label = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();
const money = (amount: number) => `৳${amount.toLocaleString("en-BD")}`;

function readSavedOrders(): SavedOrder[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedOrder => item && typeof item.orderNumber === "string" && typeof item.receiptToken === "string").slice(0, 20);
  } catch { return []; }
}

export default function YourOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(0);

  async function refreshOrders() {
    setLoading(true);
    const saved = readSavedOrders();
    try {
      const current = JSON.parse(sessionStorage.getItem("ease-order-receipt") || "null") as SavedOrder | null;
      if (current && typeof current.orderNumber === "string" && typeof current.receiptToken === "string" && !saved.some(order => order.orderNumber === current.orderNumber)) {
        saved.unshift(current);
        localStorage.setItem(storageKey, JSON.stringify(saved.slice(0, 20)));
      }
    } catch { /* Keep the page usable when browser storage is unavailable. */ }

    const results = await Promise.all(saved.map(async access => {
      try {
        const response = await fetch("/api/orders/receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(access),
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) return null;
        return {
          orderNumber: data.orderNumber as string,
          orderStatus: data.orderStatus as string,
          paymentMethod: data.paymentMethod as string,
          paymentStatus: data.paymentStatus as string,
          createdAt: data.createdAt as string,
          total: data.total as number,
          items: (data.items as Order["items"]).map(({ productName, size, quantity }) => ({ productName, size, quantity })),
        } satisfies Order;
      } catch { return null; }
    }));
    const loaded = results.filter((order): order is Order => order !== null);
    setOrders(loaded);
    setFailed(results.length - loaded.length);
    setLoading(false);
  }

  useEffect(() => { void refreshOrders(); }, []);

  return <main className="system-page">
    <a href="/" className="muted">← Back to Ease</a>
    <div className="subnav" style={{ marginTop: 28 }}>
      <div><div className="eyebrow">Ease · Delivery</div><h1>Your Orders</h1></div>
      <button className="secondary" onClick={() => void refreshOrders()} disabled={loading}>{loading ? "Refreshing…" : "Refresh status"}</button>
    </div>
    <p>Your orders saved in this browser. Delivery updates are managed by the Ease team.</p>
    {failed > 0 && <div className="error" role="status">{failed} saved {failed === 1 ? "order could" : "orders could"} not be loaded. You can still look it up with the order code and checkout phone number.</div>}
    {loading ? <section className="panel"><p>Loading your saved orders…</p></section> : !orders.length ? <section className="panel">
      <h2>No saved orders in this browser</h2>
      <p>Orders placed from this browser will appear here. To look up another order, use its code and the phone number entered at checkout.</p>
      <a className="button secondary" href="/track-order">Track an order</a>
    </section> : orders.map(order => {
      const current = deliveryStages.indexOf(order.orderStatus);
      return <section className="panel" key={order.orderNumber}>
        <div className="subnav"><h2>{order.orderNumber}</h2><span className="status">{label(order.orderStatus)}</span></div>
        <p>Placed {new Date(order.createdAt).toLocaleString()}</p>
        <h3>Delivery progress</h3>
        {order.orderStatus === "CANCELLED" ? <div className="error">This order was cancelled. Contact the store if you need help.</div> : <div className="rows" aria-label="Delivery progress">
          {deliveryStages.map((stage, index) => <div className="row" key={stage}>
            <span style={{ color: index <= current ? "#ffd778" : "#9296a5" }}>{index <= current ? "●" : "○"} &nbsp;{label(stage)}</span>
            {stage === order.orderStatus && <strong>Current status</strong>}
          </div>)}
        </div>}
        <h3 style={{ marginTop: 22 }}>Items</h3>
        {order.items.map((item, index) => <div className="row" key={`${item.productName}-${item.size}-${index}`}><span>{item.productName} · {item.size}</span><span>× {item.quantity}</span></div>)}
        <div className="row"><span>Payment</span><span>{order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod} · {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}</span></div>
        <div className="row totals"><span>Total</span><strong>{money(order.total)}</strong></div>
      </section>;
    })}
  </main>;
}
