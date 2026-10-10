"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CartLine = { id?: string; name: string; size: string; qty: number };
type Product = { id: string; name: string; image: string; variants: { size: string; price: number; stock: number; available: boolean }[] };
type Config = { insideCityLabel: string; outsideCityLabel: string; insideCityDelivery: number | null; outsideCityDelivery: number | null };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = (n: number) => `৳${n.toLocaleString("en-BD")}`;
type SavedOrder = { orderNumber: string; receiptToken: string };
function saveOrderForThisBrowser(order: SavedOrder) {
  try {
    const prior = JSON.parse(localStorage.getItem("ease-saved-orders") || "[]");
    const orders = Array.isArray(prior) ? prior.filter((entry): entry is SavedOrder => typeof entry?.orderNumber === "string" && typeof entry?.receiptToken === "string" && entry.orderNumber !== order.orderNumber) : [];
    localStorage.setItem("ease-saved-orders", JSON.stringify([order, ...orders].slice(0, 20)));
  } catch { /* Order placement must succeed even if browser storage is unavailable. */ }
}

export default function CheckoutClient() {
  const [cart, setCart] = useState<CartLine[]>([]), [products, setProducts] = useState<Product[]>([]), [config, setConfig] = useState<Config | null>(null);
  const [zone, setZone] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("ease-cart") || "[]") as CartLine[]; setCart(Array.isArray(saved) ? saved.map(x => ({ ...x, id: x.id || slug(x.name) })) : []); }
    catch { setCart([]); }
    Promise.all([fetch("/api/products").then(r => r.json()), fetch("/api/config").then(r => r.json())]).then(([p, c]) => { if (Array.isArray(p)) setProducts(p); if (c && !c.error) setConfig(c); }).catch(() => setError("We couldn't load current product and delivery information. Please refresh and try again.")).finally(() => setReady(true));
  }, []);
  const lines = useMemo(() => cart.map(line => { const product = products.find(p => p.id === line.id || p.name === line.name); const variant = product?.variants.find(v => v.size === line.size); return { line, product, variant }; }), [cart, products]);
  const subtotal = lines.reduce((sum, x) => sum + (x.variant?.price || 0) * x.line.qty, 0);
  const delivery = zone === "INSIDE_CITY" ? config?.insideCityDelivery : zone === "OUTSIDE_CITY" ? config?.outsideCityDelivery : null;
  const unavailable = lines.find(x => !x.product || !x.variant || !x.variant.available || x.variant.stock < x.line.qty);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    if (!cart.length) { setError("Your fragrance collection is waiting. Add a scent before checkout."); return; }
    if (unavailable) { setError(`${unavailable.line.name} (${unavailable.line.size}) is unavailable or the selected quantity exceeds available stock. Please adjust your bag.`); return; }
    if (delivery === null || delivery === undefined) { setError("Delivery fees are not configured yet. Please contact the store before placing an order."); return; }
    const form = new FormData(e.currentTarget), phone = String(form.get("phone") || "").replace(/[\s()-]/g, ""), normalized = phone.startsWith("+880") ? `0${phone.slice(4)}` : phone.startsWith("880") ? `0${phone.slice(3)}` : phone;
    if (!/^01[3-9]\d{8}$/.test(normalized)) { setError("Enter a valid Bangladesh phone number, such as 01XXXXXXXXX."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliveryZone: zone, items: cart.map(x => ({ productId: x.id || slug(x.name), size: x.size, quantity: x.qty })), customer: { name: form.get("name"), phone, email: form.get("email"), address: form.get("address"), city: form.get("city"), area: form.get("area"), note: form.get("note") } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn't place the order. Please try again.");
      const receipt = { orderNumber: data.orderNumber, receiptToken: data.receiptToken };
      sessionStorage.setItem("ease-order-receipt", JSON.stringify(receipt));
      saveOrderForThisBrowser(receipt);
      localStorage.setItem("ease-last-order-number", data.orderNumber);
      localStorage.removeItem("ease-cart"); window.location.href = `/order-success?order=${encodeURIComponent(data.orderNumber)}`;
    } catch (err) { setError(err instanceof Error ? err.message : "Network error. Please check your connection and retry."); setLoading(false); }
  }
  if (!ready) return <main className="system-page"><p>Preparing your order…</p></main>;
  if (!cart.length) return <main className="system-page"><div className="eyebrow">Your bag</div><h1>Your fragrance collection is waiting.</h1><p>Add a scent from the Ease collection to begin.</p><a className="button" href="/">Explore collection</a></main>;
  return <main className="system-page"><div className="subnav"><a href="/" className="muted">← Continue shopping</a><a href="/track-order">Track an order</a></div><div className="eyebrow" style={{marginTop:32}}>Ease · Secure checkout</div><h1>Complete your order</h1><p>Pay when your order arrives.</p>
    {error && <div className="error" role="alert">{error}</div>}
    <form onSubmit={submit}>
      <div className="grid"><section className="panel"><h2>Delivery details</h2><div className="field"><label htmlFor="name">Full name *</label><input id="name" name="name" autoComplete="name" maxLength={120} required /></div><div className="field"><label htmlFor="phone">Phone number *</label><input id="phone" name="phone" autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" required /></div><div className="field"><label htmlFor="email">Email <span className="muted">(optional)</span></label><input id="email" name="email" type="email" autoComplete="email" /></div><div className="field"><label htmlFor="address">Delivery address *</label><textarea id="address" name="address" autoComplete="street-address" rows={3} maxLength={500} required /></div><div className="grid"><div className="field"><label htmlFor="city">City *</label><input id="city" name="city" autoComplete="address-level2" maxLength={100} required /></div><div className="field"><label htmlFor="area">Area *</label><input id="area" name="area" maxLength={100} required /></div></div><div className="field"><label htmlFor="zone">Delivery area *</label><select id="zone" value={zone} onChange={e => setZone(e.target.value)} required><option value="">Choose delivery area</option><option value="INSIDE_CITY">{config?.insideCityLabel || "Inside city"}{config?.insideCityDelivery != null ? ` · ${money(config.insideCityDelivery)}` : " · fee not set"}</option><option value="OUTSIDE_CITY">{config?.outsideCityLabel || "Outside city"}{config?.outsideCityDelivery != null ? ` · ${money(config.outsideCityDelivery)}` : " · fee not set"}</option></select></div><div className="field"><label htmlFor="note">Order note <span className="muted">(optional)</span></label><textarea id="note" name="note" rows={2} maxLength={1000} /></div><div className="panel"><h3>Cash on Delivery</h3><p style={{marginBottom:0}}>● &nbsp;Cash on Delivery — Pay when your order arrives.</p></div></section>
      <aside className="panel"><h2>Order summary</h2><div className="rows">{lines.map(({line,product,variant})=><div className="row" key={`${line.id}-${line.size}`}><span>{line.name} <span className="muted">· {line.size} × {line.qty}</span>{(!variant||!variant.available||variant.stock<line.qty)&&<small className="error" style={{display:"block",padding:5,marginTop:4}}>Unavailable or selected quantity exceeds stock</small>}</span><strong>{variant?money(variant.price*line.qty):"—"}</strong></div>)}</div><div className="row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="row"><span>Delivery</span><strong>{delivery==null?"Choose area":money(delivery)}</strong></div><div className="row totals"><span>Total</span><strong>{delivery==null?"—":money(subtotal+delivery)}</strong></div><button style={{width:"100%",marginTop:16}} type="submit" disabled={loading}>{loading?"Placing order…":"PLACE ORDER"}</button><p className="small muted" style={{marginTop:14}}>Your payment is due when your order is delivered.</p></aside></div>
    </form>
  </main>;
}
