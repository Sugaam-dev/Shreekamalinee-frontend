import { useState, useMemo } from "react";
import {
  Search,
  Users,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { formatDate } from "../../utils/formatters.js";
import {
  useCustomersQuery,
  useUpdateCustomerStatusMutation,
} from "../../queries/useCustomerQueries.js";
import { useCart } from "../../context/CartContext.jsx";
import AdminLayout from "../../components/admin/AdminLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { TableRowSkeleton } from "../../components/common/Skeleton.jsx";

export default function AdminCustomersPage() {
  const { showToast } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'suspended'
  const [toggleTarget, setToggleTarget] = useState(null);

  const { data: customers = [], isLoading } = useCustomersQuery(searchTerm);
  const updateStatusMutation = useUpdateCustomerStatusMutation();

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      const nextStatus = !toggleTarget.enabled;
      await updateStatusMutation.mutateAsync({
        userId: toggleTarget.id,
        enabled: nextStatus,
      });
      showToast(
        `Customer account ${nextStatus ? "activated" : "suspended"} successfully`,
        "success"
      );
      setToggleTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update account status", "warning");
    }
  };

  const customerList = useMemo(() => {
    return Array.isArray(customers) ? customers : Array.isArray(customers?.content) ? customers.content : [];
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customerList
      .filter((c) => {
        if (statusFilter === "active") return c.enabled;
        if (statusFilter === "suspended") return !c.enabled;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [customerList, statusFilter]);


  return (
    <AdminLayout
      title="Patrons & Customer CRM"
      subtitle="View registered patron accounts, verify email identities, and manage account access status"
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xs border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patron name, email, or phone..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xs outline-none focus:border-[#800020] bg-white font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200 rounded-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "all" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "active" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("suspended")}
                className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                  statusFilter === "suspended" ? "bg-[#800020] text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
        </div>

        {/* Customer Accounts Table */}
        <div className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Patron Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Account Role</th>
                  <th className="py-3.5 px-4">Access Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No customer accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Patron Name */}
                      <td className="py-3 px-4">
                        <div className="font-serif font-bold text-sm text-gray-900">
                          {user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Handloom Patron"}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {user.email}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono text-gray-600">
                        {user.phoneNumber || "—"}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10.5px] font-bold ${
                            user.role === "ROLE_ADMIN" || user.role === "ROLE_SUPERADMIN"
                              ? "bg-[#800020]/10 text-[#800020] border border-[#800020]/20"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {user.role?.replace("ROLE_", "") || "CUSTOMER"}
                        </span>
                      </td>

                      {/* Access Status */}
                      <td className="py-3 px-4">
                        {user.enabled ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 size={12} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                            <XCircle size={12} />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setToggleTarget(user)}
                          className={`p-1.5 rounded-xs cursor-pointer transition-colors ${
                            user.enabled
                              ? "text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={user.enabled ? "Suspend Account" : "Activate Account"}
                        >
                          {user.enabled ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={!!toggleTarget}
          onClose={() => setToggleTarget(null)}
          title={toggleTarget?.enabled ? "Suspend Patron Account" : "Activate Patron Account"}
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xs">
              <AlertTriangle size={18} className="shrink-0 text-amber-700" />
              <span>
                Are you sure you want to {toggleTarget?.enabled ? "suspend" : "activate"}{" "}
                <strong>{toggleTarget?.email}</strong>?
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={updateStatusMutation.isPending}
                onClick={() => setToggleTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={toggleTarget?.enabled ? "danger" : "primary"}
                size="sm"
                disabled={updateStatusMutation.isPending}
                isLoading={updateStatusMutation.isPending}
                onClick={handleConfirmToggle}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : `Confirm ${toggleTarget?.enabled ? "Suspension" : "Activation"}`}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
