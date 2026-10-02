import { requireMainAdminPage } from "@/lib/auth";
import { AdminFrame } from "../admin-ui";
import AdminsManager from "./manager";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const admin = await requireMainAdminPage();
  return <AdminFrame email={admin.email} isMainAdmin={admin.isMainAdmin}><div className="eyebrow">Access management</div><h1>Admin accounts</h1><p>Add an administrator after their access request is approved. Each admin can manage orders, products, customers, and store settings.</p><AdminsManager /></AdminFrame>;
}
