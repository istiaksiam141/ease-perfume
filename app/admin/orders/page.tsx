import { requireAdminPage } from "@/lib/auth";
import { AdminFrame } from "../admin-ui";
import OrdersTable from "./table";
export const dynamic="force-dynamic";
export default async function OrdersPage(){const admin=await requireAdminPage();return <AdminFrame email={admin.email}><div className="eyebrow">Store management</div><h1>Orders</h1><p>Review customer orders and update their progress.</p><OrdersTable/></AdminFrame>}
