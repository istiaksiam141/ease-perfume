"use client";
import { FormEvent, useEffect, useState } from "react";
import { Message } from "../admin-ui";

type Variant = { id: string; size: string; price: number; stock: number; available: boolean };
type Product = { id: string; name: string; image: string; featured: boolean; active: boolean; available: boolean; variants: Variant[] };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [newImage, setNewImage] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProducts() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load products.");
    setProducts(data);
  }

  useEffect(() => { loadProducts().catch(e => setError(e.message || "Unable to load products.")); }, []);

  function patch(id: string, fn: (product: Product) => Product) {
    setProducts(current => current?.map(product => product.id === id ? fn(product) : product) || []);
  }

  async function uploadImage(file: File | undefined, target: string, onUploaded: (url: string) => void) {
    setError(""); setMessage("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Use a JPEG, PNG, or WebP image."); return; }
    if (!file.size || file.size > MAX_IMAGE_BYTES) { setError("Choose an image that is 4 MB or smaller."); return; }
    setUploading(target);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/products/image", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The image upload failed.");
      onUploaded(data.url);
      setMessage("Image uploaded. Save the product to apply it.");
    } catch (e) { setError(e instanceof Error ? e.message : "The image upload failed. Please try again."); }
    finally { setUploading(null); }
  }

  async function save(product: Product) {
    setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: [product] }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save product.");
      setMessage(`${product.name} saved.`);
      await loadProducts();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save product."); }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), image: newImage }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create product.");
      formElement.reset(); setNewImage("");
      setMessage("Product added. Set its prices and stock, then mark each size available when ready.");
      await loadProducts();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create product."); }
  }

  return <>
    <Message text={error} /><Message text={message} kind="success" />
    <section className="panel">
      <h2>Add product</h2>
      <p className="small">Upload a JPEG, PNG, or WebP image (up to 4 MB), or enter an HTTPS image URL or existing <code>/assets/...</code> path.</p>
      <form onSubmit={add} className="grid">
        <div className="field"><label htmlFor="product-name">Product name</label><input id="product-name" name="name" required maxLength={120} /></div>
        <div className="field"><label htmlFor="product-image">Image URL or path</label><input id="product-image" value={newImage} onChange={event => setNewImage(event.target.value)} placeholder="https://… or /assets/product.png" required maxLength={2048} /></div>
        <div className="field"><label htmlFor="product-image-file">Upload image</label><input id="product-image-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={event => void uploadImage(event.currentTarget.files?.[0], "new", setNewImage)} /><span className="small muted">{uploading === "new" ? "Uploading…" : "Selecting a file uploads it and fills the image URL above."}</span></div>
        {newImage && <img src={newImage} alt="New product preview" width="96" height="120" style={{ objectFit: "cover" }} />}
        <button disabled={uploading !== null}>Add product</button>
      </form>
    </section>
    {!products ? <p>{error || "Loading products…"}</p> : !products.length ? <section className="panel">No products found. Add your first product above.</section> : products.map(product => <section className="panel" key={product.id}>
      <div className="subnav"><div className="inline"><img src={product.image} alt="" width="52" height="65" style={{ objectFit: "cover" }} /><div><h2 style={{ margin: "0 0 4px" }}>{product.name}</h2><span className="muted small">{product.id}</span></div></div><button onClick={() => save(product)} disabled={uploading === product.id}>Save product</button></div>
      <div className="field"><label htmlFor={`image-${product.id}`}>Image URL or path</label><input id={`image-${product.id}`} value={product.image} maxLength={2048} onChange={event => patch(product.id, p => ({ ...p, image: event.target.value }))} /></div>
      <div className="field"><label htmlFor={`image-file-${product.id}`}>Replace image</label><input id={`image-file-${product.id}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={event => void uploadImage(event.currentTarget.files?.[0], product.id, url => patch(product.id, p => ({ ...p, image: url })))} /><span className="small muted">{uploading === product.id ? "Uploading…" : "JPEG, PNG, or WebP · up to 4 MB. Save product after upload."}</span></div>
      <div className="product-admin" style={{ gridTemplateColumns: "90px 1fr 1fr" }}><strong>Size</strong><strong>Price · ৳</strong><strong>Stock on hand</strong></div>
      {product.variants.map(variant => <div className="product-admin" key={variant.id} style={{ gridTemplateColumns: "90px 1fr 1fr" }}>
        <strong>{variant.size}</strong>
        <input type="number" min="0" max="1000000" step="1" aria-label={`${product.name} ${variant.size} price`} value={variant.price} onChange={event => patch(product.id, p => ({ ...p, variants: p.variants.map(v => v.id === variant.id ? { ...v, price: Number(event.target.value) } : v) }))} />
        <input type="number" min="0" max="1000000" step="1" aria-label={`${product.name} ${variant.size} stock`} value={variant.stock} onChange={event => patch(product.id, p => ({ ...p, variants: p.variants.map(v => v.id === variant.id ? { ...v, stock: Number(event.target.value) } : v) }))} />
        <label className="inline small" style={{ gridColumn: "1/-1" }}><input type="checkbox" checked={variant.available} onChange={event => patch(product.id, p => ({ ...p, variants: p.variants.map(v => v.id === variant.id ? { ...v, available: event.target.checked } : v) }))} /> Available to order</label>
      </div>)}
      <div className="stack" style={{ marginTop: 12 }}>
        <label className="inline small"><input type="checkbox" checked={product.featured} onChange={event => patch(product.id, p => ({ ...p, featured: event.target.checked }))} /> Featured</label>
        <label className="inline small"><input type="checkbox" checked={product.active} onChange={event => patch(product.id, p => ({ ...p, active: event.target.checked }))} /> Active in catalog</label>
      </div>
    </section>)}
  </>;
}
