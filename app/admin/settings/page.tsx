import { requireAdminPage } from "@/lib/auth";
import { AdminFrame } from "../admin-ui";
import StoreSettings from "./settings";
export const dynamic="force-dynamic";
export default async function SettingsPage(){const admin=await requireAdminPage();return <AdminFrame email={admin.email}><div className="eyebrow">Store configuration</div><h1>Settings</h1><p>Set customer-facing delivery labels and fees. Delivery fees start at ৳0 and can be edited at any time.</p><StoreSettings/></AdminFrame>}
