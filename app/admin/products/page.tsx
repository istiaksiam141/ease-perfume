import { requireAdminPage } from "@/lib/auth";
import { AdminFrame } from "../admin-ui";
import ProductsManager from "./manager";
export const dynamic="force-dynamic";
export default async function ProductsPage(){const admin=await requireAdminPage();return <AdminFrame email={admin.email}><div className="eyebrow">Catalog management</div><h1>Products</h1><p>Enter confirmed inventory and prices. A size can be ordered only when it is marked available and has stock.</p><ProductsManager/></AdminFrame>}
