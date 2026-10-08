import { Navigate } from 'react-router-dom';

// Legacy route kept working for old bookmarks/links — the Customers concept
// was folded into the real cross-tenant Leads page.
const SuperAdminCustomersPage = () => <Navigate to="/super-admin/leads" replace />;

export default SuperAdminCustomersPage;
