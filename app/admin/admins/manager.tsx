"use client";
import { FormEvent, useEffect, useState } from "react";
import { Message } from "../admin-ui";

type AdminAccount = { id: string; email: string; isMainAdmin: boolean; createdAt: string };

export default function AdminsManager() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]), [error, setError] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [removing, setRemoving] = useState<string | null>(null);
  async function load() {
    const response = await fetch("/api/admin/admins", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load admin accounts.");
    setAdmins(data);
  }
  useEffect(() => { load().catch(e => setError(e.message || "Unable to load admin accounts.")); }, []);
  async function addAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add admin.");
      formElement.reset();
      setMessage(`Admin account created for ${data.email}. Share the initial password with them privately.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add admin."); }
    finally { setBusy(false); }
  }
  async function removeAdmin(admin: AdminAccount) {
    if (admin.isMainAdmin || !window.confirm(`Remove admin access for ${admin.email}? They will no longer be able to sign in.`)) return;
    setRemoving(admin.id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/admins/${encodeURIComponent(admin.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove admin.");
      setMessage(`Admin access removed for ${admin.email}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to remove admin."); }
    finally { setRemoving(null); }
  }
  return <><Message text={error} /><Message text={message} kind="success" /><section className="panel"><h2>Add administrator</h2><p className="small muted">Set a temporary password of at least 12 characters. The new admin can sign in at <a href="/admin/login">/admin/login</a>. Share the password privately.</p><form className="grid" onSubmit={addAdmin}><div className="field"><label htmlFor="adminEmail">Admin email</label><input id="adminEmail" name="email" type="email" autoComplete="off" maxLength={200} required /></div><div className="field"><label htmlFor="adminPassword">Initial password</label><input id="adminPassword" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" required /></div><button disabled={busy}>{busy ? "Adding…" : "Add admin"}</button></form></section><section className="panel"><h2>Current administrators</h2>{admins.length ? admins.map(item => <div className="row" key={item.id}><span>{item.email}{item.isMainAdmin&&<small className="muted" style={{display:"block"}}>Main admin</small>}</span><span className="muted small">Added {new Date(item.createdAt).toLocaleDateString()}</span>{!item.isMainAdmin&&<button className="secondary" onClick={()=>removeAdmin(item)} disabled={removing!==null}>{removing===item.id?"Removing…":"Remove admin"}</button>}</div>) : <p>Loading admin accounts…</p>}</section></>;
}
