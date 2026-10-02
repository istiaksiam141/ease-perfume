import { requireAdminPage } from "@/lib/auth";
import { AdminFrame } from "../../admin-ui";
import OrderDetails from "./details";
export const dynamic="force-dynamic";
export default async function OrderDetailPage({params}:{params:Promise<{id:string}>}){const admin=await requireAdminPage();const {id}=await params;return <AdminFrame email={admin.email}><a href="/admin/orders">← All orders</a><OrderDetails orderNumber={decodeURIComponent(id)}/></AdminFrame>}
